/**
 * Read both lineups from a Deadlock screenshot by the hero pictures alone.
 *
 * Two layouts are understood:
 * - the in-game top bar: twelve round portraits over orange and blue number plates, your team on the left;
 * - a team list: the post-match scoreboard or the pause-screen player list, one portrait per row.
 *
 * Every slot is compared against each hero's own art. A slot is named only when the closest hero is
 * close and clearly ahead of the next one; otherwise it is marked unsure so the player can pick.
 * A top-bar seat with no plate and no picture (someone who never loaded in) is reported as missing.
 */

import { PORTRAIT_GRIDS, PORTRAIT_REFS } from "../data/portrait-refs.ts";
import {
  decide,
  matchSlot,
  refFromGrid,
  SURE_MARGIN,
  SURE_SCORE,
  type PortraitRef,
  type RgbImage,
  type SlotFrame,
  type SlotMatch,
} from "./portrait-match.ts";

export type { RgbImage } from "./portrait-match.ts";

export type Side = "yours" | "theirs";

export type SlotRead = {
  side: Side;
  /** Seat number on that side, from 1, in screen order. */
  seat: number;
  state: "sure" | "unsure" | "missing";
  /** The closest hero. Only trusted when `state` is "sure". */
  id: number | null;
  /** Closest heroes first, for a manual pick. */
  choices: number[];
  score: number;
  lead: number;
  /** Middle of the portrait, top to bottom, in screenshot pixels. Lets a list row be matched to its printed name. */
  y?: number;
};

export type ScreenRead = { layout: "top-bar" | "list"; slots: SlotRead[] };

/** The two art styles, each at a coarse grid for searching and a fine grid for deciding. */
export type RefBank = Record<
  "icon" | "card" | "bar" | "mini",
  { coarse: PortraitRef[]; fine: PortraitRef[] }
>;

/** Name rows from a team list, as found by `findHeroNameRows`. */
export type ListRow = { x: number; anchor: number };

const CARD_ASPECT = 380 / 280;

export function loadRefBank(heroIds?: Iterable<number>): RefBank {
  const keep = heroIds ? new Set(heroIds) : null;
  const bank: RefBank = {
    icon: { coarse: [], fine: [] },
    card: { coarse: [], fine: [] },
    bar: { coarse: [], fine: [] },
    mini: { coarse: [], fine: [] },
  };
  for (const [key, entry] of Object.entries(PORTRAIT_REFS)) {
    const id = Number(key);
    if (keep && !keep.has(id)) continue;
    for (const style of ["icon", "card", "bar", "mini"] as const) {
      const pair = entry[style];
      if (!pair) continue;
      const grids = PORTRAIT_GRIDS[style];
      const coarse = refFromGrid(
        id,
        grids.coarse[0],
        grids.coarse[1],
        decode(pair[0]),
      );
      const fine = refFromGrid(
        id,
        grids.fine[0],
        grids.fine[1],
        decode(pair[1]),
      );
      if (coarse && fine) {
        bank[style].coarse.push(coarse);
        bank[style].fine.push(fine);
      }
    }
  }
  return bank;
}

function decode(base64: string): Uint8Array {
  const text = atob(base64);
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i);
  return out;
}

export function readScreenshot(
  shot: RgbImage,
  bank: RefBank,
  rows: ListRow[] = [],
): ScreenRead | null {
  return readTopBar(shot, bank) ?? readList(shot, bank, rows);
}

/* ---------- in-game top bar ---------- */

type Team = "orange" | "blue";
type Plate = { x0: number; x1: number; y0: number; y1: number; team: Team };

function hsv(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max / 255;
  const s = max === 0 ? 0 : (max - min) / max;
  let h = 0;
  if (max !== min) {
    if (max === r) h = (60 * ((g - b) / (max - min)) + 360) % 360;
    else if (max === g) h = 60 * ((b - r) / (max - min)) + 120;
    else h = 60 * ((r - g) / (max - min)) + 240;
  }
  return { h, s, v };
}

function plateTeam(r: number, g: number, b: number): Team | null {
  const { h, s, v } = hsv(r, g, b);
  if (v < 0.55) return null;
  if (h >= 20 && h <= 48 && s > 0.6) return "orange";
  if (h >= 200 && h <= 240 && s > 0.28) return "blue";
  return null;
}

