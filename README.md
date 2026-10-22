# Margin

Win rates for Deadlock public matches. Live at [sirrank0.github.io/margin](https://sirrank0.github.io/margin/).

Margin is a static site that scores team compositions, ranks ability orders, and converts builds. Rates come from a saved snapshot of public matches since the current balance patch. The page does not call the Deadlock API on load.

## Features

### Comp odds

Pick both lineups and assign the three streets (York, Broadway, Greenwich). The chance is a shrunk log-odds model of the heroes, the leftover from allies sharing a team, the leftover from each enemy matchup, and the leftover from a street when both duos are named. A rank filter keeps matches whose two teams both averaged that badge tier. The board shows an approximate 95% Wilson interval. Items are listed, but not added into the score.

A scoreboard or pause-screen screenshot can fill both teams. The reader matches the printed hero name and the portrait in the screenshot.

### Ability order

Per-hero win rates for the opening points, the first ability maxed, and each later five-point upgrade. Hover a step for the ability card: icon, cooldown, description, and the upgrades applied at that rank. Click a row or the card's Pin button to keep it open. Branches under 200 games cannot win a comparison.

### Build courier

Paste a Deadlock build code, retarget it to another hero, and apply that hero's leading ability order. Copy the new code out.

## Stack

- React 19, TypeScript, Vite, Tailwind CSS 4
- TanStack Router
- Committed snapshots in `src/data/`
- Deployed to GitHub Pages on every push to `main`

## Getting started

Requires Node 22.

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 8080 |
| `npm run build:pages` | Static export for GitHub Pages |
| `npm test` | Unit tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Data

Rates are rebuilt from the [Deadlock API](https://api.deadlock-api.com). The window is games since the latest balance patch when the median hero has at least 2,400 of them, and the API's last 30 days otherwise.

| File | Contents |
| --- | --- |
| `src/data/margin-ranks.ts` | Rank-stratified hero, pair, item, and counter rates |
| `src/data/margin-lanes.ts` | Duo-versus-duo street matchups |
| `src/data/ability-orders.ts` | Ability-order branches per hero |
| `src/data/data-window.ts` | Shared window label and median match count |

Rank and lane rates are refreshed on every Pages deploy by `scripts/fetch-rank-slices.py`. Ability orders are committed and refreshed with:

```bash
python3 scripts/fetch-ability-orders.py
```

## Project layout

```
src/
  components/   board, ability path, ability cards, screenshot reader, courier
  data/         committed snapshots
  lib/          odds model, path ranking, build codec, screenshot matching
  routes/       TanStack routes
scripts/        data fetch, Pages build, tests
```

## Deployment

Pushes to `main` run `.github/workflows/pages.yml`. The workflow installs dependencies, refreshes rank and lane rates, builds the static export, and deploys to GitHub Pages at [sirrank0.github.io/margin](https://sirrank0.github.io/margin/).
