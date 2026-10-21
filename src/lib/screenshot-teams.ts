/** Read both lineups from a screenshot by matching portrait color grids. */

const GRID = 6;
const CELLS = GRID * GRID * 3;

export type RgbImage = { w: number; h: number; data: Uint8ClampedArray };

export type PortraitHit = { id: number; x: number; y: number; size: number; score: number };

export type TeamRead = { yours: number[]; theirs: number[]; hits: PortraitHit[] };

export type PortraitIcon = { id: number; image: RgbImage };

type Prepared = { id: number; grid: Float32Array };

export function prepareIcons(icons: PortraitIcon[]): Prepared[] {
  const prepared: Prepared[] = [];
  for (const icon of icons) {
    const grid = colorGrid(icon.image, 0, 0, Math.min(icon.image.w, icon.image.h));
    if (grid) prepared.push({ id: icon.id, grid });
  }
  return prepared;
}

export function readTeams(shot: RgbImage, icons: PortraitIcon[]): TeamRead {
  const prepared = prepareIcons(icons);
  const hits = findPortraits(shot, prepared);
  return { ...splitTeams(hits), hits };
}

export function findPortraits(shot: RgbImage, icons: Prepared[]): PortraitHit[] {
  if (icons.length === 0 || shot.w < 16 || shot.h < 16) return [];
  const scratch = new Float32Array(CELLS);
  const seeds: PortraitHit[] = [];
  const base = Math.min(shot.w, shot.h);
  const fractions = [0.05, 0.08, 0.12, 0.18, 0.26, 0.36];
  for (const fraction of fractions) {
    const size = Math.max(16, Math.round(base * fraction));
    if (size > shot.w || size > shot.h) continue;
    const stride = Math.max(3, Math.floor(size / 5));
    for (let y = 0; y + size <= shot.h; y += stride) {
      for (let x = 0; x + size <= shot.w; x += stride) {
        const ranked = rankWindow(shot, icons, x, y, size, scratch);
        if (!ranked || ranked.best < 0.5) continue;
        seeds.push({ id: ranked.id, x: x + size / 2, y: y + size / 2, size, score: ranked.best });
      }
    }
  }
  const shortlist = suppress(seeds).slice(0, 36);
  const refined: PortraitHit[] = [];
  for (const seed of shortlist) {
    const hit = refine(shot, icons, seed, scratch);
    if (hit) refined.push(hit);
  }
  return suppress(refined);
}

function refine(shot: RgbImage, icons: Prepared[], seed: PortraitHit, scratch: Float32Array): PortraitHit | null {
  let best: PortraitHit | null = null;
  const originX = seed.x - seed.size / 2;
  const originY = seed.y - seed.size / 2;
  const scales: number[] = [];
  for (let size = Math.round(seed.size * 0.75); size <= Math.round(seed.size * 1.35); size += Math.max(2, Math.round(seed.size * 0.08))) {
    if (size >= 16 && size <= shot.w && size <= shot.h) scales.push(size);
  }
  for (const size of scales) {
    const step = Math.max(2, Math.floor(size / 10));
    const reach = Math.round(Math.max(seed.size, size) / 3);
    for (let y = originY - reach; y <= originY + reach; y += step) {
      for (let x = originX - reach; x <= originX + reach; x += step) {
        if (x < 0 || y < 0 || x + size > shot.w || y + size > shot.h) continue;
        const ranked = rankWindow(shot, icons, x, y, size, scratch);
        if (!ranked || ranked.id !== seed.id || ranked.best < 0.88 || ranked.best - ranked.second < 0.08) continue;
        if (!best || ranked.best > best.score) {
          best = { id: ranked.id, x: x + size / 2, y: y + size / 2, size, score: ranked.best };
        }
      }
    }
  }
  return best;
}

function rankWindow(shot: RgbImage, icons: Prepared[], x: number, y: number, size: number, scratch: Float32Array) {
  if (!colorGridInto(shot, x, y, size, scratch)) return null;
  let best = -1;
  let bestId = -1;
  let second = -1;
  for (const icon of icons) {
    const score = dot(scratch, icon.grid);
    if (score > best) {
      second = best;
      best = score;
      bestId = icon.id;
    } else if (score > second) {
      second = score;
    }
  }
  return { id: bestId, best, second };
}

export function splitTeams(hits: PortraitHit[]): { yours: number[]; theirs: number[] } {
  if (hits.length === 0) return { yours: [], theirs: [] };
  if (hits.length === 1) return { yours: [hits[0].id], theirs: [] };
  const byX = [...hits].sort((a, b) => a.x - b.x);
  const byY = [...hits].sort((a, b) => a.y - b.y);
  const cutX = bestCut(byX, "x");
  const cutY = bestCut(byY, "y");
  const groups = cutY.gap > cutX.gap * 1.15 ? cutY.groups : cutX.groups;
  const order = (group: PortraitHit[]) =>
    group.sort((a, b) => a.x - b.x || a.y - b.y).map((hit) => hit.id);
  return { yours: order(groups[0]).slice(0, 6), theirs: order(groups[1]).slice(0, 6) };
}

