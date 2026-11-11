import { wilson } from "./odds.ts";

/** A child under this many games cannot be chosen. */
export const MIN_BRANCH = 200;
/** A child under this share of its most-played sibling cannot be chosen. */
export const MIN_SHARE = 0.05;
/** Shrinkage strength in games. A child is pulled toward its parent's rate. */
export const PRIOR_K = 2000;
/** A decision is separated only when the chance it is better clears this. */
export const SEPARATED_P = 0.95;

export type AbilityInfo = {
  id: number;
  name: string;
  slot: 1 | 2 | 3 | 4;
};

export type Count = { wins: number; matches: number };

/** Compact trie node: [abilityId, wins, matches, children]. The root's abilityId is 0. */
export type TreeNode = [number, number, number, TreeNode[]];

/** Rank vector "a,b,c,u" (0..4 each, slot order) -> next ability rows. */
export type StateTable = Record<string, Array<[number, number, number]>>;

export type BandTree = {
  band: string;
  label: string;
  root: TreeNode;
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

export type Decision = {
  id: string;
  index: number;
  label: string;
  click: Click;
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
  decisions: Decision[];
  band: string;
};

const RANK_OF: Record<number, Click["rank"]> = { 1: 0, 2: 1, 3: 2, 4: 5 };
const RANK_LABEL = ["unlock", "1-point", "2-point", "5-point"];

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

/** A choice under this many games is flagged low confidence. */
export const LOW_CONFIDENCE_GAMES = 1000;
/** Clicks in a full path: 4 unlocks and 12 upgrades (3 per ability). */
export const PATH_LENGTH = 16;
/** Appearances per ability: unlock, 1-point, 2-point, 5-point. */
const MAX_APPEARANCES = 4;

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
  const chosen = options
    .slice()
    .sort((a, b) => b.matches - a.matches || a.ability - b.ability)[0];
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

/**
 * Whether `id` may be clicked next, given the appearances so far.
 * At most four appearances per ability, and the ultimate unlocks only after
 * all three basics are unlocked.
 */
export function isLegalClick(id: number, ranks: ReadonlyMap<number, number>, abilities: AbilityInfo[]): boolean {
  const ability = abilities.find((entry) => entry.id === id);
  if (!ability) return false;
  const have = ranks.get(id) ?? 0;
  if (have >= MAX_APPEARANCES) return false;
  if (ability.slot === 4 && have === 0) {
    return abilities.filter((entry) => entry.slot !== 4).every((entry) => (ranks.get(entry.id) ?? 0) > 0);
  }
  return true;
}

/**
 * Set or clear the switch at `index`. Every later switch is dropped, because
 * the clicks after a switch are re-walked.
 */
export function applySwitch(
  overrides: Record<string, number>,
  index: number,
  ability: number | null,
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(overrides)) {
    const at = Number(key.replace("click-", ""));
    if (Number.isInteger(at) && at < index) next[key] = value;
  }
  if (ability !== null) next[`click-${index}`] = ability;
  return next;
}

function byId(hero: HeroOrders) {
  return new Map(hero.abilities.map((ability) => [ability.id, ability]));
}

function toRows(rows: ReadonlyArray<readonly [number, number, number, ...unknown[]]>, legal: (id: number) => boolean): Row[] {
  return rows
    .filter((row) => legal(row[0]))
    .map(([ability, wins, matches]) => ({ ability, wins, matches }));
}

export function buildPath(
  hero: HeroOrders,
  overrides: Record<string, number> = {},
  band = "all",
): AbilityPath {
  const tree = hero.bands.find((entry) => entry.band === band) ?? hero.bands[0];
  if (!tree) return { clicks: [], decisions: [], band };
  const names = byId(hero);
  const nameOf = (id: number) => names.get(id)?.name ?? String(id);
  const slots = hero.abilities.slice().sort((a, b) => a.slot - b.slot);
  const slotIds = slots.map((ability) => ability.id);
  const ranks = new Map<number, number>();
  const legal = (id: number) => isLegalClick(id, ranks, hero.abilities);
  let node: TreeNode | null = tree.root;
  let parentRate = hero.matches > 0 ? hero.wins / hero.matches : 0.5;
  const clicks: Click[] = [];
  const decisions: Decision[] = [];
  const length = Math.min(PATH_LENGTH, slots.length * MAX_APPEARANCES);

  for (let index = 0; index < length; index += 1) {
    const treeOpts: Row[] = toRows(node ? node[3] : [], legal);
    const stateKey = slotIds.map((id) => ranks.get(id) ?? 0).join(",");
    const stateOpts: Row[] = toRows(tree.states[stateKey] ?? [], legal);

    let pick: Pick | null =
      pickChild(treeOpts, parentRate, "tree") ??
      pickChild(stateOpts, parentRate, "state") ??
      fallbackPick(treeOpts, parentRate, "tree") ??
      fallbackPick(stateOpts, parentRate, "state") ??
      // No data at all: the first legal ability in slot order.
      fallbackPick(
        slotIds.filter(legal).slice(0, 1).map((ability) => ({ ability, wins: 0, matches: 0 })),
        parentRate,
        "state",
      );
    const forced = overrides[`click-${index}`];
    if (forced !== undefined && forced !== pick?.chosen.ability && legal(forced)) {
      const fromTree = treeOpts.find((option) => option.ability === forced);
      const fromState = stateOpts.find((option) => option.ability === forced);
      const row: Row = fromTree ?? fromState ?? { ability: forced, wins: 0, matches: 0 };
      const greedy: Option | null = pick?.chosen ?? null;
      pick = {
        chosen: { ...row, score: shrink(row, parentRate), source: fromTree ? "tree" : "state" },
        rival: greedy,
        pBetter: 0.5,
        separated: false,
        lowConfidence: row.matches < LOW_CONFIDENCE_GAMES,
        source: "forced",
      };
    }
    if (!pick) break; // only when no ability is legal, so the path is complete

    const id = pick.chosen.ability;
    const next = (ranks.get(id) ?? 0) + 1;
    ranks.set(id, next);
    const rank = RANK_OF[next] ?? 0;
    const click: Click = { ability: id, rank };
    clicks.push(click);

    const rival = pick.rival;
    decisions.push({
      id: `click-${index}`,
      index,
      label: `${nameOf(id)} ${RANK_LABEL[next - 1] ?? ""}`.trim(),
      click,
      separated: pick.separated,
      pBetter: pick.pBetter,
      lowConfidence: pick.lowConfidence,
      source: pick.source,
      chosen: { wins: pick.chosen.wins, matches: pick.chosen.matches, name: nameOf(id), rate: pick.chosen.score },
      other: rival
        ? { wins: rival.wins, matches: rival.matches, name: nameOf(rival.ability), rate: rival.score }
        : null,
      alternateId: pick.separated ? null : rival?.ability ?? null,
    });

    // Stay in the tree while the chosen click exists there; otherwise later
    // steps come from the state table.
    const child: TreeNode | null = node ? node[3].find((entry) => entry[0] === id) ?? null : null;
    parentRate = pick.chosen.score;
    node = child;
  }

  return { clicks, decisions, band: tree.band };
}

export { wilson };
