"""Choose the match window shared by the snapshots.

The latest hero-balance patch is 2026-10-05 23:05 UTC. October 6 added Baba
and did not change existing numbers.

A 50% record has a Wilson 95% half-width of 2 percentage points at 2,400
games. Games since the patch are used only when the median hero has at least
that many. Otherwise the API default, the last 30 days, is kept.
"""

from datetime import datetime, timezone

PATCH_AT = datetime(2026, 10, 5, 23, 5, tzinfo=timezone.utc)
PATCH_UNIX = int(PATCH_AT.timestamp())
ENOUGH = 2400
PATCH_LABEL = "Since the October 5, 2026 patch"


def resolve(get):
    heroes = get("/v1/assets/heroes")
    playable = {
        hero["id"]
        for hero in heroes
        if hero.get("id", 0) < 500
        and not hero.get("disabled")
        and (hero.get("items") or {}).get("signature1")
    }
    rows = get("/v1/analytics/hero-stats", {"min_unix_timestamp": PATCH_UNIX})
    counts = sorted(
        row["matches"] for row in rows if row["hero_id"] in playable and row["matches"] > 0
    )
    median = counts[len(counts) // 2] if counts else 0
    info = {
        "since": PATCH_AT.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "label": PATCH_LABEL if median >= ENOUGH else "Last 30 days",
        "switched": median >= ENOUGH,
        "medianMatches": median,
        "enough": ENOUGH,
    }
    params = {"min_unix_timestamp": PATCH_UNIX} if info["switched"] else {}
    return params, info
