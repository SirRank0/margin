import { wilson } from "./odds.ts";

/** A branch under this many games cannot win a comparison. */
export const MIN_BRANCH = 200;

export type AbilityInfo = {
  id: number;
  name: string;
  /** 1–3 are the basic abilities. 4 is the ultimate. */
  slot: 1 | 2 | 3 | 4;
};

export type Count = { wins: number; matches: number };

export type NamedCount = Count & { ability: number };

export type PrefixCount = Count & { clicks: number[] };

/** Which basic 2-point upgrades were already bought when the first 5-point upgrade was. */
export type BeforeFive = Count & { t2s: number[]; five: number };

export type HeroOrders = {
  id: number;
  name: string;
  wins: number;
  matches: number;
  abilities: AbilityInfo[];
  /** Second click was the first ability's 1-point upgrade. */
  openUpgrade: NamedCount[];
  /** First three clicks. Unlocks and the 1-point upgrade are not distinguished here. */
  prefix3: PrefixCount[];
  beforeFive: BeforeFive[];
  /** This ability's 5-point upgrade came before the ultimate's 2-point upgrade. */
  fiveBeforeUlt: NamedCount[];
  /** First ability to receive its 5-point upgrade. */
  firstMax: NamedCount[];
  /** Ultimate's 2-point upgrade was bought before any 5-point upgrade. */
  ultBeforeFive: Count;
  /** Some 5-point upgrade was bought before the ultimate's 2-point upgrade. */
  fiveBeforeUltAny: Count;
};

export type AbilityOrders = {
  fetchedAt: string;
  heroes: HeroOrders[];
};

export type Click = {
  ability: number;
  /** 0 unlock, 1 the 1-point upgrade, 2 the 2-point upgrade, 5 the 5-point upgrade. */
  rank: 0 | 1 | 2 | 5;
};

export type Decision = {
  label: string;
  /** False when the chosen line's interval overlaps the largest alternative. */
  separated: boolean;
  chosen: Count & { name: string };
  /** The largest other line, when there is one. */
  other: (Count & { name: string }) | null;
};

export type AbilityPath = {
  clicks: Click[];
  decisions: Decision[];
};

/**
 * Live boon track from hero level_info. Required gold is the API's number.
 * Four unlocks: three basics, then the ultimate at level 8. The other 32
 * boons are one ability point each. A 2-point rank costs 2 and needs the
 * 1-point rank (3 on that ability). A 5-point rank costs 5 and needs both
 * (8 on that ability). Only 4 points exist before the ultimate unlocks, so
 * a 5 cannot be bought before it.
 */
export const BOONS: Array<"unlock" | "point"> = [
  "unlock",
  "point",
  "unlock",
  "point",
  "unlock",
  "point",
  "point",
  "unlock",
  ...Array.from({ length: 28 }, () => "point" as const),
];

const RANK_ORDER: Click["rank"][] = [0, 1, 2, 5];
const RANK_COST: Record<Click["rank"], number> = { 0: 0, 1: 1, 2: 2, 5: 5 };

type Interval = Count & { low: number; high: number };

function interval(row: Count): Interval {
  const score = wilson(row.wins, row.matches);
  return { ...row, low: score.low, high: score.high };
}

function overlaps(a: Interval, b: Interval) {
  return a.low <= b.high && b.low <= a.high;
}

/**
 * Highest Wilson lower bound, if that interval does not overlap the line with
 * the most games. Otherwise the line with the most games, and it is not a win.
 */
export function choose<T extends Count>(rows: T[]): { row: T; separated: boolean } | null {
  const eligible = rows.filter((row) => row.matches >= MIN_BRANCH);
  const pool = eligible.length > 0 ? eligible : rows.filter((row) => row.matches > 0);
  if (pool.length === 0) return null;
  const scored = pool.map((row) => ({ row, ...interval(row) }));
  const leader = scored.reduce((best, row) => {
    if (row.low !== best.low) return row.low > best.low ? row : best;
    return row.matches > best.matches ? row : best;
  });
  const common = scored.reduce((best, row) => (row.matches > best.matches ? row : best));
  const chosen = leader === common || !overlaps(leader, common) ? leader : common;
  const rival = scored
    .filter((row) => row.row !== chosen.row)
    .sort((a, b) => b.matches - a.matches)[0];
  return { row: chosen.row, separated: rival ? !overlaps(chosen, rival) : false };
}

