import { useEffect, useState } from "react";
import { HeroPortrait } from "@/components/hero-portrait";
import {
  assignNamedTeams,
  findHeroNameRows,
  matchHeroName,
  type NameCrop,
  type RgbImage,
  type TeamRead,
} from "@/lib/screenshot-teams";

type Hero = { id: number; name: string };

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
    setStatus("Reading names…");
    try {
      const shot = await loadShot(file);
      const rows = findHeroNameRows(shot);
      if (rows.length === 0) {
        setStatus("No hero names found. Use the scoreboard. The top-bar circles are not read, because a skin does not match the hero picture.");
        return;
      }
      const named: { id: number; anchor: number; luma: number }[] = [];
      for (let i = 0; i < rows.length; i++) {
        setStatus(`Reading name ${i + 1} of ${rows.length}…`);
        const text = await readLine(shot, rows[i]);
        const id = matchHeroName(text, heroes);
        if (id !== null) named.push({ id, anchor: rows[i].anchor, luma: rows[i].luma });
      }
      const next = assignNamedTeams(named);
      const found = next.yours.length + next.theirs.length;
      if (found < 4) {
        setStatus("The names were too unclear to fill a team. Crop closer to the scoreboard and try again.");
        return;
      }
      setRead({ ...next, hits: [] });
      setStatus(
        `Read ${found} heroes from the names. Your side is the highlighted row's team. Swap on the page if that is backwards.`,
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
        Paste the scoreboard. The page reads the hero name under each player and fills both
        sides. Your side is the team with the highlighted row. It does not read the in-game top
        bar: those circles, especially with a skin, do not match the hero pictures.
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

async function readLine(shot: RgbImage, row: NameCrop) {
  const canvas = lineCanvas(shot, row);
  const worker = await names();
  const read = await worker.recognize(canvas);
  return read.data.text;
}

function lineCanvas(shot: RgbImage, row: NameCrop) {
  const scale = 4;
  const canvas = document.createElement("canvas");
  canvas.width = row.w * scale;
  canvas.height = row.h * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const image = ctx.createImageData(row.w, row.h);
  let lo = 255;
  let hi = 0;
  for (let y = 0; y < row.h; y++) {
    for (let x = 0; x < row.w; x++) {
      const from = ((row.y + y) * shot.w + row.x + x) * 4;
      const luma = (shot.data[from] + shot.data[from + 1] + shot.data[from + 2]) / 3;
      if (luma < lo) lo = luma;
      if (luma > hi) hi = luma;
    }
  }
  const span = Math.max(1, hi - lo);
  for (let y = 0; y < row.h; y++) {
    for (let x = 0; x < row.w; x++) {
      const from = ((row.y + y) * shot.w + row.x + x) * 4;
      const luma = (shot.data[from] + shot.data[from + 1] + shot.data[from + 2]) / 3;
      const ink = 255 - Math.round(((luma - lo) / span) * 255);
      const to = (y * row.w + x) * 4;
      image.data[to] = ink;
      image.data[to + 1] = ink;
      image.data[to + 2] = ink;
      image.data[to + 3] = 255;
    }
  }
  const source = document.createElement("canvas");
  source.width = row.w;
  source.height = row.h;
  source.getContext("2d")?.putImageData(image, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

type Reader = { recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }> };

let reader: Promise<Reader> | null = null;

function names() {
  reader ??= import("tesseract.js").then(async ({ createWorker, PSM }) => {
    const worker = await createWorker("eng");
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_LINE,
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz &",
    });
    return worker;
  });
  return reader;
}
