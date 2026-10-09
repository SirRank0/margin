"""Snapshot ability-order branches for every hero.

The board does not call the API. Each row is kept only when it has at least
KEEP games. The page's comparison then ignores branches under 200 games.
"""

import json
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from patch_window import resolve

API = "https://api.deadlock-api.com"
OUT = Path(__file__).resolve().parents[1] / "src" / "data" / "ability-orders.ts"
KEEP = 30
COST = {1: 0, 2: 1, 3: 2, 4: 5}


def get(path, params=None):
    url = API + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "margin/0.1"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.load(resp)


def add(bucket, key, wins, matches):
    row = bucket[key]
    row[0] += wins
    row[1] += matches


def events(seq):
    seen = {}
    out = []
    ap = 0
    for ability in seq:
        seen[ability] = seen.get(ability, 0) + 1
        rank = seen[ability]
        if rank > 4:
            continue
        out.append((ability, rank, ap))
        ap += COST[rank]
    return out


def named(bucket):
    rows = [
        {"ability": key, "wins": wins, "matches": matches}
        for key, (wins, matches) in bucket.items()
        if matches >= KEEP
    ]
    rows.sort(key=lambda row: row["matches"], reverse=True)
    return rows


def hero_orders(hero, names, window):
    rows = get(
        "/v1/analytics/ability-order-stats",
        {"hero_id": hero["id"], "min_matches": 1, **window},
    )
    abilities = []
    for slot in (1, 2, 3, 4):
        class_name = (hero.get("items") or {}).get(f"signature{slot}")
        found = names.get((hero["id"], class_name))
        if found:
            abilities.append({"id": found[0], "name": found[1], "slot": slot})
    known = {ability["id"] for ability in abilities}
    ult = next((ability["id"] for ability in abilities if ability["slot"] == 4), None)

    open_upgrade = defaultdict(lambda: [0, 0])
    prefix3 = defaultdict(lambda: [0, 0])
    before = defaultdict(lambda: [0, 0])
    five_before_ult = defaultdict(lambda: [0, 0])
    first_max = defaultdict(lambda: [0, 0])
    ult_before = [0, 0]
    five_before = [0, 0]
    early_spread = [0, 0]
    early_rush = defaultdict(lambda: [0, 0])
    wins = matches = 0
    basics = {ability["id"] for ability in abilities if ability["slot"] != 4}

    for row in rows:
        seq = [ability for ability in row["abilities"] if ability in known]
        w, n = row["wins"], row["matches"]
        wins += w
        matches += n
        if len(seq) >= 2 and seq[1] == seq[0]:
            add(open_upgrade, seq[0], w, n)
        if len(seq) >= 3:
            add(prefix3, (seq[0], seq[1], seq[2]), w, n)
        counts = {}
        for ability in seq:
            counts[ability] = counts.get(ability, 0) + 1
            if counts[ability] == 4:
                add(first_max, ability, w, n)
                break
        ev = events(seq)
        basic_t2 = [event for event in ev if event[0] != ult and event[1] == 3]
        fives = [event for event in ev if event[1] == 4]
        basic_fives = [event for event in fives if event[0] != ult]
        ult_t2 = next((event for event in ev if event[0] == ult and event[1] == 3), None)
        if basic_t2 and basic_fives:
            five_ap = basic_fives[0][2]
            done = tuple(sorted(event[0] for event in basic_t2 if event[2] < five_ap))
            add(before, (done, basic_fives[0][0]), w, n)
        if ult is not None and (ult_t2 or fives):
            if ult_t2 and (not fives or ult_t2[2] <= fives[0][2]):
                ult_before[0] += w
                ult_before[1] += n
            elif fives:
                five_before[0] += w
                five_before[1] += n
                add(five_before_ult, fives[0][0], w, n)
        seen = {}
        ap = 0
        pointed = set()
        rushed = None
        for ability in seq:
            seen[ability] = seen.get(ability, 0) + 1
            rank = seen[ability]
            if rank > 4:
                continue
            cost = COST[rank]
            if ap + cost > 4:
                break
            if ability in basics and rank == 2:
                pointed.add(ability)
            elif ability in basics and rank == 3 and rushed is None:
                rushed = ability
            ap += cost
        if rushed is not None and len(pointed) < 3:
            early_rush[rushed][0] += w
            early_rush[rushed][1] += n
        elif rushed is None and len(pointed) >= 3:
            early_spread[0] += w
            early_spread[1] += n

    prefixes = [
        {"clicks": list(key), "wins": w, "matches": n}
        for key, (w, n) in prefix3.items()
        if n >= KEEP
    ]
    prefixes.sort(key=lambda row: row["matches"], reverse=True)
    fives = [
        {"t2s": list(key[0]), "five": key[1], "wins": w, "matches": n}
        for key, (w, n) in before.items()
        if n >= KEEP
    ]
    fives.sort(key=lambda row: row["matches"], reverse=True)
    return {
        "id": hero["id"],
        "name": hero["name"],
        "wins": wins,
        "matches": matches,
        "abilities": abilities,
        "openUpgrade": named(open_upgrade),
        "prefix3": prefixes,
        "beforeFive": fives,
        "fiveBeforeUlt": named(five_before_ult),
        "firstMax": named(first_max),
        "ultBeforeFive": {"wins": ult_before[0], "matches": ult_before[1]},
        "fiveBeforeUltAny": {"wins": five_before[0], "matches": five_before[1]},
        "earlyPoints": {
            "spread": {"wins": early_spread[0], "matches": early_spread[1]},
            "rush": named(early_rush),
        },
    }


def main():
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
    built = []
    for hero in playable:
        try:
            row = hero_orders(hero, names, window)
        except Exception as exc:
            print("skip", hero.get("name"), exc)
            continue
        if row["matches"] <= 0 or len(row["abilities"]) < 4:
            print("skip", hero["name"], "matches", row["matches"], "abilities", len(row["abilities"]))
            continue
        built.append(row)
        print(f"{hero['name']:16} {row['matches']:7} games")
    payload = {"fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "heroes": built}
    text = (
        "// Ability-order branches. The board reads this file and does not call the API.\n"
        "import type { AbilityOrders } from \"@/lib/ability-path\";\n\n"
        f"export const abilityOrders: AbilityOrders = {json.dumps(payload, separators=(',', ':'))};\n"
    )
    OUT.write_text(text)
    print("wrote", OUT, "heroes", len(built))


if __name__ == "__main__":
    main()
