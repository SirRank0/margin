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

test("the first 5 is the ability that beats buying the ultimate package first", () => {
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
  assert.deepEqual(ranks.slice(0, 9), [
    "10:0",
    "10:1",
    "11:0",
    "11:1",
    "12:0",
    "12:1",
    "13:0",
    "10:2",
    "10:5",
  ]);
  const ultUnlock = path.clicks.findIndex((click) => click.ability === 13 && click.rank === 0);
  assert.equal(ultUnlock, 6);
  assert.equal(
    path.clicks.slice(0, ultUnlock).filter((click) => click.rank === 0).length,
    3,
  );
  assert.ok(path.clicks.findIndex((click) => click.rank === 5) > ultUnlock);
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