function bestCut(sorted: PortraitHit[], key: "x" | "y") {
  let best = -1;
  let index = Math.ceil(sorted.length / 2);
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i][key] - sorted[i - 1][key];
    const balance = 1 - Math.abs(i - sorted.length / 2) / (sorted.length / 2);
    const score = gap * (0.65 + 0.35 * balance);
    if (score > best) {
      best = score;
      index = i;
    }
  }
  return {
    gap: sorted[index][key] - sorted[index - 1][key],
    groups: [sorted.slice(0, index), sorted.slice(index)] as [PortraitHit[], PortraitHit[]],
  };
}

function suppress(found: PortraitHit[]): PortraitHit[] {
  const sorted = [...found].sort((a, b) => b.score - a.score);
  const kept: PortraitHit[] = [];
  for (const hit of sorted) {
    if (kept.some((other) => other.id === hit.id)) continue;
    const crowded = kept.some((other) => {
      const dist = Math.hypot(other.x - hit.x, other.y - hit.y);
      return dist < 0.45 * Math.min(other.size, hit.size);
    });
    if (crowded) continue;
    kept.push(hit);
    if (kept.length === 12) break;
  }
  return kept;
}

function colorGrid(image: RgbImage, x: number, y: number, size: number): Float32Array | null {
  const out = new Float32Array(CELLS);
  return colorGridInto(image, x, y, size, out) ? out : null;
}

function colorGridInto(image: RgbImage, x0: number, y0: number, size: number, out: Float32Array): boolean {
  out.fill(0);
  const cell = size / GRID;
  const xStart = Math.max(0, Math.floor(x0));
  const yStart = Math.max(0, Math.floor(y0));
  const xEnd = Math.min(image.w, Math.ceil(x0 + size));
  const yEnd = Math.min(image.h, Math.ceil(y0 + size));
  if (xEnd - xStart < 8 || yEnd - yStart < 8) return false;
  const counts = new Uint16Array(GRID * GRID);
  const data = image.data;
  let samples = 0;
  for (let y = yStart; y < yEnd; y++) {
    const gy = Math.min(GRID - 1, Math.max(0, Math.floor((y - y0) / cell)));
    const row = y * image.w;
    for (let x = xStart; x < xEnd; x++) {
      const gx = Math.min(GRID - 1, Math.max(0, Math.floor((x - x0) / cell)));
      const i = (row + x) * 4;
      if (data[i + 3] < 24) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const bin = gy * GRID + gx;
      out[bin * 3] += r;
      out[bin * 3 + 1] += g;
      out[bin * 3 + 2] += b;
      counts[bin]++;
      samples++;
    }
  }
  if (samples < (xEnd - xStart) * (yEnd - yStart) * 0.4) return false;
  let mean = 0;
  let filled = 0;
  for (let bin = 0; bin < GRID * GRID; bin++) {
    const n = counts[bin];
    if (n === 0) continue;
    out[bin * 3] /= n;
    out[bin * 3 + 1] /= n;
    out[bin * 3 + 2] /= n;
    mean += out[bin * 3] + out[bin * 3 + 1] + out[bin * 3 + 2];
    filled++;
  }
  if (filled < GRID * GRID * 0.6) return false;
  mean /= filled * 3;
  let energy = 0;
  for (let i = 0; i < out.length; i++) {
    out[i] -= mean;
    energy += out[i] * out[i];
  }
  if (energy < 80) return false;
  const inv = 1 / Math.sqrt(energy);
  for (let i = 0; i < out.length; i++) out[i] *= inv;
  return true;
}

function dot(left: Float32Array, right: Float32Array) {
  let sum = 0;
  for (let i = 0; i < left.length; i++) sum += left[i] * right[i];
  return sum;
}

export type NameCrop = { x: number; y: number; w: number; h: number; anchor: number; luma: number };

/** Rows of hero names. A scoreboard has a column of bright names. A team list has stacked row bars. */
export function findHeroNameRows(image: RgbImage): NameCrop[] {
  const text = textColumnRows(image);
  if (text.length >= 8) return text;
  return barRows(image);
}