/** Number plates sit in one line near the top: short orange or blue bars, evenly spaced. */
export function findPlates(shot: RgbImage): Plate[] {
  const band = Math.round(shot.h * 0.22);
  const minW = shot.h * 0.02;
  const maxW = shot.h * 0.055;
  let bestY = -1;
  let bestRuns: Plate[] = [];
  for (let y = 0; y < band; y++) {
    const runs: Plate[] = [];
    let start = -1;
    let team: Team | null = null;
    for (let x = 0; x <= shot.w; x++) {
      const i = (y * shot.w + x) * 4;
      const t =
        x < shot.w
          ? plateTeam(shot.data[i], shot.data[i + 1], shot.data[i + 2])
          : null;
      if (t !== team) {
        if (team && x - start >= minW && x - start <= maxW)
          runs.push({ x0: start, x1: x, y0: y, y1: y + 1, team });
        start = x;
        team = t;
      }
    }
    if (runs.length > bestRuns.length) {
      bestRuns = runs;
      bestY = y;
    }
  }
  if (bestRuns.length < 6 || bestY < 0) return [];
  return bestRuns.map((run) => {
    const x = Math.round((run.x0 + run.x1) / 2);
    let y0 = bestY;
    let y1 = bestY + 1;
    const same = (y: number) => {
      let hits = 0;
      for (let dx = -3; dx <= 3; dx++) {
        const i = (y * shot.w + (run.x0 + 2 + dx * 0)) * 4;
        const j = (y * shot.w + x + dx) * 4;
        if (
          plateTeam(shot.data[i], shot.data[i + 1], shot.data[i + 2]) ===
          run.team
        )
          hits++;
        if (
          plateTeam(shot.data[j], shot.data[j + 1], shot.data[j + 2]) ===
          run.team
        )
          hits++;
      }
      return hits >= 4;
    };
    while (y0 > 0 && same(y0 - 1)) y0--;
    while (y1 < shot.h && same(y1)) y1++;
    return { ...run, y0, y1 };
  });
}

export function readTopBar(shot: RgbImage, bank: RefBank): ScreenRead | null {
  const plates = findPlates(shot);
  const mid = shot.w / 2;
  const left = plates
    .filter((p) => (p.x0 + p.x1) / 2 < mid)
    .sort((a, b) => a.x0 - b.x0);
  const right = plates
    .filter((p) => (p.x0 + p.x1) / 2 >= mid)
    .sort((a, b) => a.x0 - b.x0);
  if (left.length < 3 || right.length < 3 || left.length + right.length < 8)
    return null;
  const gaps = [...spacing(left), ...spacing(right)].sort((a, b) => a - b);
  const pitch = gaps[Math.floor(gaps.length / 2)];
  if (!pitch || pitch < shot.h * 0.04) return null;
  const centers = (list: Plate[]) => list.map((p) => (p.x0 + p.x1) / 2);
  const leftSeats = seats(centers(left), centers(right), pitch, mid, "left");
  const rightSeats = seats(centers(right), centers(left), pitch, mid, "right");
  const plateTop = median([...left, ...right].map((p) => p.y0));
  const plateBottom = median([...left, ...right].map((p) => p.y1));
  const plateW = median([...left, ...right].map((p) => p.x1 - p.x0));
  const sides: [Side, number[], Plate[]][] = [
    ["yours", leftSeats, left],
    ["theirs", rightSeats, right],
  ];
  // The bar shows the hero card art; the tall top-bar art is a second look, and each hero keeps its better score.
  const cardW = pitch * 0.78;
  const cardH = cardW * CARD_ASPECT;
  const cardTop = plateBottom - pitch * 1.33;
  const cardFloor = (plateBottom - pitch * 0.3 - cardTop) / cardH;
  const barW = pitch * 0.57;
  const barH = (barW * 5) / 3;
  const barTop = plateBottom - pitch * 1.27;
  const barFloor = (plateBottom - pitch * 0.3 - barTop) / barH;
  type Seat =
    | {
        side: Side;
        seat: number;
        card: SlotFrame;
        bar: SlotFrame;
        firstCard: SlotMatch | null;
        firstBar: SlotMatch | null;
      }
    | { side: Side; seat: number; missing: true };
  const wide = {
    shiftX: 0.12,
    shiftY: 0.16,
    steps: 3,
    scales: [0.9, 0.97, 1.04, 1.12],
    refine: 6,
  };
  const tight = {
    shiftX: 0.04,
    shiftY: 0.05,
    steps: 2,
    scales: [0.97, 1, 1.03],
    refine: 6,
  };
  const seatList: Seat[] = [];
  for (const [side, xs, found] of sides) {
    const team = found[0].team;
    xs.forEach((cx, index) => {
      const seat = index + 1;
      const hasPlate =
        found.some((p) => Math.abs((p.x0 + p.x1) / 2 - cx) < pitch * 0.3) ||
        dimPlate(shot, cx, plateW, plateTop, plateBottom, team);
      if (!hasPlate) {
        seatList.push({ side, seat, missing: true });
        return;
      }
      const card: SlotFrame = {
        x: cx - cardW / 2,
        y: cardTop,
        w: cardW,
        h: cardH,
        visible: (u, v) => u > 0.1 && u < 0.9 && v < cardFloor,
      };
      const bar: SlotFrame = {
        x: cx - barW / 2,
        y: barTop,
        w: barW,
        h: barH,
        visible: (u, v) => u > 0.08 && u < 0.92 && v < barFloor,
      };
      seatList.push({
        side,
        seat,
        card,
        bar,
        firstCard: matchSlot(shot, card, bank.card.fine, wide),
        firstBar: matchSlot(shot, bar, bank.bar.fine, wide),
      });
    });
  }
  // Every seat on the bar has the same size and height, so the clear ones show where to look.
  const filled = seatList.filter(
    (seat): seat is Extract<Seat, { card: SlotFrame }> => !("missing" in seat),
  );
  const cardPlace = placement(
    filled.map((seat) => ({ frame: seat.card, match: seat.firstCard })),
  );
  const barPlace = placement(
    filled.map((seat) => ({ frame: seat.bar, match: seat.firstBar })),
  );
  const slots: SlotRead[] = seatList.map((seat) => {
    if ("missing" in seat)
      return {
        side: seat.side,
        seat: seat.seat,
        state: "missing",
        id: null,
        choices: [],
        score: 0,
        lead: 0,
      };
    const card = cardPlace
      ? matchSlot(shot, shiftFrame(seat.card, cardPlace), bank.card.fine, tight)
      : seat.firstCard;
    const bar = barPlace
      ? matchSlot(shot, shiftFrame(seat.bar, barPlace), bank.bar.fine, tight)
      : seat.firstBar;
    return toSlot(seat.side, seat.seat, mergeMatches(card, bar));
  });
  return { layout: "top-bar", slots: settleDuplicates(slots) };
}

