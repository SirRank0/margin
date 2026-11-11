import { wilson } from "./odds.ts";

/** A choice under this many games cannot be chosen. */
export const MIN_BRANCH = 200;
/** A choice under this share of its most-played sibling cannot be chosen. */
export const MIN_SHARE = 0.05;
/** Shrinkage strength in games. A choice is pulled toward its parent's rate. */
export const PRIOR_K = 2000;
/** A decision is separated only when the chance it is better clears this. */
export const SEPARATED_P = 0.95;
/** A choice under this many games is flagged low confidence. */
export const LOW_CONFIDENCE_GAMES = 1000;

/**
 * The boon schedule (https://deadlock.wiki/Boon, https://deadlock.wiki/Abilities).
 * Unlocks arrive at boon levels 0, 2, 4 and 7: the first three are basic-only,
 * the fourth is the ultimate's. Every other level up to 35 gives one ability point.
 */
export const UNLOCK_LEVELS = [0, 2, 4, 7] as const;
export const MAX_LEVEL = 35;
/** Points for the 1-, 2- and 5-point upgrades. Four abilities cost exactly 32. */
export const UPGRADE_COST = [1, 2, 5] as const;
export const TOTAL_POINTS = 32;
/** Upgrades per ability. */
const TIERS = 3;
/** Clicks in a full path: 4 unlocks and 12 upgrades. */
export const PATH_LENGTH = 16;
/** Points that exist when the ultimate unlock arrives at level 7. */
export const POINTS_BY_LEVEL_7 = 4;

export type AbilityInfo = {
  id: number;
  name: string;
  slot: 1 | 2 | 3 | 4;
};

export type Count = { wins: number; matches: number };

/** Compact trie node: [abilityId, wins, matches, children]. The root's abilityId is 0. */
export type TreeNode = [number, number, number, TreeNode[]];

/** "tiers a,b,c,u|unlocks used|points spent" -> next upgrade rows [abilityId, wins, matches]. */
export type StateTable = Record<string, Array<[number, number, number]>>;

export type BandTree = {
  band: string;
  label: string;
  /** Basic unlock orders as slot codes (213 = slot 2, then 1, then 3): [code, wins, matches]. */
  unlocks: Array<[number, number, number]>;
  /** Unlock code -> where the ultimate unlock went: [ultOption, wins, matches]. See ultOptionLabel. */
  ult: Record<string, Array<[number, number, number]>>;
  /** Unlock code -> prefix tree of the 12 upgrades, in purchase order. */
  spend: Record<string, TreeNode>;
  /** Backoff for the spend tree, across unlock orders. */
  states: StateTable;
};

export type HeroOrders = {
  id: number;
  name: string;
  wins: number;
  matches: number;
  abilities: AbilityInfo[];
  bands: BandTree[];
};

export type AbilityOrders = {
  fetchedAt: string;
  window?: string;
  heroes: HeroOrders[];
};

export type Click = {
  ability: number;
  /** 0 unlock, 1 the 1-point upgrade, 2 the 2-point upgrade, 5 the 5-point upgrade. */
  rank: 0 | 1 | 2 | 5;
};

/** One click of the combined path, with where it falls on the boon schedule. */
export type Step = {
  click: Click;
  kind: "unlock" | "upgrade";
  /** Earliest boon level this click can happen at, given the clicks before it. */
  level: number;
  /** Points were held across at least one level to afford or wait for this upgrade. */
  saved: boolean;
  /** The decision that placed it: "unlock-order", "ult" or "spend-N". */
  decisionId: string;
};

export type Decision = {
  id: string;
  index: number;
  kind: "unlock-order" | "ult" | "spend";
  label: string;
  /** The option taken: an unlock code, an ult option, or an ability id. */
  value: number;
  /** The upgrade, for spend decisions. */
  click: Click | null;
  separated: boolean;
  pBetter: number;
  lowConfidence: boolean;
  /** "fallback": nothing cleared the game floors, so the most-played legal option was taken. */
  source: "tree" | "state" | "forced" | "fallback";
  chosen: Count & { name: string; rate: number };
  other: (Count & { name: string; rate: number }) | null;
  alternateId: number | null;
};

export type AbilityPath = {
  clicks: Click[];
  steps: Step[];
  decisions: Decision[];
  /** Basic ability ids in unlock order. */
  unlockOrder: number[];
  ult: number;
  band: string;
};

const RANK_OF_TIER: Click["rank"][] = [0, 1, 2, 5];
const TIER_LABEL = ["unlock", "1-point", "2-point", "5-point"];

