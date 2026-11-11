# Ability mechanics

The ability board models these rules. `src/lib/ability-rules.ts` encodes them; the
model and the tests both use that module, and `scripts/fetch-ability-orders.py`
mirrors its constants.

## Rules

1. **Unlocks are a resource of their own.** One arrives at boon levels 0, 2, 4 and 7
   (600, 1,100, 2,000 and 3,800 souls). The first three can only unlock basic
   abilities, in any order the player picks. The fourth can only unlock the ultimate.
   Unlocks cannot be refunded. [Abilities], [Boon]
2. **Ability points are a separate resource.** Every boon level from 1 to 35 that does
   not give an unlock gives one point: 32 in all (1 at level 1, 4 by level 7, 5 at
   level 8, 32 at level 35, 49,200 souls). [Abilities], [Boon]
3. **Upgrades cost 1, 2 and 5 points**, in that order, three per ability. Four
   abilities cost exactly 32 points, so an unlock costs no points. [Abilities]
4. **An upgrade needs its ability unlocked and its previous upgrade.** [Abilities]
5. **Points and unlocks can be held.** Points can be saved for a later upgrade (for
   example, a 5-point upgrade). A basic unlock can be held past the ultimate's unlock;
   0.5% of games do this. [Abilities]; the held unlock is shown by the data, not stated
   by the wiki.
6. **Points spent never exceed points earned by that level.** Follows from 2 and 3.
7. An upgrade can be refunded within 10 seconds if no ability was used. The API's
   orders do not show refunds, so the model ignores them.

## The data

`/v1/analytics/ability-order-stats` returns, per distinct ability order, the
abilities clicked in order, `avg_upgrade_times_s` (average game second of each
click), wins and matches. The order has "one entry per ability point spent, unlocks
included", and an ability's first entry is its unlock ("unlocked (put their first
point into)", `ability_unlock_order_prefix`). [OpenAPI] Many games end before
level 35, so orders have 12 to 16 entries. Only `game_mode=normal` is used; street
brawl hands out points in blocks.

## Model

Each order is split into:

- **Unlock order**: the order of the three basic unlocks (6 options).
- **Ultimate unlock**: at level 7, before a held basic unlock, or held past level 7.
- **Point-allocation strategy**: see below.
- **Spend order**: the 12 upgrades in purchase order. Upgrades within 10 seconds of
  each other (by average time) count as one purchase and are put in slot order, so
  the order inside one purchase does not split the data.

The board picks the unlock order, then the ultimate unlock, then the strategy, then
the best concrete spend order inside that strategy, each by win rate shrunk toward
its parent (2,000 games), with floors of 200 games and 5% of the most-played
option. Strategies within a 95% chance of the best are shown as alternatives. The
chosen decisions are laid onto the boon schedule: an unlock is used when it arrives,
an upgrade is bought, in spend order, as soon as it is unlocked and affordable.

## Rank bands

`min_average_badge` / `max_average_badge` keep matches whose average badge is in a
range. A badge is tier * 10 + subrank (1..6), tiers 1 Initiate to 11 Eternus, as in
`scripts/fetch-rank-slices.py`. The board has all ranks plus four coarse bands:
Initiate to Acolyte (11-36), Sentinel to Ritualist (41-66), Emissary to Phantom
(71-96), Ascendant and Eternus (101-116). Only about 17% of games carry an
average badge, so bands are much thinner than all ranks. Where a band has no
eligible option for a pick, the board uses all ranks for that pick and marks it
"pooled" and low confidence. All ranks ships in the bundle; the bands are JSON files
in `public/ability-orders/<band>/<heroId>.json`, loaded when picked.

## Shrinkage strength

PRIOR_K was tuned on held-out games: see `docs/prior-tuning.md`.

## Strategy signature

A strategy is **(first ability maxed, second ability maxed, shape before the first
max)**. The shape is how many other abilities had their 2-point upgrade when the
first ability got its 5-point upgrade:

- **rush**: none (every other ability at 1 point or less),
- **one up**: exactly one,
- **spread**: two or more.

Why this signature:

- **Mechanically meaningful.** 5-point upgrades are 20 of the 32 points. Each max is
  the largest power spike a player buys, and they come late (a first max costs 8
  points, so level 11 at the earliest). Which ability gets each spike, and how much
  was spent elsewhere before the first one, is the allocation decision; the order of
  1- and 2-point clicks around it is not.
- **Data-dense.** It has at most 4 × 3 × 3 = 36 values per unlock order. In the
  data since the November 4, 2026 patch, 96.5% of games max at least two abilities,
  and the strategies the board picks have thousands to tens of thousands of games.
- **Why not the full max order or full tier vectors.** The third and fourth max are
  reached by 79% and 27% of games, so a full max order would mostly measure how
  long games lasted. Exact tier vectors at each max split the data into far more
  values with far fewer games each.

Games that never max two abilities (3.5%) have no strategy; they still count for
the unlock order and the ultimate unlock. Spend trees are stored only for unlock
orders and strategies the board can pick (200 games and 5% of the most-played
option); a switch to anything else walks the state table instead.

Caveat: reaching a second max takes about level 19 or later, so strategy win rates
are measured on games that went that long.

[Abilities]: https://deadlock.wiki/Abilities
[Boon]: https://deadlock.wiki/Boon
[OpenAPI]: https://api.deadlock-api.com/openapi.json