function spacing(list: Plate[]) {
  const out: number[] = [];
  for (let i = 1; i < list.length; i++)
    out.push(
      (list[i].x0 + list[i].x1) / 2 - (list[i - 1].x0 + list[i - 1].x1) / 2,
    );
  return out;
}

/**
 * Six seat centers for one side. When the other side shows all six, the bar is mirrored around the
 * middle of the screen, so a seat with nobody in it still has a place. Otherwise seats run outward
 * from the plate nearest the middle.
 */
function seats(
  own: number[],
  other: number[],
  pitch: number,
  mid: number,
  where: "left" | "right",
): number[] {
  const mirrored =
    other.length === 6
      ? other.map((x) => 2 * mid - x).sort((a, b) => a - b)
      : null;
  if (
    mirrored &&
    own.every((x) => mirrored.some((m) => Math.abs(m - x) < pitch * 0.3))
  )
    return mirrored;
  if (own.length === 6) return own;
  const inner = where === "left" ? Math.max(...own) : Math.min(...own);
  const step = where === "left" ? -pitch : pitch;
  const out = Array.from({ length: 6 }, (_, k) => inner + k * step);
  return out.sort((a, b) => a - b);
}

/** A greyed-out seat (dead or disconnected) still has a dull plate in the team's color. */
function dimPlate(
  shot: RgbImage,
  cx: number,
  w: number,
  y0: number,
  y1: number,
  team: Team,
) {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (
    let y = Math.round(y0 + (y1 - y0) * 0.1);
    y < y1 - (y1 - y0) * 0.1;
    y++
  ) {
    for (let x = Math.round(cx - w * 0.4); x < cx + w * 0.4; x++) {
      if (x < 0 || x >= shot.w || y < 0 || y >= shot.h) continue;
      const i = (y * shot.w + x) * 4;
      r += shot.data[i];
      g += shot.data[i + 1];
      b += shot.data[i + 2];
      n++;
    }
  }
  if (n === 0) return false;
  const { h, s, v } = hsv(r / n, g / n, b / n);
  if (v < 0.22 || s < 0.3) return false;
  return team === "orange" ? h >= 15 && h <= 50 : h >= 195 && h <= 245;
}

