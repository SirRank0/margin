import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  applySwitch,
  buildPath,
  decisionKey,
  fitsStrategy,
  isLegalStrategy,
  LOW_CONFIDENCE_GAMES,
  MAX_ALTERNATIVES,
  MIN_BRANCH,
  PRIOR_K,
  SEPARATED_P,
  splitOrder,
  STRATEGY_DECISION,
  strategyOf,
  ultOption,
  type AbilityOrders,
  type AbilityPath,
  type BandTree,
  type HeroOrders,
  type StateTable,
  type TreeNode,
} from "./ability-path.ts";
import {
  isCompletePath,
  pointsAt,
  replay,
  replayClicks,
  TOTAL_POINTS,
  UPGRADE_COST,
  type AbilityInfo,
  type Click,
} from "./ability-rules.ts";

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

/** One API row: the combined order (first appearance = unlock), optional average times. */
type Row = { seq: number[]; wins: number; matches: number; times?: number[] };

function add(table: Array<[number, number, number]>, key: number, w: number, n: number) {
  const entry = table.find((item) => item[0] === key);
  if (entry) {
    entry[1] += w;
    entry[2] += n;
  } else table.push([key, w, n]);
}

/** Same construction as scripts/fetch-ability-orders.py, without its pruning. */
function hero(rows: Row[], extraStates: StateTable = {}, abilities = ABILITIES): HeroOrders {
  const band: BandTree = { band: "all", label: "All ranks", unlocks: [], ult: {}, strategies: {}, spend: {}, states: {} };
  const slots = abilities.slice().sort((a, b) => a.slot - b.slot).map((ability) => ability.id);
  let wins = 0;
  let matches = 0;
  for (const row of rows) {
    wins += row.wins;
    matches += row.matches;
    const parts = splitOrder(row.seq, row.times, abilities);
    if (!parts) continue;
    add(band.unlocks, parts.code, row.wins, row.matches);
    if (parts.ult !== null) add((band.ult[parts.code] ??= []), parts.ult, row.wins, row.matches);
    const tiers = [0, 0, 0, 0];
    let points = 0;
    parts.spends.forEach((id, i) => {
      add((band.states[`${tiers.join(",")}|${parts.before[i]}|${points}`] ??= []), id, row.wins, row.matches);
      const at = slots.indexOf(id);
      tiers[at] += 1;
      points += UPGRADE_COST[tiers[at] - 1];
    });
    const strategy = strategyOf(parts.spends, abilities);
    if (strategy === null) continue;
    add((band.strategies[parts.code] ??= []), strategy, row.wins, row.matches);
    let node: TreeNode = (band.spend[`${parts.code}:${strategy}`] ??= [0, 0, 0, []]);
    node[1] += row.wins;
    node[2] += row.matches;
    for (const id of parts.spends) {
      let child = node[3].find((item) => item[0] === id);
      if (!child) {
        child = [id, 0, 0, []];
        node[3].push(child);
      }
      child[1] += row.wins;
      child[2] += row.matches;
      node = child;
    }
  }
  for (const [key, extra] of Object.entries(extraStates)) band.states[key] = extra;
  return { id: 1, name: "Fixture", wins, matches, abilities, bands: [band] };
}

/** `order` unlocks, then `head` upgrades, then the rest in slot order. */
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
const ABCU = [A, B, C, U];

function clicksOf(ids: number[]): Click[] {
  return ids.map((id, i) => ({ ability: id, rank: ([0, 1, 2, 5] as const)[ids.slice(0, i).filter((x) => x === id).length] }));
}

function spendOrder(path: AbilityPath) {
  return path.decisions.filter((decision) => decision.kind === "spend").map((decision) => decision.value);
}

