"""Build the two ability decisions for every hero.

Deadlock has two separate resources (https://deadlock.wiki/Abilities,
https://deadlock.wiki/Boon):

* Unlocks: one at boon levels 0, 2, 4 and 7. The first three can only go on
  basic abilities, in any order. The fourth is the ultimate's.
* Ability points: one at every other boon level up to 35, 32 in all. The
  1-, 2- and 5-point upgrades of four abilities cost exactly 32, so an unlock
  costs no points.

The API's ability order lists both in one stream: the first appearance of an
ability is its unlock and later appearances are its upgrades. This script
splits each order into:

* the unlock order of the three basics (a slot code such as 213),
* where the ultimate unlock went (see ult_option),
* the point-allocation strategy (see strategy_of and docs/ability-mechanics.md),
* the point-spend order of the 12 upgrades, as a prefix tree under each unlock
  order and strategy. Upgrades bought within WINDOW_S seconds of each other (by
  the API's average upgrade times) were bought in one go, so their order inside
  the window is not a choice; they are put in slot order so the tree does not
  split on it.

The rules live in src/lib/ability-rules.ts; the constants here mirror it, and
the split mirrors splitOrder and strategyOf in src/lib/ability-path.ts.
"""

import argparse
import gzip
import json
import shutil
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from patch_window import resolve

API = "https://api.deadlock-api.com"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "ability-orders.ts"
# Rank bands other than all ranks are written here, one JSON file per hero, and
# fetched by the ability board when a band is picked.
BAND_DIR = ROOT / "public" / "ability-orders"
# Coarse rank bands. A match's average badge is tier * 10 + subrank (1..6); the
# tiers are the ones scripts/fetch-rank-slices.py uses (1 Initiate .. 11 Eternus).
BANDS = [
    ("all", "All ranks", {}),
    ("initiate-acolyte", "Initiate to Acolyte", {"min_average_badge": 11, "max_average_badge": 36}),
    ("sentinel-ritualist", "Sentinel to Ritualist", {"min_average_badge": 41, "max_average_badge": 66}),
    ("emissary-phantom", "Emissary to Phantom", {"min_average_badge": 71, "max_average_badge": 96}),
    ("ascendant-eternus", "Ascendant and Eternus", {"min_average_badge": 101, "max_average_badge": 116}),
]
KEEP = 30
# Upgrades this close together (seconds, average game time) count as one purchase.
WINDOW_S = 10
COST = {1: 1, 2: 2, 3: 5}
# Points that exist when the ultimate unlock arrives at level 7.
POINTS_BY_LEVEL_7 = 4
# Spend trees are kept only where the board can choose them: an unlock order and a
# strategy that clear MIN_BRANCH games and MIN_SHARE of the most-played option
# (ability-path.ts). Anything else falls back to the state table on the board.
MIN_BRANCH = 200
MIN_SHARE = 0.05
# All-ranks games by how many abilities they maxed, across heroes (printed for the docs).
MAXES = defaultdict(int)


def get(path, params=None):
    url = API + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "margin/0.1"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.load(resp)


class Node:
    __slots__ = ("wins", "matches", "children")

    def __init__(self):
        self.wins = 0
        self.matches = 0
        self.children = {}


def ult_option(basics_before, points_before):
    """basics_before * 100, plus the points spent before the ultimate unlock
    when it was held past level 7 (more points than exist at level 7)."""
    held = points_before if points_before > POINTS_BY_LEVEL_7 else 0
    return basics_before * 100 + held


def split(abilities, times, slot_ids):
    """One API order -> (unlock code, ult option, spends, unlocks before each spend).

    Returns None when the three basics were never all unlocked.
    """
    slot_of = {ability: i + 1 for i, ability in enumerate(slot_ids)}
    ult = slot_ids[3]
    seen = defaultdict(int)
    basics = []
    ult_opt = None
    points = 0
    spends = []  # (ability, time, unlocks before)
    for pos, ability in enumerate(abilities):
        if ability not in slot_of or seen[ability] >= 4:
            continue
        seen[ability] += 1
        tier = seen[ability] - 1
        if tier == 0:
            if ability == ult:
                ult_opt = ult_option(len(basics), points)
            else:
                basics.append(slot_of[ability])
        else:
            t = times[pos] if times and pos < len(times) else None
            unlocked = len(basics) + (1 if ult_opt is not None else 0)
            spends.append((ability, t, unlocked))
            points += COST[tier]
    if len(basics) < 3:
        return None
    # Canonical order inside a purchase window: slot order, stable, so an
    # ability's own tiers keep their order.
    canon = []
    group = []
    last = None
    for entry in spends:
        if group and (entry[1] is None or last is None or abs(entry[1] - last) > WINDOW_S):
            canon.extend(sorted(group, key=lambda e: slot_of[e[0]]))
            group = []
        group.append(entry)
        last = entry[1]
    canon.extend(sorted(group, key=lambda e: slot_of[e[0]]))
    # Unlocks-before stays with the position, not the moved upgrade.
    before = [entry[2] for entry in spends]
    code = basics[0] * 100 + basics[1] * 10 + basics[2]
    return code, ult_opt, [entry[0] for entry in canon], before


