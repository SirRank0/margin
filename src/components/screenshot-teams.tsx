import { useEffect, useState } from "react";
import { HeroPortrait } from "@/components/hero-portrait";
import {
  chooseRowHero,
  findHeroNameRows,
  type NameCrop,
  type RgbImage,
} from "@/lib/screenshot-teams";
import type { ScreenRead, SlotRead } from "@/lib/screenshot-read";

type Hero = { id: number; name: string };

type Seat = SlotRead & { pick: number | null; byName?: boolean };

export function ScreenshotTeams({
  heroes,
  onApply,
}: {
  heroes: Hero[];
  onApply: (yours: number[], theirs: number[]) => void;
}) {
  const [status, setStatus] = useState("Drop a screenshot, or paste one.");
  const [busy, setBusy] = useState(false);
  const [seats, setSeats] = useState<Seat[] | null>(null);
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
    setSeats(null);
    setStatus("Matching the hero pictures…");
    try {
      const [shot, reader] = await Promise.all([
        loadShot(file),
        import("@/lib/screenshot-read"),
      ]);
      await frame();
      const rows = findHeroNameRows(shot);
      const bank = reader.loadRefBank(heroes.map((hero) => hero.id));
      const read = reader.readScreenshot(shot, bank, rows);
      if (!read) {
        setStatus(
          "No hero pictures found. Use the top bar during a match, the pause-screen player list, or the scoreboard.",
        );
        return;
      }
      const next: Seat[] = read.slots.map((slot) => ({
        ...slot,
        pick: slot.state === "sure" ? slot.id : null,
      }));
      if (
        read.layout === "list" &&
        next.some((seat) => seat.state === "unsure")
      ) {
        await checkNames(shot, rows, next, read);
      }
      setSeats(next);
      setStatus(summary(next));
    } catch {
      setStatus("Could not read that image.");
    } finally {
      setBusy(false);
    }
  }

  /** On a team list, an unsure picture can be settled by the printed hero name beside it. */
  async function checkNames(
    shot: RgbImage,
    rows: NameCrop[],
    next: Seat[],
    read: ScreenRead,
  ) {
    const ys = read.slots.map((slot) => slot.y ?? 0).sort((a, b) => a - b);
    const pitch =
      ys.length > 1
        ? (ys[ys.length - 1] - ys[0]) / Math.max(1, ys.length - 1)
        : 40;
    for (const seat of next) {
      if (seat.state !== "unsure" || seat.y === undefined) continue;
      const lines = rows.filter(
        (row) => Math.abs(row.y + row.h / 2 - (seat.y ?? 0)) < pitch * 0.5,
      );
      if (lines.length === 0) continue;
      setStatus("Checking a printed name…");
      const reads: { text: string; luma: number }[] = [];
      for (const line of lines)
        reads.push({ text: await readLine(shot, line), luma: line.luma });
      const named = chooseRowHero(reads, heroes);
      if (named === null) continue;
      if (seat.choices.includes(named)) {
        seat.pick = named;
        seat.byName = true;
      }
    }
  }

  function choose(index: number, id: number | null) {
    setSeats(
      (current) =>
        current?.map((seat, i) =>
          i === index ? { ...seat, pick: id } : seat,
        ) ?? null,
    );
  }

  const yours = seats?.filter((seat) => seat.side === "yours") ?? [];
  const theirs = seats?.filter((seat) => seat.side === "theirs") ?? [];

  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <h2 className="font-display text-2xl text-fg">Read a screenshot</h2>
      <p className="mt-3 max-w-2xl text-pretty text-sm text-muted">
        Paste the top bar during a match, the player list on the pause screen,
        or the scoreboard. Each hero picture is matched to the hero. If a
        picture is not a clear match, for example a skin that changes the look,
        you pick that hero yourself. An empty seat stays empty. The left side of
        the top bar, the top list on the pause screen, and the lit row on the
        scoreboard are your side.
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
      {seats ? (
        <div className="mt-4 grid gap-3">
          <SideLine
            title="Your side"
            seats={yours}
            all={seats}
            heroes={heroes}
            byId={byId}
            onPick={choose}
          />
          <SideLine
            title="Their side"
            seats={theirs}
            all={seats}
            heroes={heroes}
            byId={byId}
            onPick={choose}
          />
          <button
            type="button"
            onClick={() => onApply(picked(yours), picked(theirs))}
            className="min-h-11 rounded-card bg-amber px-4 text-sm font-medium text-ink"
          >
            Use these teams
          </button>
        </div>
      ) : null}
    </section>
  );
}

