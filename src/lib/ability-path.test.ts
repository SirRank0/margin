import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  applySwitch,
  buildPath,
  isLegalClick,
  LOW_CONFIDENCE_GAMES,
  MIN_BRANCH,
  PATH_LENGTH,
  type AbilityInfo,
  type AbilityOrders,
  type HeroOrders,
  type StateTable,
  type TreeNode,
} from "./ability-path.ts";

// Synthetic hero: three basics (slots 1-3) and an ultimate (slot 4).
const A = 10;
const B = 11;
const C = 12;
const U = 13;
const ABILITIES: AbilityInfo[] = [
  { id: A, name: "Alpha", slot: 1 },
  { id: B, name: "Beta", slot: 2 },
  { id: C, name: "Gamma", slot: 3 },
  { id: U, name: "Ult", slot: 4 },
];
/** A full legal order: each ability four times, ultimate after the three basic unlocks. */
const FULL = [A, A, B, A, C, U, A, B, B, B, C, C, C, U, U, U];

type Row = { seq: number[]; wins: number; matches: number };

/** Same construction as scripts/fetch-ability-orders.py: a trie plus the rank-vector table. */
function hero(rows: Row[], extraStates: StateTable = {}): HeroOrders {
  const root: TreeNode = [0, 0, 0, []];
  const states: StateTable = {};
  const slotIds = [A, B, C, U];
  for (const row of rows) {
    root[1] += row.wins;
    root[2] += row.matches;
    let node = root;
    const ranks = [0, 0, 0, 0];
    for (const ability of row.seq) {
      const key = ranks.join(",");
      const bucket = (states[key] ??= []);
      const entry = bucket.find((item) => item[0] === ability);
      if (entry) {
        entry[1] += row.wins;
        entry[2] += row.matches;
      } else bucket.push([ability, row.wins, row.matches]);
      ranks[slotIds.indexOf(ability)] += 1;
      let child = node[3].find((item) => item[0] === ability);
      if (!child) {
        child = [ability, 0, 0, []];
        node[3].push(child);
      }
      child[1] += row.wins;
      child[2] += row.matches;
      node = child;
    }
  }
  for (const [key, extra] of Object.entries(extraStates)) states[key] = extra;
  return {
    id: 1,
    name: "Fixture",
    wins: root[1],
    matches: root[2],
    abilities: ABILITIES,
    bands: [{ band: "all", label: "All ranks", root, states }],
  };
}

