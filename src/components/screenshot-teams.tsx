import { useEffect, useState } from "react";
import { HeroPortrait } from "@/components/hero-portrait";
import {
  assignNamedTeams,
  chooseRowHero,
  findHeroNameRows,
  indexFace,
  matchHeroName,
  portraitId,
  readPortraitColumn,
  type FaceHit,
  type FaceRef,
  type NameCrop,
  type RgbImage,
  type TeamRead,
} from "@/lib/screenshot-teams";

type Hero = { id: number; name: string };

const faceCache = new Map<number, Promise<FaceRef | null>>();

export function ScreenshotTeams({
  heroes,
  onApply,
}: {
  heroes: Hero[];
  onApply: (yours: number[], theirs: number[]) => void;
}) {
  const [status, setStatus] = useState("Drop a scoreboard, or paste one.");
  const [busy, setBusy] = useState(false);
  const [read, setRead] = useState<TeamRead | null>(null);
  const byId = new Map(heroes.map((hero) => [hero.id, hero]));

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const file = imageFile(event.clipboardData);
      if (!file) return;
      event.preventDefault();
      void take(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  async function take(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) {
      setStatus("That file is not an image.");
      return;
    }
    setBusy(true);
    setRead(null);
    setStatus("Matching the portraits beside the names…");
    try {
      const [shot, faces] = await Promise.all([loadShot(file), loadFaces(heroes)]);
      const rows = findHeroNameRows(shot);
      if (rows.length === 0) {
        setStatus(
          "No team list in that shot. Use the scoreboard or the pause-screen list. The in-game top bar is a skin, so those circles are not matched.",
        );
        return;
      }
      const groups = groupRows(rows);
      await frame();
      const portraits = readPortraitColumn(
        shot,
        groups.map((group) => group[0].anchor),
        groups.map((group) => group[0].x),
        faces,
      );
      const named: { id: number | null; anchor: number; luma: number }[] = [];
      for (let i = 0; i < groups.length; i++) {
        const face = portraits[i];
        let readId: number | null = null;
        if (!unmistakable(face)) {
          setStatus(`Reading name ${i + 1} of ${groups.length}…`);
          const reads: { text: string; luma: number }[] = [];
          for (let j = 0; j < groups[i].length; j++) {
            const line = groups[i][j];
            let text = await readLine(shot, line);
            const last = j === groups[i].length - 1;
            if (last && matchHeroName(text, heroes) === null) text = await readLine(shot, line, 8);
            reads.push({ text, luma: line.luma });
          }
          readId = chooseRowHero(reads, heroes);
        }
        named.push({
          id: portraitId(face, readId),
          anchor: groups[i][0].anchor,
          luma: groups[i][0].luma,
        });
      }
      const next = assignNamedTeams(named);
      const found = next.yours.length + next.theirs.length;
      if (found < 4) {
        setStatus("The names were too unclear to fill a team. Crop closer to the scoreboard and try again.");
        return;
      }
      setRead({ ...next, hits: [] });
      const fromPictures = named.filter((row, index) => row.id !== null && unmistakable(portraits[index])).length;
      setStatus(
        fromPictures > 0
          ? `Read ${found} heroes. ${fromPictures} came from the portrait next to the name, including any name the text missed. Your side is the highlighted row. Swap on the page if that is backwards.`
          : `Read ${found} heroes from the names. Your side is the highlighted row's team. Swap on the page if that is backwards.`,
      );
    } catch {
      setStatus("Could not read that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <h2 className="font-display text-2xl text-fg">Read a screenshot</h2>
      <p className="mt-3 max-w-2xl text-pretty text-sm text-muted">
        Paste the scoreboard, or the team list on the pause screen. The portrait beside each name is
        matched to the hero, and the printed name is used when that picture is not clear. A lit row
        marks your side. The in-game top bar is skipped, because those circles follow the equipped
        skin and are not the hero icon.
      </p>
      <label
        className="mt-4 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-card border border-dashed border-line px-4 py-4 text-center text-sm text-muted"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void take(event.dataTransfer.files[0]);
        }}
        onPaste={(event) => {
          const file = imageFile(event.clipboardData);
          if (file) void take(file);
        }}
      >
        {status}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            void take(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      {read && (read.yours.length > 0 || read.theirs.length > 0) ? (
        <div className="mt-4 grid gap-3">
          <SideLine title="Your side" ids={read.yours} byId={byId} />
          <SideLine title="Their side" ids={read.theirs} byId={byId} />
          <button
            type="button"
            onClick={() => onApply(read.yours, read.theirs)}
            className="min-h-11 rounded-card bg-amber px-4 text-sm font-medium text-ink"
          >
            Use these teams
          </button>
        </div>
      ) : null}
    </section>
  );
}

function unmistakable(hit: FaceHit | null): boolean {
  return hit !== null && hit.score >= 0.88 && hit.score - hit.runner >= 0.22;
}

function groupRows(rows: NameCrop[]) {
  const groups: NameCrop[][] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last[0].anchor === row.anchor) last.push(row);
    else groups.push([row]);
  }
  return groups;
}

