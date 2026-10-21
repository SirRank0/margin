import assert from "node:assert/strict";
import test from "node:test";
import { HEROES } from "./deadlock/heroes.ts";
import { assignNamedTeams, chooseRowHero, findHeroNameRows, indexFace, matchFace, matchHeroName, portraitId, readTeams, type RgbImage } from "./screenshot-teams.ts";

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
    "WY Lay ceist",
    "NW Lay cist",
    "WU Cay ceist",
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
      "Lady Geist",
      "Lady Geist",
      "Lady Geist",
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

test("a pause-screen row keeps the hero line, not the player name", () => {
  const heroes = [
    { id: 63, name: "Mina" },
    { id: 76, name: "Graves" },
    { id: 12, name: "Kelvin" },
    { id: 13, name: "Haze" },
    { id: 86, name: "Violet" },
  ];
  const id = chooseRowHero(
    [
      { text: "Wehzley", luma: 180 },
      { text: "Graves Level -1", luma: 90 },
    ],
    heroes,
  );
  assert.equal(id, 76);
  const tagged = chooseRowHero(
    [
      { text: "Mina", luma: 200 },
      { text: "Graves Level", luma: 80 },
    ],
    heroes,
  );
  assert.equal(tagged, 76);
  const scoreboard = chooseRowHero(
    [
      { text: "Butter", luma: 200 },
      { text: "Violet", luma: 90 },
    ],
    heroes,
  );
  assert.equal(scoreboard, 86);
  const sameWord = chooseRowHero(
    [
      { text: "Haze", luma: 200 },
      { text: "Kelvin", luma: 80 },
    ],
    heroes,
  );
  assert.equal(sameWord, 12);
});

test("a team title does not count as a hero", () => {
  assert.equal(matchHeroName("ArchMother Victorious", HEROES), null);
  assert.equal(matchHeroName("Hidden King", HEROES), null);
  assert.equal(HEROES.find((hero) => hero.id === matchHeroName("C RatKing", HEROES))?.name, "Rat King");
});

test("a team list on the right is found from the row bars, not a fixed side", () => {
  const shot = image(400, 430, () => [6, 6, 8]);
  for (const y0 of [30, 76, 122, 168, 230, 276, 322, 368]) {
    for (let y = y0; y < y0 + 40; y++) {
      for (let x = 280; x < 390; x++) {
        const i = (y * shot.w + x) * 4;
        shot.data[i] = 48;
        shot.data[i + 1] = 50;
        shot.data[i + 2] = 56;
      }
    }
  }
  const rows = findHeroNameRows(shot);
  assert.equal(rows.length, 8);
  assert.ok(rows.every((row) => row.x > shot.w / 2));
});

test("a clear portrait fills a blank name and does not replace a read name", () => {
  const sure = { id: 4, score: 0.91, runner: 0.5, x: 0, y: 0, size: 40 };
  const soft = { id: 4, score: 0.8, runner: 0.55, x: 0, y: 0, size: 40 };
  const fill = { id: 4, score: 0.86, runner: 0.6, x: 0, y: 0, size: 40 };
  const weak = { id: 4, score: 0.6, runner: 0.2, x: 0, y: 0, size: 40 };
  assert.equal(portraitId(sure, 13), 4);
  assert.equal(portraitId(soft, 13), 13);
  assert.equal(portraitId(soft, null), null);
  assert.equal(portraitId(fill, null), 4);
  assert.equal(portraitId(weak, null), null);
  assert.equal(portraitId(null, 13), 13);
});

test("a painted icon matches itself and not the other icon", () => {
  const geist = image(48, 48, (x, y) => [40 + x * 3, 180 - y * 2, 70]);
  const haze = image(48, 48, (x, y) => [20, 40 + y * 4, 220 - x * 3]);
  const faces = [indexFace(4, geist), indexFace(13, haze)].filter((face) => face !== null);
  const hit = matchFace(geist, 0, 0, 48, faces);
  assert.ok(hit);
  assert.equal(hit.id, 4);
  assert.ok(hit.score - hit.runner >= 0.22);
});