function byId(hero: HeroOrders) {
  return new Map(hero.abilities.map((ability) => [ability.id, ability]));
}

function decision(label: string, chosen: Count, chosenName: string, other: Count | null, otherName: string | null, separated: boolean): Decision {
  return {
    label,
    separated,
    chosen: { ...chosen, name: chosenName },
    other: other && otherName ? { ...other, name: otherName } : null,
  };
}

export function buildPath(hero: HeroOrders): AbilityPath {
  const names = byId(hero);
  const nameOf = (id: number) => names.get(id)?.name ?? String(id);
  const basics = hero.abilities.filter((ability) => ability.slot !== 4).sort((a, b) => a.slot - b.slot);
  const ult = hero.abilities.find((ability) => ability.slot === 4);
  const decisions: Decision[] = [];

  const openerPick = choose(hero.openUpgrade);
  const opener = openerPick?.row.ability ?? basics[0]?.id;
  if (openerPick && opener !== undefined) {
    const other = hero.openUpgrade
      .filter((row) => row.ability !== opener && row.matches >= MIN_BRANCH)
      .sort((a, b) => b.matches - a.matches)[0];
    decisions.push(
      decision(
        "Open, then the 1-point upgrade",
        openerPick.row,
        nameOf(opener),
        other ?? null,
        other ? nameOf(other.ability) : null,
        openerPick.separated,
      ),
    );
  }

  const secondRows = new Map<number, Count>();
  if (opener !== undefined) {
    for (const row of hero.prefix3) {
      if (row.clicks[0] !== opener || row.clicks[1] !== opener) continue;
      const next = row.clicks[2];
      if (next === undefined || next === opener || next === ult?.id) continue;
      const prev = secondRows.get(next) ?? { wins: 0, matches: 0 };
      secondRows.set(next, { wins: prev.wins + row.wins, matches: prev.matches + row.matches });
    }
  }
  const secondPick = choose([...secondRows].map(([ability, count]) => ({ ability, ...count })));
  const second = secondPick?.row.ability ?? basics.find((ability) => ability.id !== opener)?.id;
  if (secondPick && second !== undefined) {
    const other = [...secondRows]
      .filter(([ability, count]) => ability !== second && count.matches >= MIN_BRANCH)
      .sort((a, b) => b[1].matches - a[1].matches)[0];
    decisions.push(
      decision(
        "Second ability",
        secondPick.row,
        nameOf(second),
        other ? other[1] : null,
        other ? nameOf(other[0]) : null,
        secondPick.separated,
      ),
    );
  }
  const third = basics.find((ability) => ability.id !== opener && ability.id !== second)?.id;

  const ultGate = choose([
    { ...hero.fiveBeforeUltAny, kind: "five" as const },
    { ...hero.ultBeforeFive, kind: "ult" as const },
  ]);
  const ultFirst = ultGate?.row.kind === "ult" && ultGate.separated;
  if (ult && hero.fiveBeforeUltAny.matches + hero.ultBeforeFive.matches > 0) {
    decisions.push(
      decision(
        "Ultimate's 2-point upgrade",
        ultFirst ? hero.ultBeforeFive : hero.fiveBeforeUltAny,
        ultFirst ? "Before any 5-point upgrade" : "After a 5-point upgrade",
        ultFirst ? hero.fiveBeforeUltAny : hero.ultBeforeFive,
        ultFirst ? "After a 5-point upgrade" : "Before any 5-point upgrade",
        ultGate?.separated ?? false,
      ),
    );
  }

  const beatenByFive = new Set(
    hero.fiveBeforeUlt
      .filter((row) => {
        const gate = hero.ultBeforeFive;
        if (row.matches < MIN_BRANCH || gate.matches < MIN_BRANCH) return false;
        const a = interval(row);
        const b = interval(gate);
        return a.low > b.high;
      })
      .map((row) => row.ability),
  );
  let fivePool = hero.beforeFive;
  if (beatenByFive.size > 0) {
    const narrowed = fivePool.filter((row) => beatenByFive.has(row.five));
    if (narrowed.length > 0) fivePool = narrowed;
  }
  const fiveKey = (row: BeforeFive) => `${[...row.t2s].sort((a, b) => a - b).join("+")}|${row.five}`;
  const fivePick = choose(fivePool.map((row) => ({ ...row, key: fiveKey(row) })));
  const t2Before = new Set(fivePick?.row.t2s ?? []);
  const firstFive = fivePick?.row.five;
  if (fivePick && firstFive !== undefined) {
    const picked = fiveKey(fivePick.row);
    const other = fivePool
      .filter((row) => fiveKey(row) !== picked && row.matches >= MIN_BRANCH)
      .sort((a, b) => b.matches - a.matches)[0];
    const labelOf = (row: BeforeFive) => {
      const prior = row.t2s.map(nameOf).join(" + ");
      return `${prior || "no 2-point upgrade"} → ${nameOf(row.five)}`;
    };
    decisions.push(
      decision(
        "First 5-point upgrade",
        fivePick.row,
        labelOf(fivePick.row),
        other ?? null,
        other ? labelOf(other) : null,
        fivePick.separated,
      ),
    );
  }

  const weakMax = new Set<number>();
  const maxPick = choose(hero.firstMax);
  if (maxPick) {
    const leader = interval(maxPick.separated ? maxPick.row : hero.firstMax.reduce((a, b) => (interval(a).low >= interval(b).low ? a : b)));
    for (const row of hero.firstMax) {
      if (row.matches < MIN_BRANCH) continue;
      const score = interval(row);
      if (score.high < leader.low) weakMax.add(row.ability);
    }
  }

  const queue: Click[] = [];
  const queued = new Map<number, number>();
  function enqueue(id: number | undefined, rank: Click["rank"]) {
    if (id === undefined) return;
    const have = queued.get(id) ?? -1;
    const target = RANK_ORDER.indexOf(rank);
    if (target <= have) return;
    for (let step = have + 1; step <= target; step += 1) {
      queue.push({ ability: id, rank: RANK_ORDER[step] });
      queued.set(id, step);
    }
  }

  for (const id of [opener, second, third]) enqueue(id, 1);
  for (const ability of basics) {
    if (t2Before.has(ability.id) && ability.id !== firstFive) enqueue(ability.id, 2);
  }
  if (ultFirst) enqueue(ult?.id, 2);
  enqueue(firstFive, 5);
  if (!ultFirst) enqueue(ult?.id, 2);
  const rest = basics
    .map((ability) => ability.id)
    .filter((id) => id !== firstFive)
    .sort(
      (a, b) =>
        Number(weakMax.has(a)) - Number(weakMax.has(b)) ||
        (names.get(a)?.slot ?? 0) - (names.get(b)?.slot ?? 0),
    );
  for (const id of rest) enqueue(id, 5);
  enqueue(ult?.id, 5);

  const clicks: Click[] = [];
  const owned = new Map<number, number>();
  const unlocks = [opener, second, third, ult?.id].filter((id): id is number => id !== undefined);
  let unlockAt = 0;
  let bank = 0;
  let next = 0;
  for (const boon of BOONS) {
    if (boon === "unlock") {
      const id = unlocks[unlockAt];
      unlockAt += 1;
      if (id === undefined) continue;
      clicks.push({ ability: id, rank: 0 });
      owned.set(id, 0);
    } else {
      bank += 1;
    }
    while (next < queue.length) {
      const buy = queue[next];
      const have = owned.get(buy.ability) ?? -1;
      const need = RANK_ORDER.indexOf(buy.rank);
      if (have < 0 || have < need - 1) break;
      if (have >= need) {
        next += 1;
        continue;
      }
      const cost = RANK_COST[buy.rank];
      if (bank < cost) break;
      bank -= cost;
      clicks.push(buy);
      owned.set(buy.ability, need);
      next += 1;
    }
  }

  return { clicks, decisions };
}
