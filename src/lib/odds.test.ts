import assert from "node:assert/strict";
import test from "node:test";
import { scoreLobby, sigmoid, logit, wilson, heroRates, rankSample, HERO_THIN_MATCHES, LANE_PRIOR_K, countedMatches, type MarginMeta } from "./odds.ts";

function meta(
  heroes: MarginMeta["heroes"],
  pairs: MarginMeta["pairs"] = [],
  counters: NonNullable<MarginMeta["counters"]> = [],
  lanes: MarginMeta["lanes"] = [],
): MarginMeta {
  return { heroes, pairs, counters, lanes, items: [], fetchedAt: "2026-10-04T00:00:00.000Z" };
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

test("a duo lane above the four strengths keeps a positive leftover", () => {
  const heroes = [
    { id: 1, name: "A", wins: 5000, matches: 10000 },
    { id: 2, name: "B", wins: 5000, matches: 10000 },
    { id: 3, name: "C", wins: 5000, matches: 10000 },
    { id: 4, name: "D", wins: 5000, matches: 10000 },
  ];
  const lanes = [
    { a: 1, b: 2, c: 3, d: 4, wins: 7000, matches: 10000 },
    { a: 1, b: 3, c: 2, d: 4, wins: 5000, matches: 10000 },
    { a: 1, b: 4, c: 2, d: 3, wins: 5000, matches: 10000 },
    { a: 2, b: 3, c: 1, d: 4, wins: 4200, matches: 10000 },
  ];
  const score = scoreLobby(meta(heroes, [], [], lanes), [1, 2], [3, 4], [
    { yours: [1, 2], theirs: [3, 4] },
  ]);
  const lane = score.parts.find((part) => part.kind === "lane");
  assert.ok(lane);
  assert.ok(lane.observed > lane.predicted + 0.1);
  assert.ok(lane.leftover > 0);
  assert.ok(lane.marginal > 0);
  const flipped = scoreLobby(meta(heroes, [], [], lanes), [3, 4], [1, 2], [
    { yours: [3, 4], theirs: [1, 2] },
  ]);
  assert.ok(Math.abs(score.probability + flipped.probability - 1) < 1e-9);
});

test("a street leftover is not wiped by a large table of ordinary streets", () => {
  const heroes = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: String.fromCharCode(65 + i),
    wins: 5000,
    matches: 10000,
  }));
  const lanes = [
    { a: 1, b: 2, c: 3, d: 4, wins: 28, matches: 62 },
  ];
  for (let i = 1; i <= 8; i++) {
    for (let j = i + 1; j <= 8; j++) {
      for (let k = 1; k <= 8; k++) {
        for (let l = k + 1; l <= 8; l++) {
          if (new Set([i, j, k, l]).size < 4) continue;
          if (i === 1 && j === 2 && k === 3 && l === 4) continue;
          lanes.push({ a: i, b: j, c: k, d: l, wins: 50, matches: 100 });
        }
      }
    }
  }
  const score = scoreLobby(meta(heroes, [], [], lanes), [1, 2], [3, 4], [
    { yours: [1, 2], theirs: [3, 4] },
  ]);
  const lane = score.parts.find((part) => part.kind === "lane");
  assert.ok(lane);
  assert.ok(lane.matches === 62);
  assert.ok(lane.observed < lane.predicted - 0.04);
  assert.ok(lane.leftover < -0.01);
  assert.ok(lane.marginal < 0);
  const raw = logit(lane.observed) - logit(lane.predicted);
  assert.ok(Math.abs(lane.leftover) < Math.abs(raw));
  assert.ok(Math.abs(lane.leftover) > Math.abs(raw) * (62 / (62 + LANE_PRIOR_K)) * 0.5);
});

test("a thin street leftover stays close to zero, a huge sample keeps more of its gap", () => {
  const heroes = [
    { id: 1, name: "A", wins: 5000, matches: 10000 },
    { id: 2, name: "B", wins: 5000, matches: 10000 },
    { id: 3, name: "C", wins: 5000, matches: 10000 },
    { id: 4, name: "D", wins: 5000, matches: 10000 },
  ];
  const thin = scoreLobby(
    meta(heroes, [], [], [{ a: 1, b: 2, c: 3, d: 4, wins: 21, matches: 30 }]),
    [1, 2],
    [3, 4],
    [{ yours: [1, 2], theirs: [3, 4] }],
  ).parts.find((part) => part.kind === "lane");
  const thick = scoreLobby(
    meta(heroes, [], [], [{ a: 1, b: 2, c: 3, d: 4, wins: 7000, matches: 10000 }]),
    [1, 2],
    [3, 4],
    [{ yours: [1, 2], theirs: [3, 4] }],
  ).parts.find((part) => part.kind === "lane");
  assert.ok(thin && thick);
  assert.ok(Math.abs(thin.leftover) < 0.08);
  assert.ok(thick.leftover > 0.5);
  assert.ok(Math.abs(thick.leftover) > Math.abs(thin.leftover) * 3);
});


