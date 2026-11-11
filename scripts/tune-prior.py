"""Tune PRIOR_K (the shrinkage strength) on held-out games.

Reproducible: run scripts/fetch-ability-orders.py --raw-dir DIR first (it saves
each hero's all-ranks API rows), then

    python3 scripts/tune-prior.py --raw-dir DIR

Method:

* Split every API row's games in two at random (binomial thinning): train gets
  n_train ~ Binomial(n, 1/2) games and w_train ~ Hypergeometric(w, n - w, n_train)
  of the wins; held-out gets the rest. That is an exact random split of games,
  done on the aggregated counts. Fixed seed.
* Build both halves exactly as the fetch script does (unlock orders,
  strategies, spend trees).
* For each K, predict every node's win rate from train with the board's
  shrinkage, (wins + K * parent) / (games + K), parents chained as on the board:
  all games -> unlock order -> strategy -> spend tree root -> each spend node.
  Score the held-out wins and losses at every node with the Bernoulli
  log-likelihood. Nodes with no train games are predicted at their parent.
* Path stability: build the board's path from each half separately with each K
  (scripts/tune-prior-stability.ts runs the real buildPath) and count how often
  the two halves agree.

Writes docs/prior-tuning.md. Needs numpy (not needed by the site build).
"""

import argparse
import gzip
import importlib.util
import json
import math
import subprocess
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("fetch", ROOT / "scripts" / "fetch-ability-orders.py")
fetch = importlib.util.module_from_spec(spec)
sys.dont_write_bytecode = True
spec.loader.exec_module(fetch)

KS = [250, 500, 1000, 2000, 3000, 5000, 10000]


def thin(rows, rng):
    n = np.array([row["matches"] for row in rows], dtype=np.int64)
    w = np.array([row["wins"] for row in rows], dtype=np.int64)
    w = np.minimum(w, n)
    n_train = rng.binomial(n, 0.5)
    w_train = np.zeros_like(n)
    ok = n_train > 0
    w_train[ok] = rng.hypergeometric(w[ok], (n - w)[ok], n_train[ok])
    train, test = [], []
    for row, nt, wt, nn, ww in zip(rows, n_train, w_train, n, w):
        base = {"abilities": row["abilities"], "avg_upgrade_times_s": row.get("avg_upgrade_times_s")}
        if nt > 0:
            train.append({**base, "wins": int(wt), "matches": int(nt)})
        if nn - nt > 0:
            test.append({**base, "wins": int(ww - wt), "matches": int(nn - nt)})
    return train, test


def loglik(w, n, p):
    p = min(max(p, 1e-9), 1 - 1e-9)
    return w * math.log(p) + (n - w) * math.log(1 - p)


def shrink(w, n, parent, k):
    return (w + k * parent) / (n + k)


def score(train, test, k):
    """Held-out log-likelihood and games scored, per level."""
    (u_tr, _, s_tr, sp_tr, _), (u_te, _, s_te, sp_te, _) = train["built"], test["built"]
    hero = train["wins"] / train["matches"] if train["matches"] else 0.5
    out = {"unlock": [0.0, 0], "strategy": [0.0, 0], "spend": [0.0, 0]}
    order_rate = {}
    for code in set(u_tr) | set(u_te):
        w, n = u_tr.get(code, (0, 0))
        order_rate[code] = shrink(w, n, hero, k)
        if code in u_te:
            tw, tn = u_te[code]
            out["unlock"][0] += loglik(tw, tn, order_rate[code])
            out["unlock"][1] += tn
    for code in set(s_tr) | set(s_te):
        parent = order_rate.get(code, hero)
        table_tr = s_tr.get(code, {})
        table_te = s_te.get(code, {})
        for strategy in set(table_tr) | set(table_te):
            w, n = table_tr.get(strategy, (0, 0))
            rate = shrink(w, n, parent, k)
            if strategy in table_te:
                tw, tn = table_te[strategy]
                out["strategy"][0] += loglik(tw, tn, rate)
                out["strategy"][1] += tn
            root_te = sp_te.get((code, strategy))
            if root_te is None:
                continue
            stack = [(root_te, sp_tr.get((code, strategy)), rate)]
            while stack:
                node_te, node_tr, above = stack.pop()
                for ability, child_te in node_te.children.items():
                    child_tr = node_tr.children.get(ability) if node_tr else None
                    p = shrink(child_tr.wins, child_tr.matches, above, k) if child_tr else above
                    out["spend"][0] += loglik(child_te.wins, child_te.matches, p)
                    out["spend"][1] += child_te.matches
                    stack.append((child_te, child_tr, p))
    return out


def half(rows, abilities):
    slot_ids = [ability["id"] for ability in abilities]
    built = fetch.build(rows, slot_ids)
    return {
        "built": built,
        "wins": sum(row["wins"] for row in rows),
        "matches": sum(row["matches"] for row in rows),
    }