/* ---------- scoreboard and pause list ---------- */

type ListStyle = "icon" | "card";

function listFrame(
  style: ListStyle,
  cx: number,
  cy: number,
  pitch: number,
): SlotFrame {
  if (style === "icon") {
    const size = pitch * 0.8;
    return {
      x: cx - size / 2,
      y: cy - size / 2,
      w: size,
      h: size,
      visible: (u, v) => (u - 0.5) ** 2 + (v - 0.5) ** 2 < 0.25,
    };
  }
  const w = pitch * 0.63;
  const h = w * CARD_ASPECT;
  const vc = (w * 0.84) / h;
  const rv = (w * 0.52) / h;
  return {
    x: cx - w / 2,
    y: cy - w * 0.84,
    w,
    h,
    visible: (u, v) => ((u - 0.5) / 0.52) ** 2 + ((v - vc) / rv) ** 2 < 1,
  };
}

function listBarFrame(cx: number, cy: number, pitch: number): SlotFrame {
  const w = pitch * 0.47;
  const h = (w * 5) / 3;
  const vc = w / h;
  const r = pitch * 0.34;
  return {
    x: cx - w / 2,
    y: cy - w,
    w,
    h,
    visible: (u, v) =>
      (((u - 0.5) * w) / r) ** 2 + (((v - vc) * h) / r) ** 2 < 1,
  };
}

type Placement = { scale: number; dx: number; dy: number };

/** Median offset and size of the confident matches, as shares of the frame width. */
function placement(
  found: { frame: SlotFrame; match: SlotMatch | null }[],
): Placement | null {
  const sure = found.filter(
    (f) =>
      f.match?.pose &&
      f.match.score >= 0.82 &&
      f.match.score - f.match.runner >= 0.1,
  );
  if (sure.length < 3) return null;
  const scale = median(sure.map((f) => f.match!.pose!.w / f.frame.w));
  const dx = median(
    sure.map(
      (f) =>
        (f.match!.pose!.x +
          f.match!.pose!.w / 2 -
          (f.frame.x + f.frame.w / 2)) /
        f.frame.w,
    ),
  );
  const dy = median(
    sure.map(
      (f) =>
        (f.match!.pose!.y +
          f.match!.pose!.h / 2 -
          (f.frame.y + f.frame.h / 2)) /
        f.frame.w,
    ),
  );
  return { scale, dx, dy };
}

function shiftFrame(frame: SlotFrame, place: Placement): SlotFrame {
  const w = frame.w * place.scale;
  const h = frame.h * place.scale;
  const cx = frame.x + frame.w / 2 + place.dx * frame.w;
  const cy = frame.y + frame.h / 2 + place.dy * frame.w;
  return { ...frame, x: cx - w / 2, y: cy - h / 2, w, h };
}

/** Six evenly spaced rows that best fit the name rows of one team. */
function fitRows(anchors: number[], pitch: number): number[] {
  let best = Infinity;
  let start = anchors[0] ?? 0;
  for (const anchor of anchors) {
    for (let k = 0; k < 6; k++) {
      const y0 = anchor - k * pitch;
      let cost = 0;
      for (const other of anchors) {
        let d = Infinity;
        for (let j = 0; j < 6; j++)
          d = Math.min(d, Math.abs(other - (y0 + j * pitch)));
        cost += Math.min(d, pitch / 2);
      }
      if (cost < best - 1e-6) {
        best = cost;
        start = y0;
      }
    }
  }
  return Array.from({ length: 6 }, (_, k) => start + k * pitch);
}

