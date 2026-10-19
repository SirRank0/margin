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

/** Rows of hero names on a scoreboard. The in-game top bar does not qualify. */
export function findHeroNameRows(image: RgbImage): NameCrop[] {
  const { w, h, data } = image;
  if (w < 200 || h < 200) return [];
  const x0 = Math.round(w * 0.1);
  const x1 = Math.round(w * 0.32);
  const counts = new Uint16Array(h);
  for (let y = 0; y < h; y++) {
    let n = 0;
    const row = y * w;
    for (let x = x0; x < x1; x++) {
      const i = (row + x) * 4;
      if (data[i] > 175 && data[i + 1] > 175 && data[i + 2] > 175) n++;
    }
    counts[y] = n;
  }
  const groups: [number, number][] = [];
  let start = -1;
  let prev = -1;
  for (let y = 0; y < h; y++) {
    if (counts[y] < 8) continue;
    if (start < 0) start = y;
    else if (y > prev + 3) {
      groups.push([start, prev]);
      start = y;
    }
    prev = y;
  }
  if (start >= 0) groups.push([start, prev]);

  const cropX = Math.round(w * 0.128);
  const cropW = Math.round(w * 0.23) - cropX;
  const cropH = Math.max(16, Math.round(h * 0.017));
  const sampleX = Math.round(w * 0.32);
  const sampleW = Math.round(w * 0.16);
  const rows: NameCrop[] = [];
  for (const [top, bottom] of groups) {
    if (bottom - top > 36) continue;
    const y = top + Math.round(h * 0.012);
    if (y < 0 || y + cropH > h) continue;
    rows.push({
      x: cropX,
      y,
      w: cropW,
      h: cropH,
      anchor: top,
      luma: patchLuma(image, sampleX, y, sampleW, cropH),
    });
  }
  return rows.length >= 8 ? rows : [];
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
  const cleaned = clean(text);
  if (!cleaned) return null;
  const padded = ` ${cleaned} `;
  let best: { id: number; length: number } | null = null;
  for (const hero of heroes) {
    const name = clean(hero.name);
    if (!name) continue;
    const hit = name.length < 5 ? padded.includes(` ${name} `) : padded.includes(name);
    if (!hit) continue;
    if (!best || name.length > best.length) best = { id: hero.id, length: name.length };
  }
  if (best) return best.id;
  const tokens = cleaned.split(" ").filter((token) => token.length >= 6);
  let near: { id: number; distance: number } | null = null;
  for (const token of tokens) {
    for (const hero of heroes) {
      const name = clean(hero.name);
      if (name.includes(" ") || name.length < 6) continue;
      const distance = editDistance(token, name);
      if (distance > 1) continue;
      if (near && near.id !== hero.id) return null;
      near = { id: hero.id, distance };
    }
  }
  return near?.id ?? null;
}

export function assignNamedTeams(rows: { id: number; anchor: number; luma: number }[]): {
  yours: number[];
  theirs: number[];
} {
  const ordered = [...rows].sort((a, b) => a.anchor - b.anchor);
  if (ordered.length === 0) return { yours: [], theirs: [] };
  if (ordered.length === 1) return { yours: [ordered[0].id], theirs: [] };
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
  const highlighted = bright.luma > mid * 1.35 ? groups.findIndex((group) => group.includes(bright)) : 0;
  const yours = groups[highlighted] ?? groups[0];
  const theirs = groups[highlighted === 0 ? 1 : 0] ?? [];
  return { yours: uniqueIds(yours).slice(0, 6), theirs: uniqueIds(theirs).slice(0, 6) };
}

function uniqueIds(rows: { id: number }[]) {
  const ids: number[] = [];
  for (const row of rows) if (!ids.includes(row.id)) ids.push(row.id);
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
