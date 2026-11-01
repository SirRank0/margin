import assert from "node:assert/strict";
import test from "node:test";
import { encodeHeroBuild, readHeroBuild } from "./build-codec.ts";

test("a hero build round-trips the shop columns and the ability order", () => {
  const clicks = [
    { ability: 2206337006, rank: 0 as const },
    { ability: 2206337006, rank: 1 as const },
    { ability: 1656913918, rank: 2 as const },
    { ability: 2702908623, rank: 5 as const },
  ];
  const encoded = encodeHeroBuild({
    heroId: 25,
    name: "  Flask first  ",
    columns: [
      { name: "Weapon", itemIds: [3776945997] },
      { name: "Vitality", itemIds: [] },
      { name: "Spirit", itemIds: [968099481, 2462046703] },
    ],
    clicks,
  });
  const read = readHeroBuild(encoded);
  assert.equal(read.heroId, 25);
  assert.equal(read.name, "Flask first");
  assert.deepEqual(
    read.columns.map((column) => column.name),
    ["Weapon", "Vitality", "Spirit"],
  );
  assert.deepEqual(read.columns[0]?.itemIds, [3776945997]);
  assert.deepEqual(read.columns[1]?.itemIds, []);
  assert.deepEqual(read.columns[2]?.itemIds, [968099481, 2462046703]);
  assert.equal(read.columns[0]?.width, 300);
  assert.ok((read.columns[2]?.height ?? 0) > (read.columns[1]?.height ?? 0));
  assert.deepEqual(read.clicks, clicks);
});
