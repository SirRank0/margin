/**
 * Deadlock's ability rules, in one place. The model (ability-path.ts) and the
 * tests both use this module, so a path the model emits is checked against the
 * same rules it was built from. docs/ability-mechanics.md states the rules and
 * their sources. scripts/fetch-ability-orders.py mirrors the constants.
 */

export type AbilityInfo = {
  id: number;
  name: string;
  slot: 1 | 2 | 3 | 4;
};

export type Click = {
  ability: number;
  /** 0 unlock, 1 the 1-point upgrade, 2 the 2-point upgrade, 5 the 5-point upgrade. */
  rank: 0 | 1 | 2 | 5;
};

/** Boon levels that give an unlock. The first three are basic-only, the fourth is the ultimate's. */
export const UNLOCK_LEVELS = [0, 2, 4, 7] as const;
/** Ability points stop at this boon level. */
export const MAX_LEVEL = 35;
/** Point cost of the 1st, 2nd and 3rd upgrade of an ability. */
export const UPGRADE_COST = [1, 2, 5] as const;
/** Upgrades per ability. */
export const TIERS = 3;
/** Points in a game: every boon level 1..35 that does not give an unlock. */
export const TOTAL_POINTS = 32;
/** Clicks in a full path: 4 unlocks and 12 upgrades. */
export const PATH_LENGTH = 16;
/** Click rank after 0..3 upgrades (index 0 is the unlock). */
export const RANK_OF_TIER: readonly Click["rank"][] = [0, 1, 2, 5];

/** Points earned by the end of boon level `level`. */
export function pointsAt(level: number): number {
  let points = 0;
  for (let at = 1; at <= Math.min(level, MAX_LEVEL); at += 1) {
    if (!(UNLOCK_LEVELS as readonly number[]).includes(at)) points += 1;
  }
  return points;
}

/** Basic unlocks earned by the end of boon level `level` (0..3). */
export function basicUnlocksAt(level: number): number {
  return UNLOCK_LEVELS.slice(0, 3).filter((at) => at <= level).length;
}

/** Points the ultimate unlock finds in hand at level 7 when none were spent. */
export const POINTS_BY_ULT_UNLOCK = pointsAt(UNLOCK_LEVELS[3]);

export type Replay = { ok: true; levels: number[] } | { ok: false; at: number; reason: string };

/**
 * Check a click list against the rules and give the earliest boon level of each
 * click. Levels only ever add resources, so taking each click at its earliest
 * level is optimal: the list is legal exactly when this succeeds.
 *
 * - an ability is unlocked once, then upgraded at most three times, in order;
 * - unlocks 1-3 are basic-only and arrive at levels 0, 2, 4; the ultimate's arrives at level 7;
 * - an upgrade needs its ability unlocked and its previous upgrade;
 * - points spent never exceed points earned by that level, so at most 32.
 */
export function replay(clicks: readonly Click[], abilities: readonly AbilityInfo[]): Replay {
  const tiers = new Map<number, number>(); // -1 locked, 0 unlocked, 1..3 upgrades
  let level = 0;
  let basicsUsed = 0;
  let spent = 0;
  const levels: number[] = [];
  for (const [at, click] of clicks.entries()) {
    const ability = abilities.find((entry) => entry.id === click.ability);
    if (!ability) return { ok: false, at, reason: "unknown ability" };
    const next = (tiers.get(click.ability) ?? -1) + 1;
    if (next > TIERS) return { ok: false, at, reason: "more than three upgrades" };
    if (click.rank !== RANK_OF_TIER[next]) return { ok: false, at, reason: "rank out of order" };
    if (next === 0) {
      if (ability.slot === 4) level = Math.max(level, UNLOCK_LEVELS[3]);
      else {
        if (basicsUsed >= 3) return { ok: false, at, reason: "a fourth basic unlock" };
        while (basicUnlocksAt(level) <= basicsUsed && level <= MAX_LEVEL) level += 1;
        basicsUsed += 1;
      }
    } else {
      const cost = UPGRADE_COST[next - 1];
      while (pointsAt(level) - spent < cost && level <= MAX_LEVEL) level += 1;
      spent += cost;
    }
    if (level > MAX_LEVEL || spent > TOTAL_POINTS) return { ok: false, at, reason: "more points than the game gives" };
    tiers.set(click.ability, next);
    levels.push(level);
  }
  return { ok: true, levels };
}

/** Earliest boon level of each click, or null when the list breaks a rule. */
export function replayClicks(clicks: readonly Click[], abilities: readonly AbilityInfo[]): number[] | null {
  const result = replay(clicks, abilities);
  return result.ok ? result.levels : null;
}

/** A legal list that unlocks and fully upgrades all four abilities. */
export function isCompletePath(clicks: readonly Click[], abilities: readonly AbilityInfo[]): boolean {
  if (clicks.length !== PATH_LENGTH || abilities.length !== 4 || !replay(clicks, abilities).ok) return false;
  return abilities.every(
    (ability) => clicks.filter((click) => click.ability === ability.id).length === TIERS + 1,
  );
}
