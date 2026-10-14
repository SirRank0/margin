import assert from "node:assert/strict";
import test from "node:test";
import { buildPath, choose, type HeroOrders } from "./ability-path.ts";

test("a higher lower bound wins only when it clears the largest line", () => {
  const separated = choose([
    { id: "common", wins: 4220, matches: 10000 },
    { id: "edge", wins: 280, matches: 500 },
  ]);
  assert.equal(separated?.row.id, "edge");
  assert.equal(separated?.separated, true);

  const tied = choose([
    { id: "common", wins: 5500, matches: 10000 },
    { id: "edge", wins: 290, matches: 500 },
  ]);
  assert.equal(tied?.row.id, "common");
  assert.equal(tied?.separated, false);
});

test("the first 5 follows the first-max table, including the ultimate", () => {
  const hero: HeroOrders = {
    id: 1,
    name: "Fixture",
    wins: 550,
    matches: 1000,
    abilities: [
      { id: 10, name: "Grenade", slot: 1 },
      { id: 11, name: "Swarm", slot: 2 },
      { id: 12, name: "Armor", slot: 3 },
      { id: 13, name: "Ult", slot: 4 },
    ],
    openUpgrade: [
      { ability: 10, wins: 5530, matches: 10000 },
      { ability: 12, wins: 2740, matches: 5000 },
      { ability: 11, wins: 1600, matches: 3000 },
    ],
    prefix3: [
      { clicks: [10, 10, 11], wins: 2760, matches: 5000 },
      { clicks: [10, 10, 12], wins: 2216, matches: 4000 },
    ],
    beforeFive: [
      { t2s: [10], five: 10, wins: 2865, matches: 5000 },
      { t2s: [10, 12], five: 12, wins: 10212, matches: 18000 },
      { t2s: [12, 11], five: 11, wins: 1038, matches: 2000 },
    ],
    fiveBeforeUlt: [
      { ability: 10, wins: 4552, matches: 8000 },
      { ability: 12, wins: 2740, matches: 5000 },
      { ability: 11, wins: 1032, matches: 2000 },
    ],
    firstMax: [
      { ability: 10, wins: 5690, matches: 10000 },
      { ability: 13, wins: 5510, matches: 10000 },
      { ability: 12, wins: 5460, matches: 10000 },
      { ability: 11, wins: 1548, matches: 3000 },
    ],
    ultBeforeFive: { wins: 21960, matches: 40000 },
    fiveBeforeUltAny: { wins: 8800, matches: 16000 },
  };
  const path = buildPath(hero);
  const ranks = path.clicks.map((click) => `${click.ability}:${click.rank}`);
  const ultUnlock = path.clicks.findIndex((click) => click.ability === 13 && click.rank === 0);
  assert.equal(ultUnlock, 6);
  assert.equal(
    path.clicks.slice(0, ultUnlock).filter((click) => click.rank === 0).length,
    3,
  );
  assert.ok(path.clicks.findIndex((click) => click.rank === 5) > ultUnlock);
  const firstFive = path.clicks.find((click) => click.rank === 5);
  assert.equal(firstFive?.ability, 10);
  const ultFive = path.clicks.findIndex((click) => click.ability === 13 && click.rank === 5);
  const grenadeFive = path.clicks.findIndex((click) => click.ability === 10 && click.rank === 5);
  assert.ok(grenadeFive < ultFive);
  assert.deepEqual(ranks.slice(0, 9), [
    "10:0",
    "10:1",
    "11:0",
    "11:1",
    "12:0",
    "12:1",
    "13:0",
    "13:1",
    "13:2",
  ]);
  const cost = { 0: 0, 1: 1, 2: 2, 5: 5 } as const;
  const spent = new Map<number, number>();
  const reached = new Map<number, number>();
  for (const click of path.clicks) {
    const prior = reached.get(click.ability) ?? -1;
    const order = [0, 1, 2, 5];
    assert.equal(order.indexOf(click.rank), prior + 1);
    reached.set(click.ability, prior + 1);
    if (click.rank === 5) assert.equal((spent.get(click.ability) ?? 0) + 5, 8);
    spent.set(click.ability, (spent.get(click.ability) ?? 0) + cost[click.rank]);
  }
  const five = path.decisions.find((row) => row.label.startsWith("First 5"));
  assert.equal(five?.separated, false);
  assert.equal(five?.chosen.name.includes("Grenade"), true);
});