/** Standard normal CDF. Abramowitz and Stegun 26.2.17. */
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x >= 0 ? 1 - p : p;
}

function shrink(child: Count, parentRate: number, k = PRIOR_K): number {
  return (child.wins + k * parentRate) / (child.matches + k);
}

function posterior(child: Count, parentRate: number, k = PRIOR_K) {
  const a = child.wins + k * parentRate;
  const b = child.matches - child.wins + k * (1 - parentRate);
  const mean = a / (a + b);
  const variance = (a * b) / ((a + b) ** 2 * (a + b + 1));
  return { mean, variance };
}

/** Points earned by the end of boon level `level`. */
export function pointsAt(level: number): number {
  let points = 0;
  for (let at = 1; at <= Math.min(level, MAX_LEVEL); at += 1) {
    if (!(UNLOCK_LEVELS as readonly number[]).includes(at)) points += 1;
  }
  return points;
}

/** Basic unlocks earned by the end of boon level `level` (0..3). */
function basicUnlocksAt(level: number): number {
  return UNLOCK_LEVELS.slice(0, 3).filter((at) => at <= level).length;
}

/** Ult option: basics unlocked before it * 100, plus points spent before it when held past level 7. */
export function ultOption(basicsBefore: number, pointsBefore: number): number {
  return basicsBefore * 100 + (pointsBefore > POINTS_BY_LEVEL_7 ? pointsBefore : 0);
}

export function ultOptionLabel(option: number): string {
  const basics = Math.floor(option / 100);
  const held = option % 100;
  const when = held > 0 ? `held until ${held} points are spent` : "at level 7";
  if (basics >= 3) return `Ultimate ${when}`;
  return `Ultimate ${when}, before basic unlock ${basics + 1}`;
}

function isLegalUltOption(option: number): boolean {
  const basics = Math.floor(option / 100);
  const held = option % 100;
  const maxBefore = TOTAL_POINTS - UPGRADE_COST.reduce((sum, cost) => sum + cost, 0);
  return basics >= 0 && basics <= 3 && (held === 0 || (held > POINTS_BY_LEVEL_7 && held <= maxBefore));
}

/** Slot code (213) -> basic ability ids, or null when it is not an order of the three basics. */
function decodeOrder(code: number, abilities: AbilityInfo[]): number[] | null {
  const digits = String(code).split("").map(Number);
  if (digits.length !== 3 || new Set(digits).size !== 3) return null;
  const ids = digits.map((slot) => abilities.find((ability) => ability.slot === slot && slot !== 4)?.id);
  return ids.every((id): id is number => id !== undefined) ? ids : null;
}

function orderCode(ids: number[], abilities: AbilityInfo[]): number {
  return ids.reduce((code, id) => code * 10 + (abilities.find((ability) => ability.id === id)?.slot ?? 0), 0);
}

/**
 * Check a combined click list against the hard rules and return the earliest
 * boon level of each click, or null when it breaks one:
 * unlocks 1-3 are basic-only and arrive at levels 0, 2, 4; the ultimate's unlock
 * arrives at level 7; an upgrade needs its ability unlocked and its previous tier;
 * points spent never exceed points earned; at most 32 points by level 35.
 */
export function replayClicks(clicks: Click[], abilities: AbilityInfo[]): number[] | null {
  const tiers = new Map<number, number>();
  let level = 0;
  let basicsUsed = 0;
  let spent = 0;
  const levels: number[] = [];
  for (const click of clicks) {
    const ability = abilities.find((entry) => entry.id === click.ability);
    if (!ability) return null;
    const have = tiers.get(click.ability) ?? -1; // -1 locked, 0 unlocked, 1..3 upgrades
    const next = have + 1;
    if (next > TIERS || click.rank !== RANK_OF_TIER[next]) return null;
    if (next === 0) {
      if (ability.slot === 4) level = Math.max(level, UNLOCK_LEVELS[3]);
      else {
        if (basicsUsed >= 3) return null;
        while (basicUnlocksAt(level) <= basicsUsed && level <= MAX_LEVEL) level += 1;
        basicsUsed += 1;
      }
    } else {
      const cost = UPGRADE_COST[next - 1];
      while (pointsAt(level) - spent < cost && level <= MAX_LEVEL) level += 1;
      spent += cost;
    }
    if (level > MAX_LEVEL || spent > TOTAL_POINTS) return null;
    tiers.set(click.ability, next);
    levels.push(level);
  }
  return levels;
}

