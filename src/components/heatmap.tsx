import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { heatmapWindow } from "@/data/heatmap-window";
import { HEROES } from "@/lib/deadlock/heroes";
import { compareHeroNames } from "@/lib/hero-order";
import { HeroPortrait } from "@/components/hero-portrait";
import {
  MIN_KD_EVENTS,
  cellToImage,
  imageToWorld,
  kdEvents,
  kdOpacity,
  kdRatio,
  parseHeatmap,
  worldToCell,
  type HeatCell,
  type HeatmapGrid,
} from "@/lib/heatmap";

const VIEWS = [
  { id: "kills", label: "Kills" },
  { id: "deaths", label: "Deaths" },
  { id: "kd", label: "K/D" },
] as const;

type View = (typeof VIEWS)[number]["id"];

const ALL = "all";
const AMBER = { r: 224, g: 177, b: 90 };
const ROSE = { r: 208, g: 96, b: 86 };
const BLUE = { r: 106, g: 158, b: 192 };

type Rgb = { r: number; g: number; b: number };

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const u = Math.min(1, Math.max(0, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * u),
    g: Math.round(a.g + (b.g - a.g) * u),
    b: Math.round(a.b + (b.b - a.b) * u),
  };
}

function stamp(ctx: CanvasRenderingContext2D, px: number, py: number, radius: number, color: Rgb, alpha: number) {
  const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
  gradient.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha})`);
  gradient.addColorStop(0.45, `rgba(${color.r},${color.g},${color.b},${alpha * 0.55})`);
  gradient.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  ctx.fill();
}

function paint(ctx: CanvasRenderingContext2D, grid: HeatmapGrid, view: View) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  const radius = (grid.cell / (2 * grid.radius)) * width * 2.15;
  if (view === "kd") {
    const visible = grid.cells
      .map((cell) => ({ cell, ratio: kdRatio(cell) }))
      .filter((row): row is { cell: HeatCell; ratio: number } => row.ratio !== null);
    const maxEvents = Math.max(...visible.map((row) => kdEvents(row.cell)), MIN_KD_EVENTS + 1);
    for (const { cell, ratio } of visible) {
      const { px, py } = cellToImage(cell.ix, cell.iy, width, height, grid.radius, grid.cell);
      const log = ratio === Number.POSITIVE_INFINITY ? 2 : Math.max(-2, Math.min(2, Math.log2(ratio)));
      const color = mix(BLUE, AMBER, (log + 2) / 4);
      stamp(ctx, px, py, radius, color, kdOpacity(cell, maxEvents));
    }
    return;
  }
  const key = view === "kills" ? "kills" : "deaths";
  const max = Math.max(...grid.cells.map((cell) => cell[key]), 1);
  const color = view === "kills" ? AMBER : ROSE;
  for (const cell of grid.cells) {
    const value = cell[key];
    if (value <= 0) continue;
    const t = Math.log1p(value) / Math.log1p(max);
    const { px, py } = cellToImage(cell.ix, cell.iy, width, height, grid.radius, grid.cell);
    stamp(ctx, px, py, radius, color, 0.12 + 0.8 * t);
  }
}

function compact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return value.toLocaleString();
}

function ratioLabel(ratio: number | null) {
  if (ratio === null) return "too few fights";
  if (!Number.isFinite(ratio)) return "kills only";
  return `${ratio.toFixed(ratio >= 10 ? 1 : 2)} K/D`;
}

function viewBlurb(view: View) {
  if (view === "kills") return "Brighter amber marks places with more kills.";
  if (view === "deaths") return "Brighter red marks places with more deaths.";
  return "Amber means more kills than deaths there; blue means more deaths. Spots with only a handful of fights are hidden.";
}

export function HeatmapSection() {
  const heroes = useMemo(() => {
    const have = new Set<number>(heatmapWindow.heroes);
    return HEROES.filter((hero) => hero.released && have.has(hero.id)).sort((a, b) =>
      compareHeroNames(a.name, b.name),
    );
  }, []);
  const [heroKey, setHeroKey] = useState<string>(ALL);
  const [view, setView] = useState<View>("kills");
  const [grids, setGrids] = useState<Record<string, HeatmapGrid | "missing">>({});
  const [hover, setHover] = useState<{ x: number; y: number; cell: HeatCell | null } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const grid = grids[heroKey];
  const ready = grid && grid !== "missing" ? grid : null;
  const byCell = useMemo(() => {
    const map = new Map<string, HeatCell>();
    if (ready) {
      for (const cell of ready.cells) map.set(`${cell.ix},${cell.iy}`, cell);
    }
    return map;
  }, [ready]);
  const hero = heroes.find((row) => String(row.id) === heroKey);
  const who = heroKey === ALL ? "all heroes" : (hero?.name ?? "this hero");

  useEffect(() => {
    if (grids[heroKey] !== undefined) return;
    let live = true;
    const url = `${import.meta.env.BASE_URL}heatmaps/${heroKey}.json`;
    async function load() {
      try {
        const response = await fetch(url);
        if (!response.ok) return "missing" as const;
        return parseHeatmap(await response.json()) ?? "missing";
      } catch {
        return "missing" as const;
      }
    }
    void load().then((result) => {
      if (live) setGrids((current) => ({ ...current, [heroKey]: result }));
    });
    return () => {
      live = false;
    };
  }, [heroKey, grids]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;
    function draw() {
      if (!canvas || !frame) return;
      const size = Math.max(1, Math.round(frame.clientWidth));
      if (canvas.width !== size) {
        canvas.width = size;
        canvas.height = size;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (ready) paint(ctx, ready, view);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [ready, view]);

  function onMove(event: MouseEvent<HTMLDivElement>) {
    if (!ready) {
      setHover(null);
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const world = imageToWorld(x, y, bounds.width, bounds.height, ready.radius);
    const at = worldToCell(world.x, world.y, ready.cell);
    const cell = byCell.get(`${at.ix},${at.iy}`) ?? null;
    setHover({ x, y, cell });
  }

  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl text-fg">Heatmap</h2>
          <p className="mt-1 text-pretty text-sm text-muted">
            {viewBlurb(view)} {heatmapWindow.label}.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {hero ? <HeroPortrait id={hero.id} name={hero.name} /> : null}
          <label className="flex flex-col gap-1 text-sm text-muted">
            Show
            <select
              value={view}
              onChange={(event) => setView(event.target.value as View)}
              className="min-h-11 rounded-card border border-line bg-bg px-3 text-sm text-fg"
            >
              {VIEWS.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted">
            Hero
            <select
              value={heroKey}
              onChange={(event) => {
                setHeroKey(event.target.value);
                setHover(null);
              }}
              className="min-h-11 rounded-card border border-line bg-bg px-3 text-sm text-fg"
            >
              <option value={ALL}>All heroes</option>
              {heroes.map((row) => (
                <option key={row.id} value={String(row.id)}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start">
        <div
          ref={frameRef}
          className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-card border border-line bg-bg"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <img
            src={`${import.meta.env.BASE_URL}maps/minimap.png`}
            alt="Deadlock map"
            className="block h-full w-full object-contain"
          />
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
          {hover?.cell ? (
            <div
              className="pointer-events-none absolute z-10 rounded-card border border-line bg-bg/95 px-2 py-1 text-xs text-fg shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
              style={{
                left: Math.min(hover.x + 12, (frameRef.current?.clientWidth ?? 320) - 160),
                top: Math.max(8, hover.y - 40),
              }}
            >
              <p>
                {compact(hover.cell.kills)} kills · {compact(hover.cell.deaths)} deaths
              </p>
              <p className="text-muted">{ratioLabel(kdRatio(hover.cell))}</p>
            </div>
          ) : null}
        </div>
        <div className="text-sm text-muted">
          {!grid ? <p>Loading the map for {who}.</p> : null}
          {grid === "missing" ? <p>No heatmap is saved for {who} yet.</p> : null}
          {ready ? (
            <p className="tabular-nums">
              {compact(ready.kills)} kills · {compact(ready.deaths)} deaths
              {heroKey !== ALL ? ` for ${who}` : ""} in this window.
            </p>
          ) : null}
          <Legend view={view} />
        </div>
      </div>
    </section>
  );
}

function Legend({ view }: { view: View }) {
  if (view === "kd") {
    return (
      <div className="mt-3">
        <div
          className="h-2 w-48 rounded-full"
          style={{ background: "linear-gradient(to right, rgb(106,158,192), rgb(244,239,228), rgb(224,177,90))" }}
        />
        <div className="mt-1 flex w-48 justify-between text-xs">
          <span>More deaths</span>
          <span>Even</span>
          <span>More kills</span>
        </div>
      </div>
    );
  }
  const from = view === "kills" ? "rgba(224,177,90,0.2)" : "rgba(208,96,86,0.2)";
  const to = view === "kills" ? "rgb(224,177,90)" : "rgb(208,96,86)";
  const low = view === "kills" ? "Fewer kills" : "Fewer deaths";
  const high = view === "kills" ? "More kills" : "More deaths";
  return (
    <div className="mt-3">
      <div className="h-2 w-48 rounded-full" style={{ background: `linear-gradient(to right, ${from}, ${to})` }} />
      <div className="mt-1 flex w-48 justify-between text-xs">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
