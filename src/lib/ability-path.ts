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

/** The next 5-point upgrade after `prefix` was already bought, in that order. */
export type MaxStep = Count & { prefix: number[]; ability: number };
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
  /**
   * How the first four ability points were spent. Those are the points
   * available before the ultimate unlocks. `spread` bought all three 1-point
   * ranks. `rush` bought that ability's 2-point rank and left one 1-point rank
   * unbought.
   */
  earlyPoints?: {
    spread: Count;
    rush: NamedCount[];
  };
  /**
   * Next 5-point upgrade after the abilities in `prefix` were already maxed.
   * An empty prefix is the first 5. Counted in every game that reached that
   * point, so a later step is not compared with an earlier one.
   */
  maxSteps?: MaxStep[];
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

type Opening = Count & { ability: number | null };

/** Drop any line whose range sits entirely under another line with enough games. */
function undominated(rows: Opening[]): { row: Opening; separated: boolean } | null {
  const eligible = rows.filter((row) => row.matches >= MIN_BRANCH);
  if (eligible.length === 0) return null;
  const scored = eligible.map((row) => ({ row, ...interval(row) }));
  const kept = scored.filter(
    (row) => !scored.some((other) => other.row !== row.row && other.low > row.high),
  );
  kept.sort((a, b) => b.row.matches - a.row.matches);
  const chosen = kept[0];
  if (!chosen) return null;
  return { row: chosen.row, separated: kept.length === 1 };
}