function textColumnRows(image: RgbImage): NameCrop[] {
  const { w, h } = image;
  if (w < 200 || h < 200) return [];
  const width = Math.round(w * 0.18);
  const step = Math.max(20, Math.round(w * 0.02));
  let best: { regular: number; x0: number; groups: [number, number][] } | null = null;
  for (let x = 0; x + width <= w; x += step) {
    const groups = brightBands(image, x, x + width, 175, 8).filter((band) => band[1] - band[0] <= 36 && band[1] - band[0] >= 3);
    if (groups.length < 8) continue;
    const regular = regularGaps(groups.map((band) => band[0]));
    if (!best || regular > best.regular) best = { regular, x0: x, groups };
  }
  if (!best || best.regular < 10) return [];
  const gaps = best.groups.slice(1).map((band, index) => band[0] - best.groups[index][0]);
  const pitch = median(gaps) || Math.round(h * 0.05);
  const lefts = best.groups.map((band) => bandLeft(image, best.x0, best.x0 + width, band[0], band[1], 150));
  const known = lefts.filter((value) => value >= 0);
  const nameLeft = median(known.length ? known : [best.x0]);
  const origin = Math.max(0, nameLeft);
  const scanW = Math.round(w * 0.16);
  const rows: NameCrop[] = [];
  for (let i = 0; i < best.groups.length; i++) {
    const band = best.groups[i];
    const nextTop = i + 1 < best.groups.length ? best.groups[i + 1][0] : band[1] + pitch;
    const slotTop = band[0] + Math.round(pitch * 0.18);
    const slotBot = Math.min(nextTop - 2, band[0] + Math.round(pitch * 0.72));
    const line = nameLine(image, slotTop, slotBot, origin, origin + scanW);
    if (!line) continue;
    const luma = patchLuma(
      image,
      Math.min(image.w - 8, line.x + line.w + 6),
      band[0],
      Math.round(w * 0.05),
      Math.max(10, nextTop - band[0]),
    );
    rows.push({ ...line, anchor: band[0], luma });
  }
  return rows.length >= 8 ? rows : [];
}

function barRows(image: RgbImage): NameCrop[] {
  const { w, h } = image;
  if (w < 200 || h < 200) return [];
  const win = Math.round(w * 0.16);
  const step = Math.max(16, Math.round(w * 0.02));
  let best: { regular: number; x0: number; bars: [number, number][] } | null = null;
  for (let x = 0; x + win <= w; x += step) {
    const found = rowBars(image, x, x + win);
    if (found.length < 8) continue;
    const kept = keepRuns(found, 4);
    if (kept.length < 8) continue;
    const regular = regularGaps(kept.map((bar) => bar[0]));
    if (!best || regular > best.regular) best = { regular, x0: x, bars: kept };
  }
  if (!best) return [];
  const edges = best.bars.map((bar) => {
    const height = bar[1] - bar[0];
    const y = bar[0] + Math.round(height * 0.12);
    const cropH = Math.max(10, Math.round(height * 0.4));
    return bandLeft(image, best.x0, Math.min(w, best.x0 + win), y, y + cropH, 130);
  });
  const inside = edges.filter((edge) => edge >= best.x0);
  const origin = inside.length >= 4 ? median(inside) : best.x0;
  const scanW = Math.round(w * 0.18);
  return best.bars.flatMap((bar) => {
    const x0 = Math.max(0, origin - 4);
    const lines = inkSpans(image, x0, Math.min(w, x0 + scanW), bar[0], bar[1]);
    const height = bar[1] - bar[0];
    const luma = patchLuma(image, x0, bar[0], Math.min(scanW, w - x0), height);
    if (lines.length === 0) {
      const y = bar[0] + Math.round(height * 0.58);
      const cropH = Math.max(14, Math.round(height * 0.28));
      const x = Math.max(0, origin);
      if (y < 0 || y + cropH > h || x + 8 > w) return [];
      return [{ x, y, w: Math.min(Math.round(w * 0.13), w - x), h: cropH, anchor: bar[0], luma }];
    }
    return lines.map((line) => ({ ...line, anchor: bar[0], luma }));
  });
}