export function readList(
  shot: RgbImage,
  bank: RefBank,
  rows: ListRow[],
): ScreenRead | null {
  const anchors = [...new Set(rows.map((row) => row.anchor))].sort(
    (a, b) => a - b,
  );
  if (anchors.length < 6) return null;
  const pitch = median(
    anchors
      .slice(1)
      .map((a, i) => a - anchors[i])
      .filter((gap) => gap > 0),
  );
  if (!pitch || pitch < shot.h * 0.025) return null;
  let cut = 1;
  let widest = -1;
  for (let i = 1; i < anchors.length; i++) {
    if (anchors[i] - anchors[i - 1] > widest) {
      widest = anchors[i] - anchors[i - 1];
      cut = i;
    }
  }
  const groups =
    widest > pitch * 1.5
      ? [anchors.slice(0, cut), anchors.slice(cut)]
      : [anchors];
  const lines = groups.map((group) => fitRows(group, pitch));
  const ys = lines.flat();
  const xs = rows.map((row) => row.x);
  const medX = median(xs);
  const x0 = Math.max(0, Math.min(...xs) - pitch * 2);
  const x1 = Math.min(
    shot.w,
    Math.max(...xs.filter((x) => x <= medX)) + pitch * 0.3,
  );

  let column: {
    rank: number;
    style: ListStyle;
    x: number;
    yOff: number;
  } | null = null;
  for (const style of ["icon", "card"] as const) {
    const refs = bank[style].coarse;
    if (refs.length === 0) continue;
    for (const yOff of [0, 0.25].map((f) => f * pitch)) {
      for (let x = x0; x <= x1; x += pitch * 0.15) {
        let sum = 0;
        const ids = new Set<number>();
        for (const y of ys) {
          const hit = matchSlot(
            shot,
            listFrame(style, x, y + yOff, pitch),
            refs,
            { shiftX: 0.15, shiftY: 0.3, steps: 1, scales: [1], refine: 0 },
          );
          if (!hit) continue;
          sum += hit.score;
          ids.add(hit.id);
        }
        const rank = sum * (0.35 + (0.65 * ids.size) / ys.length);
        if (!column || rank > column.rank) column = { rank, style, x, yOff };
      }
    }
  }
  if (!column) return null;
  const chosen = column;
  const lumas = ys.map((y) =>
    rowLuma(
      shot,
      chosen.x + pitch * 0.6,
      chosen.x + pitch * 4,
      y + chosen.yOff,
      pitch,
    ),
  );
  const sorted = [...lumas].sort((a, b) => a - b);
  const midLuma = sorted[Math.floor(sorted.length / 2)];
  const brightest = lumas.indexOf(Math.max(...lumas));
  const brightGroup =
    lumas[brightest] > midLuma * 2.2 ? Math.floor(brightest / 6) : 0;
  const wide = {
    shiftX: 0.2,
    shiftY: 0.45,
    steps: 4,
    scales: [0.88, 0.96, 1.04, 1.12, 1.2],
    refine: 6,
  };
  const tight = {
    shiftX: 0.05,
    shiftY: 0.06,
    steps: 2,
    scales: [0.97, 1, 1.03],
    refine: 6,
  };
  const look = (
    frame: SlotFrame,
    cx: number,
    cy: number,
    search: typeof wide,
    place?: Placement,
  ) => {
    const at = place ? shiftFrame(frame, place) : frame;
    let match = matchSlot(shot, at, bank[chosen.style].fine, search);
    // The scoreboard head is sometimes the small map art rather than the shop icon.
    if (chosen.style === "icon")
      match = mergeMatches(match, matchSlot(shot, at, bank.mini.fine, search));
    // The pause list crops the card art into a circle; the tall top-bar art is a second look.
    if (chosen.style === "card") {
      const bar = listBarFrame(cx, cy, pitch);
      match = mergeMatches(
        match,
        matchSlot(
          shot,
          place ? shiftFrame(bar, place) : bar,
          bank.bar.fine,
          search,
        ),
      );
    }
    return match;
  };
  type Seat = {
    side: Side;
    seat: number;
    group: number;
    frame: SlotFrame;
    cx: number;
    cy: number;
    firstStyle: SlotMatch | null;
  };
  const seatsFound: Seat[] = [];
  lines.forEach((line, groupIndex) => {
    const side: Side =
      lines.length === 1 || groupIndex === brightGroup ? "yours" : "theirs";
    // Each team's rows get their own small up-or-down nudge, since the name rows only roughly mark them.
    // A missed or extra name row can put the six rows one row off, so one row up and down is tried too.
    let nudge = chosen.yOff;
    let nudgeRank = -Infinity;
    for (const whole of [-1, 0, 1]) {
      for (let f = -0.3; f <= 0.31; f += 0.1) {
        let sum = 0;
        for (const y of line) {
          const hit = matchSlot(
            shot,
            listFrame(
              chosen.style,
              chosen.x,
              y + chosen.yOff + (whole + f) * pitch,
              pitch,
            ),
            bank[chosen.style].coarse,
            { shiftX: 0.15, shiftY: 0.15, steps: 1, scales: [1], refine: 0 },
          );
          sum += hit?.score ?? 0;
        }
        if (sum > nudgeRank + 1e-9) {
          nudgeRank = sum;
          nudge = chosen.yOff + (whole + f) * pitch;
        }
      }
    }
    line.forEach((y, k) => {
      const frame = listFrame(chosen.style, chosen.x, y + nudge, pitch);
      const firstStyle = matchSlot(shot, frame, bank[chosen.style].fine, wide);
      seatsFound.push({
        side,
        seat: k + 1,
        group: groupIndex,
        frame,
        cx: chosen.x,
        cy: y + nudge,
        firstStyle,
      });
    });
  });
  // Rows share one layout. Where the clear rows lined up tells every row where to look, so a
  // look-alike cannot win by sliding to an odd spot. Each team keeps its own up-or-down offset.
  const slots: SlotRead[] = seatsFound.map((seat) => {
    const peers = seatsFound.filter((other) => other.group === seat.group);
    const place = placement(
      peers.map((other) => ({ frame: other.frame, match: other.firstStyle })),
    );
    const match = place
      ? look(seat.frame, seat.cx, seat.cy, tight, place)
      : look(seat.frame, seat.cx, seat.cy, wide);
    return { ...toSlot(seat.side, seat.seat, match), y: seat.cy };
  });
  slots.sort((a, b) =>
    a.side === b.side ? a.seat - b.seat : a.side === "yours" ? -1 : 1,
  );
  return { layout: "list", slots: settleDuplicates(slots) };
}