function samePrefix(left: number[], right: number[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

const MAX_LABELS = ["First", "Second", "Third", "Fourth"];

function walkMaxSteps(steps: MaxStep[]): { order: number[]; picks: Array<{ row: MaxStep; separated: boolean; other: MaxStep | null }> } | null {
  if (steps.length === 0) return null;
  const order: number[] = [];
  const picks: Array<{ row: MaxStep; separated: boolean; other: MaxStep | null }> = [];
  for (let depth = 0; depth < 4; depth += 1) {
    const rows = steps.filter((row) => samePrefix(row.prefix, order));
    const pick = choose(rows);
    if (!pick) break;
    const other =
      rows
        .filter((row) => row.ability !== pick.row.ability && row.matches >= MIN_BRANCH)
        .sort((a, b) => b.matches - a.matches)[0] ?? null;
    picks.push({ row: pick.row, separated: pick.separated, other });
    order.push(pick.row.ability);
  }
  return order.length > 0 ? { order, picks } : null;
}

function orderByEvidence(rows: NamedCount[]): number[] {
  const left = rows.filter((row) => row.matches > 0).map((row) => ({ ...row }));
  const order: number[] = [];
  while (left.length > 0) {
    const pick = choose(left);
    if (!pick) break;
    order.push(pick.row.ability);
    const index = left.findIndex((row) => row.ability === pick.row.ability);
    if (index < 0) break;
    left.splice(index, 1);
  }
  return order;
}

export function buildPath(hero: HeroOrders): AbilityPath {
  const names = byId(hero);
  const nameOf = (id: number) => names.get(id)?.name ?? String(id);
  const basics = hero.abilities.filter((ability) => ability.slot !== 4).sort((a, b) => a.slot - b.slot);
  const ult = hero.abilities.find((ability) => ability.slot === 4);
  const decisions: Decision[] = [];

  let rush: number | null = null;
  if (hero.earlyPoints) {
    const openings: Opening[] = [
      { ...hero.earlyPoints.spread, ability: null },
      ...hero.earlyPoints.rush.map((row) => ({ ...row })),
    ];
    const opening = undominated(openings);
    if (opening) {
      rush = opening.row.ability;
      const other = openings
        .filter((row) => row.ability !== rush && row.matches >= MIN_BRANCH)
        .sort((a, b) => b.matches - a.matches)[0];
      decisions.push(
        decision(
          "First four points",
          opening.row,
          rush === null ? "Three 1-point ranks" : `${nameOf(rush)} to its 2-point rank`,
          other ?? null,
          other ? (other.ability === null ? "Three 1-point ranks" : `${nameOf(other.ability)} to its 2-point rank`) : null,
          opening.separated,
        ),
      );
    }
  }

  const openerPick = rush === null ? choose(hero.openUpgrade) : null;
  const opener = rush ?? openerPick?.row.ability ?? basics[0]?.id;
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

  const walked = hero.maxSteps ? walkMaxSteps(hero.maxSteps) : null;
  const maxOrder = walked?.order ?? orderByEvidence(hero.firstMax);
  const maxPick = walked ? null : choose(hero.firstMax);
  const firstMaxId = maxOrder[0] ?? maxPick?.row.ability;
  const firstFiveIsUlt = ult !== undefined && firstMaxId === ult.id;
  if (walked) {
    for (let index = 0; index < walked.picks.length; index += 1) {
      const pick = walked.picks[index];
      if (!pick) continue;
      decisions.push(
        decision(
          `${MAX_LABELS[index] ?? "Next"} 5-point upgrade`,
          pick.row,
          nameOf(pick.row.ability),
          pick.other,
          pick.other ? nameOf(pick.other.ability) : null,
          pick.separated,
        ),
      );
    }
  } else if (maxPick && firstMaxId !== undefined) {
    const other = hero.firstMax
      .filter((row) => row.ability !== firstMaxId && row.matches >= MIN_BRANCH)
      .sort((a, b) => b.matches - a.matches)[0];
    decisions.push(
      decision(
        "First 5-point upgrade",
        maxPick.row,
        nameOf(firstMaxId),
        other ?? null,
        other ? nameOf(other.ability) : null,
        maxPick.separated,
      ),
    );
  }

  const fiveKey = (row: BeforeFive) => `${[...row.t2s].sort((a, b) => a - b).join("+")}|${row.five}`;
  const packageRows = firstFiveIsUlt ? [] : hero.beforeFive.filter((row) => row.five === firstMaxId);
  const packagePick = choose(packageRows.map((row) => ({ ...row, key: fiveKey(row) })));
  const t2Before = new Set(packagePick?.row.t2s ?? []);
  if (packagePick && firstMaxId !== undefined) {
    const picked = fiveKey(packagePick.row);
    const other = packageRows
      .filter((row) => fiveKey(row) !== picked && row.matches >= MIN_BRANCH)
      .sort((a, b) => b.matches - a.matches)[0];
    const labelOf = (row: BeforeFive) => {
      const prior = row.t2s.filter((id) => id !== row.five).map(nameOf);
      return prior.length > 0 ? prior.join(" + ") : "No other 2-point rank";
    };
    if (other) {
      decisions.push(
        decision(
          "2-point ranks before that 5",
          packagePick.row,
          labelOf(packagePick.row),
          other,
          labelOf(other),
          packagePick.separated,
        ),
      );
    }
  }

  const ultGate = choose([
    { ...hero.fiveBeforeUltAny, kind: "five" as const },
    { ...hero.ultBeforeFive, kind: "ult" as const },
  ]);
  const ultT2BeforeBasicFive = !firstFiveIsUlt && ultGate?.row.kind === "ult";
  if (!firstFiveIsUlt && ult && ultGate && hero.fiveBeforeUltAny.matches + hero.ultBeforeFive.matches > 0) {
    const before = ultGate.row.kind === "ult";
    decisions.push(
      decision(
        "Ultimate's 2-point upgrade",
        before ? hero.ultBeforeFive : hero.fiveBeforeUltAny,
        before ? "Before any 5-point upgrade" : "After a 5-point upgrade",
        before ? hero.fiveBeforeUltAny : hero.ultBeforeFive,
        before ? "After a 5-point upgrade" : "Before any 5-point upgrade",
        ultGate.separated,
      ),
    );
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

  if (rush !== null) {
    enqueue(rush, 1);
    enqueue(second, 1);
    enqueue(rush, 2);
    if (!firstFiveIsUlt) enqueue(third, 1);
  } else {
    for (const id of [opener, second, third]) enqueue(id, 1);
  }
  if (firstFiveIsUlt) {
    enqueue(ult?.id, 5);
  } else {
    for (const ability of basics) {
      if (t2Before.has(ability.id) && ability.id !== firstMaxId) enqueue(ability.id, 2);
    }
    if (ultT2BeforeBasicFive) enqueue(ult?.id, 2);
    enqueue(firstMaxId, 5);
  }
  for (const id of maxOrder) {
    if (id === firstMaxId) continue;
    enqueue(id, 5);
  }
  const evidenced = new Set(maxOrder);
  const leftovers = [...basics.map((ability) => ability.id), ult?.id].filter(
    (id): id is number => id !== undefined && !evidenced.has(id),
  );
  leftovers.sort((a, b) => (names.get(a)?.slot ?? 0) - (names.get(b)?.slot ?? 0));
  for (const id of leftovers) enqueue(id, 5);

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