def strategy_of(spends, slot_ids):
    """(first max slot, second max slot, shape) as first*100 + second*10 + shape.

    shape is how many other abilities had their 2-point upgrade when the first
    one got its 5-point upgrade: 0 none (rush), 1 one, 2 two or more (spread).
    None when fewer than two abilities were maxed.
    """
    tiers = [0, 0, 0, 0]
    maxes = []
    shape = 0
    for ability in spends:
        i = slot_ids.index(ability)
        tiers[i] += 1
        if tiers[i] == 3:
            if not maxes:
                shape = min(2, sum(1 for j, t in enumerate(tiers) if j != i and t >= 2))
            maxes.append(i + 1)
            if len(maxes) == 2:
                return maxes[0] * 100 + maxes[1] * 10 + shape
    return None


def build(rows, slot_ids, tally=False):
    index_of = {ability: i for i, ability in enumerate(slot_ids)}
    unlocks = defaultdict(lambda: [0, 0])
    ults = defaultdict(lambda: defaultdict(lambda: [0, 0]))
    strategies = defaultdict(lambda: defaultdict(lambda: [0, 0]))
    spend = defaultdict(Node)
    states = defaultdict(lambda: defaultdict(lambda: [0, 0]))
    for row in rows:
        parts = split(row["abilities"], row.get("avg_upgrade_times_s"), slot_ids)
        if parts is None:
            continue
        code, ult_opt, spends, before = parts
        w, n = row["wins"], row["matches"]
        unlocks[code][0] += w
        unlocks[code][1] += n
        if ult_opt is not None:
            ults[code][ult_opt][0] += w
            ults[code][ult_opt][1] += n
        tiers_seen = defaultdict(int)
        for ability in spends:
            tiers_seen[ability] += 1
        if tally:
            MAXES[sum(1 for t in tiers_seen.values() if t == 3)] += n
        strategy = strategy_of(spends, slot_ids)
        if strategy is None:
            continue
        strategies[code][strategy][0] += w
        strategies[code][strategy][1] += n
        node = spend[(code, strategy)]
        node.wins += w
        node.matches += n
        tiers = [0, 0, 0, 0]
        points = 0
        for ability, unlocked in zip(spends, before):
            key = f"{','.join(map(str, tiers))}|{unlocked}|{points}"
            bucket = states[key][ability]
            bucket[0] += w
            bucket[1] += n
            i = index_of[ability]
            tiers[i] += 1
            points += COST[tiers[i]]
            child = node.children.get(ability)
            if child is None:
                child = Node()
                node.children[ability] = child
            child.wins += w
            child.matches += n
            node = child
    return unlocks, ults, strategies, spend, states


def prune(node):
    node.children = {
        ability: prune(child) for ability, child in node.children.items() if child.matches >= KEEP
    }
    return node


def serialize(node, ability_id):
    children = sorted(node.children.items(), key=lambda item: (-item[1].matches, item[0]))
    return [ability_id, node.wins, node.matches, [serialize(child, ability) for ability, child in children]]


def rows_of(table):
    rows = [[key, w, n] for key, (w, n) in table.items() if n >= KEEP]
    rows.sort(key=lambda row: (-row[2], row[0]))
    return rows


def choosable(table):
    top = max((n for _, n in table.values()), default=0)
    return {key for key, (_, n) in table.items() if n >= MIN_BRANCH and n >= MIN_SHARE * top}


def abilities_of(hero, names):
    abilities = []
    for slot in (1, 2, 3, 4):
        class_name = (hero.get("items") or {}).get(f"signature{slot}")
        found = names.get((hero["id"], class_name))
        if found:
            abilities.append({"id": found[0], "name": found[1], "slot": slot})
    return abilities


def fetch_rows(hero_id, window, params):
    return get(
        "/v1/analytics/ability-order-stats",
        {"hero_id": hero_id, "min_matches": 1, "game_mode": "normal", **window, **params},
    )