type Plan = { order: number[]; ult: number; spends: number[] };
type Scheduled = { steps: Step[] };

/**
 * Lay the unlock order, the ultimate option and the spend order onto the boon
 * schedule. Each unlock is used when it arrives (the ultimate at level 7 unless
 * the option holds it); each upgrade is bought, in spend order, as soon as its
 * ability is unlocked and the points are there. The result is legal by construction.
 */
function schedule(plan: Plan, abilities: AbilityInfo[]): Scheduled {
  const ultId = abilities.find((ability) => ability.slot === 4)?.id ?? -1;
  const basicsBeforeUlt = Math.floor(plan.ult / 100);
  const heldUntil = plan.ult % 100;
  const tiers = new Map<number, number>();
  const unlocked = new Set<number>();
  const steps: Step[] = [];
  let basicsUsed = 0;
  let spent = 0;
  let next = 0;
  let waited = false;
  for (let level = 0; level <= MAX_LEVEL; level += 1) {
    const points = pointsAt(level);
    for (;;) {
      const want = plan.spends[next];
      let moved = false;
      if (basicsUsed < 3 && basicsUsed < basicUnlocksAt(level)) {
        const id = plan.order[basicsUsed];
        const hold = basicsUsed >= basicsBeforeUlt && !unlocked.has(ultId) && want !== id;
        if (!hold) {
          unlocked.add(id);
          basicsUsed += 1;
          tiers.set(id, 0);
          steps.push({ click: { ability: id, rank: 0 }, kind: "unlock", level, saved: false, decisionId: "unlock-order" });
          moved = true;
        }
      }
      if (
        !unlocked.has(ultId) &&
        level >= UNLOCK_LEVELS[3] &&
        basicsUsed >= Math.min(basicsBeforeUlt, 3) &&
        (heldUntil === 0 || spent >= heldUntil || want === ultId)
      ) {
        unlocked.add(ultId);
        tiers.set(ultId, 0);
        steps.push({ click: { ability: ultId, rank: 0 }, kind: "unlock", level, saved: false, decisionId: "ult" });
        moved = true;
      }
      if (want !== undefined && unlocked.has(want)) {
        const tier = (tiers.get(want) ?? 0) + 1;
        const cost = UPGRADE_COST[tier - 1];
        if (cost !== undefined && points - spent >= cost) {
          tiers.set(want, tier);
          spent += cost;
          steps.push({
            click: { ability: want, rank: RANK_OF_TIER[tier] },
            kind: "upgrade",
            level,
            saved: waited,
            decisionId: `spend-${next}`,
          });
          waited = false;
          next += 1;
          moved = true;
        }
      }
      if (!moved) break;
    }
    if (next < plan.spends.length && points - spent > 0) waited = true;
  }
  return { steps };
}

const DECISION_KEYS = ["unlock-order", "ult"] as const;

/** Override key of the decision at `index`: unlock order, ultimate, then spend-0..spend-11. */
export function decisionKey(index: number): string {
  return DECISION_KEYS[index] ?? `spend-${index - DECISION_KEYS.length}`;
}

function decisionIndex(key: string): number {
  const fixed = (DECISION_KEYS as readonly string[]).indexOf(key);
  if (fixed >= 0) return fixed;
  const match = /^spend-(\d+)$/.exec(key);
  return match ? DECISION_KEYS.length + Number(match[1]) : Number.NaN;
}

/**
 * Set or clear the switch at decision `index`. Every later switch is dropped,
 * because the decisions after a switch are walked again.
 */
export function applySwitch(
  overrides: Record<string, number>,
  index: number,
  value: number | null,
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [key, kept] of Object.entries(overrides)) {
    const at = decisionIndex(key);
    if (Number.isInteger(at) && at < index) next[key] = kept;
  }
  if (value !== null) next[decisionKey(index)] = value;
  return next;
}

type Source = "tree" | "state";
type Row = Count & { ability: number };
type Option = Row & { score: number; source: Source };
type Pick = {
  chosen: Option;
  rival: Option | null;
  separated: boolean;
  pBetter: number;
  lowConfidence: boolean;
  source: Decision["source"];
};

