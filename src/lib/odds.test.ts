import assert from "node:assert/strict";
import test from "node:test";
import { scoreLobby, sigmoid, logit, wilson, type MarginMeta } from "./odds.ts";

function meta(
  heroes: MarginMeta["heroes"],
  pairs: MarginMeta["pairs"] = [],
  counters: NonNullable<MarginMeta["counters"]> = [],
): MarginMeta {
  return { heroes, pairs, counters, items: [], fetchedAt: "2026-10-04T00:00:00.000Z" };
}

test("an empty lobby is one half, with no sampling width", () => {
  const score = scoreLobby(meta([{ id: 1, name: "A", wins: 500, matches: 1000 }]), [], []);
  assert.equal(score.probability, 0.5);
  assert.equal(score.low, 0.5);
  assert.equal(score.high, 0.5);
});

test("swapping sides complements the chance and the interval", () => {
  const data = meta([
    { id: 1, name: "Strong", wins: 6000, matches: 10000 },
    { id: 2, name: "Weak", wins: 4000, matches: 10000 },
  ]);
  const left = scoreLobby(data, [1], [2]);
  const right = scoreLobby(data, [2], [1]);
  assert.ok(Math.abs(left.probability + right.probability - 1) < 1e-12);
  assert.ok(Math.abs(left.low + right.high - 1) < 1e-12);
  const strong = left.parts.find((part) => part.kind === "hero" && part.label === "Strong");
  assert.ok(strong && strong.side === "yours" && strong.logOdds > 0 && strong.marginal > 0);
});

test("a huge sample keeps its win rate; a tiny hot streak does not", () => {
  const heroes = [
    { id: 1, name: "Established", wins: 60000, matches: 100000 },
    { id: 3, name: "Mirror", wins: 40000, matches: 100000 },
    { id: 2, name: "Streak", wins: 8, matches: 10 },
    ...Array.from({ length: 20 }, (_, i) => ({
      id: 10 + i,
      name: `Field ${i}`,
      wins: 5000,
      matches: 10000,
    })),
  ];
  const data = meta(heroes);
  const established = scoreLobby(data, [1], []);
  const streak = scoreLobby(data, [2], []);
  assert.ok(established.probability > 0.58);
  assert.ok(established.probability < 0.62);
  assert.ok(streak.probability < 0.56);
  assert.ok(streak.probability > 0.5);
});

test("a pair at the additive prediction does not move the chance", () => {
  const heroes = [
    { id: 1, name: "A", wins: 5500, matches: 10000 },
    { id: 2, name: "B", wins: 5500, matches: 10000 },
    ...Array.from({ length: 15 }, (_, i) => ({
      id: 10 + i,
      name: `Field ${i}`,
      wins: 5000,
      matches: 10000,
    })),
  ];
  const alone = scoreLobby(meta(heroes), [1, 2], []);
  const predicted = sigmoid(2 * (Math.log(0.55 / 0.45)));
  const pairLogit = Math.log(predicted / (1 - predicted));
  const pairP = 1 / (1 + Math.exp(-pairLogit));
  const withPair = scoreLobby(
    meta(heroes, [{ a: 1, b: 2, wins: Math.round(pairP * 8000), matches: 8000 }]),
    [1, 2],
    [],
  );
  assert.ok(Math.abs(withPair.probability - alone.probability) < 0.01);
});

test("a matchup at the additive prediction does not move the chance", () => {
  const heroes = [
    { id: 1, name: "A", wins: 5500, matches: 10000 },
    { id: 2, name: "B", wins: 4500, matches: 10000 },
    ...Array.from({ length: 15 }, (_, i) => ({
      id: 10 + i,
      name: `Field ${i}`,
      wins: 5000,
      matches: 10000,
    })),
  ];
  const alone = scoreLobby(meta(heroes), [1], [2]);
  const expected = sigmoid(logit(0.55) - logit(0.45));
  const withCounter = scoreLobby(
    meta(heroes, [], [
      { hero: 1, enemy: 2, wins: Math.round(expected * 8000), matches: 8000 },
      { hero: 2, enemy: 1, wins: Math.round((1 - expected) * 8000), matches: 8000 },
    ]),
    [1],
    [2],
  );
  assert.ok(Math.abs(withCounter.probability - alone.probability) < 0.01);
});

test("a repeated bad matchup lowers the chance, and swapping sides flips it", () => {
  const heroes = [
    { id: 1, name: "A", wins: 5500, matches: 10000 },
    { id: 2, name: "B", wins: 4500, matches: 10000 },
    ...Array.from({ length: 15 }, (_, i) => ({
      id: 10 + i,
      name: `Field ${i}`,
      wins: 5000,
      matches: 10000,
    })),
  ];
  const noise = Array.from({ length: 15 }, (_, i) => ({
    hero: 10 + i,
    enemy: 1,
    wins: 5000,
    matches: 10000,
  }));
  const counters = [
    { hero: 1, enemy: 2, wins: 3200, matches: 8000 },
    { hero: 2, enemy: 1, wins: 4800, matches: 8000 },
    ...noise,
  ];
  const data = meta(heroes, [], counters);
  const alone = scoreLobby(meta(heroes), [1], [2]);
  const countered = scoreLobby(data, [1], [2]);
  const flipped = scoreLobby(data, [2], [1]);
  assert.ok(countered.probability < alone.probability - 0.02);
  assert.ok(Math.abs(countered.probability + flipped.probability - 1) < 1e-9);
});

test("a pair above the two win rates keeps a positive leftover", () => {
  const heroes = [
    { id: 1, name: "A", wins: 5000, matches: 10000 },
    { id: 2, name: "B", wins: 5000, matches: 10000 },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: 10 + i,
      name: `Field ${i}`,
      wins: 5000,
      matches: 10000,
    })),
  ];
  const pairs = [{ a: 1, b: 2, wins: 6200, matches: 10000 }];
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      pairs.push({ a: 10 + i, b: 10 + j, wins: 5000, matches: 10000 });
    }
  }
  const score = scoreLobby(meta(heroes, pairs), [1, 2], []);
  const pair = score.parts.find((part) => part.kind === "pair" && part.label === "A + B");
  assert.ok(pair);
  assert.ok(pair.observed > pair.predicted + 0.05);
  assert.ok(pair.leftover > 0);
  assert.ok(pair.marginal > 0);
});

test("Wilson interval covers the point and shrinks as matches grow", () => {
  const thin = wilson(6, 10);
  const thick = wilson(6000, 10000);
  assert.ok(thin.low < thin.p && thin.p < thin.high);
  assert.ok(thick.high - thick.low < thin.high - thin.low);
});
