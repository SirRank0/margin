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
* the point-spend order of the 12 upgrades, as a prefix tree under each unlock
  order. Upgrades bought within WINDOW_S seconds of each other (by the API's
  average upgrade times) were bought in one go, so their order inside the
  window is not a choice; they are put in slot order so the tree does not split
  on it.
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
# Upgrades this close together (seconds, average game time) count as one purchase.
WINDOW_S = 10
COST = {1: 1, 2: 2, 3: 5}
# Points that exist when the ultimate unlock arrives at level 7.
POINTS_BY_LEVEL_7 = 4


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


def build(rows, slot_ids):
    index_of = {ability: i for i, ability in enumerate(slot_ids)}
    unlocks = defaultdict(lambda: [0, 0])
    ults = defaultdict(lambda: defaultdict(lambda: [0, 0]))
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
        node = spend[code]
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
    return unlocks, ults, spend, states


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


def hero_tree(hero, names, window):
    rows = get(
        "/v1/analytics/ability-order-stats",
        {"hero_id": hero["id"], "min_matches": 1, "game_mode": "normal", **window},
    )
    abilities = []
    for slot in (1, 2, 3, 4):
        class_name = (hero.get("items") or {}).get(f"signature{slot}")
        found = names.get((hero["id"], class_name))
        if found:
            abilities.append({"id": found[0], "name": found[1], "slot": slot})
    wins = sum(row["wins"] for row in rows)
    matches = sum(row["matches"] for row in rows)
    band = {"band": "all", "label": "All ranks", "unlocks": [], "ult": {}, "spend": {}, "states": {}}
    if len(abilities) == 4:
        unlocks, ults, spend, states = build(rows, [ability["id"] for ability in abilities])
        band["unlocks"] = rows_of(unlocks)
        kept = {str(row[0]) for row in band["unlocks"]}
        band["ult"] = {code: rows_of(table) for code, table in ults.items() if str(code) in kept}
        band["spend"] = {str(code): serialize(prune(node), 0) for code, node in spend.items() if str(code) in kept}
        band["states"] = {key: r for key, table in states.items() if (r := rows_of(table))}
    return {
        "id": hero["id"],
        "name": hero["name"],
        "wins": wins,
        "matches": matches,
        "abilities": abilities,
        "bands": [band],
    }


def count_nodes(node):
    return 1 + sum(count_nodes(child) for child in node[3])


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
            row = hero_tree(hero, names, window)
        except Exception as exc:
            print("skip", hero.get("name"), exc)
            continue
        if row["matches"] <= 0 or len(row["abilities"]) < 4:
            print("skip", hero["name"], "matches", row["matches"])
            continue
        built.append(row)
        nodes = sum(count_nodes(root) for root in row["bands"][0]["spend"].values())
        print(f"{hero['name']:16} {row['matches']:7} games  {len(row['bands'][0]['unlocks'])} orders  {nodes:5} nodes")
    payload = {
        "fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "window": info["label"],
        "heroes": built,
    }
    text = (
        "// Ability unlock orders and point-spend trees. The board reads this file and does not call the API.\n"
        "import type { AbilityOrders } from \"@/lib/ability-path\";\n\n"
        f"export const abilityOrders: AbilityOrders = {json.dumps(payload, separators=(',', ':'))};\n"
    )
    OUT.write_text(text)
    print("wrote", OUT, "heroes", len(built), "bytes", OUT.stat().st_size)


if __name__ == "__main__":
    main()
