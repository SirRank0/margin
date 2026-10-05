"""Refresh rank-stratified public rates into src/data/margin-ranks.ts.

Each slice is the API's default 30-day window. A rank slice keeps matches
whose two teams both averaged that badge tier (tier * 10 + subrank).
"""

import json
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

API = "https://api.deadlock-api.com"
OUT = Path(__file__).resolve().parents[1] / "src" / "data" / "margin-ranks.ts"
LANES = Path(__file__).resolve().parents[1] / "src" / "data" / "margin-lanes.ts"

# The board's item chips. Names come from the previous snapshot.
ITEMS = {
    2922054143: "Rusted Barrel",
    2108215830: "Heroic Aura",
    1219329868: "Spirit Sap",
    690458959: "Express Shot",
    805079544: "Weapon Shielding",
    3977876567: "Kinetic Dash",
    709540378: "Cultist Sacrifice",
    381961617: "Active Reload",
    2407033488: "Intensifying Magazine",
    857669956: "Guardian Ward",
    4204808176: "Rebuttal",
}

TIERS = [
    (1, "Initiate"),
    (2, "Seeker"),
    (3, "Acolyte"),
    (4, "Sentinel"),
    (5, "Mystic"),
    (6, "Ritualist"),
    (7, "Emissary"),
    (8, "Oracle"),
    (9, "Phantom"),
    (10, "Ascendant"),
    (11, "Eternus"),
]


def get(path, params=None):
    url = API + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "margin/0.1"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        return json.load(resp)


# Pairs below this are too thin for a binomial logit. Shrinkage, not a
# higher cutoff, decides how much a recorded pair is allowed to matter.
PAIR_MIN = 30


def slice_meta(heroes, pairs, items, names, counters=None):
    hero_rows = []
    for row in heroes:
        name = names.get(row["hero_id"])
        if not name or row["matches"] <= 0:
            continue
        hero_rows.append(
            {
                "id": row["hero_id"],
                "name": name,
                "wins": row["wins"],
                "matches": row["matches"],
            }
        )
    hero_rows.sort(key=lambda hero: hero["matches"], reverse=True)
    pair_rows = []
    for row in pairs:
        matches = row["matches_played"]
        if matches < PAIR_MIN:
            continue
        pair_rows.append(
            {
                "a": row["hero_id1"],
                "b": row["hero_id2"],
                "wins": row["wins"],
                "matches": matches,
            }
        )
    counter_rows = []
    for row in counters or []:
        matches = row["matches_played"]
        hero_id = row["hero_id"]
        enemy_id = row["enemy_hero_id"]
        if matches < PAIR_MIN or hero_id == enemy_id:
            continue
        if hero_id not in names or enemy_id not in names:
            continue
        counter_rows.append(
            {
                "hero": hero_id,
                "enemy": enemy_id,
                "wins": row["wins"],
                "matches": matches,
            }
        )
    item_rows = []
    for row in items:
        name = ITEMS.get(row["item_id"])
        if not name:
            continue
        item_rows.append(
            {
                "id": row["item_id"],
                "name": name,
                "wins": row["wins"],
                "matches": row["matches"],
            }
        )
    item_rows.sort(key=lambda item: ITEMS and list(ITEMS).index(item["id"]))
    return {
        "heroMin": 0,
        "pairMin": PAIR_MIN,
        "meta": {
            "heroes": hero_rows,
            "pairs": pair_rows,
            "counters": counter_rows,
            "items": item_rows,
            "fetchedAt": datetime.now(timezone.utc).isoformat(),
        },
    }


def main():
    names = {hero["id"]: hero["name"] for hero in get("/v1/assets/heroes")}
    bands = [("all", "All ranks", None)]
    for tier, label in TIERS:
        bands.append(
            (
                label.lower(),
                label,
                {
                    "min_average_badge": tier * 10 + 1,
                    "max_average_badge": tier * 10 + 6,
                },
            )
        )

    def load(band):
        ident, label, params = band
        heroes = get("/v1/analytics/hero-stats", params)
        pairs = get("/v1/analytics/hero-synergy-stats", params)
        counters = get("/v1/analytics/hero-counter-stats", {**(params or {}), "min_matches": PAIR_MIN})
        items = get("/v1/analytics/item-stats", params)
        built = slice_meta(heroes, pairs, items, names, counters)
        built["id"] = ident
        built["label"] = label
        print(
            f"{label:12} heroes {len(built['meta']['heroes']):2} "
            f"pairs {len(built['meta']['pairs']):4}"
        )
        return built

    with ThreadPoolExecutor(4) as pool:
        slices = list(pool.map(load, bands))
    order = {ident: index for index, (ident, _, _) in enumerate(bands)}
    slices.sort(key=lambda row: order[row["id"]])
    payload = json.dumps(slices, separators=(",", ":"))
    OUT.write_text(
        "import type { MarginMeta } from \"@/lib/odds\";\n\n"
        "export type RankSlice = {\n"
        "  id: string;\n"
        "  label: string;\n"
        "  heroMin: number;\n"
        "  pairMin: number;\n"
        "  meta: MarginMeta;\n"
        "};\n\n"
        f"export const rankSlices: RankSlice[] = {payload};\n"
    )
    print("wrote", OUT, "bytes", OUT.stat().st_size)
    lane_rows = get(
        "/v1/analytics/lane-matchup-stats",
        {"min_matches": 80, "group_by": "hero_ids,enemy_hero_ids"},
    )
    lanes = []
    for row in lane_rows:
        a, b = sorted(int(x) for x in row["hero_ids"])
        c, d = sorted(int(x) for x in row["enemy_hero_ids"])
        if a == b or c == d or row["matches_played"] < 80:
            continue
        lanes.append(
            f"  {{a:{a},b:{b},c:{c},d:{d},wins:{int(row['wins'])},matches:{int(row['matches_played'])}}}"
        )
    LANES.write_text(
        'import type { LaneStat } from "@/lib/odds";\n\n'
        "/** Duo versus duo, all ranks, last 30 days, at least 80 lane matchups. Streets are pooled. Solo lanes are excluded by the source table. */\n"
        "export const laneMatchups: LaneStat[] = [\n"
        + ",\n".join(lanes)
        + "\n];\n"
    )
    print("wrote", LANES, "rows", len(lanes))


if __name__ == "__main__":
    main()
