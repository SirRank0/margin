import { wilson } from "./odds.ts";
import {
  basicUnlocksAt,
  MAX_LEVEL,
  pointsAt,
  POINTS_BY_ULT_UNLOCK,
  RANK_OF_TIER,
  TIERS,
  TOTAL_POINTS,
  UNLOCK_LEVELS,
  UPGRADE_COST,
  type AbilityInfo,
  type Click,
} from "./ability-rules.ts";

export {
  isCompletePath,
  MAX_LEVEL,
  PATH_LENGTH,
  pointsAt,
  replay,
  replayClicks,
  TOTAL_POINTS,
  UNLOCK_LEVELS,
  UPGRADE_COST,
  type AbilityInfo,
  type Click,
} from "./ability-rules.ts";

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
/** Near-equal strategies shown next to the best one. */
export const MAX_ALTERNATIVES = 3;
/** Upgrades this close together (seconds, average game time) count as one purchase. */
export const WINDOW_S = 10;

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
  /** Unlock code -> point-allocation strategies: [strategy, wins, matches]. See strategyOf. */
  strategies: Record<string, Array<[number, number, number]>>;
  /** "unlockCode:strategy" -> prefix tree of the 12 upgrades, in purchase order. */
  spend: Record<string, TreeNode>;
  /** Backoff for the spend trees, across unlock orders and strategies. */
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

/** One click of the combined path, with where it falls on the boon schedule. */
export type Step = {
  click: Click;
  kind: "unlock" | "upgrade";
  /** Boon level this click happens at on the schedule. */
  level: number;
  /** The decision that placed it: "unlock-order", "ult" or "spend-N". */
  decisionId: string;
};

