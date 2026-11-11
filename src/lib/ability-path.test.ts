import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  applySwitch,
  buildPath,
  LOW_CONFIDENCE_GAMES,
  MIN_BRANCH,
  PATH_LENGTH,
  pointsAt,
  replayClicks,
  ultOption,
  type AbilityInfo,
  type AbilityOrders,
  type AbilityPath,
  type BandTree,
  type HeroOrders,
  type StateTable,
  type TreeNode,
} from "./ability-path.ts";

// Synthetic hero: three basics (slots 1-3) and an ultimate (slot 4).
const A = 10;
const B = 11;
const C = 12;
const U = 13;
const SLOTS = [A, B, C, U];
const ABILITIES: AbilityInfo[] = [
  { id: A, name: "Alpha", slot: 1 },
  { id: B, name: "Beta", slot: 2 },
  { id: C, name: "Gamma", slot: 3 },
  { id: U, name: "Ult", slot: 4 },
];
const COST = [1, 2, 5];
const WINDOW_S = 10;

/** One API row: the combined order (first appearance = unlock), optional average times. */
type Row = { seq: number[]; wins: number; matches: number; times?: number[] };

/** Same split as scripts/fetch-ability-orders.py. */
function split(seq: number[], times?: number[]) {
  const seen = new Map<number, number>();
  const basics: number[] = [];
  let ult: number | null = null;
  let points = 0;
  const spends: Array<{ id: number; t: number | undefined; unlocked: number }> = [];
  seq.forEach((id, pos) => {
    const have = seen.get(id) ?? 0;
    if (!SLOTS.includes(id) || have >= 4) return;
    seen.set(id, have + 1);
    if (have === 0) {
      if (id === U) ult = ultOption(basics.length, points);
      else basics.push(SLOTS.indexOf(id) + 1);
    } else {
      spends.push({ id, t: times?.[pos], unlocked: basics.length + (ult !== null ? 1 : 0) });
      points += COST[have - 1];
    }
  });
  if (basics.length < 3) return null;
  const canon: typeof spends = [];
  let group: typeof spends = [];
  let last: number | undefined;
  for (const entry of spends) {
    if (group.length && (entry.t === undefined || last === undefined || Math.abs(entry.t - last) > WINDOW_S)) {
      canon.push(...group.slice().sort((x, y) => SLOTS.indexOf(x.id) - SLOTS.indexOf(y.id)));
      group = [];
    }
    group.push(entry);
    last = entry.t;
  }
  canon.push(...group.slice().sort((x, y) => SLOTS.indexOf(x.id) - SLOTS.indexOf(y.id)));
  return {
    code: basics[0] * 100 + basics[1] * 10 + basics[2],
    ult,
    spends: canon.map((entry) => entry.id),
    before: spends.map((entry) => entry.unlocked),
  };
}

function add(table: Array<[number, number, number]>, key: number, w: number, n: number) {
  const entry = table.find((item) => item[0] === key);
  if (entry) {
    entry[1] += w;
    entry[2] += n;
  } else table.push([key, w, n]);
}

function hero(rows: Row[], extraStates: StateTable = {}): HeroOrders {
  const band: BandTree = { band: "all", label: "All ranks", unlocks: [], ult: {}, spend: {}, states: {} };
  let wins = 0;
  let matches = 0;
  for (const row of rows) {
    wins += row.wins;
    matches += row.matches;
    const parts = split(row.seq, row.times);
    if (!parts) continue;
    add(band.unlocks, parts.code, row.wins, row.matches);
    if (parts.ult !== null) add((band.ult[parts.code] ??= []), parts.ult, row.wins, row.matches);
    let node: TreeNode = (band.spend[parts.code] ??= [0, 0, 0, []]);
    node[1] += row.wins;
    node[2] += row.matches;
    const tiers = [0, 0, 0, 0];
    let points = 0;
    parts.spends.forEach((id, i) => {
      add((band.states[`${tiers.join(",")}|${parts.before[i]}|${points}`] ??= []), id, row.wins, row.matches);
      const slot = SLOTS.indexOf(id);
      tiers[slot] += 1;
      points += COST[tiers[slot] - 1];
      let child = node[3].find((item) => item[0] === id);
      if (!child) {
        child = [id, 0, 0, []];
        node[3].push(child);
      }
      child[1] += row.wins;
      child[2] += row.matches;
      node = child;
    });
  }
  for (const [key, extra] of Object.entries(extraStates)) band.states[key] = extra;
  return { id: 1, name: "Fixture", wins, matches, abilities: ABILITIES, bands: [band] };
}

