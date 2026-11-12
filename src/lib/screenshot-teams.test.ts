import assert from "node:assert/strict";
import test from "node:test";
import { HEROES } from "./deadlock/heroes.ts";
import { assignNamedTeams, chooseRowHero, findHeroNameRows, matchHeroName, type RgbImage } from "./screenshot-teams.ts";

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

test("Doorman matches The Doorman, including a dropped leading The", () => {
  const id = HEROES.find((hero) => hero.name === "The Doorman")?.id;
  assert.equal(id, 69);
  for (const line of ["The Doorman", "Doorman", "the doorman", "Doorman Level", "Doorman (A", "he Doorman", "T Doorman"]) {
    assert.equal(matchHeroName(line, HEROES), 69, line);
  }
});