function pickChild(options: Row[], parentRate: number, source: Source): Pick | null {
  const top = Math.max(0, ...options.map((option) => option.matches));
  const eligible = options.filter((option) => option.matches >= MIN_BRANCH && option.matches >= MIN_SHARE * top);
  if (eligible.length === 0) return null;
  const scored: Option[] = eligible
    .map((option) => ({ ...option, score: shrink(option, parentRate), source }))
    .sort((a, b) => b.score - a.score || b.matches - a.matches || a.ability - b.ability);
  const chosen = scored[0];
  const rival = scored[1] ?? null;
  if (!chosen) return null;
  let pBetter = 1;
  if (rival) {
    const c = posterior(chosen, parentRate);
    const r = posterior(rival, parentRate);
    const scale = Math.sqrt(c.variance + r.variance);
    pBetter = scale > 0 ? normalCdf((c.mean - r.mean) / scale) : 0.5;
  }
  return {
    chosen,
    rival,
    pBetter,
    separated: rival ? pBetter >= SEPARATED_P : true,
    lowConfidence: source === "state" || chosen.matches < LOW_CONFIDENCE_GAMES,
    source,
  };
}

/** Most-played legal option when nothing clears the game floors. Always low confidence. */
function fallbackPick(options: Row[], parentRate: number, source: Source): Pick | null {
  const chosen = options.slice().sort((a, b) => b.matches - a.matches || a.ability - b.ability)[0];
  if (!chosen) return null;
  return {
    chosen: { ...chosen, score: shrink(chosen, parentRate), source },
    rival: null,
    pBetter: 1,
    separated: true,
    lowConfidence: true,
    source: "fallback",
  };
}

/** Pick by the rules, then apply a legal switch. Never returns null when `last` has an option. */
function decide(
  tiers: Array<{ rows: Row[]; source: Source }>,
  last: Row,
  parentRate: number,
  forced: number | undefined,
  legal: (value: number) => boolean,
): Pick {
  let pick: Pick | null = null;
  for (const tier of tiers) pick ??= pickChild(tier.rows, parentRate, tier.source);
  for (const tier of tiers) pick ??= fallbackPick(tier.rows, parentRate, tier.source);
  pick ??= fallbackPick([last], parentRate, "state") as Pick;
  if (forced !== undefined && forced !== pick.chosen.ability && legal(forced)) {
    let row: Row = { ability: forced, wins: 0, matches: 0 };
    let source: Source = "state";
    for (const tier of tiers) {
      const found = tier.rows.find((option) => option.ability === forced);
      if (found) {
        row = found;
        source = tier.source;
        break;
      }
    }
    pick = {
      chosen: { ...row, score: shrink(row, parentRate), source },
      rival: pick.chosen,
      pBetter: 0.5,
      separated: false,
      lowConfidence: row.matches < LOW_CONFIDENCE_GAMES,
      source: "forced",
    };
  }
  return pick;
}

function rows(table: ReadonlyArray<readonly [number, number, number]> | undefined, legal: (value: number) => boolean): Row[] {
  return (table ?? [])
    .filter((row) => legal(row[0]))
    .map(([ability, wins, matches]) => ({ ability, wins, matches }));
}

/**
 * Walk the two decisions, then lay them on the boon schedule.
 *
 * 1. Unlock order: the order of the three basic unlocks, by shrunk win rate.
 *    The ultimate's unlock is its own small step: at level 7, or wherever the
 *    games that held it put it.
 * 2. Point spending: the 12 upgrades as a tree under the chosen unlock order.
 *    Unlocks never compete with upgrades here.
 *
 * `clicks` is the combined, legal, ordered 16-click list.
 */
