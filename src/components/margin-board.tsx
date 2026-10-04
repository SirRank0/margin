import { useMemo, useState } from "react";
import { ArrowLeftRight, RotateCcw, Search, X } from "lucide-react";
import { scoreLobby, wilson } from "@/lib/odds";
import { rankSlices } from "@/data/margin-ranks";

const SEATS = 6;

type Side = "yours" | "theirs";

function pct(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function compact(matches: number) {
  if (matches >= 1_000_000) return `${(matches / 1_000_000).toFixed(1)}m`;
  if (matches >= 1000) return `${Math.round(matches / 1000)}k`;
  return String(matches);
}

function monogram(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function MarginBoard() {
  const [rankId, setRankId] = useState(rankSlices[0].id);
  const slice = rankSlices.find((row) => row.id === rankId) ?? rankSlices[0];
  const meta = slice.meta;
  const [yours, setYours] = useState<number[]>([]);
  const [theirs, setTheirs] = useState<number[]>([]);
  const [side, setSide] = useState<Side>("yours");
  const [query, setQuery] = useState("");

  const byId = useMemo(() => new Map(meta.heroes.map((hero) => [hero.id, hero])), [meta.heroes]);
  const taken = useMemo(() => new Set([...yours, ...theirs]), [yours, theirs]);
  const score = useMemo(() => scoreLobby(meta, yours, theirs), [meta, yours, theirs]);

  const shown = meta.heroes.filter((hero) =>
    hero.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function addHero(id: number) {
    const list = side === "yours" ? yours : theirs;
    const setList = side === "yours" ? setYours : setTheirs;
    if (taken.has(id) || list.length >= SEATS) return;
    setList([...list, id]);
    if (list.length + 1 >= SEATS && side === "yours" && theirs.length < SEATS) {
      setSide("theirs");
    }
  }

  function removeHero(which: Side, id: number) {
    const setList = which === "yours" ? setYours : setTheirs;
    setList((current) => current.filter((hero) => hero !== id));
  }

  function clear() {
    setYours([]);
    setTheirs([]);
    setSide("yours");
  }

  function swap() {
    setYours(theirs);
    setTheirs(yours);
  }

  const yoursFull = yours.length >= SEATS;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-medium tracking-wide text-amber uppercase">Margin</p>
          <h1 className="mt-1 font-display text-4xl text-fg sm:text-5xl">Comp odds</h1>
          <p className="mt-2 text-pretty text-muted">
            Pick both lineups. The chance is a shrunk log-odds model of those heroes and the
            leftover from their pairs. Items are shown, but not added in. It is not a ban solver.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Rank
            <select
              value={rankId}
              onChange={(event) => setRankId(event.target.value)}
              className="min-h-11 rounded-card border border-line bg-bg px-3 text-sm text-fg"
            >
              {rankSlices.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={swap} className="inline-flex min-h-11 items-center gap-2 rounded-card border border-line bg-surface px-3 text-sm text-fg">
              <ArrowLeftRight className="size-4" aria-hidden />
              Swap
            </button>
            <button type="button" onClick={clear} className="inline-flex min-h-11 items-center gap-2 rounded-card border border-line bg-surface px-3 text-sm text-fg">
              <RotateCcw className="size-4" aria-hidden />
              Clear
            </button>
          </div>
        </div>
      </header>
      <section className="rounded-card border border-line bg-surface p-4 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Your side</p>
            <p className="font-display text-5xl tabular-nums text-fg sm:text-6xl">{pct(score.probability)}</p>
          </div>
          <p className="text-right text-sm text-muted">
            Their side
            <span className="mt-1 block font-display text-2xl tabular-nums text-fg">{pct(1 - score.probability)}</span>
          </p>
        </div>
        <p className="mt-3 text-sm text-pretty text-muted">
          Approximate 95% interval {pct(score.low)}–{pct(score.high)}, if each record were its own
          sample. Shared matches make the true interval wider. {slice.label} is the last 30 days
          {slice.id === "all" ? ", every rank mixed together." : " where both teams averaged that badge."}
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-enemy">
          <div className="h-full bg-ally transition-[width] duration-200" style={{ width: `${Math.round(score.probability * 1000) / 10}%` }} />
        </div>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2">
          {score.steps.map((step, index) => (
            <li key={step.label} className="rounded-card bg-raised px-3 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-fg">{index + 1}. {step.label}</p>
                <p className="tabular-nums text-sm text-amber">{pct(step.probability)}</p>
              </div>
              <p className="mt-1 text-sm text-pretty text-muted">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <TeamCard title="Your side" active={side === "yours"} ids={yours} byId={byId} onFocus={() => setSide("yours")} onRemove={(id) => removeHero("yours", id)} />
        <TeamCard title="Their side" active={side === "theirs"} ids={theirs} byId={byId} onFocus={() => setSide("theirs")} onRemove={(id) => removeHero("theirs", id)} />
      </div>
      <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl text-fg">Heroes</h2>
            <p className="text-sm text-muted">
              Adding to {side === "yours" ? "your side" : "their side"}
              {side === "yours" && yoursFull ? " \u2014 that side is full" : ""}
              {side === "theirs" && theirs.length >= SEATS ? " \u2014 that side is full" : ""}
            </p>
          </div>
          <label className="flex min-h-11 items-center gap-2 rounded-card border border-line bg-bg px-3 sm:w-64">
            <Search className="size-4 text-muted" aria-hidden />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="w-full bg-transparent py-2 text-sm text-fg outline-none placeholder:text-muted" />
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((hero) => {
            const used = taken.has(hero.id);
            const rate = wilson(hero.wins, hero.matches);
            return (
              <button key={hero.id} type="button" disabled={used || (side === "yours" ? yoursFull : theirs.length >= SEATS)} onClick={() => addHero(hero.id)} title={`${pct(rate.low)}\u2013${pct(rate.high)} Wilson 95% interval`} className="flex min-h-14 items-center gap-3 rounded-card border border-line bg-raised px-3 py-2 text-left disabled:opacity-40">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-bg font-medium text-amber">{monogram(hero.name)}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-fg">{hero.name}</span>
                  <span className="block tabular-nums text-sm text-muted">{pct(rate.p)} \u00b7 {compact(hero.matches)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-2xl text-fg">Items</h2>
        <p className="mt-1 max-w-2xl text-pretty text-sm text-muted">
          Associated win rate only, with a Wilson 95% interval. These are not in the chance above.
          Players buy them more often when the match is already going well, so the rate is not the
          effect of the item.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {meta.items.map((item) => {
            const rate = wilson(item.wins, item.matches);
            return (
              <span key={item.id} title={`${pct(rate.low)}\u2013${pct(rate.high)} Wilson 95% interval, ${compact(item.matches)} matches`} className="inline-flex min-h-11 items-center rounded-full border border-line bg-raised px-3 text-sm text-fg">
                {item.name}
                <span className="ml-2 tabular-nums text-muted">{pct(rate.p)}</span>
              </span>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function TeamCard({ title, active, ids, byId, onFocus, onRemove }: { title: string; active: boolean; ids: number[]; byId: Map<number, { id: number; name: string; wins: number; matches: number }>; onFocus: () => void; onRemove: (id: number) => void; }) {
  const seats = Array.from({ length: SEATS }, (_, index) => ids[index] ?? null);
  return (
    <section className={`rounded-card border p-4 ${active ? "border-amber bg-surface" : "border-line bg-surface"}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-fg">{title}</h2>
        <button type="button" onClick={onFocus} className={`min-h-11 rounded-full px-3 text-sm ${active ? "bg-amber text-ink" : "border border-line text-fg"}`}>
          {active ? "Adding here" : "Add here"}
        </button>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {seats.map((id, index) => {
          const hero = id == null ? null : byId.get(id);
          return (
            <li key={index}>
              {hero ? (
                <button type="button" onClick={() => onRemove(hero.id)} className="flex min-h-14 w-full items-center justify-between gap-2 rounded-card bg-raised px-3 text-left">
                  <span className="truncate text-sm font-medium text-fg">{hero.name}</span>
                  <X className="size-4 shrink-0 text-muted" aria-hidden />
                </button>
              ) : (
                <button type="button" onClick={onFocus} className="flex min-h-14 w-full items-center rounded-card border border-dashed border-line px-3 text-sm text-muted">Empty seat</button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