test("the ultimate is maxed first when its first-max line is the largest and nothing clears it", () => {
  const hero: HeroOrders = {
    id: 2,
    name: "UltFirst",
    wins: 480,
    matches: 1000,
    abilities: [
      { id: 10, name: "Grenade", slot: 1 },
      { id: 11, name: "Swarm", slot: 2 },
      { id: 12, name: "Armor", slot: 3 },
      { id: 13, name: "Ult", slot: 4 },
    ],
    openUpgrade: [{ ability: 10, wins: 4800, matches: 10000 }],
    prefix3: [{ clicks: [10, 10, 11], wins: 2400, matches: 5000 }],
    beforeFive: [{ t2s: [10, 11], five: 10, wins: 2400, matches: 5000 }],
    fiveBeforeUlt: [{ ability: 10, wins: 2300, matches: 5000 }],
    firstMax: [
      { ability: 13, wins: 4800, matches: 10000 },
      { ability: 10, wins: 2350, matches: 5000 },
    ],
    ultBeforeFive: { wins: 7000, matches: 14000 },
    fiveBeforeUltAny: { wins: 2300, matches: 5000 },
    earlyPoints: {
      spread: { wins: 2000, matches: 4000 },
      rush: [{ ability: 10, wins: 4800, matches: 10000 }],
    },
  };
  const path = buildPath(hero);
  const ultFive = path.clicks.findIndex((click) => click.ability === 13 && click.rank === 5);
  const basicFive = path.clicks.findIndex((click) => click.ability !== 13 && click.rank === 5);
  assert.ok(ultFive >= 0 && basicFive >= 0 && ultFive < basicFive);
  const ultTwo = path.clicks.findIndex((click) => click.ability === 13 && click.rank === 2);
  assert.ok(ultTwo >= 0 && ultTwo < ultFive);
  const five = path.decisions.find((row) => row.label === "First 5-point upgrade");
  assert.equal(five?.chosen.name, "Ult");
  assert.equal(five?.separated, false);
});

test("an early 2-point rank is shown only when no other opening clears it", () => {
  const hero: HeroOrders = {
    id: 1,
    name: "Fixture",
    wins: 550,
    matches: 1000,
    abilities: [
      { id: 10, name: "Grenade", slot: 1 },
      { id: 11, name: "Swarm", slot: 2 },
      { id: 12, name: "Armor", slot: 3 },
      { id: 13, name: "Ult", slot: 4 },
    ],
    openUpgrade: [{ ability: 11, wins: 1600, matches: 3000 }],
    prefix3: [{ clicks: [10, 10, 11], wins: 2760, matches: 5000 }],
    beforeFive: [{ t2s: [10], five: 10, wins: 2865, matches: 5000 }],
    fiveBeforeUlt: [{ ability: 10, wins: 4552, matches: 8000 }],
    firstMax: [
      { ability: 10, wins: 5690, matches: 10000 },
      { ability: 11, wins: 1548, matches: 3000 },
    ],
    ultBeforeFive: { wins: 1100, matches: 2000 },
    fiveBeforeUltAny: { wins: 2800, matches: 5000 },
    earlyPoints: {
      spread: { wins: 5400, matches: 10000 },
      rush: [
        { ability: 10, wins: 5720, matches: 10000 },
        { ability: 11, wins: 5000, matches: 10000 },
      ],
    },
  };
  const path = buildPath(hero);
  const ranks = path.clicks.map((click) => `${click.ability}:${click.rank}`);
  assert.deepEqual(ranks.slice(0, 8), ["10:0", "10:1", "11:0", "11:1", "12:0", "10:2", "13:0", "12:1"]);
  const opening = path.decisions.find((row) => row.label === "First four points");
  assert.equal(opening?.separated, true);
  assert.equal(opening?.chosen.name.includes("Grenade"), true);
});

test("the next 5 is conditional on the ones already maxed", () => {
  const hero: HeroOrders = {
    id: 3,
    name: "Chain",
    wins: 480,
    matches: 1000,
    abilities: [
      { id: 10, name: "Grenade", slot: 1 },
      { id: 11, name: "Swarm", slot: 2 },
      { id: 12, name: "Armor", slot: 3 },
      { id: 13, name: "Ult", slot: 4 },
    ],
    openUpgrade: [{ ability: 10, wins: 4800, matches: 10000 }],
    prefix3: [{ clicks: [10, 10, 11], wins: 2400, matches: 5000 }],
    beforeFive: [],
    fiveBeforeUlt: [],
    firstMax: [
      { ability: 13, wins: 4800, matches: 10000 },
      { ability: 10, wins: 3360, matches: 8000 },
      { ability: 12, wins: 500, matches: 1000 },
    ],
    ultBeforeFive: { wins: 1000, matches: 2000 },
    fiveBeforeUltAny: { wins: 1000, matches: 2000 },
    maxSteps: [
      { prefix: [], ability: 13, wins: 4800, matches: 10000 },
      { prefix: [], ability: 10, wins: 2000, matches: 5000 },
      { prefix: [13], ability: 10, wins: 4200, matches: 10000 },
      { prefix: [13], ability: 12, wins: 2900, matches: 5000 },
      { prefix: [13, 12], ability: 10, wins: 2500, matches: 5000 },
      { prefix: [13, 12], ability: 11, wins: 2000, matches: 4000 },
      { prefix: [13, 12, 10], ability: 11, wins: 2000, matches: 4000 },
    ],
  };
  const path = buildPath(hero);
  const fives = path.clicks.filter((click) => click.rank === 5).map((click) => click.ability);
  assert.deepEqual(fives, [13, 12, 10, 11]);
  const second = path.decisions.find((row) => row.label === "Second 5-point upgrade");
  assert.equal(second?.chosen.name, "Armor");
  assert.equal(second?.separated, true);
  assert.equal(second?.other?.name, "Grenade");
});