test("a hero card's model rate matches picking that hero alone in the lobby", () => {
  const data = meta([
    { id: 1, name: "Established", wins: 60000, matches: 100000 },
    { id: 2, name: "Streak", wins: 8, matches: 10 },
    ...Array.from({ length: 20 }, (_, i) => ({
      id: 10 + i,
      name: `Field ${i}`,
      wins: 5000,
      matches: 10000,
    })),
  ]);
  const rates = heroRates(data);
  for (const hero of data.heroes) {
    const rate = rates.get(hero.id);
    assert.ok(rate);
    const alone = scoreLobby(data, [hero.id], []);
    assert.ok(Math.abs(rate.model - alone.probability) < 1e-12);
    assert.equal(rate.raw, hero.wins / hero.matches);
    assert.equal(rate.thin, hero.matches < HERO_THIN_MATCHES);
    const interval = wilson(hero.wins, hero.matches);
    assert.equal(rate.interval.low, interval.low);
    assert.equal(rate.interval.high, interval.high);
  }
  const streak = rates.get(2);
  const established = rates.get(1);
  assert.ok(streak && established);
  assert.ok(streak.thin);
  assert.ok(!established.thin);
  assert.ok(Math.abs(streak.model - 0.5) < Math.abs(streak.raw - 0.5));
  assert.ok(Math.abs(established.model - established.raw) < 0.01);
});

test("a 200-game floor marks thin heroes, and a band is thin when its median hero is under it", () => {
  assert.equal(HERO_THIN_MATCHES, 200);
  assert.equal(rankSample([{ matches: 199 }]).thin, true);
  assert.equal(rankSample([{ matches: 200 }]).thin, false);
  const mixed = rankSample([
    { matches: 10 },
    { matches: 65 },
    { matches: 400 },
  ]);
  assert.equal(mixed.medianMatches, 65);
  assert.equal(mixed.thin, true);
  assert.equal(rankSample([{ matches: 423 }, { matches: 500 }, { matches: 600 }]).thin, false);
});

test("countedMatches leaves games with no recorded winner out of the total", () => {
  assert.equal(countedMatches(14, 16, 31), 30);
  assert.equal(countedMatches(50, 50, 100), 100);
  assert.equal(countedMatches(0, 0, 12), 0);
  // One side missing is handled by the caller; the helper still returns the scored games.
  assert.equal(countedMatches(20, 0, 25), 20);
  // Do not invent games if the two win totals exceed the stored count.
  assert.equal(countedMatches(60, 50, 100), 100);
});