/** Unlocks A, B, C (or `order`), ult, then the remaining upgrades of `head` completed in slot order. */
function seq(order: number[], ...head: number[]) {
  const counts = new Map<number, number>();
  const out: number[] = [];
  const push = (id: number) => {
    out.push(id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  };
  for (const id of order) push(id);
  for (const id of head) push(id);
  for (const id of SLOTS) while ((counts.get(id) ?? 0) < 4) push(id);
  return out;
}
const ABC = [A, B, C, U];

function spendOrder(path: AbilityPath) {
  return path.decisions.filter((decision) => decision.kind === "spend").map((decision) => decision.value);
}

function assertFullLegal(path: AbilityPath, abilities: AbilityInfo[]) {
  assert.equal(path.clicks.length, PATH_LENGTH);
  const levels = replayClicks(path.clicks, abilities);
  assert.ok(levels, "the combined path breaks a hard rule");
  for (const ability of abilities) {
    assert.deepEqual(
      path.clicks.filter((click) => click.ability === ability.id).map((click) => click.rank),
      [0, 1, 2, 5],
    );
  }
}

test("boon schedule: 32 points by level 35, 4 by level 7", () => {
  assert.equal(pointsAt(0), 0);
  assert.equal(pointsAt(1), 1);
  assert.equal(pointsAt(6), 4);
  assert.equal(pointsAt(7), 4);
  assert.equal(pointsAt(8), 5);
  assert.equal(pointsAt(35), 32);
});

test("unlock order is its own decision, chosen by shrunk win rate", () => {
  const h = hero([
    { seq: seq([A, B, C, U]), wins: 50_000, matches: 100_000 },
    { seq: seq([B, A, C, U]), wins: 10_800, matches: 20_000 },
    { seq: seq([C, B, A, U]), wins: 150, matches: 250 }, // under 5% of the top order's games
  ]);
  const path = buildPath(h);
  const unlock = path.decisions[0];
  assert.equal(unlock.kind, "unlock-order");
  assert.equal(unlock.value, 213);
  assert.equal(unlock.chosen.name, "Beta → Alpha → Gamma");
  assert.equal(unlock.other?.name, "Alpha → Beta → Gamma");
  assert.deepEqual(path.unlockOrder, [B, A, C]);
  assert.deepEqual(
    path.steps.filter((step) => step.kind === "unlock").map((step) => step.click.ability),
    [B, A, C, U],
  );
  assertFullLegal(path, ABILITIES);
});

test("unlocks do not compete with upgrades: the spend tree only holds upgrades", () => {
  // Same plan, clicked in two interleavings: A unlock, A 1-point, B unlock... vs A unlock, B unlock, A 1-point.
  // In the old single stream these were rival siblings; now they are one spend line.
  const h = hero([
    { seq: [A, A, B, C, ...seq([], A, B, U).slice(4)].slice(0, 16), wins: 0, matches: 0 },
    { seq: [A, A, B, C, U, A, B, B, C, C, A, B, C, U, U, U], wins: 5_000, matches: 10_000 },
    { seq: [A, B, A, C, U, A, B, B, C, C, A, B, C, U, U, U], wins: 5_200, matches: 10_000 },
  ]);
  const path = buildPath(h);
  for (const decision of path.decisions.filter((entry) => entry.kind === "spend")) {
    assert.ok(decision.click && decision.click.rank !== 0, "no unlock among spend decisions");
  }
  const first = path.decisions[2];
  assert.equal(first.value, A);
  assert.equal(first.chosen.matches, 20_000, "both interleavings count for the same first upgrade");
  assert.equal(first.other, null);
  assertFullLegal(path, ABILITIES);
});

test("upgrades bought within the same window are merged; measured order kept when apart", () => {
  // Two lines buy C 1-point and B 1-point together (2 s apart) in opposite orders.
  const base = [A, B, C, A];
  const t = [0, 100, 200, 300];
  const tail = [U, A, A, B, B, C, C, U, U, U];
  const tailTimes = [400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300];
  const h = hero([
    { seq: [...base, C, B, ...tail], times: [...t, 350, 352, ...tailTimes], wins: 3_000, matches: 6_000 },
    { seq: [...base, B, C, ...tail], times: [...t, 350, 352, ...tailTimes], wins: 3_100, matches: 6_000 },
  ]);
  const merged = buildPath(h);
  assert.deepEqual(spendOrder(merged).slice(0, 3), [A, B, C], "slot order inside the window");
  assert.equal(merged.decisions[3].chosen.matches, 12_000, "one branch, not two");

  // Far apart in time, the order is a real choice and stays as measured.
  const apart = hero([
    { seq: [...base, C, B, ...tail], times: [...t, 350, 450, ...tailTimes], wins: 3_000, matches: 6_000 },
  ]);
  assert.deepEqual(spendOrder(buildPath(apart)).slice(0, 3), [A, C, B]);
});

test("early ultimate (basic unlock held) is legal and can be chosen", () => {
  const early = [A, B, A, U, C, A, B, B, C, C, A, B, C, U, U, U];
  assert.ok(replayClicks(
    early.map((id, i) => ({ ability: id, rank: ([0, 1, 2, 5] as const)[early.slice(0, i).filter((x) => x === id).length] })),
    ABILITIES,
  ));
  const h = hero([
    { seq: early, wins: 6_000, matches: 10_000 },
    { seq: [A, B, A, C, U, A, B, B, C, C, A, B, C, U, U, U], wins: 5_000, matches: 10_000 },
  ]);
  const path = buildPath(h);
  const ult = path.decisions[1];
  assert.equal(ult.kind, "ult");
  assert.equal(ult.value, ultOption(2, 1));
  assert.match(ult.chosen.name, /before basic unlock 3/);
  const unlocks = path.steps.filter((step) => step.kind === "unlock").map((step) => step.click.ability);
  assert.deepEqual(unlocks, [A, B, U, C]);
  assertFullLegal(path, ABILITIES);
});

test("hard rules: points never exceed what the schedule has earned", () => {
  const ranks = (ids: number[]) =>
    ids.map((id, i) => ({ ability: id, rank: ([0, 1, 2, 5] as const)[ids.slice(0, i).filter((x) => x === id).length] }));
  // A 5-point upgrade as the third upgrade: 1 + 2 + 5 = 8 points, earned at level 11.
  const levels = replayClicks(ranks([A, A, A, A]), ABILITIES);
  assert.deepEqual(levels, [0, 1, 5, 11]);
  assert.equal(pointsAt(11), 8);
  assert.equal(replayClicks(ranks([A, B, C, A, B]), ABILITIES)?.[2], 4, "third basic unlock waits for level 4");
  assert.equal(replayClicks(ranks([A, U]), ABILITIES)?.[1], 7, "the ultimate unlock waits for level 7");
  assert.equal(replayClicks(ranks([A, B, C, A, A, A, A]), ABILITIES), null, "no fourth upgrade");
  assert.equal(replayClicks([{ ability: A, rank: 1 }], ABILITIES), null, "no upgrade before the unlock");
  assert.equal(replayClicks([{ ability: 99, rank: 0 }], ABILITIES), null, "unknown ability");

  // Scheduled paths buy a 5-point upgrade only once 5 points are in hand, and mark the saving.
  const h = hero([{ seq: seq(ABC, A, A, A), wins: 6_000, matches: 10_000 }]);
  const path = buildPath(h);
  const fivePoint = path.steps.find((step) => step.click.ability === A && step.click.rank === 5)!;
  assert.equal(fivePoint.saved, true);
  let spent = 0;
  for (const step of path.steps) {
    if (step.kind === "upgrade") spent += step.click.rank;
    assert.ok(spent <= pointsAt(step.level), "spent within what was earned");
  }
  assertFullLegal(path, ABILITIES);
});

test("shrinkage and floors on the spend tree", () => {
  const h = hero([
    { seq: seq(ABC, A), wins: 51_500, matches: 100_000 },
    { seq: seq(ABC, B), wins: 120, matches: 200 },
  ]);
  assert.equal(buildPath(h).decisions[2].value, A, "a small line cannot win on luck");
  const thin = hero([
    { seq: seq(ABC, A), wins: 500, matches: 1_000 },
    { seq: seq(ABC, B), wins: 140, matches: MIN_BRANCH - 50 },
  ]);
  assert.equal(buildPath(thin).decisions[2].value, A, "under MIN_BRANCH");
});

test("backoff: an exhausted spend tree uses the state table and is low confidence", () => {
  const h = hero([{ seq: [A, A, B, C], wins: 5_000, matches: 10_000 }], {
    "1,0,0,0|3|1": [
      [C, 3_000, 5_000],
      [B, 2_000, 5_000],
    ],
  });
  const second = buildPath(h).decisions[3];
  assert.equal(second.source, "state");
  assert.equal(second.lowConfidence, true);
  assert.equal(second.value, C);
});

test("never stop: thin data falls back to the most-played legal option, low confidence", () => {
  const h = hero([
    { seq: seq(ABC, A, B), wins: 66, matches: 119 },
    { seq: seq(ABC, A, C), wins: 54, matches: 102 },
    { seq: [A, B, C, A], wins: 4_000, matches: 8_000 },
  ]);
  h.bands[0].states = {};
  const path = buildPath(h);
  assertFullLegal(path, ABILITIES);
  const second = path.decisions[3];
  assert.equal(second.source, "fallback");
  assert.equal(second.value, B, "most played of the thin children");
  assert.ok(path.decisions.slice(3).every((decision) => decision.lowConfidence));

  const empty = hero([]);
  const bare = buildPath(empty);
  assertFullLegal(bare, ABILITIES);
  assert.ok(bare.decisions.every((decision) => decision.source === "fallback"));
});

test("switches: unlock order and spend switches re-walk and clear later switches", () => {
  const h = hero([
    { seq: seq([A, B, C, U], A, B), wins: 5_250, matches: 10_000 },
    { seq: seq([A, B, C, U], A, C), wins: 3_900, matches: 8_000 },
    { seq: seq([A, B, C, U], A, C, A), wins: 1_350, matches: 2_000 },
    { seq: seq([B, A, C, U], B, B), wins: 5_200, matches: 10_000 },
  ]);
  const main = buildPath(h);
  const tie = main.decisions[3];
  assert.equal(tie.kind, "spend");
  assert.equal(tie.separated, false);
  assert.ok(tie.alternateId !== null);

  const cleared = applySwitch({ "unlock-order": 123, "spend-5": B, "spend-1": B }, 3, tie.alternateId);
  assert.deepEqual(cleared, { "unlock-order": 123, "spend-1": tie.alternateId });

  const switched = buildPath(h, applySwitch({}, 3, tie.alternateId));
  assert.equal(switched.decisions[3].value, tie.alternateId);
  assert.equal(switched.decisions[3].source, "forced");
  assert.equal(switched.decisions[4].value, A, "below the switch the forced child's own subtree is walked");
  assertFullLegal(switched, ABILITIES);
  assert.deepEqual(buildPath(h, applySwitch(applySwitch({}, 3, tie.alternateId), 3, null)), main);
  assert.deepEqual(buildPath(h, { "spend-0": main.decisions[2].value }), main, "forcing the greedy choice is a no-op");

  const unlock = main.decisions[0];
  assert.equal(unlock.separated, false);
  const reordered = buildPath(h, applySwitch({ "spend-1": C }, 0, unlock.alternateId));
  assert.equal(reordered.decisions[0].value, unlock.alternateId);
  assert.deepEqual(reordered.unlockOrder, [B, A, C]);
  assert.equal(reordered.decisions[2].value, B, "the spend tree is the one under the new unlock order");
  assertFullLegal(reordered, ABILITIES);

  const illegal = buildPath(h, { "unlock-order": 124 });
  assert.deepEqual(illegal.decisions[0].value, main.decisions[0].value, "an illegal switch is ignored");
});

test("low-confidence flag uses the named threshold", () => {
  const full = seq(ABC, A, B, C);
  const h = hero([{ seq: full, wins: 300, matches: LOW_CONFIDENCE_GAMES - 1 }]);
  assert.ok(buildPath(h).decisions.every((decision) => decision.lowConfidence));
  const big = hero([{ seq: full, wins: 600, matches: LOW_CONFIDENCE_GAMES }]);
  assert.ok(buildPath(big).decisions.every((decision) => !decision.lowConfidence));
});

test("deterministic, and independent of row order", () => {
  const rows: Row[] = [
    { seq: seq([A, B, C, U], A), wins: 5_000, matches: 10_000 },
    { seq: seq([B, A, C, U], B), wins: 5_000, matches: 10_000 },
    { seq: seq([C, A, B, U], C), wins: 4_000, matches: 9_000 },
  ];
  const one = buildPath(hero(rows));
  assert.deepEqual(buildPath(hero(rows)), one);
  assert.deepEqual(buildPath(hero(rows.slice().reverse())), one);
});

test("snapshot: every hero in src/data/ability-orders.ts gets a full legal path", () => {
  const source = readFileSync(new URL("../data/ability-orders.ts", import.meta.url), "utf8");
  const json = source.slice(source.indexOf("= {") + 2, source.lastIndexOf("}") + 1);
  const orders = JSON.parse(json) as AbilityOrders;
  assert.ok(orders.heroes.length > 0);
  for (const entry of orders.heroes) {
    const path = buildPath(entry);
    assertFullLegal(path, entry.abilities);
    assert.deepEqual(buildPath(entry), path, `${entry.name} is deterministic`);
  }
});