function frame() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function SideLine({
  title,
  ids,
  byId,
}: {
  title: string;
  ids: number[];
  byId: Map<number, Hero>;
}) {
  return (
    <div>
      <p className="text-sm text-muted">{title}</p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {ids.map((id) => {
          const hero = byId.get(id);
          return (
            <li key={id} className="flex items-center gap-2 rounded-card bg-bg px-2 py-1">
              <HeroPortrait id={id} name={hero?.name ?? String(id)} />
              <span className="text-sm text-fg">{hero?.name ?? id}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function imageFile(data: DataTransfer | null): File | undefined {
  if (!data) return;
  const direct = [...data.files].find((file) => file.type.startsWith("image/"));
  if (direct) return direct;
  for (const item of data.items) {
    if (!item.type.startsWith("image/")) continue;
    return item.getAsFile() ?? undefined;
  }
}

async function loadFaces(heroes: Hero[]) {
  const loaded = await Promise.all(heroes.map((hero) => loadFace(hero.id)));
  return loaded.filter((face): face is FaceRef => face !== null);
}

function loadFace(id: number): Promise<FaceRef | null> {
  const cached = faceCache.get(id);
  if (cached) return cached;
  const pending = readFace(id);
  faceCache.set(id, pending);
  return pending;
}

async function readFace(id: number): Promise<FaceRef | null> {
  const response = await fetch(`/heroes/${id}.webp`);
  if (!response.ok) return null;
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bitmap.close();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return indexFace(id, { w: canvas.width, h: canvas.height, data: pixels.data });
}

async function loadShot(file: File): Promise<RgbImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const pixels = ctx.getImageData(0, 0, w, h);
  return { w, h, data: pixels.data };
}

async function readLine(shot: RgbImage, row: NameCrop, scale = 5) {
  const canvas = lineCanvas(shot, row, scale);
  const worker = await names();
  const read = await worker.recognize(canvas);
  return read.data.text;
}

function lineCanvas(shot: RgbImage, row: NameCrop, scale = 5) {
  const pad = 40;
  const canvas = document.createElement("canvas");
  canvas.width = row.w * scale + pad * 2;
  canvas.height = row.h * scale + pad * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const image = ctx.createImageData(row.w, row.h);
  let lo = 255;
  let hi = 0;
  const samples: number[] = [];
  for (let y = 0; y < row.h; y++) {
    for (let x = 0; x < row.w; x++) {
      const from = ((row.y + y) * shot.w + row.x + x) * 4;
      const luma = (shot.data[from] + shot.data[from + 1] + shot.data[from + 2]) / 3;
      samples.push(luma);
      if (luma < lo) lo = luma;
      if (luma > hi) hi = luma;
    }
  }
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < samples.length; i++) {
    const ink = 255 - Math.round(((samples[i] - lo) / span) * 255);
    const to = i * 4;
    image.data[to] = ink;
    image.data[to + 1] = ink;
    image.data[to + 2] = ink;
    image.data[to + 3] = 255;
  }
  const source = document.createElement("canvas");
  source.width = row.w;
  source.height = row.h;
  source.getContext("2d")?.putImageData(image, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, pad, pad, row.w * scale, row.h * scale);
  return canvas;
}

type Reader = { recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }> };

let reader: Promise<Reader> | null = null;

function names() {
  reader ??= import("tesseract.js").then(async ({ createWorker, PSM }) => {
    const worker = await createWorker("eng");
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_LINE,
      user_defined_dpi: "300",
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz &",
    });
    return worker;
  });
  return reader;
}