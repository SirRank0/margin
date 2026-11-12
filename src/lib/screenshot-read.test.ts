import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { HEROES } from "./deadlock/heroes.ts";
import { readPng } from "./fixtures/read-png.ts";
import { decide, type SlotMatch } from "./portrait-match.ts";
import {
  loadRefBank,
  readList,
  readScreenshot,
  readTopBar,
  settleDuplicates,
  sureTeams,
  type RgbImage,
  type ScreenRead,
  type SlotRead,
} from "./screenshot-read.ts";

// Fixtures are crops of real screenshots: only the portraits, with player names pixelated away.
// Each crop is put back on a blank screen of the original size, at its original place.
function screen(
  file: string,
  w: number,
  h: number,
  x: number,
  y: number,
): RgbImage {
  const crop = readPng(
    fileURLToPath(new URL(`./fixtures/${file}`, import.meta.url)),
  );
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = 12;
    data[i * 4 + 1] = 12;
    data[i * 4 + 2] = 14;
    data[i * 4 + 3] = 255;
  }
  for (let row = 0; row < crop.h; row++) {
    data.set(
      crop.data.subarray(row * crop.w * 4, (row + 1) * crop.w * 4),
      ((y + row) * w + x) * 4,
    );
  }
  return { w, h, data };
}

const id = (name: string) => {
  const hero = HEROES.find((h) => h.name === name);
  assert.ok(hero, name);
  return hero.id;
};
const ids = (names: string[]) => names.map(id);
const nameOf = (hero: number | null) =>
  HEROES.find((h) => h.id === hero)?.name ?? String(hero);
const bank = loadRefBank(HEROES.map((hero) => hero.id));

function seats(read: ScreenRead | null, side: SlotRead["side"]) {
  assert.ok(read);
  return read.slots
    .filter((slot) => slot.side === side)
    .sort((a, b) => a.seat - b.seat);
}

// Name rows as the text finder reported them on the full screenshots: [x, top of text].
const scoreboardRows = [
  [419, 108],
  [265, 144],
  [223, 200],
  [265, 256],
  [264, 312],
  [223, 423],
  [265, 587],
  [223, 627],
  [265, 684],
  [223, 742],
  [264, 796],
  [265, 867],
];
const pauseRows = [
  173, 232, 301, 351, 415, 471, 572, 635, 694, 751, 813, 873,
].flatMap((anchor) => [
  [1518, anchor],
  [1518, anchor],
]);

test("scoreboard portraits give both full teams, with the lit row's team as yours", () => {
  const shot = screen("scoreboard-portraits.png", 1920, 1080, 170, 100);
  const read = readList(
    shot,
    bank,
    scoreboardRows.map(([x, anchor]) => ({ x, anchor })),
  );
  assert.equal(read?.layout, "list");
  assert.ok(
    read.slots.every((slot) => slot.state === "sure"),
    read.slots.map((s) => `${nameOf(s.id)} ${s.state}`).join(", "),
  );
  const teams = sureTeams(read);
  assert.deepEqual(
    teams.yours,
    ids(["Vindicta", "Dynamo", "Lady Geist", "Viscous", "Drifter", "Silver"]),
  );
  assert.deepEqual(
    teams.theirs,
    ids(["Abrams", "Kelvin", "Mina", "Wraith", "Yamato", "Rem"]),
  );
});

test("pause-screen portraits give both full teams, with the top list as yours", () => {
  const shot = screen("pause-portraits.png", 1920, 1080, 1490, 150);
  const read = readList(
    shot,
    bank,
    pauseRows.map(([x, anchor]) => ({ x, anchor })),
  );
  assert.equal(read?.layout, "list");
  assert.ok(
    read.slots.every((slot) => slot.state === "sure"),
    read.slots.map((s) => `${nameOf(s.id)} ${s.state}`).join(", "),
  );
  const teams = sureTeams(read);
  assert.deepEqual(
    teams.yours,
    ids(["Mina", "Graves", "Sinclair", "Silver", "Ivy", "Venator"]),
  );
  assert.deepEqual(
    teams.theirs,
    ids(["Wraith", "Vyper", "Shiv", "Lash", "Abrams", "Rem"]),
  );
});