/** Text lines inside a row bar. A pause-screen row has the player name above the hero name. */
function inkSpans(
  image: RgbImage,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): { x: number; y: number; w: number; h: number }[] {
  x0 = Math.max(0, Math.floor(x0));
  x1 = Math.min(image.w, Math.ceil(x1));
  y0 = Math.max(0, Math.floor(y0));
  y1 = Math.min(image.h, Math.ceil(y1));
  if (x1 - x0 < 8 || y1 - y0 < 16) return [];
  const samples: number[] = [];
  for (let y = y0; y < y1; y++) {
    const row = y * image.w;
    for (let x = x0; x < x1; x += 2) {
      const i = (row + x) * 4;
      samples.push((image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3);
    }
  }
  samples.sort((a, b) => a - b);
  const bg = samples[Math.floor(samples.length * 0.35)] ?? 0;
  const thr = bg + 26;
  const counts = new Uint16Array(y1 - y0);
  for (let y = y0; y < y1; y++) {
    const row = y * image.w;
    let n = 0;
    for (let x = x0; x < x1; x++) {
      const i = (row + x) * 4;
      if ((image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3 > thr) n++;
    }
    counts[y - y0] = n;
  }
  let peak = 0;
  for (const n of counts) if (n > peak) peak = n;
  if (peak < 8) return [];
  const height = counts.length;
  const zoneMax = (from: number, to: number) => {
    let max = 0;
    const start = Math.max(0, Math.floor(height * from));
    const end = Math.min(height - 1, Math.floor(height * to));
    for (let i = start; i <= end; i++) if (counts[i] > max) max = counts[i];
    return max;
  };
  const top = zoneMax(0.05, 0.48);
  const bottom = zoneMax(0.52, 0.95);
  const midLo = Math.floor(height * 0.38);
  const midHi = Math.min(height - 1, Math.floor(height * 0.68));
  let valley = midLo;
  for (let i = midLo; i <= midHi; i++) if (counts[i] < counts[valley]) valley = i;
  const ranges: [number, number][] =
    top > peak * 0.35 && bottom > peak * 0.32 && counts[valley] < 0.72 * Math.min(top, bottom)
      ? [
          [0, valley - 1],
          [valley + 1, height - 1],
        ]
      : (() => {
          const ink: number[] = [];
          for (let i = 0; i < height; i++) if (counts[i] > peak * 0.2) ink.push(i);
          return ink.length ? ([[ink[0], ink[ink.length - 1]]] as [number, number][]) : [];
        })();
  const spans: { x: number; y: number; w: number; h: number }[] = [];
  for (const [from, to] of ranges) {
    const rows: number[] = [];
    for (let i = Math.max(0, from); i <= Math.min(height - 1, to); i++) {
      if (counts[i] > Math.max(4, peak * 0.12)) rows.push(i);
    }
    if (rows.length < 3) continue;
    const ya = y0 + rows[0];
    const yb = y0 + rows[rows.length - 1];
    let xa = x1;
    let xb = x0;
    for (let y = ya; y <= yb; y++) {
      const row = y * image.w;
      for (let x = x0; x < x1; x++) {
        const i = (row + x) * 4;
        if ((image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3 > thr) {
          if (x < xa) xa = x;
          if (x > xb) xb = x;
        }
      }
    }
    if (xb <= xa) continue;
    const y = Math.max(0, ya - 1);
    const bottomEdge = Math.min(image.h, yb + 3);
    const x = Math.max(0, xa - 3);
    const right = Math.min(image.w, xb + 7);
    spans.push({ x, y, w: right - x, h: bottomEdge - y });
  }
  return spans;
}

/** Gray hero name in the slot under the player name. */
function nameLine(
  image: RgbImage,
  y0: number,
  y1: number,
  x0: number,
  x1: number,
): { x: number; y: number; w: number; h: number } | null {
  x0 = Math.max(0, Math.floor(x0));
  x1 = Math.min(image.w, Math.ceil(x1));
  y0 = Math.max(0, Math.floor(y0));
  y1 = Math.min(image.h, Math.ceil(y1));
  if (x1 - x0 < 24 || y1 - y0 < 8) return null;
  const gray: number[] = [];
  for (let y = y0; y < y1; y++) {
    const row = y * image.w;
    const values: number[] = [];
    for (let x = x0; x < x1; x++) {
      const i = (row + x) * 4;
      values.push((image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3);
    }
    values.sort((a, b) => a - b);
    const mid = values[Math.floor(values.length / 2)] ?? 0;
    let ink = 0;
    let white = 0;
    for (const value of values) {
      if (value > mid + 40) ink++;
      if (value > 175) white++;
    }
    if (ink >= 8 && white * 2 < ink) gray.push(y);
  }
  const clusters: [number, number][] = [];
  let start = -1;
  let prev = -1;
  for (const y of gray) {
    if (start < 0) start = y;
    else if (y > prev + 2) {
      clusters.push([start, prev]);
      start = y;
    }
    prev = y;
  }
  if (start >= 0) clusters.push([start, prev]);
  const band = clusters.filter((span) => span[1] - span[0] >= 3).at(-1);
  if (!band) return null;
  const ya = Math.max(y0, band[0] - 2);
  const yb = Math.min(y1 - 1, band[1] + 2);
  const cols = new Uint16Array(x1 - x0);
  for (let y = ya; y <= yb; y++) {
    const row = y * image.w;
    for (let x = x0; x < x1; x++) {
      const i = (row + x) * 4;
      if ((image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3 > 90) cols[x - x0]++;
    }
  }
  const runs: [number, number][] = [];
  let runStart = -1;
  let gap = 0;
  let runEnd = -1;
  for (let i = 0; i < cols.length; i++) {
    if (cols[i] >= 2) {
      if (runStart < 0) runStart = i;
      gap = 0;
      runEnd = i;
    } else if (runStart >= 0 && ++gap > 12) {
      runs.push([runStart, runEnd]);
      runStart = -1;
    }
  }
  if (runStart >= 0) runs.push([runStart, runEnd]);
  const wide = runs.filter((item) => item[1] - item[0] >= 20);
  const run = wide.sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
  if (!run) return null;
  const y = Math.max(0, ya - 1);
  const bottom = Math.min(image.h, yb + 3);
  const x = Math.max(0, x0 + run[0] - 2);
  const right = Math.min(image.w, x0 + run[1] + 3);
  return { x, y, w: right - x, h: bottom - y };
}

function brightBands(image: RgbImage, x0: number, x1: number, threshold: number, minCount: number): [number, number][] {
  const counts = new Uint16Array(image.h);
  for (let y = 0; y < image.h; y++) {
    let n = 0;
    const row = y * image.w;
    for (let x = x0; x < x1; x++) {
      const i = (row + x) * 4;
      if (image.data[i] > threshold && image.data[i + 1] > threshold && image.data[i + 2] > threshold) n++;
    }
    counts[y] = n;
  }
  return groupRuns(counts, minCount);
}

function rowBars(image: RgbImage, x0: number, x1: number): [number, number][] {
  const means = new Float32Array(image.h);
  const span = Math.max(1, x1 - x0);
  for (let y = 0; y < image.h; y++) {
    let sum = 0;
    const row = y * image.w;
    for (let x = x0; x < x1; x++) {
      const i = (row + x) * 4;
      sum += image.data[i] + image.data[i + 1] + image.data[i + 2];
    }
    means[y] = sum / (span * 3);
  }
  const smooth = Float32Array.from(means);
  for (let y = 2; y < image.h - 2; y++) {
    smooth[y] = (means[y - 2] + means[y - 1] + means[y] + means[y + 1] + means[y + 2]) / 5;
  }
  const sorted = Array.from(smooth).sort((a, b) => a - b);
  const low = sorted[Math.floor(sorted.length * 0.15)];
  const high = sorted[Math.floor(sorted.length * 0.75)];
  if (high - low < 12) return [];
  const threshold = low + 0.35 * (high - low);
  const on = new Uint16Array(image.h);
  for (let y = 0; y < image.h; y++) if (smooth[y] > threshold) on[y] = 1;
  const spans = groupRuns(on, 1);
  if (spans.length < 8) return [];
  const heights = spans.map((span) => span[1] - span[0]).sort((a, b) => a - b);
  const typical = heights[Math.floor(heights.length / 2)];
  return spans.filter((span) => {
    const height = span[1] - span[0];
    return height >= typical * 0.82 && height <= typical * 1.18 && height >= 32 && height <= 90;
  });
}

function keepRuns(bars: [number, number][], minRun: number): [number, number][] {
  const gaps = bars.slice(1).map((bar, index) => bar[0] - bars[index][0]);
  const ordered = [...gaps].sort((a, b) => a - b);
  const pitch = ordered[Math.floor(ordered.length / 4)] || ordered[0] || 1;
  const runs: [number, number][][] = [];
  let run: [number, number][] = [bars[0]];
  for (let i = 1; i < bars.length; i++) {
    if (bars[i][0] - bars[i - 1][0] > pitch * 1.45) {
      runs.push(run);
      run = [];
    }
    run.push(bars[i]);
  }
  runs.push(run);
  return runs.filter((group) => group.length >= minRun).flat();
}

function groupRuns(counts: ArrayLike<number>, minCount: number): [number, number][] {
  const groups: [number, number][] = [];
  let start = -1;
  let prev = -1;
  for (let y = 0; y < counts.length; y++) {
    if (counts[y] < minCount) continue;
    if (start < 0) start = y;
    else if (y > prev + 3) {
      groups.push([start, prev]);
      start = y;
    }
    prev = y;
  }
  if (start >= 0) groups.push([start, prev]);
  return groups;
}

function regularGaps(starts: number[]) {
  if (starts.length < 2) return 0;
  const gaps = starts.slice(1).map((start, index) => start - starts[index]);
  const mid = median(gaps);
  return gaps.filter((gap) => gap > mid * 0.55 && gap < mid * 1.8).length;
}

function bandLeft(image: RgbImage, x0: number, x1: number, y0: number, y1: number, threshold: number) {
  for (let x = x0; x < x1; x++) {
    for (let y = y0; y <= y1 && y < image.h; y++) {
      const i = (y * image.w + x) * 4;
      if (image.data[i] > threshold && image.data[i + 1] > threshold && image.data[i + 2] > threshold) return x;
    }
  }
  return -1;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function patchLuma(image: RgbImage, x: number, y: number, w: number, h: number) {
  const x1 = Math.min(image.w, x + w);
  const y1 = Math.min(image.h, y + h);
  let sum = 0;
  let n = 0;
  for (let py = Math.max(0, y); py < y1; py++) {
    const row = py * image.w;
    for (let px = Math.max(0, x); px < x1; px++) {
      const i = (row + px) * 4;
      sum += image.data[i] + image.data[i + 1] + image.data[i + 2];
      n++;
    }
  }
  return n ? sum / (n * 3) : 0;
}

export function matchHeroName(text: string, heroes: { id: number; name: string }[]): number | null {
  const cleaned = clean(text).replace(/\blevel\w*/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  const padded = ` ${cleaned} `;
  const tokens = cleaned.split(" ").filter(Boolean);
  let best: { id: number; length: number } | null = null;
  for (const hero of heroes) {
    const name = clean(hero.name);
    if (!name) continue;
    const words = name.split(" ").filter(Boolean);
    const joined = words.join("");
    const whole = padded.includes(` ${name} `);
    const glued = words.length > 1 && tokens.some((token) => token === joined || (token.length >= 5 && editDistance(token, joined) <= 1));
    const strong = words.filter((word) => tokens.some((token) => tokenHits(token, word))).length;
    const close =
      words.length === 1
        ? words.every((word) => tokens.some((token) => tokenHits(token, word)))
        : words.every((word) => tokens.some((token) => softHit(token, word))) && strong >= 1;
    if (!whole && !glued && !close) continue;
    if (!best || name.length > best.length) best = { id: hero.id, length: name.length };
  }
  return best?.id ?? null;
}

function tokenHits(token: string, word: string) {
  if (token === word) return true;
  if (word.length >= 4 && token.length >= 3 && editDistance(token, word) <= 1) return true;
  if (!token.startsWith(word) || token.length === word.length) return false;
  const rest = token.slice(word.length).replace(/[^a-z]/g, "");
  return rest.length > 0 && editDistance(rest, "level") <= 2;
}

function softHit(token: string, word: string) {
  if (tokenHits(token, word)) return true;
  return word.length >= 4 && token.length >= 3 && Math.abs(token.length - word.length) <= 1 && editDistance(token, word) <= 2;
}

/** One hero per row. The name under the player is the character. A "Level" line is that name on the pause screen. */
export function chooseRowHero(
  reads: { text: string; luma: number }[],
  heroes: { id: number; name: string }[],
): number | null {
  const hits = reads
    .map((read) => ({ id: matchHeroName(read.text, heroes), text: clean(read.text), luma: read.luma }))
    .filter((hit): hit is { id: number; text: string; luma: number } => hit.id !== null);
  if (hits.length === 0) return null;
  const leveled = hits.filter((hit) => hit.text.includes("level"));
  const pool = leveled.length > 0 ? leveled : hits;
  return pool[pool.length - 1].id;
}

export function assignNamedTeams(rows: { id: number | null; anchor: number; luma: number }[]): {
  yours: number[];
  theirs: number[];
} {
  const ordered = [...rows].sort((a, b) => a.anchor - b.anchor);
  if (ordered.length === 0) return { yours: [], theirs: [] };
  if (ordered.length === 1) return { yours: ordered[0].id === null ? [] : [ordered[0].id], theirs: [] };
  let cut = 1;
  let gap = -1;
  for (let i = 1; i < ordered.length; i++) {
    const size = ordered[i].anchor - ordered[i - 1].anchor;
    if (size > gap) {
      gap = size;
      cut = i;
    }
  }
  const groups = [ordered.slice(0, cut), ordered.slice(cut)];
  const lumas = ordered.map((row) => row.luma).sort((a, b) => a - b);
  const mid = lumas[Math.floor(lumas.length / 2)];
  const bright = ordered.reduce((best, row) => (row.luma > best.luma ? row : best));
  const highlighted = bright.luma > mid * 1.7 ? groups.findIndex((group) => group.includes(bright)) : 0;
  const yours = groups[highlighted] ?? groups[0];
  const theirs = groups[highlighted === 0 ? 1 : 0] ?? [];
  return { yours: uniqueIds(yours).slice(0, 6), theirs: uniqueIds(theirs).slice(0, 6) };
}

function uniqueIds(rows: { id: number | null }[]) {
  const ids: number[] = [];
  for (const row of rows) if (row.id !== null && !ids.includes(row.id)) ids.push(row.id);
  return ids;
}

function clean(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(left: string, right: string) {
  const row = new Array<number>(right.length + 1);
  for (let j = 0; j < row.length; j++) row[j] = j;
  for (let i = 1; i <= left.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const next = row[j];
      row[j] = left[i - 1] === right[j - 1] ? prev : 1 + Math.min(prev, row[j], row[j - 1]);
      prev = next;
    }
  }
  return row[right.length];
}
const FACE = 24;
const BINS = 5;
const HIST = BINS * BINS * BINS;

/** Official portrait, trimmed to the painted character and compared as color, not as a file name. */
export type FaceRef = {
  id: number;
  pixels: Float32Array;
  mask: Uint8Array;
  idx: Uint16Array;
  hist: Float32Array;
};

const scratchColors = new Float32Array(FACE * FACE * 3);
const scratchAlpha = new Float32Array(FACE * FACE);
const scratchCentered = new Float32Array(FACE * FACE * 3);
const scratchHist = new Float32Array(HIST);

export function indexFace(id: number, image: RgbImage): FaceRef | null {
  const box = opaqueSquare(image);
  if (!box) return null;
  const pixels = new Float32Array(FACE * FACE * 3);
  const alpha = new Float32Array(FACE * FACE);
  paintScaled(image, box.x, box.y, box.side, pixels, alpha);
  const mask = new Uint8Array(FACE * FACE);
  const kept: number[] = [];
  for (let i = 0; i < mask.length; i++) {
    if (alpha[i] > 40) {
      mask[i] = 1;
      kept.push(i);
    }
  }
  const count = kept.length;
  if (count < 24) return null;
  const idx = Uint16Array.from(kept);
  for (let c = 0; c < 3; c++) {
    let sum = 0;
    for (let i = 0; i < mask.length; i++) if (mask[i]) sum += pixels[i * 3 + c];
    const mean = sum / count;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) pixels[i * 3 + c] = 0;
      else pixels[i * 3 + c] -= mean;
    }
  }
  let energy = 0;
  for (let i = 0; i < pixels.length; i++) energy += pixels[i] * pixels[i];
  if (energy < 1) return null;
  const inv = 1 / Math.sqrt(energy);
  for (let i = 0; i < pixels.length; i++) pixels[i] *= inv;
  const hist = new Float32Array(HIST);
  fillHist(image, box, hist);
  return { id, pixels, mask, idx, hist };
}

function fillHist(image: RgbImage, box: { x: number; y: number; side: number }, hist: Float32Array) {
  const colors = new Float32Array(FACE * FACE * 3);
  const alpha = new Float32Array(FACE * FACE);
  paintScaled(image, box.x, box.y, box.side, colors, alpha);
  let n = 0;
  for (let i = 0; i < FACE * FACE; i++) {
    if (alpha[i] <= 40) continue;
    const r = Math.min(BINS - 1, (colors[i * 3] * BINS) / 256);
    const g = Math.min(BINS - 1, (colors[i * 3 + 1] * BINS) / 256);
    const b = Math.min(BINS - 1, (colors[i * 3 + 2] * BINS) / 256);
    hist[(r | 0) * BINS * BINS + (g | 0) * BINS + (b | 0)]++;
    n++;
  }
  if (n > 0) for (let i = 0; i < hist.length; i++) hist[i] /= n;
}

function opaqueSquare(image: RgbImage): { x: number; y: number; side: number } | null {
  let x0 = image.w;
  let y0 = image.h;
  let x1 = 0;
  let y1 = 0;
  let seen = false;
  for (let y = 0; y < image.h; y++) {
    const row = y * image.w;
    for (let x = 0; x < image.w; x++) {
      if (image.data[(row + x) * 4 + 3] <= 16) continue;
      seen = true;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  if (!seen) return null;
  const cx = (x0 + x1 + 1) / 2;
  const cy = (y0 + y1 + 1) / 2;
  const side = Math.max(x1 - x0 + 1, y1 - y0 + 1) * 1.04;
  return { x: cx - side / 2, y: cy - side / 2, side };
}

function paintScaled(image: RgbImage, x: number, y: number, size: number, pixels: Float32Array, alpha: Float32Array) {
  const cell = size / FACE;
  for (let gy = 0; gy < FACE; gy++) {
    const y0 = Math.max(0, Math.floor(y + gy * cell));
    const y1 = Math.min(image.h, Math.ceil(y + (gy + 1) * cell));
    for (let gx = 0; gx < FACE; gx++) {
      const x0 = Math.max(0, Math.floor(x + gx * cell));
      const x1 = Math.min(image.w, Math.ceil(x + (gx + 1) * cell));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let n = 0;
      for (let py = y0; py < y1; py++) {
        const row = py * image.w;
        for (let px = x0; px < x1; px++) {
          const i = (row + px) * 4;
          const alphaByte = image.data[i + 3];
          r += image.data[i];
          g += image.data[i + 1];
          b += image.data[i + 2];
          a += alphaByte;
          n++;
        }
      }
      const o = gy * FACE + gx;
      if (n === 0) continue;
      pixels[o * 3] = r / n;
      pixels[o * 3 + 1] = g / n;
      pixels[o * 3 + 2] = b / n;
      alpha[o] = a / n;
    }
  }
}

export type FaceHit = { id: number; score: number; runner: number; x: number; y: number; size: number };

/** Best hero for one square. Score is color correlation plus a palette match. */
export function matchFace(shot: RgbImage, x: number, y: number, size: number, faces: FaceRef[]): FaceHit | null {
  if (faces.length === 0 || size < 12) return null;
  if (x < 0 || y < 0 || x + size > shot.w || y + size > shot.h) return null;
  paintScaled(shot, x, y, size, scratchColors, scratchAlpha);
  let best = -2;
  let bestId = -1;
  let runner = -2;
  for (const face of faces) {
    const score = faceScore(scratchColors, face);
    if (score > best) {
      runner = best;
      best = score;
      bestId = face.id;
    } else if (score > runner) {
      runner = score;
    }
  }
  if (bestId < 0) return null;
  return { id: bestId, score: best, runner, x, y, size };
}

function faceScore(colors: Float32Array, face: FaceRef) {
  const count = face.idx.length;
  let mean0 = 0;
  let mean1 = 0;
  let mean2 = 0;
  for (let k = 0; k < count; k++) {
    const i = face.idx[k] * 3;
    mean0 += colors[i];
    mean1 += colors[i + 1];
    mean2 += colors[i + 2];
  }
  mean0 /= count;
  mean1 /= count;
  mean2 /= count;
  let energy = 0;
  const centered = scratchCentered;
  centered.fill(0);
  for (let k = 0; k < count; k++) {
    const o = face.idx[k] * 3;
    const v0 = colors[o] - mean0;
    const v1 = colors[o + 1] - mean1;
    const v2 = colors[o + 2] - mean2;
    centered[o] = v0;
    centered[o + 1] = v1;
    centered[o + 2] = v2;
    energy += v0 * v0 + v1 * v1 + v2 * v2;
  }
  if (energy < 1) return -1;
  const inv = 1 / Math.sqrt(energy);
  let ncc = 0;
  const pixels = face.pixels;
  for (let k = 0; k < count; k++) {
    const o = face.idx[k] * 3;
    ncc += (centered[o] * pixels[o] + centered[o + 1] * pixels[o + 1] + centered[o + 2] * pixels[o + 2]) * inv;
  }
  const hist = scratchHist;
  hist.fill(0);
  for (let k = 0; k < count; k++) {
    const o = face.idx[k] * 3;
    const r = Math.min(BINS - 1, (colors[o] * BINS) / 256) | 0;
    const g = Math.min(BINS - 1, (colors[o + 1] * BINS) / 256) | 0;
    const b = Math.min(BINS - 1, (colors[o + 2] * BINS) / 256) | 0;
    hist[r * BINS * BINS + g * BINS + b]++;
  }
  let inter = 0;
  const faceHist = face.hist;
  for (let i = 0; i < HIST; i++) inter += Math.min(hist[i] / count, faceHist[i]);
  return 0.72 * ncc + 0.45 * inter;
}

/**
 * The portrait sits just left of the name on that row.
 * Tries a small stack of squares and keeps the one that looks most like one hero.
 */
export function matchBeside(
  shot: RgbImage,
  anchor: number,
  textX: number,
  pitch: number,
  faces: FaceRef[],
): FaceHit | null {
  if (faces.length === 0 || pitch < 16) return null;
  const sizes = [0.72, 0.86, 1.02].map((scale) => Math.round(pitch * scale));
  const shifts = [-0.22, -0.06, 0.1].map((scale) => Math.round(anchor + pitch * scale));
  const xStart = Math.max(0, textX - Math.round(pitch * 1.7));
  const xEnd = Math.min(shot.w - 8, textX + Math.round(pitch * 0.2));
  const step = Math.max(3, Math.round(pitch * 0.08));
  let best: FaceHit | null = null;
  for (const size of sizes) {
    if (size < 16) continue;
    for (const y of shifts) {
      for (let x = xStart; x + size <= shot.w && x <= xEnd; x += step) {
        const hit = matchFace(shot, x, y, size, faces);
        if (!hit) continue;
        if (!best || hit.score > best.score) best = hit;
      }
    }
  }
  return best;
}

/**
 * Portraits share one column, just left of the names.
 * The column is the alignment where the faces are different heroes, not one repeated icon.
 */
export function readPortraitColumn(
  shot: RgbImage,
  anchors: number[],
  textXs: number[],
  faces: FaceRef[],
): (FaceHit | null)[] {
  const empty = anchors.map(() => null);
  if (faces.length === 0 || anchors.length < 4) return empty;
  const gaps = anchors
    .slice(1)
    .map((anchor, index) => anchor - anchors[index])
    .filter((gap) => gap > 0)
    .sort((a, b) => a - b);
  const pitch = gaps[Math.floor(gaps.length / 2)] || 0;
  if (pitch < 20) return empty;
  const xs = [...textXs].sort((a, b) => a - b);
  const left = xs[Math.floor(xs.length / 2)] ?? 0;
  let column: { rank: number; x: number; yOff: number; size: number } | null = null;
  const sizes = [0.78, 0.9].map((scale) => Math.round(pitch * scale));
  const offsets = [-0.12, 0.02].map((scale) => Math.round(pitch * scale));
  for (const size of sizes) {
    for (const yOff of offsets) {
      const xFrom = left - Math.round(pitch * 1.15);
      for (let x = xFrom; x <= left; x += 6) {
        const ids: number[] = [];
        let sum = 0;
        let seen = 0;
        for (const anchor of anchors) {
          const hit = matchFace(shot, x, anchor + yOff, size, faces);
          if (!hit) continue;
          seen++;
          sum += hit.score;
          ids.push(hit.id);
        }
        if (seen < anchors.length) continue;
        const unique = new Set(ids).size;
        const rank = sum * (0.35 + (0.65 * unique) / seen);
        if (!column || rank > column.rank) column = { rank, x, yOff, size };
      }
    }
  }
  if (!column) return empty;
  return anchors.map((anchor) => {
    let top: FaceHit | null = null;
    for (let dx = -8; dx <= 8; dx += 4) {
      for (let dy = -8; dy <= 8; dy += 4) {
        for (const extra of [-4, 0, 4]) {
          const hit = matchFace(shot, column.x + dx, anchor + column.yOff + dy, column.size + extra, faces);
          if (hit && (!top || hit.score > top.score)) top = hit;
        }
      }
    }
    return top;
  });
}

/** The picture wins when it is unmistakable. Otherwise the name is used, and a strong picture only fills a blank. */
export function portraitId(hit: FaceHit | null, readId: number | null): number | null {
  if (hit && hit.score >= 0.88 && hit.score - hit.runner >= 0.22) return hit.id;
  if (readId !== null) return readId;
  if (hit && hit.score >= 0.84 && hit.score - hit.runner >= 0.2) return hit.id;
  return null;
}

