import assert from "node:assert/strict";
import test from "node:test";
import {
  CELL_SIZE,
  MAP_RADIUS,
  MIN_KD_EVENTS,
  cellCenter,
  cellToImage,
  imageToWorld,
  kdOpacity,
  kdRatio,
  parseHeatmap,
  worldToCell,
  worldToImage,
} from "./heatmap.ts";

const fixture = {
  v: 1,
  radius: MAP_RADIUS,
  cell: CELL_SIZE,
  kills: 100,
  deaths: 80,
  cells: [
    [0, 0, 50, 40],
    [1, -2, 50, 40],
  ],
};

test("the map origin sits at the image center, and +Y is toward the top", () => {
  const { px, py } = worldToImage(0, 0, 1024, 1024);
  assert.equal(px, 512);
  assert.equal(py, 512);
  const north = worldToImage(0, 1000, 1024, 1024);
  const south = worldToImage(0, -1000, 1024, 1024);
  assert.ok(north.py < 512, "positive Y should move toward the top of the image");
  assert.ok(south.py > 512, "negative Y should move toward the bottom of the image");
  const east = worldToImage(1000, 0, 1024, 1024);
  assert.ok(east.px > 512);
});

test("a raster cell is projected from its center, matching the official +64 offset", () => {
  assert.equal(cellCenter(0), 64);
  assert.equal(cellCenter(-1), -64);
  const { px, py } = cellToImage(0, 0, 1024, 1024);
  const officialX = ((0 + CELL_SIZE / 2 + MAP_RADIUS) / (2 * MAP_RADIUS)) * 1024;
  const officialY = ((MAP_RADIUS - 0 - CELL_SIZE / 2) / (2 * MAP_RADIUS)) * 1024;
  assert.equal(px, officialX);
  assert.equal(py, officialY);
  // Cell (0, 0) is just east and north of the origin, so slightly right and up.
  assert.ok(px > 512);
  assert.ok(py < 512);
});

test("image and world coordinates round-trip through a cell index", () => {
  const { px, py } = worldToImage(-2000, 4000, 800, 800);
  const world = imageToWorld(px, py, 800, 800);
  assert.ok(Math.abs(world.x + 2000) < 1e-9);
  assert.ok(Math.abs(world.y - 4000) < 1e-9);
  const at = worldToCell(70, -200);
  assert.deepEqual(at, { ix: 0, iy: -2 });
});

test("parseHeatmap reads a compact grid and skips empty cells", () => {
  const grid = parseHeatmap({
    ...fixture,
    cells: [
      ...fixture.cells,
      [3, 3, 0, 0],
    ],
  });
  assert.ok(grid);
  assert.equal(grid.kills, 100);
  assert.equal(grid.deaths, 80);
  assert.equal(grid.cells.length, 2);
  assert.deepEqual(grid.cells[0], { ix: 0, iy: 0, kills: 50, deaths: 40 });
  assert.deepEqual(grid.cells[1], { ix: 1, iy: -2, kills: 50, deaths: 40 });
});

test("parseHeatmap rejects a malformed payload", () => {
  assert.equal(parseHeatmap(null), null);
  assert.equal(parseHeatmap({ v: 2, radius: MAP_RADIUS, cell: CELL_SIZE, kills: 0, deaths: 0, cells: [] }), null);
  assert.equal(parseHeatmap({ v: 1, radius: MAP_RADIUS, cell: CELL_SIZE, kills: 0, deaths: 0, cells: [[0, 0, 1]] }), null);
  assert.equal(parseHeatmap({ v: 1, radius: MAP_RADIUS, cell: CELL_SIZE, kills: -1, deaths: 0, cells: [] }), null);
  assert.equal(parseHeatmap({ v: 1, radius: MAP_RADIUS, cell: CELL_SIZE, kills: 0, deaths: 0, cells: [[0, 0.5, 1, 0]] }), null);
});

test("K/D hides thin samples and fades the rest", () => {
  const thin = { ix: 0, iy: 0, kills: 4, deaths: 3 };
  const enough = { ix: 1, iy: 0, kills: 30, deaths: 10 };
  const richer = { ix: 2, iy: 0, kills: 300, deaths: 100 };
  assert.equal(kdRatio(thin), null);
  assert.equal(kdRatio(enough), 3);
  assert.equal(kdRatio({ ix: 0, iy: 0, kills: MIN_KD_EVENTS, deaths: 0 }), Number.POSITIVE_INFINITY);
  assert.equal(kdOpacity(thin, 400), 0);
  const dim = kdOpacity(enough, 400);
  const bright = kdOpacity(richer, 400);
  assert.ok(dim > 0 && dim < bright);
  assert.ok(bright <= 1);
});