/** Complete `head` into a full 16-click order (each ability four times, in slot order). */
function seq(...head: number[]) {
  const counts = new Map<number, number>();
  for (const id of head) counts.set(id, (counts.get(id) ?? 0) + 1);
  const out = [...head];
  for (const id of [A, B, C, U]) {
    while ((counts.get(id) ?? 0) < 4) {
      out.push(id);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return out;
}

function assertFullLegal(path: ReturnType<typeof buildPath>, abilities: AbilityInfo[]) {
  const ranks = new Map<number, number>();
  for (const click of path.clicks) {
    assert.ok(isLegalClick(click.ability, ranks, abilities), `illegal click ${click.ability}`);
    const next = (ranks.get(click.ability) ?? 0) + 1;
    ranks.set(click.ability, next);
    assert.equal(click.rank, [0, 1, 2, 5][next - 1]);
  }
  assert.equal(path.clicks.length, Math.min(PATH_LENGTH, abilities.length * 4));
}

test("shrinkage: a small line cannot beat a large one on luck", () => {
  // 200 games at 60% vs 100,000 at 51.5%: the small line is under 5% of the large one's games.
  const h = hero([
    { seq: seq(A), wins: 51_500, matches: 100_000 },
    { seq: seq(B), wins: 120, matches: 200 },
  ]);
  assert.equal(buildPath(h).clicks[0].ability, A);

  const h2 = hero([
    { seq: seq(A), wins: 50_000, matches: 100_000 },
    { seq: seq(B), wins: 10_800, matches: 20_000 },
  ]);
  const first = buildPath(h2).decisions[0];
  assert.equal(first.click.ability, B, "a large real edge wins");
  assert.equal(first.separated, true);
  assert.equal(first.other?.name, "Alpha");
});

test("MIN_SHARE rejects a thin line (Mina-like 1,045 vs 155,996)", () => {
  const h = hero([
    { seq: seq(A, A, B, C), wins: 72_681, matches: 155_996 },
    { seq: seq(A, A, B, B), wins: 530, matches: 1_045 }, // 50.7% on 1,045 games
  ]);
  const fourth = buildPath(h).decisions[3];
  assert.equal(fourth.click.ability, C);
  assert.equal(fourth.other, null, "the thin line is not a rival either");
});

test("MIN_BRANCH rejects a line under 200 games even with a large share", () => {
  const h = hero([
    { seq: seq(A), wins: 500, matches: 1_000 },
    { seq: seq(B), wins: 140, matches: MIN_BRANCH - 50 }, // 15% share, 93% win rate
  ]);
  assert.equal(buildPath(h).clicks[0].ability, A);
});

test("backoff: an exhausted tree node uses the state table and is low confidence", () => {
  // The tree only knows two clicks; the state table knows what follows rank vector 2,0,0,0.
  const h = hero([{ seq: [A, A], wins: 5_000, matches: 10_000 }], {
    "2,0,0,0": [
      [C, 3_000, 5_000],
      [B, 2_000, 5_000],
    ],
  });
  const third = buildPath(h).decisions[2];
  assert.equal(third.source, "state");
  assert.equal(third.lowConfidence, true);
  assert.equal(third.click.ability, C);
});

test("never stop: thin tree and thin state table fall back to the most-played legal click", () => {
  // Holliday-like: after four clicks the only children are under MIN_BRANCH, one of them the
  // ultimate, which is not legal yet.
  const h = hero([
    { seq: seq(A, A, B, A, U), wins: 66, matches: 119 },
    { seq: seq(A, A, B, A, C), wins: 54, matches: 102 },
    { seq: [A, A, B, A], wins: 4_000, matches: 8_000 },
  ]);
  const path = buildPath(h);
  assertFullLegal(path, ABILITIES);
  const fifth = path.decisions[4];
  assert.equal(fifth.click.ability, C, "the ultimate is skipped until all basics are unlocked");
  assert.equal(fifth.source, "fallback");
  assert.equal(fifth.lowConfidence, true);
  assert.ok(path.decisions.slice(4).every((decision) => decision.lowConfidence));
});

test("never stop: no data at all still yields a full legal path", () => {
  const h = hero([{ seq: [A], wins: 500, matches: 1_000 }]);
  h.bands[0].states = {};
  const path = buildPath(h);
  assertFullLegal(path, ABILITIES);
  assert.ok(path.decisions.slice(1).every((decision) => decision.source === "fallback"));
});

test("measured order is preserved: A,B,A stays A,B,A", () => {
  const order = [A, B, A, C, U, A, A, B, B, B, C, C, C, U, U, U];
  const h = hero([{ seq: order, wins: 6_000, matches: 10_000 }]);
  const path = buildPath(h);
  assert.deepEqual(
    path.clicks.map((click) => click.ability),
    order,
  );
  assert.deepEqual(path.clicks.slice(0, 3), [
    { ability: A, rank: 0 },
    { ability: B, rank: 0 },
    { ability: A, rank: 1 },
  ]);
});

test("click-N switch re-walks from that click and clears later switches", () => {
  const h = hero([
    // After A: B and C both 5,250 / 10,000, a dead tie (B wins on the id tie-break).
    { seq: seq(A, B, B), wins: 5_250, matches: 10_000 },
    { seq: seq(A, C, C), wins: 3_900, matches: 8_000 },
    { seq: seq(A, C, A), wins: 1_350, matches: 2_000 },
  ]);
  const main = buildPath(h);
  const tie = main.decisions[1];
  assert.equal(tie.separated, false);
  assert.ok(tie.alternateId !== null);

  const switched = applySwitch({ "click-0": A, "click-5": B, "click-1": B }, 1, tie.alternateId);
  assert.deepEqual(switched, { "click-0": A, "click-1": tie.alternateId });

  const path = buildPath(h, applySwitch({}, 1, tie.alternateId));
  assert.deepEqual(path.clicks.slice(0, 1), main.clicks.slice(0, 1));
  assert.equal(path.clicks[1].ability, tie.alternateId);
  assert.equal(path.decisions[1].source, "forced");
  // Below the switch the walk follows the forced child's own subtree: C then A (67.5%) beats C, C (48.8%).
  assert.equal(path.clicks[2].ability, A);
  assertFullLegal(path, ABILITIES);

  assert.deepEqual(buildPath(h, applySwitch(switched, 1, null)), main, "back to the main line");
  assert.deepEqual(buildPath(h, { "click-0": main.clicks[0].ability }), main, "forcing the greedy click is a no-op");
});

test("the separated test and the displayed other use the same rival", () => {
  // Runner-up by shrunk rate (B) is not the most-played alternative (C).
  const h = hero([
    { seq: seq(A), wins: 15_900, matches: 30_000 },
    { seq: seq(B), wins: 2_640, matches: 5_000 },
    { seq: seq(C), wins: 50_000, matches: 100_000 },
  ]);
  const first = buildPath(h).decisions[0];
  assert.equal(first.click.ability, A);
  assert.equal(first.other?.name, "Beta");
  assert.ok(first.other && first.other.rate <= first.chosen.rate);
});

test("deterministic, and independent of child order", () => {
  const rows: Row[] = [
    { seq: seq(A, B), wins: 5_000, matches: 10_000 },
    { seq: seq(B, A), wins: 5_000, matches: 10_000 },
    { seq: seq(C, A), wins: 4_000, matches: 9_000 },
  ];
  const one = buildPath(hero(rows));
  assert.deepEqual(buildPath(hero(rows)), one);
  assert.deepEqual(buildPath(hero(rows.slice().reverse())), one);
});

test("ultimate guard: no ult unlock before all three basics, in tree, state and switches", () => {
  const ranks = new Map([
    [A, 1],
    [B, 1],
  ]);
  assert.equal(isLegalClick(U, ranks, ABILITIES), false);
  ranks.set(C, 1);
  assert.equal(isLegalClick(U, ranks, ABILITIES), true);
  assert.equal(isLegalClick(A, new Map([[A, 4]]), ABILITIES), false, "at most four appearances");
  assert.equal(isLegalClick(99, new Map(), ABILITIES), false, "unknown ability");

  // The most-played next click after A, B is an early ult; it must be skipped.
  const h = hero([
    { seq: seq(A, B, U), wins: 9_000, matches: 20_000 },
    { seq: seq(A, B, C), wins: 1_000, matches: 2_000 },
  ]);
  const path = buildPath(h, { "click-2": U });
  assert.equal(path.clicks[2].ability, C, "an illegal switch is ignored");
  assertFullLegal(path, ABILITIES);
  assertFullLegal(buildPath(h), ABILITIES);
});

test("low-confidence flag uses the named threshold", () => {
  const h = hero([{ seq: FULL, wins: 300, matches: LOW_CONFIDENCE_GAMES - 1 }]);
  assert.ok(buildPath(h).decisions.every((decision) => decision.lowConfidence));
  const big = hero([{ seq: FULL, wins: 600, matches: LOW_CONFIDENCE_GAMES }]);
  assert.ok(buildPath(big).decisions.every((decision) => !decision.lowConfidence));
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