export type Decision = {
  id: string;
  index: number;
  kind: "unlock-order" | "ult" | "strategy" | "spend";
  label: string;
  /** The option taken: an unlock code, an ult option, a strategy, or an ability id. */
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

export type Alternative = Count & {
  strategy: number;
  name: string;
  rate: number;
  /** The best strategy, listed when another one is switched in. */
  best: boolean;
  /** Chance the best strategy beats this one: under SEPARATED_P, so they are near-equal. 0.5 for the best itself. */
  pBestBetter: number;
  path: AbilityPath;
};

export type AbilityPath = {
  clicks: Click[];
  steps: Step[];
  decisions: Decision[];
  /** Basic ability ids in unlock order. */
  unlockOrder: number[];
  ult: number;
  strategy: number;
  /** Near-equal strategies, each with its own full path. Empty on an alternative's own path. */
  alternatives: Alternative[];
  band: string;
};

const TIER_LABEL = ["unlock", "1-point", "2-point", "5-point"];
const SHAPE_COUNT = 3;

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

/** Chance `a` has the higher true rate than `b`, both shrunk toward `parentRate`. */
function chanceBetter(a: Count, b: Count, parentRate: number): number {
  const pa = posterior(a, parentRate);
  const pb = posterior(b, parentRate);
  const scale = Math.sqrt(pa.variance + pb.variance);
  return scale > 0 ? normalCdf((pa.mean - pb.mean) / scale) : 0.5;
}

// ---------------------------------------------------------------- the ultimate unlock

/** Ult option: basics unlocked before it * 100, plus points spent before it when held past level 7. */
export function ultOption(basicsBefore: number, pointsBefore: number): number {
  return basicsBefore * 100 + (pointsBefore > POINTS_BY_ULT_UNLOCK ? pointsBefore : 0);
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
  return (
    Number.isInteger(option) && basics >= 0 && basics <= 3 && (held === 0 || (held > POINTS_BY_ULT_UNLOCK && held <= maxBefore))
  );
}

// ---------------------------------------------------------------- unlock order

/** Slot code (213) -> basic ability ids, or null when it is not an order of the three basics. */
function decodeOrder(code: number, abilities: AbilityInfo[]): number[] | null {
  if (!Number.isInteger(code)) return null;
  const digits = String(code).split("").map(Number);
  if (digits.length !== 3 || new Set(digits).size !== 3) return null;
  const ids = digits.map((slot) => abilities.find((ability) => ability.slot === slot && slot !== 4)?.id);
  return ids.every((id): id is number => id !== undefined) ? ids : null;
}

function slotOf(id: number, abilities: AbilityInfo[]): number {
  return abilities.find((ability) => ability.id === id)?.slot ?? 0;
}

// ---------------------------------------------------------------- splitting an API order

export type SplitOrder = {
  /** Basic unlock order as a slot code. */
  code: number;
  /** Ult option, or null when the ultimate was never unlocked. */
  ult: number | null;
  /** Upgrades in purchase order, same-window purchases in slot order. */
  spends: number[];
  /** Unlocks used before each purchase position. */
  before: number[];
};

/**
 * Split one API order (first appearance = unlock) into the unlock order, the
 * ultimate option and the spend order. Upgrades within WINDOW_S seconds of each
 * other are one purchase and go in slot order. Mirrors split() in
 * scripts/fetch-ability-orders.py. Null when the three basics were never all unlocked.
 */
export function splitOrder(order: readonly number[], times: readonly number[] | undefined, abilities: AbilityInfo[]): SplitOrder | null {
  const slots = new Map(abilities.map((ability) => [ability.id, ability.slot]));
  const seen = new Map<number, number>();
  const basics: number[] = [];
  let ult: number | null = null;
  let points = 0;
  const spends: Array<{ id: number; t: number | undefined; unlocked: number }> = [];
  order.forEach((id, pos) => {
    const slot = slots.get(id);
    const have = seen.get(id) ?? 0;
    if (slot === undefined || have >= TIERS + 1) return;
    seen.set(id, have + 1);
    if (have === 0) {
      if (slot === 4) ult = ultOption(basics.length, points);
      else basics.push(slot);
    } else {
      spends.push({ id, t: times?.[pos], unlocked: basics.length + (ult !== null ? 1 : 0) });
      points += UPGRADE_COST[have - 1];
    }
  });
  if (basics.length < 3) return null;
  const bySlot = (x: { id: number }, y: { id: number }) => (slots.get(x.id) ?? 0) - (slots.get(y.id) ?? 0);
  const canon: typeof spends = [];
  let group: typeof spends = [];
  let last: number | undefined;
  for (const entry of spends) {
    if (group.length > 0 && (entry.t === undefined || last === undefined || Math.abs(entry.t - last) > WINDOW_S)) {
      canon.push(...group.slice().sort(bySlot));
      group = [];
    }
    group.push(entry);
    last = entry.t;
  }
  canon.push(...group.slice().sort(bySlot));
  return {
    code: basics[0] * 100 + basics[1] * 10 + basics[2],
    ult,
    spends: canon.map((entry) => entry.id),
    before: spends.map((entry) => entry.unlocked),
  };
}

// ---------------------------------------------------------------- point-allocation strategy

/**
 * A point-allocation strategy: first ability maxed (5-point upgrade), second
 * ability maxed, and the shape before the first max: how many other abilities
 * had their 2-point upgrade then (0 rush, 1 one up, 2 two or more = spread).
 * Encoded as firstSlot * 100 + secondSlot * 10 + shape. Null when fewer than two
 * abilities were maxed. Mirrors strategy_of() in scripts/fetch-ability-orders.py.
 * docs/ability-mechanics.md explains the choice.
 */
export function strategyOf(spends: readonly number[], abilities: AbilityInfo[]): number | null {
  const tiers = [0, 0, 0, 0];
  const maxes: number[] = [];
  let shape = 0;
  for (const id of spends) {
    const slot = slotOf(id, abilities);
    if (slot === 0) continue;
    tiers[slot - 1] += 1;
    if (tiers[slot - 1] === TIERS) {
      if (maxes.length === 0) {
        shape = Math.min(2, tiers.filter((tier, at) => at !== slot - 1 && tier >= 2).length);
      }
      maxes.push(slot);
      if (maxes.length === 2) return maxes[0] * 100 + maxes[1] * 10 + shape;
    }
  }
  return null;
}

function decodeStrategy(strategy: number) {
  return { first: Math.floor(strategy / 100), second: Math.floor(strategy / 10) % 10, shape: strategy % 10 };
}

export function isLegalStrategy(strategy: number): boolean {
  if (!Number.isInteger(strategy) || strategy < 100 || strategy > 999) return false;
  const { first, second, shape } = decodeStrategy(strategy);
  return first >= 1 && first <= 4 && second >= 1 && second <= 4 && first !== second && shape < SHAPE_COUNT;
}

export function strategyLabel(strategy: number, abilities: AbilityInfo[]): string {
  const { first, second, shape } = decodeStrategy(strategy);
  const name = (slot: number) => abilities.find((ability) => ability.slot === slot)?.name ?? `slot ${slot}`;
  const before =
    shape === 0
      ? "nothing else past its 1-point upgrade before that"
      : shape === 1
        ? "one other ability at its 2-point upgrade before that"
        : "two or more other abilities at their 2-point upgrade before that";
  return `Max ${name(first)} first, then ${name(second)}; ${before}`;
}

/**
 * Whether buying the next upgrade of the ability in slot index `at` keeps the
 * spend order inside `strategy`, given upgrade tiers by slot index. A move that
 * keeps it inside always exists until all 12 upgrades are bought.
 */
export function fitsStrategy(strategy: number, tiers: readonly number[], at: number): boolean {
  const { first, second, shape } = decodeStrategy(strategy);
  const x = first - 1;
  const y = second - 1;
  const next = tiers[at] + 1;
  if (next > TIERS) return false;
  if (tiers[x] < TIERS) {
    const othersUp = tiers.filter((tier, i) => i !== x && tier >= 2).length;
    if (next === TIERS) {
      if (at !== x) return false;
      return shape === 0 ? othersUp === 0 : shape === 1 ? othersUp === 1 : othersUp >= 2;
    }
    if (at !== x && next === 2) return shape === 2 || (shape === 1 && othersUp === 0);
    return true;
  }
  if (tiers[y] < TIERS && next === TIERS) return at === y;
  return true;
}

// ---------------------------------------------------------------- the boon schedule

type Plan = { order: number[]; ult: number; spends: number[] };

/**
 * Lay the unlock order, the ultimate option and the spend order onto the boon
 * schedule (ability-rules.ts). Each unlock is used when it arrives (the ultimate
 * at level 7 unless the option holds it); each upgrade is bought, in spend order,
 * as soon as its ability is unlocked and the points are there.
 */
function schedule(plan: Plan, abilities: AbilityInfo[]): Step[] {
  const ultId = abilities.find((ability) => ability.slot === 4)?.id ?? -1;
  const basicsBeforeUlt = Math.floor(plan.ult / 100);
  const heldUntil = plan.ult % 100;
  const tiers = new Map<number, number>();
  const unlocked = new Set<number>();
  const steps: Step[] = [];
  let basicsUsed = 0;
  let spent = 0;
  let next = 0;
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
          steps.push({ click: { ability: id, rank: 0 }, kind: "unlock", level, decisionId: "unlock-order" });
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
        steps.push({ click: { ability: ultId, rank: 0 }, kind: "unlock", level, decisionId: "ult" });
        moved = true;
      }
      if (want !== undefined && unlocked.has(want)) {
        const tier = (tiers.get(want) ?? 0) + 1;
        const cost = UPGRADE_COST[tier - 1];
        if (cost !== undefined && points - spent >= cost) {
          tiers.set(want, tier);
          spent += cost;
          steps.push({ click: { ability: want, rank: RANK_OF_TIER[tier] }, kind: "upgrade", level, decisionId: `spend-${next}` });
          next += 1;
          moved = true;
        }
      }
      if (!moved && want !== undefined && !unlocked.has(want)) {
        // The next upgrade is waiting on a held unlock: holding never blocks spending,
        // so use the next unlock in hand (a basic in unlock order, else the ultimate).
        if (basicsUsed < 3 && basicsUsed < basicUnlocksAt(level)) {
          const id = plan.order[basicsUsed];
          unlocked.add(id);
          basicsUsed += 1;
          tiers.set(id, 0);
          steps.push({ click: { ability: id, rank: 0 }, kind: "unlock", level, decisionId: "unlock-order" });
          continue;
        }
        if (want === ultId && level >= UNLOCK_LEVELS[3]) {
          unlocked.add(ultId);
          tiers.set(ultId, 0);
          steps.push({ click: { ability: ultId, rank: 0 }, kind: "unlock", level, decisionId: "ult" });
          continue;
        }
      }
      if (!moved) break;
    }
  }
  return steps;
}

