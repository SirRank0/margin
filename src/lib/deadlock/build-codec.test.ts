import assert from "node:assert/strict";
import test from "node:test";
import { encodeHeroBuild, readHeroBuild, readPublicBuild } from "./build-codec.ts";

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

test("category notes, item annotations, and ability notes survive a round trip", () => {
  const encoded = encodeHeroBuild({
    heroId: 15,
    name: "Gunbop",
    description: "Max 2 first",
    tags: [0, 4],
    columns: [
      {
        name: "Early",
        description: "Lane",
        optional: false,
        width: 1100,
        height: 140,
        mods: [
          { id: 1254091416, annotation: "Versus Vindicta", sellPriority: 2 },
          { id: 3696726732, flexSlots: 1, imbueTarget: 1928108461 },
        ],
      },
      { name: "Flex", description: "", optional: true, mods: [] },
    ],
    clicks: [{ ability: 1928108461, rank: 0, annotation: "Start here" }],
  });
  const read = readHeroBuild(encoded);
  assert.equal(read.description, "Max 2 first");
  assert.deepEqual(read.tags, [4]);
  assert.equal(read.columns[0]?.description, "Lane");
  assert.equal(read.columns[0]?.optional, false);
  assert.equal(read.columns[0]?.width, 1100);
  assert.equal(read.columns[0]?.mods[0]?.annotation, "Versus Vindicta");
  assert.equal(read.columns[0]?.mods[0]?.sellPriority, 2);
  assert.equal(read.columns[0]?.mods[1]?.flexSlots, 1);
  assert.equal(read.columns[0]?.mods[1]?.imbueTarget, 1928108461);
  assert.equal(read.columns[1]?.optional, true);
  assert.deepEqual(read.clicks, [{ ability: 1928108461, rank: 0, annotation: "Start here" }]);
});

test("a public build payload becomes the same canvas", () => {
  const read = readPublicBuild({
    hero_id: 15,
    name: "KING OF FIRE RATE",
    description: "Ultra GunBop",
    tags: [0, 0, 3],
    details: {
      mod_categories: [
        {
          name: "Early",
          description: "Core Items on Start",
          width: 1081,
          height: 147,
          mods: [{ ability_id: 1254091416, annotation: "Versus Vindicta\n", sell_priority: null }],
        },
      ],
      ability_order: {
        currency_changes: [
          { ability_id: 1928108461, currency_type: 2, delta: -1, annotation: null },
          { ability_id: 2521902222, currency_type: 1, delta: -5, annotation: "Max this" },
        ],
      },
    },
  });
  assert.equal(read.heroId, 15);
  assert.equal(read.columns[0]?.mods[0]?.annotation, "Versus Vindicta");
  assert.deepEqual(read.tags, [3]);
  assert.deepEqual(read.clicks, [
    { ability: 1928108461, rank: 0 },
    { ability: 2521902222, rank: 5, annotation: "Max this" },
  ]);
});