def band_tree(rows, abilities, ident, label):
    """One rank band: unlock orders, ultimate options, strategies, spend trees, states."""
    band = {
        "band": ident,
        "label": label,
        "wins": sum(row["wins"] for row in rows),
        "matches": sum(row["matches"] for row in rows),
        "unlocks": [],
        "ult": {},
        "strategies": {},
        "spend": {},
        "states": {},
    }
    coverage = 0
    if len(abilities) == 4:
        unlocks, ults, strategies, spend, states = build(rows, [ability["id"] for ability in abilities], tally=ident == "all")
        band["unlocks"] = rows_of(unlocks)
        kept = {row[0] for row in band["unlocks"]}
        band["ult"] = {str(code): rows_of(table) for code, table in ults.items() if code in kept}
        band["strategies"] = {str(code): rows_of(table) for code, table in strategies.items() if code in kept}
        orders = choosable(unlocks)
        picks = {code: choosable(table) for code, table in strategies.items()}
        band["spend"] = {
            f"{code}:{strategy}": serialize(prune(node), 0)
            for (code, strategy), node in spend.items()
            if code in orders and strategy in picks.get(code, set())
        }
        band["states"] = {key: r for key, table in states.items() if (r := rows_of(table))}
        coverage = sum(n for table in strategies.values() for _, n in table.values())
    return band, coverage


def count_nodes(node):
    return 1 + sum(count_nodes(child) for child in node[3])


def dump(value):
    return json.dumps(value, separators=(",", ":"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw-dir", help="also save each hero's all-ranks API rows here (gzip JSON), for scripts/tune-prior.py")
    args = parser.parse_args()
    heroes = get("/v1/assets/heroes")
    items = get("/v1/assets/items")
    names = {}
    for item in items:
        hero = item.get("hero")
        class_name = item.get("class_name")
        if hero and class_name and item.get("name"):
            names[(hero, class_name)] = (item["id"], item["name"])
    playable = [
        hero
        for hero in heroes
        if hero.get("id", 0) < 500 and (hero.get("items") or {}).get("signature1") and not hero.get("disabled")
    ]
    playable.sort(key=lambda hero: hero["name"])
    window, info = resolve(get)
    print("window", info["label"], "median", info["medianMatches"])
    if BAND_DIR.exists():
        shutil.rmtree(BAND_DIR)
    raw_dir = Path(args.raw_dir) if args.raw_dir else None
    if raw_dir:
        raw_dir.mkdir(parents=True, exist_ok=True)
    built = []
    band_bytes = 0
    for hero in playable:
        abilities = abilities_of(hero, names)
        if len(abilities) < 4:
            print("skip", hero["name"], "abilities", len(abilities))
            continue
        bands = []
        try:
            for ident, label, params in BANDS:
                rows = fetch_rows(hero["id"], window, params)
                if ident == "all" and raw_dir:
                    with gzip.open(raw_dir / f"{hero['id']}.json.gz", "wt") as fh:
                        json.dump({"hero": hero["id"], "name": hero["name"], "abilities": abilities, "rows": rows}, fh)
                tree, coverage = band_tree(rows, abilities, ident, label)
                bands.append((tree, coverage))
        except Exception as exc:
            print("skip", hero.get("name"), exc)
            continue
        everyone, coverage = bands[0]
        if everyone["matches"] <= 0:
            print("skip", hero["name"], "matches", everyone["matches"])
            continue
        built.append({
            "id": hero["id"],
            "name": hero["name"],
            "wins": everyone["wins"],
            "matches": everyone["matches"],
            "abilities": abilities,
            "bands": [everyone],
        })
        for tree, _ in bands[1:]:
            path = BAND_DIR / tree["band"] / f"{hero['id']}.json"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(dump(tree))
            band_bytes += path.stat().st_size
        nodes = sum(count_nodes(root) for root in everyone["spend"].values())
        share = coverage / everyone["matches"]
        sizes = " ".join(f"{tree['matches']:>7}" for tree, _ in bands[1:])
        print(f"{hero['name']:16} {everyone['matches']:7} games  {nodes:6} nodes  {share:.1%} with a strategy  bands {sizes}")
    payload = {
        "fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "window": info["label"],
        "bands": [{"band": ident, "label": label} for ident, label, _ in BANDS],
        "heroes": built,
    }
    text = (
        "// Ability unlock orders, point-allocation strategies and spend trees, all ranks.\n"
        "// Other rank bands are in public/ability-orders/<band>/<heroId>.json, loaded on demand.\n"
        "// The board reads these files and does not call the API.\n"
        "import type { AbilityOrders } from \"@/lib/ability-path\";\n\n"
        f"export const abilityOrders: AbilityOrders = {dump(payload)};\n"
    )
    OUT.write_text(text)
    total = sum(MAXES.values()) or 1
    print("maxed abilities:", {k: f"{v / total:.1%}" for k, v in sorted(MAXES.items())})
    print("wrote", OUT, "heroes", len(built), "bytes", OUT.stat().st_size, "band files bytes", band_bytes)


if __name__ == "__main__":
    main()