test("the in-game top bar is read at 720p, your team on the left", () => {
  const shot = screen("hud-12-top-bar.png", 1280, 720, 200, 0);
  const read = readScreenshot(shot, bank);
  assert.equal(read?.layout, "top-bar");
  const yours = seats(read, "yours");
  const theirs = seats(read, "theirs");
  assert.equal(yours.length, 6);
  assert.equal(theirs.length, 6);
  assert.deepEqual(
    yours.map((s) => (s.state === "sure" ? s.id : null)),
    ids(["Graves", "Pocket", "Silver", "Abrams", "Venator", "Wraith"]),
  );
  assert.deepEqual(
    theirs.map((s) => (s.state === "sure" ? s.id : null)),
    ids(["Paradox", "Seven", "Mirage", "Celeste", "Haze", "Shiv"]),
  );
});

test("a player who never loaded in leaves one empty seat, and the other eleven still read", () => {
  const shot = screen("hud-11-top-bar.png", 1280, 720, 200, 0);
  const read = readScreenshot(shot, bank);
  assert.equal(read?.layout, "top-bar");
  const yours = seats(read, "yours");
  const theirs = seats(read, "theirs");
  assert.equal(yours.length + theirs.length, 12);
  const missing = read.slots.filter((slot) => slot.state === "missing");
  assert.equal(missing.length, 1);
  assert.equal(missing[0].side, "theirs");
  assert.equal(missing[0].seat, 6);
  // Seats that are named must be right. Skinned, greyed-out, or covered pictures may be left for a pick.
  const expected: Record<string, string> = {
    "yours 2": "Pocket",
    "yours 3": "Haze",
    "yours 5": "Venator",
    "yours 6": "Vindicta",
    "theirs 1": "Silver",
    "theirs 2": "The Doorman",
    "theirs 3": "Shiv",
    "theirs 4": "Rem",
    "theirs 5": "Infernus",
  };
  for (const slot of read.slots) {
    if (slot.state !== "sure") continue;
    assert.equal(
      nameOf(slot.id),
      expected[`${slot.side} ${slot.seat}`],
      `${slot.side} ${slot.seat}`,
    );
  }
  assert.ok(read.slots.filter((slot) => slot.state === "sure").length >= 7);
  // The paused Rem is not named outright, but is offered first.
  const rem = theirs[3];
  assert.equal(rem.state, "unsure");
  assert.equal(rem.choices[0], id("Rem"));
});

test("a picture that matches no hero well is marked unsure, not guessed", () => {
  const shot = screen("hud-12-top-bar.png", 1280, 720, 200, 0);
  // Paint over the third seat's portrait, as an unrecognizable skin would look.
  for (let y = 0; y < 58; y++) {
    for (let x = 345; x < 395; x++) {
      const i = (y * shot.w + x) * 4;
      const stripe = ((x >> 2) + (y >> 2)) % 2 ? 200 : 60;
      shot.data[i] = stripe;
      shot.data[i + 1] = 120;
      shot.data[i + 2] = 255 - stripe;
    }
  }
  const read = readTopBar(shot, bank);
  const yours = seats(read, "yours");
  assert.equal(yours[2].state, "unsure");
  assert.equal(yours[0].state, "sure");
  assert.equal(yours[4].id, id("Venator"));
});

test("a slot needs a close match and a clear lead to be named", () => {
  const match = (score: number, runner: number): SlotMatch => ({
    id: 1,
    score,
    runnerId: 2,
    runner,
    ranked: [
      { id: 1, score },
      { id: 2, score: runner },
    ],
  });
  assert.equal(decide(match(0.92, 0.6)).sure, true);
  assert.equal(decide(match(0.92, 0.86)).sure, false);
  assert.equal(decide(match(0.6, 0.2)).sure, false);
  assert.equal(decide(null).sure, false);
});

test("two seats claiming one hero leave only the stronger one named", () => {
  const slot = (seat: number, score: number): SlotRead => ({
    side: "yours",
    seat,
    state: "sure",
    id: 7,
    choices: [7],
    score,
    lead: 0.2,
  });
  const settled = settleDuplicates([slot(1, 0.9), slot(2, 0.8)]);
  assert.deepEqual(
    settled.map((s) => s.state),
    ["sure", "unsure"],
  );
});
