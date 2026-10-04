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


def floors(hero_matches):
    if hero_matches >= 2_000_000:
        return 200, 400
    if hero_matches >= 300_000:
        return 80, 120
    return 40, 30


def slice_meta(heroes, pairs, items, names):
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
    total = sum(hero["matches"] for hero in hero_rows)
    hero_min, pair_min = floors(total)
    pair_rows = []
    for row in pairs:
        matches = row["matches_played"]
        if matches < pair_min:
            continue
        pair_rows.append(
            {
                "a": row["hero_id1"],
                "b": row["hero_id2"],
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
    item_rows.sort(key=lambda item: list(ITEMS).index(item["id"]))
    return {
        "heroMin": hero_min,
        "pairMin": pair_min,
        "meta": {
            "heroes": hero_rows,
            "pairs": pair_rows,
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
        items = get("/v1/analytics/item-stats", params)
        built = slice_meta(heroes, pairs, items, names)
        built["id"] = ident
        built["label"] = label
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


if __name__ == "__main__":
    main()