def board_hero(hero_id, name, abilities, rows):
    tree, _ = fetch.band_tree(rows, abilities, "all", "All ranks")
    return {"id": hero_id, "name": name, "wins": tree["wins"], "matches": tree["matches"], "abilities": abilities, "bands": [tree]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw-dir", required=True)
    parser.add_argument("--seed", type=int, default=20261111)
    parser.add_argument("--work", default="/tmp/tune-prior")
    parser.add_argument("--out", default=str(ROOT / "docs" / "prior-tuning.md"))
    args = parser.parse_args()
    rng = np.random.default_rng(args.seed)
    work = Path(args.work)
    work.mkdir(parents=True, exist_ok=True)
    totals = {k: defaultdict(lambda: [0.0, 0]) for k in KS}
    halves = {"a": [], "b": []}
    files = sorted(Path(args.raw_dir).glob("*.json.gz"))
    games = 0
    for path in files:
        with gzip.open(path, "rt") as fh:
            raw = json.load(fh)
        abilities = raw["abilities"]
        train_rows, test_rows = thin(raw["rows"], rng)
        games += sum(row["matches"] for row in raw["rows"])
        train, test = half(train_rows, abilities), half(test_rows, abilities)
        for k in KS:
            for level, (ll, n) in score(train, test, k).items():
                totals[k][level][0] += ll
                totals[k][level][1] += n
        halves["a"].append(board_hero(raw["hero"], raw["name"], abilities, train_rows))
        halves["b"].append(board_hero(raw["hero"], raw["name"], abilities, test_rows))
        print("scored", raw["name"])
    for key, heroes in halves.items():
        (work / f"{key}.json").write_text(json.dumps({"fetchedAt": "", "heroes": heroes}, separators=(",", ":")))
    stability = json.loads(
        subprocess.run(
            ["node", "--experimental-strip-types", "--no-warnings", str(ROOT / "scripts" / "tune-prior-stability.ts"),
             str(work / "a.json"), str(work / "b.json"), ",".join(map(str, KS))],
            check=True, capture_output=True, text=True,
        ).stdout
    )
    base = 2000
    lines = []
    best_k = max(KS, key=lambda k: totals[k]["strategy"][0] + totals[k]["spend"][0])
    for k in KS:
        row = totals[k]
        cells = []
        for level in ("unlock", "strategy", "spend"):
            ll, n = row[level]
            cells.append(f"{(ll - totals[base][level][0]):+,.1f}")
        st = stability[str(k)]
        both = row["strategy"][0] + row["spend"][0] - totals[base]["strategy"][0] - totals[base]["spend"][0]
        mark = " **best**" if k == best_k else ""
        lines.append(
            f"| {k:,}{mark} | {cells[0]} | {cells[1]} | {cells[2]} | {both:+,.1f} | "
            f"{st['sameStrategy']:.0%} | {st['sameUnlock']:.0%} | {st['clickAgreement']:.0%} | {st['sameClicks']:.0%} |"
        )
    n_strategy = totals[base]["strategy"][1]
    n_spend = totals[base]["spend"][1]
    per = {lvl: -totals[best_k][lvl][0] / max(1, totals[best_k][lvl][1]) for lvl in ("unlock", "strategy", "spend")}
    doc = f"""# PRIOR_K tuning

Generated by `scripts/tune-prior.py` (seed {args.seed}) on {datetime.now(timezone.utc):%Y-%m-%d}, from
the all-ranks data saved by `scripts/fetch-ability-orders.py --raw-dir`: {len(files)} heroes,
{games:,} games. The method is in the script's docstring: a random game-level split
(binomial thinning) into two halves, shrinkage fitted on one half, Bernoulli
log-likelihood of the other half's wins and losses at every node.

Log-likelihood is in nats, relative to K = 2,000 (the old value); higher is better.
Held-out games scored: {n_strategy:,} at strategy nodes and {n_spend:,} game-steps at
spend-tree nodes. "Both" is strategy plus spend, the two levels this K governs on
the board's strategy and spend choices. Stability: the board's path built from each
half separately, share of heroes where the two halves agree on the strategy and on
the unlock order, the average share of the 16 click positions that agree, and the
share of heroes where all 16 agree. Each half has half the games, so stability on the
full data is higher than shown; the comparison between K values is what counts.

| K | Unlock order | Strategy | Spend nodes | Both | Same strategy | Same unlock order | Clicks agreeing | Same 16 clicks |
|---|---|---|---|---|---|---|---|---|
""" + "\n".join(lines) + f"""

At the best K, the held-out log loss per game is {per['unlock']:.4f} at unlock orders,
{per['strategy']:.4f} at strategies and {per['spend']:.4f} per game-step in the spend
trees (ln 2 = 0.6931 is a coin flip; win rates sit near 50%, so the differences
between K values are small per game and add up over millions of games).

PRIOR_K is set to the K with the best "Both" column: **PRIOR_K = {best_k:,}**.
"""
    Path(args.out).write_text(doc)
    print(doc)
    print("BEST", best_k)


if __name__ == "__main__":
    main()
