"""Build a prefix tree of ability sequences for every hero.

The board walks the tree. It does not stitch separate tables.
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


def get(path, params=None):
    url = API + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "margin/0.1"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.load(resp)


class Node:
    __slots__ = ("wins", "matches", "end_matches", "children")

    def __init__(self):
        self.wins = 0
        self.matches = 0
        self.end_matches = 0
        self.children = {}

    def add(self, wins, matches, ending):
        self.wins += wins
        self.matches += matches
        if ending:
            self.end_matches += matches


def build(rows, slot_ids):
    """Insert sequences into a trie and a rank-vector backoff table.

    slot_ids is the four ability ids in slot order. The state key is the
    four ranks (0..4) in that order, so games that reached the same ranks
    by different orders share a backoff row.
    """
    known = set(slot_ids)
    root = Node()
    states = defaultdict(lambda: defaultdict(lambda: [0, 0]))
    for row in rows:
        seen = defaultdict(int)
        clean = []
        for ability in row["abilities"]:
            if ability not in known or seen[ability] >= 4:
                continue
            seen[ability] += 1
            clean.append(ability)
        w, n = row["wins"], row["matches"]
        node = root
        node.add(w, n, ending=not clean)
        ranks = [0, 0, 0, 0]
        index_of = {ability: i for i, ability in enumerate(slot_ids)}
        for pos, ability in enumerate(clean):
            key = ",".join(str(r) for r in ranks)
            bucket = states[key][ability]
            bucket[0] += w
            bucket[1] += n
            ranks[index_of[ability]] += 1
            child = node.children.get(ability)
            if child is None:
                child = Node()
                node.children[ability] = child
            child.add(w, n, ending=pos == len(clean) - 1)
            node = child
    return root, states


def prune(node):
    node.children = {
        ability: child
        for ability, child in node.children.items()
        if child.matches >= KEEP and prune(child) is not None
    }
    return node


def serialize(node, ability_id):
    children = sorted(node.children.items(), key=lambda item: -item[1].matches)
    return [ability_id, node.wins, node.matches, [serialize(child, ability) for ability, child in children]]


def serialize_states(states):
    out = {}
    for key, nxt in states.items():
        rows = [[ability, w, n] for ability, (w, n) in nxt.items() if n >= KEEP]
        if rows:
            rows.sort(key=lambda row: -row[2])
            out[key] = rows
    return out


def hero_tree(hero, names, window):
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
    slot_ids = [ability["id"] for ability in abilities]
    wins = sum(row["wins"] for row in rows)
    matches = sum(row["matches"] for row in rows)
    root, states = build(rows, slot_ids)
    prune(root)
    return {
        "id": hero["id"],
        "name": hero["name"],
        "wins": wins,
        "matches": matches,
        "abilities": abilities,
        "bands": [{
            "band": "all",
            "label": "All ranks",
            "root": serialize(root, 0),
            "states": serialize_states(states),
        }],
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
            row = hero_tree(hero, names, window)
        except Exception as exc:
            print("skip", hero.get("name"), exc)
            continue
        if row["matches"] <= 0 or len(row["abilities"]) < 4:
            print("skip", hero["name"], "matches", row["matches"])
            continue
        built.append(row)
        nodes = count_nodes(row["bands"][0]["root"])
        print(f"{hero['name']:16} {row['matches']:7} games  {nodes:5} nodes")
    payload = {
        "fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "window": info["label"],
        "heroes": built,
    }
    text = (
        "// Ability-order tree. The board reads this file and does not call the API.\n"
        "import type { AbilityOrders } from \"@/lib/ability-path\";\n\n"
        f"export const abilityOrders: AbilityOrders = {json.dumps(payload, separators=(',', ':'))};\n"
    )
    OUT.write_text(text)
    print("wrote", OUT, "heroes", len(built), "bytes", OUT.stat().st_size)


def count_nodes(node):
    return 1 + sum(count_nodes(child) for child in node[3])


if __name__ == "__main__":
    main()
