/** Compact kill/death grids from scripts/fetch-heatmaps.py, and map projection. */

export const MAP_RADIUS = 10752;
export const CELL_SIZE = 128;
/** Kill/death ratio cells with fewer fights than this are hidden. */
export const MIN_KD_EVENTS = 20;

export type HeatCell = {
  ix: number;
  iy: number;
  kills: number;
  deaths: number;
};

export type HeatmapGrid = {
  radius: number;
  cell: number;
  kills: number;
  deaths: number;
  cells: HeatCell[];
};

/**
 * World position of a raster cell's center. The API stores the southwest
 * corner of each 128-unit cell as position_x / position_y.
 */
export function cellCenter(index: number, cell = CELL_SIZE): number {
  return index * cell + cell / 2;
}

/**
 * Project a world (x, y) point onto a minimap image. Y is flipped so north
 * (positive Y, Team 1's side) is toward the top of the image.
 */
export function worldToImage(
  x: number,
  y: number,
  width: number,
  height: number,
  radius = MAP_RADIUS,
): { px: number; py: number } {
  const span = 2 * radius;
  return {
    px: ((x + radius) / span) * width,
    py: ((radius - y) / span) * height,
  };
}

export function cellToImage(
  ix: number,
  iy: number,
  width: number,
  height: number,
  radius = MAP_RADIUS,
  cell = CELL_SIZE,
): { px: number; py: number } {
  return worldToImage(cellCenter(ix, cell), cellCenter(iy, cell), width, height, radius);
}

export function imageToWorld(
  px: number,
  py: number,
  width: number,
  height: number,
  radius = MAP_RADIUS,
): { x: number; y: number } {
  const span = 2 * radius;
  return {
    x: (px / width) * span - radius,
    y: radius - (py / height) * span,
  };
}

/** The raster cell whose area contains this world point. */
export function worldToCell(x: number, y: number, cell = CELL_SIZE): { ix: number; iy: number } {
  return {
    ix: Math.floor(x / cell),
    iy: Math.floor(y / cell),
  };
}

export function kdEvents(cell: HeatCell): number {
  return cell.kills + cell.deaths;
}

/**
 * Kill/death ratio, or null when the cell is too thin to show. A cell with
 * kills and no deaths is treated as a very high ratio once it clears the floor.
 */
export function kdRatio(cell: HeatCell, minEvents = MIN_KD_EVENTS): number | null {
  if (kdEvents(cell) < minEvents) return null;
  if (cell.deaths === 0) return cell.kills > 0 ? Number.POSITIVE_INFINITY : null;
  return cell.kills / cell.deaths;
}

/** 0–1 fade for K/D cells that cleared the sample floor. Thin cells stay dimmer. */
export function kdOpacity(cell: HeatCell, maxEvents: number, minEvents = MIN_KD_EVENTS): number {
  const events = kdEvents(cell);
  if (events < minEvents || maxEvents <= minEvents) return 0;
  const t = Math.log(events - minEvents + 1) / Math.log(maxEvents - minEvents + 1);
  return 0.28 + 0.72 * Math.min(1, Math.max(0, t));
}

export function parseHeatmap(data: unknown): HeatmapGrid | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  if (row.v !== 1) return null;
  const radius = toPositiveInt(row.radius);
  const cell = toPositiveInt(row.cell);
  const kills = toNonNegativeInt(row.kills);
  const deaths = toNonNegativeInt(row.deaths);
  if (radius === null || cell === null || kills === null || deaths === null) return null;
  if (!Array.isArray(row.cells)) return null;
  const cells: HeatCell[] = [];
  for (const item of row.cells) {
    if (!Array.isArray(item) || item.length !== 4) return null;
    const ix = toInt(item[0]);
    const iy = toInt(item[1]);
    const cellKills = toNonNegativeInt(item[2]);
    const cellDeaths = toNonNegativeInt(item[3]);
    if (ix === null || iy === null || cellKills === null || cellDeaths === null) return null;
    if (cellKills === 0 && cellDeaths === 0) continue;
    cells.push({ ix, iy, kills: cellKills, deaths: cellDeaths });
  }
  return { radius, cell, kills, deaths, cells };
}

function toInt(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && Number.isFinite(value) ? value : null;
}

function toNonNegativeInt(value: unknown): number | null {
  const n = toInt(value);
  return n !== null && n >= 0 ? n : null;
}

function toPositiveInt(value: unknown): number | null {
  const n = toInt(value);
  return n !== null && n > 0 ? n : null;
}