/** Every rule from ability-rules.ts, plus: the path realizes the strategy it claims. */
function assertObeysRules(path: AbilityPath, abilities: AbilityInfo[], where = "") {
  const result = replay(path.clicks, abilities);
  assert.ok(result.ok, `${where} breaks a rule: ${result.ok ? "" : `${result.reason} at click ${result.at}`}`);
  assert.ok(isCompletePath(path.clicks, abilities), `${where} is not a full path`);
  let spent = 0;
  path.steps.forEach((step, i) => {
    assert.equal(step.level, result.ok ? Math.max(step.level, result.levels[i]) : 0, `${where} step ${i} before its earliest level`);
    if (step.kind === "upgrade") spent += step.click.rank;
    assert.ok(spent <= pointsAt(step.level), `${where} spends more than earned at level ${step.level}`);
  });
  assert.equal(spent, TOTAL_POINTS);
  assert.equal(strategyOf(spendOrder(path), abilities), path.strategy, `${where} does not follow its strategy`);
  for (const alternative of path.alternatives) {
    assert.equal(alternative.path.strategy, alternative.strategy);
    assertObeysRules(alternative.path, abilities, `${where} alternative ${alternative.strategy}`);
  }
}

/** Deterministic PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- rules

test("rules: the boon schedule gives 32 points by level 35 and 4 by level 7", () => {
  assert.deepEqual([0, 1, 6, 7, 8, 11, 35].map(pointsAt), [0, 1, 4, 4, 5, 8, 32]);
  assert.equal(UPGRADE_COST.reduce((sum, cost) => sum + cost, 0) * 4, TOTAL_POINTS, "unlocks cost no points");
});

test("rules: replay rejects every broken rule and gives earliest levels", () => {
  assert.deepEqual(replayClicks(clicksOf([A, A, A, A]), ABILITIES), [0, 1, 5, 11], "1 + 2 + 5 points by level 11");
  assert.equal(replayClicks(clicksOf([A, B, C]), ABILITIES)?.[2], 4, "third basic unlock at level 4");
  assert.equal(replayClicks(clicksOf([A, U]), ABILITIES)?.[1], 7, "ultimate unlock at level 7");
  assert.ok(replayClicks(clicksOf([A, B, A, U, C]), ABILITIES), "a held basic unlock after the ultimate is legal");
  const reason = (clicks: Click[]) => {
    const result = replay(clicks, ABILITIES);
    return result.ok ? "ok" : result.reason;
  };
  assert.equal(reason(clicksOf([A, A, A, A, A])), "more than three upgrades");
  assert.equal(reason([{ ability: A, rank: 1 }]), "rank out of order", "no upgrade before the unlock");
  assert.equal(reason([{ ability: A, rank: 0 }, { ability: A, rank: 2 }]), "rank out of order", "no skipped tier");
  assert.equal(reason([{ ability: 99, rank: 0 }]), "unknown ability");
  const fourBasics: AbilityInfo[] = [...ABILITIES.slice(0, 3), { id: 14, name: "Delta", slot: 3 }, ABILITIES[3]];
  assert.equal(replay(clicksOf([A, B, C, 14]), fourBasics).ok, false, "only three basic unlocks");
});

// ---------------------------------------------------------------- strategies

test("strategy classification: rush, one up, spread, and too short", () => {
  // Max A with nothing else past 1 point, then B.
  assert.equal(strategyOf([A, B, A, A, B, B], ABILITIES), 120);
  // Max A with B at 2 points, then B.
  assert.equal(strategyOf([A, B, B, A, A, B], ABILITIES), 121);
  // Max C with A and B at 2 points, then A: spread.
  assert.equal(strategyOf([A, A, B, B, C, C, C, A], ABILITIES), 312);
  assert.equal(strategyOf([A, A, A, B, B], ABILITIES), null, "only one max");
  for (const s of [120, 121, 312, 432]) assert.ok(isLegalStrategy(s));
  for (const s of [110, 123, 150, 12, 1200, 12.5]) assert.equal(isLegalStrategy(s), false);
});

test("fitsStrategy always leaves a move, and every completion lands in the strategy", () => {
  const random = rng(7);
  for (const strategy of [120, 121, 122, 130, 210, 241, 312, 342, 412, 431, 432]) {
    for (let trial = 0; trial < 60; trial += 1) {
      const tiers = [0, 0, 0, 0];
      const spends: number[] = [];
      for (let k = 0; k < 12; k += 1) {
        const moves = [0, 1, 2, 3].filter((at) => fitsStrategy(strategy, tiers, at));
        assert.ok(moves.length > 0, `stuck in ${strategy} at ${tiers}`);
        const at = moves[Math.floor(random() * moves.length)];
        tiers[at] += 1;
        spends.push(SLOTS[at]);
      }
      assert.equal(strategyOf(spends, ABILITIES), strategy);
    }
  }
});

test("strategy selection beats step-greedy: a spread wins overall though no first step looks best", () => {
  const rows: Row[] = [
    // Rush A: 20,000 games at 50%.
    { seq: seq(ABCU, A, A, A, B, B, B), wins: 10_000, matches: 20_000 },
    // Spread starting with A: 3,000 at 60%.
    { seq: seq(ABCU, A, B, B, C, C, A, A, B), wins: 1_800, matches: 3_000 },
    // Spread starting with B: 3,000 at 54%.
    { seq: seq(ABCU, B, A, B, C, C, A, A, B), wins: 1_620, matches: 3_000 },
  ];
  const h = hero(rows);
  // A step-greedy walk sees A (23,000 games, 51.3%) against B (3,000 games, 54%) at the first upgrade.
  const parent = h.wins / h.matches;
  const shrunk = (w: number, n: number) => (w + PRIOR_K * parent) / (n + PRIOR_K);
  assert.ok(shrunk(1_620, 3_000) > shrunk(11_800, 23_000), "step-greedy would start with B");

  const path = buildPath(h);
  assert.equal(path.strategy, 122, "max A first, then B, after a spread");
  assert.equal(path.decisions[STRATEGY_DECISION].chosen.matches, 6_000);
  assert.deepEqual(spendOrder(path).slice(0, 8), [A, B, B, C, C, A, A, B], "best concrete order inside the spread");
  assertObeysRules(path, ABILITIES);
});

test("near-equal strategies come back as switchable alternatives, each a full legal path", () => {
  const h = hero([
    { seq: seq(ABCU, A, A, A, B, B, B), wins: 5_050, matches: 10_000 }, // 120 at 50.5%
    { seq: seq(ABCU, A, A, A, C, C, C), wins: 5_000, matches: 10_000 }, // 130 at 50%
    { seq: seq(ABCU, B, B, B, C, C, C), wins: 4_950, matches: 10_000 }, // 230 at 49.5%
    { seq: seq(ABCU, C, C, C, B, B, B), wins: 4_000, matches: 10_000 }, // 320 at 40%: clearly worse
  ]);
  const path = buildPath(h);
  assert.equal(path.strategy, 120);
  assert.deepEqual(path.alternatives.map((alternative) => alternative.strategy), [130, 230]);
  assert.ok(path.alternatives.length <= MAX_ALTERNATIVES);
  for (const alternative of path.alternatives) {
    assert.ok(alternative.pBestBetter < SEPARATED_P);
    assert.equal(alternative.path.alternatives.length, 0);
  }
  assertObeysRules(path, ABILITIES);

  // Switching to an alternative gives that alternative's path, and lists the best one back.
  const switched = buildPath(h, applySwitch({}, STRATEGY_DECISION, 130));
  assert.deepEqual(switched.clicks, path.alternatives[0].path.clicks);
  assert.equal(switched.decisions[STRATEGY_DECISION].source, "forced");
  assert.ok(switched.alternatives.some((alternative) => alternative.strategy === 120));
  assert.deepEqual(buildPath(h, applySwitch({ "spend-2": B }, STRATEGY_DECISION, null)), path, "back to the best");

  // A clearly separated best has no alternatives.
  const clear = hero([
    { seq: seq(ABCU, A, A, A, B, B, B), wins: 6_000, matches: 10_000 },
    { seq: seq(ABCU, A, A, A, C, C, C), wins: 4_000, matches: 10_000 },
  ]);
  assert.deepEqual(buildPath(clear).alternatives, []);
});

test("alternatives are capped at MAX_ALTERNATIVES", () => {
  const lines = [
    [A, A, A, B, B, B],
    [A, A, A, C, C, C],
    [B, B, B, A, A, A],
    [B, B, B, C, C, C],
    [C, C, C, A, A, A],
  ];
  const h = hero(lines.map((head) => ({ seq: seq(ABCU, ...head), wins: 5_000, matches: 10_000 })));
  assert.equal(buildPath(h).alternatives.length, MAX_ALTERNATIVES);
});

// ---------------------------------------------------------------- unlocks, windows, ultimate

test("unlock order is its own decision, chosen by shrunk win rate", () => {
  const h = hero([
    { seq: seq([A, B, C, U]), wins: 50_000, matches: 100_000 },
    { seq: seq([B, A, C, U]), wins: 10_800, matches: 20_000 },
    { seq: seq([C, B, A, U]), wins: 150, matches: 250 },
  ]);
  const path = buildPath(h);
  assert.equal(path.decisions[0].kind, "unlock-order");
  assert.equal(path.decisions[0].value, 213);
  assert.equal(path.decisions[0].chosen.name, "Beta → Alpha → Gamma");
  assert.deepEqual(path.unlockOrder, [B, A, C]);
  assert.deepEqual(path.steps.filter((step) => step.kind === "unlock").map((step) => step.click.ability), [B, A, C, U]);
  assertObeysRules(path, ABILITIES);
});

test("unlocks do not compete with upgrades", () => {
  const h = hero([
    { seq: [A, A, B, C, U, A, B, B, C, C, A, B, C, U, U, U], wins: 5_000, matches: 10_000 },
    { seq: [A, B, A, C, U, A, B, B, C, C, A, B, C, U, U, U], wins: 5_200, matches: 10_000 },
  ]);
  const path = buildPath(h);
  for (const decision of path.decisions.filter((entry) => entry.kind === "spend")) {
    assert.ok(decision.click && decision.click.rank !== 0);
  }
  const first = path.decisions[STRATEGY_DECISION + 1];
  assert.equal(first.value, A);
  assert.equal(first.chosen.matches, 20_000, "both interleavings are one spend line");
  assertObeysRules(path, ABILITIES);
});

test("upgrades in one purchase window are merged; apart, the measured order is kept", () => {
  const base = [A, B, C, A];
  const t = [0, 100, 200, 300];
  const tail = [U, A, A, B, B, C, C, U, U, U];
  const tailTimes = [400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300];
  const h = hero([
    { seq: [...base, C, B, ...tail], times: [...t, 350, 352, ...tailTimes], wins: 3_000, matches: 6_000 },
    { seq: [...base, B, C, ...tail], times: [...t, 350, 352, ...tailTimes], wins: 3_100, matches: 6_000 },
  ]);
  const merged = buildPath(h);
  assert.deepEqual(spendOrder(merged).slice(0, 3), [A, B, C]);
  assert.equal(merged.decisions[STRATEGY_DECISION + 2].chosen.matches, 12_000);
  const apart = hero([{ seq: [...base, C, B, ...tail], times: [...t, 350, 450, ...tailTimes], wins: 3_000, matches: 6_000 }]);
  assert.deepEqual(spendOrder(buildPath(apart)).slice(0, 3), [A, C, B]);
});

test("early ultimate (a held basic unlock) is legal and can be chosen", () => {
  const early = [A, B, A, U, C, A, B, B, C, C, A, B, C, U, U, U];
  const h = hero([
    { seq: early, wins: 6_000, matches: 10_000 },
    { seq: [A, B, A, C, U, A, B, B, C, C, A, B, C, U, U, U], wins: 5_000, matches: 10_000 },
  ]);
  const path = buildPath(h);
  assert.equal(path.decisions[1].value, ultOption(2, 1));
  assert.deepEqual(path.steps.filter((step) => step.kind === "unlock").map((step) => step.click.ability), [A, B, U, C]);
  assertObeysRules(path, ABILITIES);
});

// ---------------------------------------------------------------- floors, backoff, fallback

test("floors: a small strategy or step cannot win on luck", () => {
  const h = hero([
    { seq: seq(ABCU, A, A, A, B, B, B), wins: 51_500, matches: 100_000 },
    { seq: seq(ABCU, B, B, B, A, A, A), wins: 120, matches: 200 },
  ]);
  assert.equal(buildPath(h).strategy, 120);
  const thin = hero([
    { seq: seq(ABCU, A, A, A, B, B, B), wins: 500, matches: 1_000 },
    { seq: seq(ABCU, B, B, B, A, A, A), wins: 140, matches: MIN_BRANCH - 50 },
  ]);
  assert.equal(buildPath(thin).strategy, 120);
});

test("backoff: an exhausted spend tree uses the state table, inside the strategy", () => {
  // Strategy 120 is known from full games; this line's tree stops after one upgrade.
  const h = hero(
    [
      { seq: seq(ABCU, A, A, A, B, B, B), wins: 5_000, matches: 10_000 },
      { seq: [A, A, B, C], wins: 5_000, matches: 10_000 },
    ],
    { "1,0,0,0|2|1": [[B, 9_000, 10_000]] },
  );
  const path = buildPath(h, { "spend-0": A, "spend-1": B });
  assert.equal(path.strategy, 120);
  assertObeysRules(path, ABILITIES);
  // A state row that would leave the strategy (B to 2 points before A is maxed in a rush) is skipped.
  const third = path.decisions[STRATEGY_DECISION + 3];
  assert.notEqual(third.value, B);
});

test("never stop: thin or missing data still gives a full legal path, low confidence", () => {
  const h = hero([
    { seq: seq(ABCU, A, B), wins: 66, matches: 119 }, // strategy 120
    { seq: seq(ABCU, C, C, C), wins: 54, matches: 102 }, // strategy 310
  ]);
  h.bands[0].states = {};
  const path = buildPath(h);
  assertObeysRules(path, ABILITIES);
  assert.equal(path.decisions[STRATEGY_DECISION].source, "fallback");
  assert.ok(path.decisions.every((decision) => decision.lowConfidence));
  const bare = buildPath(hero([]));
  assertObeysRules(bare, ABILITIES);
  assert.ok(bare.decisions.every((decision) => decision.source === "fallback"));
});

test("low-confidence flag uses the named threshold", () => {
  const full = seq(ABCU, A, A, A, B, B, B);
  assert.ok(buildPath(hero([{ seq: full, wins: 300, matches: LOW_CONFIDENCE_GAMES - 1 }])).decisions.every((d) => d.lowConfidence));
  assert.ok(buildPath(hero([{ seq: full, wins: 600, matches: LOW_CONFIDENCE_GAMES }])).decisions.every((d) => !d.lowConfidence));
});

// ---------------------------------------------------------------- switches and determinism

test("switches: unlock order, strategy and spend switches re-walk and clear later switches", () => {
  const h = hero([
    { seq: seq([A, B, C, U], A, B, A, A), wins: 5_250, matches: 10_000 },
    { seq: seq([A, B, C, U], A, C, A, A), wins: 5_240, matches: 10_000 },
    { seq: seq([B, A, C, U], B, B, B), wins: 5_200, matches: 10_000 },
  ]);
  const main = buildPath(h);
  const cleared = applySwitch({ "unlock-order": 123, strategy: 120, "spend-5": B, "spend-1": B }, STRATEGY_DECISION + 2, A);
  assert.deepEqual(cleared, { "unlock-order": 123, strategy: 120, "spend-1": A });
  assert.equal(decisionKey(STRATEGY_DECISION + 1), "spend-0");

  const tie = main.decisions[STRATEGY_DECISION + 2];
  assert.equal(tie.separated, false);
  const switched = buildPath(h, applySwitch({}, tie.index, tie.alternateId));
  assert.equal(switched.decisions[tie.index].value, tie.alternateId);
  assert.equal(switched.decisions[tie.index].source, "forced");
  assertObeysRules(switched, ABILITIES);
  assert.deepEqual(buildPath(h, applySwitch(applySwitch({}, tie.index, tie.alternateId), tie.index, null)), main);
  assert.deepEqual(buildPath(h, { "spend-0": main.decisions[STRATEGY_DECISION + 1].value }), main, "forcing the greedy choice is a no-op");

  const reordered = buildPath(h, applySwitch({ "spend-1": C }, 0, 213));
  assert.deepEqual(reordered.unlockOrder, [B, A, C]);
  assert.equal(reordered.strategy, 210, "the strategy table is the one under the new unlock order");
  assertObeysRules(reordered, ABILITIES);

  assert.deepEqual(buildPath(h, { "unlock-order": 124 }).unlockOrder, main.unlockOrder, "an illegal unlock switch is ignored");
  assert.equal(buildPath(h, { strategy: 110 }).strategy, main.strategy, "an illegal strategy switch is ignored");
  // Strategy 120 is a rush: B may not reach its 2-point upgrade before A is maxed.
  assert.equal(main.strategy, 120);
  const leaving = buildPath(h, { "spend-0": B, "spend-1": B });
  assert.equal(leaving.decisions[STRATEGY_DECISION + 1].value, B);
  assert.notEqual(leaving.decisions[STRATEGY_DECISION + 2].value, B, "a switch that leaves the strategy is ignored");
  assertObeysRules(leaving, ABILITIES);
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

// ---------------------------------------------------------------- properties

/** A random API-like order: any interleaving, sometimes junk, sometimes cut short. */
function randomRow(random: () => number): Row {
  const counts = new Map<number, number>();
  const seqOut: number[] = [];
  const length = 10 + Math.floor(random() * 9);
  while (seqOut.length < length) {
    const roll = random();
    if (roll < 0.02) seqOut.push(99); // unknown id
    else {
      const id = SLOTS[Math.floor(random() * 4)];
      const have = counts.get(id) ?? 0;
      if (have >= 4 && random() < 0.9) continue; // usually skip, sometimes a fifth appearance
      counts.set(id, have + 1);
      seqOut.push(id);
    }
    if (seqOut.length > 40) break;
  }
  let t = 0;
  const times = seqOut.map(() => (t += random() < 0.3 ? random() * 12 : 20 + random() * 200));
  const matches = 1 + Math.floor(random() ** 2 * 30_000);
  return { seq: seqOut, times: random() < 0.9 ? times : undefined, wins: Math.floor(matches * (0.4 + random() * 0.2)), matches };
}