export function buildPath(hero: HeroOrders, overrides: Record<string, number> = {}, band = "all"): AbilityPath {
  const tree = hero.bands.find((entry) => entry.band === band) ?? hero.bands[0];
  const slots = hero.abilities.slice().sort((a, b) => a.slot - b.slot);
  const basics = slots.filter((ability) => ability.slot !== 4);
  const ultId = slots.find((ability) => ability.slot === 4)?.id;
  if (!tree || basics.length !== 3 || ultId === undefined) {
    return { clicks: [], steps: [], decisions: [], unlockOrder: [], ult: 300, band };
  }
  const nameOf = (id: number) => hero.abilities.find((ability) => ability.id === id)?.name ?? String(id);
  const orderName = (code: number) => (decodeOrder(code, hero.abilities) ?? []).map(nameOf).join(" → ");
  const decisions: Decision[] = [];
  const record = (
    kind: Decision["kind"],
    label: string,
    pick: Pick,
    nameOfValue: (value: number) => string,
    click: Click | null,
  ) => {
    const index = decisions.length;
    const rival = pick.rival;
    decisions.push({
      id: decisionKey(index),
      index,
      kind,
      label,
      value: pick.chosen.ability,
      click,
      separated: pick.separated,
      pBetter: pick.pBetter,
      lowConfidence: pick.lowConfidence,
      source: pick.source,
      chosen: { wins: pick.chosen.wins, matches: pick.chosen.matches, name: nameOfValue(pick.chosen.ability), rate: pick.chosen.score },
      other: rival ? { wins: rival.wins, matches: rival.matches, name: nameOfValue(rival.ability), rate: rival.score } : null,
      alternateId: pick.separated ? null : (rival?.ability ?? null),
    });
  };

  // 1. Unlock order of the three basics.
  const heroRate = hero.matches > 0 ? hero.wins / hero.matches : 0.5;
  const legalOrder = (code: number) => decodeOrder(code, hero.abilities) !== null;
  const slotOrder = orderCode(basics.map((ability) => ability.id), hero.abilities);
  const orderPick = decide(
    [{ rows: rows(tree.unlocks, legalOrder), source: "tree" }],
    { ability: slotOrder, wins: 0, matches: 0 },
    heroRate,
    overrides[decisionKey(0)],
    legalOrder,
  );
  const code = orderPick.chosen.ability;
  const order = decodeOrder(code, hero.abilities) ?? basics.map((ability) => ability.id);
  record("unlock-order", "Unlock order", orderPick, orderName, null);
  const orderRate = orderPick.chosen.score;

  // The ultimate's unlock.
  const ultPick = decide(
    [{ rows: rows(tree.ult[String(code)], isLegalUltOption), source: "tree" }],
    { ability: 300, wins: 0, matches: 0 },
    orderRate,
    overrides[decisionKey(1)],
    isLegalUltOption,
  );
  const ult = ultPick.chosen.ability;
  record("ult", "Ultimate unlock", ultPick, ultOptionLabel, null);

  // 2. Point spending, under the chosen unlock order.
  const tiers = new Map<number, number>(slots.map((ability) => [ability.id, 0]));
  const legalSpend = (id: number) => tiers.has(id) && (tiers.get(id) ?? TIERS) < TIERS;
  const spends: number[] = [];
  let node: TreeNode | null = tree.spend[String(code)] ?? null;
  let parentRate = orderRate;
  for (let k = 0; k < slots.length * TIERS; k += 1) {
    const spent = spends.reduce((sum, id, at) => sum + UPGRADE_COST[spends.slice(0, at).filter((x) => x === id).length], 0);
    const tierKey = slots.map((ability) => tiers.get(ability.id) ?? 0).join(",");
    // Backoff state for a candidate: tiers, unlocks used before buying it on the
    // schedule, and points spent. Each candidate reads its own state row.
    const stateRows: Array<[number, number, number]> = [];
    for (const ability of slots) {
      if (!legalSpend(ability.id)) continue;
      const trial = schedule({ order, ult, spends: [...spends, ability.id] }, hero.abilities).steps;
      const at = trial.findIndex((step) => step.decisionId === `spend-${spends.length}`);
      const unlocksUsed = trial.slice(0, at).filter((step) => step.kind === "unlock").length;
      const row = tree.states[`${tierKey}|${unlocksUsed}|${spent}`]?.find((entry) => entry[0] === ability.id);
      if (row) stateRows.push(row);
    }
    const first = slots.find((ability) => legalSpend(ability.id))!.id;
    const pick = decide(
      [
        { rows: rows(node?.[3].map((child) => [child[0], child[1], child[2]] as [number, number, number]), legalSpend), source: "tree" },
        { rows: rows(stateRows, legalSpend), source: "state" },
      ],
      { ability: first, wins: 0, matches: 0 },
      parentRate,
      overrides[decisionKey(DECISION_KEYS.length + k)],
      legalSpend,
    );
    const id = pick.chosen.ability;
    const tier = (tiers.get(id) ?? 0) + 1;
    tiers.set(id, tier);
    spends.push(id);
    const click: Click = { ability: id, rank: RANK_OF_TIER[tier] };
    record("spend", `${nameOf(id)} ${TIER_LABEL[tier]}`, pick, nameOf, click);
    node = node ? (node[3].find((child) => child[0] === id) ?? null) : null;
    parentRate = pick.chosen.score;
  }

  const { steps } = schedule({ order, ult, spends }, hero.abilities);
  return { clicks: steps.map((step) => step.click), steps, decisions, unlockOrder: order, ult, band: tree.band };
}

export { wilson };