test("a matchup rate ignores matches with no recorded winner", () => {
  const heroes = [
    { id: 1, name: "A", wins: 5000, matches: 10000 },
    { id: 2, name: "B", wins: 5000, matches: 10000 },
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
  const dropped = scoreLobby(
    meta(heroes, [], [
      { hero: 1, enemy: 2, wins: 5000, matches: 11000 },
      { hero: 2, enemy: 1, wins: 4000, matches: 11000 },
      ...noise,
    ]),
    [1],
    [2],
  );
  const alreadyCounted = scoreLobby(
    meta(heroes, [], [
      { hero: 1, enemy: 2, wins: 5000, matches: 9000 },
      { hero: 2, enemy: 1, wins: 4000, matches: 9000 },
      ...noise,
    ]),
    [1],
    [2],
  );
  const counter = dropped.parts.find((part) => part.kind === "counter" && part.side === "yours");
  const clean = alreadyCounted.parts.find((part) => part.kind === "counter" && part.side === "yours");
  assert.ok(counter && clean);
  assert.equal(counter.matches, 9000);
  assert.ok(Math.abs(counter.observed - 5000 / 9000) < 1e-12);
  assert.ok(Math.abs(counter.observed - 5000 / 11000) > 0.05);
  assert.ok(Math.abs(dropped.probability - alreadyCounted.probability) < 1e-12);
  assert.equal(clean.matches, 9000);
  assert.ok(counter.observed > counter.predicted);
  assert.ok(counter.leftover > 0);
});

test("a street rate ignores matches with no recorded winner", () => {
  const heroes = [
    { id: 1, name: "A", wins: 5000, matches: 10000 },
    { id: 2, name: "B", wins: 5000, matches: 10000 },
    { id: 3, name: "C", wins: 5000, matches: 10000 },
    { id: 4, name: "D", wins: 5000, matches: 10000 },
  ];
  const bothWays = scoreLobby(
    meta(heroes, [], [], [
      { a: 1, b: 2, c: 3, d: 4, wins: 60, matches: 100 },
      { a: 3, b: 4, c: 1, d: 2, wins: 30, matches: 100 },
    ]),
    [1, 2],
    [3, 4],
    [{ yours: [1, 2], theirs: [3, 4] }],
  );
  const oneWay = scoreLobby(
    meta(heroes, [], [], [{ a: 1, b: 2, c: 3, d: 4, wins: 28, matches: 62 }]),
    [1, 2],
    [3, 4],
    [{ yours: [1, 2], theirs: [3, 4] }],
  );
  const lane = bothWays.parts.find((part) => part.kind === "lane");
  const untouched = oneWay.parts.find((part) => part.kind === "lane");
  assert.ok(lane && untouched);
  assert.equal(lane.matches, 90);
  assert.ok(Math.abs(lane.observed - 60 / 90) < 1e-12);
  assert.equal(untouched.matches, 62);
  assert.ok(Math.abs(untouched.observed - 28 / 62) < 1e-12);
  const flipped = scoreLobby(
    meta(heroes, [], [], [
      { a: 1, b: 2, c: 3, d: 4, wins: 60, matches: 100 },
      { a: 3, b: 4, c: 1, d: 2, wins: 30, matches: 100 },
    ]),
    [3, 4],
    [1, 2],
    [{ yours: [3, 4], theirs: [1, 2] }],
  );
  assert.ok(Math.abs(bothWays.probability + flipped.probability - 1) < 1e-9);
});

function evenField(matches: number, count = 20): MarginMeta["heroes"] {
  return Array.from({ length: count }, (_, i) => ({
    id: 10 + i,
    name: `Field ${i}`,
    wins: matches / 2,
    matches,
  }));
}

/** A split field so the model can see real spread, not only noise. */
function splitField(matches: number): MarginMeta["heroes"] {
  return Array.from({ length: 20 }, (_, i) => ({
    id: 10 + i,
    name: `Field ${i}`,
    wins: i < 10 ? matches * 0.6 : matches * 0.4,
    matches,
  }));
}

function assertShrunkTowardField(data: MarginMeta, id: number, expectThin: boolean) {
  const hero = data.heroes.find((row) => row.id === id);
  const rate = heroRates(data).get(id);
  assert.ok(hero && rate);
  assert.equal(rate.wins, hero.wins);
  assert.equal(rate.matches, hero.matches);
  assert.equal(rate.raw, hero.wins / hero.matches);
  assert.equal(rate.thin, expectThin);
  assert.equal(rate.thin, hero.matches < HERO_THIN_MATCHES);
  const alone = scoreLobby(data, [id], []).probability;
  assert.ok(Math.abs(rate.model - alone) < 1e-12);
  const field = 0.5;
  const lo = Math.min(rate.raw, field);
  const hi = Math.max(rate.raw, field);
  assert.ok(
    rate.model >= lo - 1e-12 && rate.model <= hi + 1e-12,
    "headline sits between the raw rate and the field",
  );
  assert.ok(Math.abs(rate.model - field) <= Math.abs(rate.raw - field) + 1e-12);
}

test("thin rank cards shrink toward the field, whether or not the band itself is thin", () => {
  // An Eternus-like band: the median hero is well under the 200-game floor.
  // With no detectable spread, short records are pulled all the way to average.
  const thinBand = meta([
    { id: 1, name: "Streak", wins: 4, matches: 11 },
    { id: 2, name: "Popular", wins: 90, matches: 170 },
    ...evenField(64),
  ]);
  const thinSample = rankSample(thinBand.heroes);
  assert.ok(thinSample.medianMatches < HERO_THIN_MATCHES);
  assert.ok(thinSample.thin);
  assertShrunkTowardField(thinBand, 1, true);
  assertShrunkTowardField(thinBand, 2, true);
  const streak = heroRates(thinBand).get(1);
  assert.ok(streak);
  assert.ok(Math.abs(streak.model - 0.5) < 0.02);

  // An Initiate-like band: the median hero is well above the floor, but a
  // short record on that band is still marked thin and pulled toward average.
  const thickBand = meta([
    { id: 3, name: "New", wins: 53, matches: 125 },
    ...splitField(800),
  ]);
  const thickSample = rankSample(thickBand.heroes);
  assert.ok(thickSample.medianMatches >= HERO_THIN_MATCHES);
  assert.ok(!thickSample.thin);
  assertShrunkTowardField(thickBand, 3, true);
  const newRate = heroRates(thickBand).get(3);
  assert.ok(newRate);
  assert.ok(newRate.model !== newRate.raw);
  const established = heroRates(thickBand).get(10);
  assert.ok(established);
  assert.ok(!established.thin);
  assert.ok(Math.abs(established.model - established.raw) < 0.01);
});