function picked(seats: Seat[]) {
  const ids: number[] = [];
  for (const seat of seats)
    if (seat.pick !== null && !ids.includes(seat.pick)) ids.push(seat.pick);
  return ids;
}

function summary(seats: Seat[]) {
  const sure = seats.filter((seat) => seat.state === "sure").length;
  const byName = seats.filter((seat) => seat.byName).length;
  const unsure = seats.filter(
    (seat) => seat.state === "unsure" && !seat.byName,
  ).length;
  const missing = seats.filter((seat) => seat.state === "missing").length;
  const parts = [`Matched ${sure} of ${seats.length} heroes by picture.`];
  if (byName > 0) parts.push(`${byName} more from the printed name.`);
  if (unsure > 0)
    parts.push(
      `${unsure} ${unsure === 1 ? "picture is" : "pictures are"} not clear, so pick ${unsure === 1 ? "that hero" : "those heroes"} below.`,
    );
  if (missing > 0)
    parts.push(
      `${missing} ${missing === 1 ? "seat is" : "seats are"} empty, likely a player who has not loaded in.`,
    );
  return parts.join(" ");
}

function frame() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function SideLine({
  title,
  seats,
  all,
  heroes,
  byId,
  onPick,
}: {
  title: string;
  seats: Seat[];
  all: Seat[];
  heroes: Hero[];
  byId: Map<number, Hero>;
  onPick: (index: number, id: number | null) => void;
}) {
  const sorted = [...heroes].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div>
      <p className="text-sm text-muted">{title}</p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {seats.map((seat) => {
          const index = all.indexOf(seat);
          const key = `${seat.side}-${seat.seat}`;
          if (seat.state === "missing") {
            return (
              <li
                key={key}
                className="flex min-h-12 items-center rounded-card border border-dashed border-line px-3 py-1 text-sm text-muted"
              >
                Empty seat
              </li>
            );
          }
          if (seat.state === "sure") {
            const hero = seat.pick === null ? undefined : byId.get(seat.pick);
            return (
              <li
                key={key}
                className="flex items-center gap-2 rounded-card bg-bg px-2 py-1"
              >
                {seat.pick !== null ? (
                  <HeroPortrait
                    id={seat.pick}
                    name={hero?.name ?? String(seat.pick)}
                  />
                ) : null}
                <span className="text-sm text-fg">
                  {hero?.name ?? seat.pick}
                </span>
              </li>
            );
          }
          const guesses = seat.choices.filter((id) => byId.has(id));
          const hero = seat.pick === null ? undefined : byId.get(seat.pick);
          return (
            <li
              key={key}
              className="flex items-center gap-2 rounded-card border border-amber/60 bg-bg px-2 py-1"
            >
              {seat.pick !== null ? (
                <HeroPortrait
                  id={seat.pick}
                  name={hero?.name ?? String(seat.pick)}
                />
              ) : null}
              <label className="flex flex-col text-xs text-muted">
                {seat.byName
                  ? "From the printed name"
                  : "Not sure, pick a hero"}
                <select
                  className="mt-0.5 min-h-9 rounded-card border border-line bg-surface px-2 text-sm text-fg"
                  value={seat.pick ?? ""}
                  onChange={(event) =>
                    onPick(
                      index,
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                    )
                  }
                >
                  <option value="">Leave empty</option>
                  {guesses.length > 0 ? (
                    <optgroup label="Closest pictures">
                      {guesses.map((id) => (
                        <option key={`g${id}`} value={id}>
                          {byId.get(id)?.name ?? id}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  <optgroup label="All heroes">
                    {sorted.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
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

/** The reader is tuned on 1080-pixel-tall screens, so a full-screen shot is scaled to that height first. */
async function loadShot(file: File): Promise<RgbImage> {
  const bitmap = await createImageBitmap(file);
  const aspect = bitmap.width / bitmap.height;
  const fullScreen = aspect >= 1.25 && aspect <= 2.5;
  const scale = fullScreen
    ? 1080 / bitmap.height
    : Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingQuality = "high";
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
      const luma =
        (shot.data[from] + shot.data[from + 1] + shot.data[from + 2]) / 3;
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

type Reader = {
  recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }>;
};

let reader: Promise<Reader> | null = null;

function names() {
  reader ??= import("tesseract.js").then(async ({ createWorker, PSM }) => {
    const worker = await createWorker("eng");
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_LINE,
      user_defined_dpi: "300",
      tessedit_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz &",
    });
    return worker;
  });
  return reader;
}