/** Brightness of the row behind the name: a low share of its pixels, so a lit row stands out but text does not. */
function rowLuma(
  shot: RgbImage,
  x0: number,
  x1: number,
  y: number,
  pitch: number,
) {
  const values: number[] = [];
  for (let py = Math.round(y - pitch * 0.3); py <= y + pitch * 0.3; py += 2) {
    for (let px = Math.round(x0); px <= x1; px += 2) {
      if (px < 0 || py < 0 || px >= shot.w || py >= shot.h) continue;
      const i = (py * shot.w + px) * 4;
      values.push(
        0.299 * shot.data[i] +
          0.587 * shot.data[i + 1] +
          0.114 * shot.data[i + 2],
      );
    }
  }
  values.sort((a, b) => a - b);
  return values.length ? values[Math.floor(values.length * 0.25)] : 0;
}

/* ---------- shared ---------- */

/** Each hero keeps its better score from two looks at the same slot. */
export function mergeMatches(
  a: SlotMatch | null,
  b: SlotMatch | null,
): SlotMatch | null {
  if (!a || !b) return a ?? b;
  const best = new Map<number, number>();
  for (const r of [...a.ranked, ...b.ranked])
    best.set(r.id, Math.max(best.get(r.id) ?? -Infinity, r.score));
  const ranked = [...best.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((x, y) => y.score - x.score);
  const next = ranked[1] ?? { id: -1, score: -1 };
  return {
    id: ranked[0].id,
    score: ranked[0].score,
    runnerId: next.id,
    runner: next.score,
    ranked,
  };
}

function toSlot(side: Side, seat: number, match: SlotMatch | null): SlotRead {
  const verdict = decide(match, SURE_SCORE, SURE_MARGIN);
  return {
    side,
    seat,
    state: verdict.sure ? "sure" : "unsure",
    id: verdict.id,
    choices: match ? match.ranked.slice(0, 4).map((r) => r.id) : [],
    score: match?.score ?? 0,
    lead: match ? match.score - match.runner : 0,
  };
}

/** A hero is in a match once. If two seats both claim one, only the stronger claim stays sure. */
export function settleDuplicates(slots: SlotRead[]): SlotRead[] {
  const out = slots.map((slot) => ({ ...slot }));
  for (const slot of out) {
    if (slot.state !== "sure" || slot.id === null) continue;
    const rival = out.find(
      (other) =>
        other !== slot && other.state === "sure" && other.id === slot.id,
    );
    if (!rival) continue;
    const weaker = rival.score < slot.score ? rival : slot;
    weaker.state = "unsure";
  }
  return out;
}

/** Sure heroes per side, in seat order. */
export function sureTeams(read: ScreenRead): {
  yours: number[];
  theirs: number[];
} {
  const pick = (side: Side) =>
    read.slots
      .filter((s) => s.side === side && s.state === "sure" && s.id !== null)
      .map((s) => s.id as number);
  return { yours: pick("yours"), theirs: pick("theirs") };
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