// ---------------------------------------------------------------- decisions and switches

const DECISION_KEYS = ["unlock-order", "ult", "strategy"] as const;

/** Override key of the decision at `index`: unlock order, ultimate, strategy, then spend-0..spend-11. */
export function decisionKey(index: number): string {
  return DECISION_KEYS[index] ?? `spend-${index - DECISION_KEYS.length}`;
}

function decisionIndex(key: string): number {
  const fixed = (DECISION_KEYS as readonly string[]).indexOf(key);
  if (fixed >= 0) return fixed;
  const match = /^spend-(\d+)$/.exec(key);
  return match ? DECISION_KEYS.length + Number(match[1]) : Number.NaN;
}

/** Index of the strategy decision, for switching strategies. */
export const STRATEGY_DECISION = DECISION_KEYS.indexOf("strategy");

/**
 * Set or clear the switch at decision `index`. Every later switch is dropped,
 * because the decisions after a switch are walked again.
 */
export function applySwitch(overrides: Record<string, number>, index: number, value: number | null): Record<string, number> {
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

function eligible(options: Row[]): Row[] {
  const top = Math.max(0, ...options.map((option) => option.matches));
  return options.filter((option) => option.matches >= MIN_BRANCH && option.matches >= MIN_SHARE * top);
}

function ranked(options: Row[], parentRate: number, source: Source): Option[] {
  return eligible(options)
    .map((option) => ({ ...option, score: shrink(option, parentRate), source }))
    .sort((a, b) => b.score - a.score || b.matches - a.matches || a.ability - b.ability);
}

function pickChild(options: Row[], parentRate: number, source: Source): Pick | null {
  const [chosen, rival = null] = ranked(options, parentRate, source);
  if (!chosen) return null;
  const pBetter = rival ? chanceBetter(chosen, rival, parentRate) : 1;
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

/** Pick by the rules, then apply a legal switch. `last` is the option when there is no data. */
function decide(
  sources: Array<{ rows: Row[]; source: Source }>,
  last: Row,
  parentRate: number,
  forced: number | undefined,
  legal: (value: number) => boolean,
): Pick {
  let pick: Pick | null = null;
  for (const entry of sources) pick ??= pickChild(entry.rows, parentRate, entry.source);
  for (const entry of sources) pick ??= fallbackPick(entry.rows, parentRate, entry.source);
  pick ??= fallbackPick([last], parentRate, "state") as Pick;
  if (forced !== undefined && forced !== pick.chosen.ability && legal(forced)) {
    let row: Row = { ability: forced, wins: 0, matches: 0 };
    let source: Source = "state";
    for (const entry of sources) {
      const found = entry.rows.find((option) => option.ability === forced);
      if (found) {
        row = found;
        source = entry.source;
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
  return (table ?? []).filter((row) => legal(row[0])).map(([ability, wins, matches]) => ({ ability, wins, matches }));
}

function emptyPath(band: string): AbilityPath {
  return { clicks: [], steps: [], decisions: [], unlockOrder: [], ult: 300, strategy: 0, alternatives: [], band };
}

/**
 * Walk the decisions, then lay them on the boon schedule.
 *
 * 1. Unlock order of the three basics, and where the ultimate unlock goes.
 * 2. Point-allocation strategy under that unlock order (strategyOf), chosen as a
 *    whole by shrunk win rate. Near-equal strategies come back as alternatives,
 *    each with its own full path.
 * 3. The best concrete spend order inside the strategy: its own spend tree, every
 *    step kept inside the strategy (fitsStrategy).
 *
 * `clicks` is the combined, legal, ordered 16-click list of the chosen line.
 */
export function buildPath(
  hero: HeroOrders,
  overrides: Record<string, number> = {},
  band = "all",
  options: { alternatives?: boolean } = {},
): AbilityPath {
  const tree = hero.bands.find((entry) => entry.band === band) ?? hero.bands[0];
  const slots = hero.abilities.slice().sort((a, b) => a.slot - b.slot);
  const basics = slots.filter((ability) => ability.slot !== 4);
  if (!tree || slots.length !== 4 || basics.length !== 3 || slots.some((ability, at) => ability.slot !== at + 1)) {
    return emptyPath(band);
  }
  const nameOf = (id: number) => hero.abilities.find((ability) => ability.id === id)?.name ?? String(id);
  const orderName = (code: number) => (decodeOrder(code, hero.abilities) ?? []).map(nameOf).join(" → ");
  const decisions: Decision[] = [];
  const record = (kind: Decision["kind"], label: string, pick: Pick, nameOfValue: (value: number) => string, click: Click | null) => {
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

  // 1. Unlock order, then the ultimate unlock.
  const heroRate = hero.matches > 0 ? hero.wins / hero.matches : 0.5;
  const legalOrder = (code: number) => decodeOrder(code, hero.abilities) !== null;
  const orderPick = decide(
    [{ rows: rows(tree.unlocks, legalOrder), source: "tree" }],
    { ability: 123, wins: 0, matches: 0 },
    heroRate,
    overrides[decisionKey(0)],
    legalOrder,
  );
  const code = orderPick.chosen.ability;
  const order = decodeOrder(code, hero.abilities) ?? basics.map((ability) => ability.id);
  record("unlock-order", "Unlock order", orderPick, orderName, null);
  const orderRate = orderPick.chosen.score;

  // Holding the ultimate unlock is allowed only where games did it: a switch must
  // name an option from the data, or the level-7 default.
  const ultRows = rows(tree.ult[String(code)], isLegalUltOption);
  const ultPick = decide(
    [{ rows: ultRows, source: "tree" }],
    { ability: 300, wins: 0, matches: 0 },
    orderRate,
    overrides[decisionKey(1)],
    (option) => option === 300 || ultRows.some((row) => row.ability === option),
  );
  const ult = ultPick.chosen.ability;
  record("ult", "Ultimate unlock", ultPick, ultOptionLabel, null);

  // 2. Strategy, chosen as a whole.
  const strategyRows = rows(tree.strategies?.[String(code)], isLegalStrategy);
  const defaultStrategy = (slotOf(order[0], hero.abilities) * 10 + slotOf(order[1], hero.abilities)) * 10;
  const strategyPick = decide(
    [{ rows: strategyRows, source: "tree" }],
    { ability: defaultStrategy, wins: 0, matches: 0 },
    orderRate,
    overrides[decisionKey(STRATEGY_DECISION)],
    isLegalStrategy,
  );
  const strategy = strategyPick.chosen.ability;
  const labelOf = (value: number) => strategyLabel(value, hero.abilities);
  record("strategy", "Strategy", strategyPick, labelOf, null);

  // 3. Concrete spend order inside the strategy.
  const tiers = [0, 0, 0, 0];
  const atOf = (id: number) => slots.findIndex((ability) => ability.id === id);
  const legalSpend = (id: number) => {
    const at = atOf(id);
    return at >= 0 && fitsStrategy(strategy, tiers, at);
  };
  const spends: number[] = [];
  let spent = 0;
  let node: TreeNode | null = tree.spend[`${code}:${strategy}`] ?? null;
  let parentRate = strategyPick.chosen.score;
  for (let k = 0; k < slots.length * TIERS; k += 1) {
    const tierKey = tiers.join(",");
    // Backoff state for a candidate: tiers, unlocks used before buying it on the
    // schedule, and points spent. Each candidate reads its own state row.
    const stateRows: Array<[number, number, number]> = [];
    for (const ability of slots) {
      if (!legalSpend(ability.id)) continue;
      const trial = schedule({ order, ult, spends: [...spends, ability.id] }, hero.abilities);
      const at = trial.findIndex((step) => step.decisionId === `spend-${spends.length}`);
      const unlocksUsed = trial.slice(0, at).filter((step) => step.kind === "unlock").length;
      const row = tree.states[`${tierKey}|${unlocksUsed}|${spent}`]?.find((entry) => entry[0] === ability.id);
      if (row) stateRows.push(row);
    }
    const first = slots.find((ability) => legalSpend(ability.id));
    if (!first) break; // unreachable: fitsStrategy always leaves a move until all 12 are bought
    const pick = decide(
      [
        { rows: rows(node?.[3].map((child) => [child[0], child[1], child[2]] as [number, number, number]), legalSpend), source: "tree" },
        { rows: rows(stateRows, legalSpend), source: "state" },
      ],
      { ability: first.id, wins: 0, matches: 0 },
      parentRate,
      overrides[decisionKey(DECISION_KEYS.length + k)],
      legalSpend,
    );
    const id = pick.chosen.ability;
    const at = atOf(id);
    tiers[at] += 1;
    spent += UPGRADE_COST[tiers[at] - 1];
    spends.push(id);
    const click: Click = { ability: id, rank: RANK_OF_TIER[tiers[at]] };
    record("spend", `${nameOf(id)} ${TIER_LABEL[tiers[at]]}`, pick, nameOf, click);
    node = node ? (node[3].find((child) => child[0] === id) ?? null) : null;
    parentRate = pick.chosen.score;
  }

  const steps = schedule({ order, ult, spends }, hero.abilities);
  const path: AbilityPath = {
    clicks: steps.map((step) => step.click),
    steps,
    decisions,
    unlockOrder: order,
    ult,
    strategy,
    alternatives: [],
    band: tree.band,
  };

  // Near-equal strategies: the best one cannot be told apart from them at SEPARATED_P.
  if (options.alternatives !== false) {
    const [best, ...rest] = ranked(strategyRows, orderRate, "tree");
    if (best) {
      const keep = applySwitch(overrides, STRATEGY_DECISION, null);
      path.alternatives = [best, ...rest]
        .filter((option) => option.ability !== strategy)
        .map((option) => ({ option, p: option === best ? 0.5 : chanceBetter(best, option, orderRate) }))
        .filter(({ option, p }) => option === best || p < SEPARATED_P)
        .slice(0, MAX_ALTERNATIVES)
        .map(({ option, p }) => ({
          strategy: option.ability,
          name: labelOf(option.ability),
          wins: option.wins,
          matches: option.matches,
          rate: option.score,
          best: option === best,
          pBestBetter: p,
          path: buildPath(hero, { ...keep, [decisionKey(STRATEGY_DECISION)]: option.ability }, band, { alternatives: false }),
        }));
    }
  }
  return path;
}

export { wilson };
