import assert from "node:assert/strict";
import test from "node:test";
import { HEROES } from "./deadlock/heroes.ts";
import { assignNamedTeams, matchHeroName, readTeams, type RgbImage } from "./screenshot-teams.ts";

function image(w: number, h: number, paint: (x: number, y: number) => [number, number, number]): RgbImage {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = paint(x, y);
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { w, h, data };
}

function mosaic(colors: [number, number, number][]): RgbImage {
  return image(32, 32, (x, y) => colors[(y < 16 ? 0 : 2) + (x < 16 ? 0 : 1)]);
}

function paste(dest: RgbImage, src: RgbImage, atX: number, atY: number) {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const from = (y * src.w + x) * 4;
      const to = ((atY + y) * dest.w + atX + x) * 4;
      dest.data[to] = src.data[from];
      dest.data[to + 1] = src.data[from + 1];
      dest.data[to + 2] = src.data[from + 2];
      dest.data[to + 3] = 255;
    }
  }
}

const icons = [
  { id: 1, image: mosaic([[220, 40, 40], [40, 40, 220], [220, 40, 40], [40, 40, 220]]) },
  { id: 2, image: mosaic([[40, 200, 60], [240, 220, 40], [40, 180, 200], [240, 80, 20]]) },
  { id: 3, image: mosaic([[180, 40, 180], [250, 250, 250], [20, 20, 20], [180, 40, 180]]) },
  { id: 4, image: mosaic([[240, 140, 20], [20, 80, 160], [20, 80, 160], [240, 140, 20]]) },
];

test("a left group and a right group become the two sides", () => {
  const shot = image(400, 140, () => [8, 8, 10]);
  paste(shot, icons[0].image, 24, 50);
  paste(shot, icons[1].image, 80, 50);
  paste(shot, icons[2].image, 260, 50);
  paste(shot, icons[3].image, 320, 50);
  const read = readTeams(shot, icons);
  assert.deepEqual(read.yours, [1, 2]);
  assert.deepEqual(read.theirs, [3, 4]);
});

test("a top group and a bottom group split on the wider gap", () => {
  const shot = image(160, 400, () => [8, 8, 10]);
  paste(shot, icons[0].image, 40, 24);
  paste(shot, icons[1].image, 90, 24);
  paste(shot, icons[2].image, 40, 300);
  paste(shot, icons[3].image, 90, 300);
  const read = readTeams(shot, icons);
  assert.deepEqual(read.yours, [1, 2]);
  assert.deepEqual(read.theirs, [3, 4]);
});

test("scoreboard text maps to the hero, including a one-letter miss", () => {
  const lines = [
    "4 Violet (A",
    "IRS Lady Geist |}",
    "Ry Haze El",
    "8 Holliday (hl",
    "&g<3 Rat King ses",
    "by oraves",
    "Celeste (A 0",
    "ce Paige sll",
    "W  Venator",
    "@' Deadman Danny (A",
    "ey Kelvin Ll LL",
    "Billy ses",
  ];
  const ids = lines.map((line) => matchHeroName(line, HEROES));
  assert.deepEqual(
    ids.map((id) => HEROES.find((hero) => hero.id === id)?.name),
    [
      "Violet",
      "Lady Geist",
      "Haze",
      "Holliday",
      "Rat King",
      "Graves",
      "Celeste",
      "Paige",
      "Venator",
      "Deadman Danny",
      "Kelvin",
      "Billy",
    ],
  );
});

test("the highlighted scoreboard team is yours", () => {
  const rows = [
    { id: 86, anchor: 100, luma: 40 },
    { id: 76, anchor: 160, luma: 36 },
    { id: 81, anchor: 400, luma: 42 },
    { id: 65, anchor: 460, luma: 90 },
  ];
  const teams = assignNamedTeams(rows);
  assert.deepEqual(teams.yours, [81, 65]);
  assert.deepEqual(teams.theirs, [86, 76]);
});