test("property: random synthetic data and random switches always give a full legal path in its strategy", () => {
  const random = rng(20261111);
  const keys = ["unlock-order", "ult", "strategy", "spend-0", "spend-3", "spend-7", "spend-11", "bogus"];
  const values = [123, 213, 321, 124, 300, 200, 307, 120, 121, 122, 312, 432, 110, A, B, C, U, 99];
  for (let trial = 0; trial < 400; trial += 1) {
    const rows = Array.from({ length: 1 + Math.floor(random() * 40) }, () => randomRow(random));
    const h = hero(rows);
    const overrides: Record<string, number> = {};
    for (const key of keys) if (random() < 0.25) overrides[key] = values[Math.floor(random() * values.length)];
    const path = buildPath(h, overrides);
    assertObeysRules(path, ABILITIES, `trial ${trial}`);
    assert.deepEqual(buildPath(hero(rows.slice().reverse()), overrides), path, `trial ${trial} is deterministic`);
  }
});

test("property: every hero in src/data/ability-orders.ts, and every alternative, obeys the rules", () => {
  const source = readFileSync(new URL("../data/ability-orders.ts", import.meta.url), "utf8");
  const json = source.slice(source.indexOf("= {") + 2, source.lastIndexOf("}") + 1);
  const orders = JSON.parse(json) as AbilityOrders;
  assert.ok(orders.heroes.length > 0);
  for (const entry of orders.heroes) {
    const path = buildPath(entry);
    assertObeysRules(path, entry.abilities, entry.name);
    assert.deepEqual(buildPath(entry), path, `${entry.name} is deterministic`);
    // Every unlock order the board can switch to also gives a legal path.
    for (const [code] of entry.bands[0].unlocks) {
      assertObeysRules(buildPath(entry, { "unlock-order": code }, "all", { alternatives: false }), entry.abilities, `${entry.name} ${code}`);
    }
  }
});
