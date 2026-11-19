"""Fetch ranked kill/death heatmaps for the last 30 days.

Writes compact JSON grids to public/heatmaps/ (all heroes, then one file per
hero) and a small window file the board imports. The page loads the grids on
demand and does not call the API. Requests run one at a time; 503s are retried
with backoff. Off-map and junk cells are dropped, and the two teams are merged
in each cell.
"""

from __future__ import annotations

import http.client
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

API = "https://api.deadlock-api.com"
ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "heatmaps"
WINDOW = ROOT / "src" / "data" / "heatmap-window.ts"
HEROES_TS = ROOT / "src" / "lib" / "deadlock" / "heroes.ts"
RADIUS = 10752
CELL = 128
USER_AGENT = "margin/0.1"
TIMEOUT_S = 180
ATTEMPTS = 6


def hero_ids() -> list[int]:
    text = HEROES_TS.read_text()
    ids = [
        int(match.group(1))
        for match in re.finditer(
            r"\{\s*id:\s*(\d+)\s*,\s*name:\s*\"[^\"]+\"\s*,\s*released:\s*true\s*\}",
            text,
        )
    ]
    if not ids:
        raise SystemExit(f"no released heroes in {HEROES_TS}")
    return ids


def retry_wait(exc: Exception, delay: int) -> int | None:
    """Seconds to wait, or None if this error should not be retried."""
    if isinstance(exc, urllib.error.HTTPError):
        retry_after = exc.headers.get("Retry-After") if exc.headers else None
        try:
            hinted = int(retry_after) if retry_after else None
        except ValueError:
            hinted = None
        if exc.code == 503:
            return max(1, min(hinted or delay, 120))
        # 504 means this exact query just timed out and will fail immediately
        # until Retry-After elapses. Wait at least a couple of minutes.
        if exc.code == 504:
            return max(120, min(hinted or 180, 300))
        return None
    if isinstance(exc, (urllib.error.URLError, TimeoutError, http.client.RemoteDisconnected, http.client.IncompleteRead, ConnectionError, OSError)):
        return max(1, min(delay, 120))
    return None


def get(path: str, params: dict | None = None) -> object:
    url = API + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    delay = 5
    last_error: Exception | None = None
    for attempt in range(ATTEMPTS):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
                return json.load(resp)
        except Exception as exc:
            last_error = exc
            wait = retry_wait(exc, delay)
            if wait is None or attempt == ATTEMPTS - 1:
                raise
            print(f"{exc} on {path}; retry in {wait}s (attempt {attempt + 1}/{ATTEMPTS})")
            time.sleep(wait)
            delay = min(max(delay, wait) * 2, 180)
    raise last_error or RuntimeError("request failed")


def compact_cells(rows: list[dict]) -> tuple[list[list[int]], int, int]:
    merged: dict[tuple[int, int], list[int]] = defaultdict(lambda: [0, 0])
    for row in rows:
        try:
            x = int(row["position_x"])
            y = int(row["position_y"])
            kills = int(row.get("kills") or 0)
            deaths = int(row.get("deaths") or 0)
        except (KeyError, TypeError, ValueError):
            continue
        if abs(x) > RADIUS or abs(y) > RADIUS:
            continue
        if kills < 0 or deaths < 0 or (kills == 0 and deaths == 0):
            continue
        if x % CELL or y % CELL:
            # The API rasters to 128; skip anything that does not land on the grid.
            continue
        cell = merged[(x // CELL, y // CELL)]
        cell[0] += kills
        cell[1] += deaths
    cells = [[ix, iy, counts[0], counts[1]] for (ix, iy), counts in sorted(merged.items())]
    total_kills = sum(cell[2] for cell in cells)
    total_deaths = sum(cell[3] for cell in cells)
    return cells, total_kills, total_deaths


def write_grid(path: Path, cells: list[list[int]], kills: int, deaths: int) -> None:
    payload = {
        "v": 1,
        "radius": RADIUS,
        "cell": CELL,
        "kills": kills,
        "deaths": deaths,
        "cells": cells,
    }
    path.write_text(json.dumps(payload, separators=(",", ":")))


def month_day(stamp: datetime) -> str:
    return f"{stamp.strftime('%B')} {stamp.day}, {stamp.year}"


def fetch_grid(params: dict) -> tuple[list[list[int]], int, int]:
    data = get("/v1/analytics/kill-death-stats", params)
    if not isinstance(data, list):
        raise RuntimeError(f"unexpected kill-death-stats payload: {type(data).__name__}")
    return compact_cells(data)


def main() -> None:
    now = datetime.now(timezone.utc)
    start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc) - timedelta(days=30)
    min_ts = int(start.timestamp())
    label = f"Ranked games from {month_day(start)} to {month_day(now)}"
    base = {
        "game_mode": "normal",
        "match_mode": "ranked",
        "min_unix_timestamp": min_ts,
    }
    ids = hero_ids()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("*.json"):
        old.unlink()

    print("fetch all heroes", label)
    cells, kills, deaths = fetch_grid(base)
    write_grid(OUT_DIR / "all.json", cells, kills, deaths)
    print(f"all  cells {len(cells):5}  kills {kills}  deaths {deaths}  bytes {(OUT_DIR / 'all.json').stat().st_size}")

    kept: list[int] = []
    skipped: list[int] = []

    def write_hero(hero_id: int) -> bool:
        print(f"fetch hero {hero_id}")
        try:
            hero_cells, hero_kills, hero_deaths = fetch_grid({**base, "hero_ids": hero_id})
        except Exception as exc:
            print(f"skip hero {hero_id}: {exc}")
            return False
        write_grid(OUT_DIR / f"{hero_id}.json", hero_cells, hero_kills, hero_deaths)
        size = (OUT_DIR / f"{hero_id}.json").stat().st_size
        print(f"hero {hero_id:3}  cells {len(hero_cells):5}  kills {hero_kills}  deaths {hero_deaths}  bytes {size}")
        return True

    for hero_id in ids:
        if write_hero(hero_id):
            kept.append(hero_id)
        else:
            skipped.append(hero_id)
    if skipped:
        print(f"retrying {len(skipped)} skipped heroes after a pause")
        time.sleep(90)
        still: list[int] = []
        for hero_id in skipped:
            if write_hero(hero_id):
                kept.append(hero_id)
            else:
                still.append(hero_id)
        skipped = still
        if skipped:
            print("still missing heroes", skipped)
    kept.sort()

    window = {
        "since": start.strftime("%Y-%m-%d"),
        "until": now.strftime("%Y-%m-%d"),
        "label": label,
        "matchMode": "ranked",
        "radius": RADIUS,
        "cell": CELL,
        "heroes": kept,
        "fetchedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    text = (
        "// Date range and hero list for the heatmap grids in public/heatmaps/.\n"
        "// The board loads those JSON files on demand and does not call the API.\n"
        "export const heatmapWindow = "
        f"{json.dumps(window, indent=2)} as const;\n"
    )
    WINDOW.write_text(text)
    total = sum(path.stat().st_size for path in OUT_DIR.glob("*.json"))
    print("wrote", WINDOW, "heroes", len(kept), "grid bytes", total)


if __name__ == "__main__":
    main()
