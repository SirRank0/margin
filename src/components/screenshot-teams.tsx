import { useEffect, useRef, useState } from "react";
import { HeroPortrait } from "@/components/hero-portrait";
import { heroPortraits } from "@/data/hero-portraits";
import { readTeams, type RgbImage, type TeamRead } from "@/lib/screenshot-teams";

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
  const rootRef = useRef<HTMLDetailsElement>(null);
  const byId = new Map(heroes.map((hero) => [hero.id, hero]));

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (!rootRef.current?.open) return;
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
    setStatus("Reading portraits…");
    try {
      const shot = await loadShot(file);
      const icons = await loadIcons(heroes);
      const next = readTeams(shot, icons);
      setRead(next);
      const found = next.yours.length + next.theirs.length;
      setStatus(
        found === 0
          ? "No portraits matched. Use a scoreboard or the top bar, with the hero pictures visible."
          : `Matched ${found}. The left or top group is your side. Swap on the page if that is backwards.`,
      );
    } catch {
      setStatus("Could not read that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details ref={rootRef} className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <summary className="cursor-pointer font-display text-2xl text-fg">Read a screenshot</summary>
      <p className="mt-3 max-w-2xl text-pretty text-sm text-muted">
        Paste a scoreboard or the top bar. The page matches the portraits to the hero pictures and
        fills both sides. It does not read lanes, items, or player names. A portrait that is too
        small, or covered, is skipped.
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
    </details>
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
  const scale = Math.min(1, 560 / Math.max(bitmap.width, bitmap.height));
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

const iconCache = new Map<number, Promise<RgbImage | null>>();

async function loadIcons(heroes: Hero[]) {
  const icons = await Promise.all(
    heroes.map(async (hero) => {
      const url = heroPortraits[hero.id]?.icon;
      if (!url) return null;
      const image = await loadIcon(hero.id, url);
      return image ? { id: hero.id, image } : null;
    }),
  );
  return icons.filter((icon): icon is { id: number; image: RgbImage } => icon !== null);
}

function loadIcon(id: number, url: string) {
  const cached = iconCache.get(id);
  if (cached) return cached;
  const pending = fetchIcon(url);
  iconCache.set(id, pending);
  return pending;
}

async function fetchIcon(url: string): Promise<RgbImage | null> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  try {
    await img.decode();
  } catch {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#101218";
  ctx.fillRect(0, 0, 48, 48);
  ctx.drawImage(img, 0, 0, 48, 48);
  const pixels = ctx.getImageData(0, 0, 48, 48);
  return { w: 48, h: 48, data: pixels.data };
}
