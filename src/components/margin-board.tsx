import { useMemo, useState } from "react";
import { ArrowLeftRight, RotateCcw, Search, X } from "lucide-react";
import { scoreLobby, wilson, type Score, type ScorePart } from "@/lib/odds";
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
  const score = useMemo(
    () => scoreLobby(meta, yours, theirs),
    [meta, yours, theirs],
  );

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
            Pick both lineups. The chance is a shrunk log-odds model of those heroes, the
            leftover from allies sharing a team, and the leftover from each enemy matchup.
            Items are shown, but not added in. It is not a ban solver.
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
          <button
            type="button"
            onClick={swap}
            className="inline-flex min-h-11 items-center gap-2 rounded-card border border-line bg-surface px-3 text-sm text-fg"
          >
            <ArrowLeftRight className="size-4" aria-hidden />
            Swap
          </button>
          <button
            type="button"
            onClick={clear}
            className="inline-flex min-h-11 items-center gap-2 rounded-card border border-line bg-surface px-3 text-sm text-fg"
          >
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
            <p className="font-display text-5xl tabular-nums text-fg sm:text-6xl">
              {pct(score.probability)}
            </p>
          </div>
          <p className="text-right text-sm text-muted">
            Their side
            <span className="mt-1 block font-display text-2xl tabular-nums text-fg">
              {pct(1 - score.probability)}
            </span>
          </p>
        </div>
        <p className="mt-3 text-sm text-pretty text-muted">
          Approximate 95% interval {pct(score.low)}–{pct(score.high)}, if each record were its own
          sample. Shared matches make the true interval wider. {slice.label} is the last 30 days
          {slice.id === "all"
            ? ", every rank mixed together."
            : " where both teams averaged that badge."}
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-enemy">
          <div
            className="h-full bg-ally transition-[width] duration-200"
            style={{ width: `${Math.round(score.probability * 1000) / 10}%` }}
          />
        </div>
        <Ledger score={score} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <TeamCard
          title="Your side"
          active={side === "yours"}
          ids={yours}
          byId={byId}
          onFocus={() => setSide("yours")}
          onRemove={(id) => removeHero("yours", id)}
        />
        <TeamCard
          title="Their side"
          active={side === "theirs"}
          ids={theirs}
          byId={byId}
          onFocus={() => setSide("theirs")}
          onRemove={(id) => removeHero("theirs", id)}
        />
      </div>

      <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl text-fg">Heroes</h2>
            <p className="text-sm text-muted">
              Adding to {side === "yours" ? "your side" : "their side"}
              {side === "yours" && yoursFull ? " — that side is full" : ""}
              {side === "theirs" && theirs.length >= SEATS ? " — that side is full" : ""}
            </p>
          </div>
          <label className="flex min-h-11 items-center gap-2 rounded-card border border-line bg-bg px-3 sm:w-64">
            <Search className="size-4 text-muted" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="w-full bg-transparent py-2 text-sm text-fg outline-none placeholder:text-muted"
            />
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((hero) => {
            const used = taken.has(hero.id);
            const rate = wilson(hero.wins, hero.matches);
            return (
              <button
                key={hero.id}
                type="button"
                disabled={used || (side === "yours" ? yoursFull : theirs.length >= SEATS)}
                onClick={() => addHero(hero.id)}
                title={`${pct(rate.low)}–${pct(rate.high)} Wilson 95% interval`}
                className="flex min-h-14 items-center gap-3 rounded-card border border-line bg-raised px-3 py-2 text-left disabled:opacity-40"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-bg font-medium text-amber">
                  {monogram(hero.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-fg">{hero.name}</span>
                  <span className="block tabular-nums text-sm text-muted">
                    {pct(rate.p)} · {compact(hero.matches)}
                  </span>
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
              <span
                key={item.id}
                title={`${pct(rate.low)}–${pct(rate.high)} Wilson 95% interval, ${compact(item.matches)} matches`}
                className="inline-flex min-h-11 items-center rounded-full border border-line bg-raised px-3 text-sm text-fg"
              >
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

function Ledger({ score }: { score: Score }) {
  const heroes = score.parts.filter((part) => part.kind === "hero");
  const pairs = score.parts.filter((part) => part.kind === "pair");
  const counters = score.parts
    .filter((part) => part.kind === "counter")
    .filter((part) => Math.abs(part.leftover) >= 0.01 || Math.abs(part.marginal) >= 0.003)
    .sort((a, b) => Math.abs(b.marginal) - Math.abs(a.marginal));
  const hiddenCounters =
    score.parts.filter((part) => part.kind === "counter").length - counters.length;

  return (
    <div className="mt-5 border-t border-line pt-5">
      <h2 className="font-display text-2xl text-fg">How this number is built</h2>
      <p className="mt-1 max-w-2xl text-pretty text-sm text-muted">
        Same layout as a worked sum: the term, the arithmetic, and what it does. A pair is not
        entered as its win rate. That win rate is only compared with the rate the two heroes
        already implied.
      </p>
      <ol className="mt-4 grid gap-2 text-sm">
        <MethodRow
          who="Hero"
          math="θ = logit(win rate) − logit(field)"
          say="Each pick adds its own rate. Theirs is subtracted. Thin samples are pulled toward the field."
        />
        <MethodRow
          who="Pair"
          math="r = logit(together) − θ₁ − θ₂"
          say="Only the gap after both rates. More together than that is synergy. Less is anti-synergy. A typical pair is pulled to zero."
        />
        <MethodRow
          who="Matchup"
          math="d = logit(versus) − θyou + θthem"
          say="Only the gap after both strengths. A usual matchup is pulled to zero."
        />
        <MethodRow
          who="Chance"
          math="σ( Σθyou + Σryou − Σθthem − Σrthem + Σd )"
          say="The sum is on a log-odds scale, then turned back into a chance. The point shifts share that curve, so they do not add up to the gap from 50%."
        />
      </ol>
      {score.parts.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          No heroes yet, so every term is zero and the chance stays at one half.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          <TermGroup title="Heroes" parts={heroes} />
          <TermGroup
            title="Pairs"
            parts={pairs}
            empty="Add two heroes on the same side to see a pair."
          />
          <TermGroup
            title="Matchups"
            parts={counters}
            empty="Add a hero on each side to see a matchup."
            note={
              hiddenCounters > 0
                ? `${hiddenCounters} other matchups were within 0.3 points of what the two strengths already predict, so they add nothing.`
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}

function MethodRow({ who, math, say }: { who: string; math: string; say: string }) {
  return (
    <li className="grid gap-1 border-l-2 border-amber py-2 pl-3 sm:grid-cols-[5.5rem_1fr] sm:gap-3">
      <p className="font-medium text-amber">{who}</p>
      <p>
        <span className="block text-fg">{math}</span>
        <span className="mt-0.5 block text-pretty text-muted">{say}</span>
      </p>
    </li>
  );
}

function TermGroup({
  title,
  parts,
  empty,
  note,
}: {
  title: string;
  parts: ScorePart[];
  empty?: string;
  note?: string;
}) {
  return (
    <section>
      <h3 className="text-sm font-medium text-fg">{title}</h3>
      {parts.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {parts.map((part) => (
            <TermRow key={`${part.kind}-${part.side}-${part.label}`} part={part} />
          ))}
        </ul>
      )}
      {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
    </section>
  );
}

function TermRow({ part }: { part: ScorePart }) {
  const reading = readPart(part);
  const tone =
    part.marginal > 0.0005 ? "text-ally" : part.marginal < -0.0005 ? "text-enemy" : "text-muted";
  return (
    <li className="grid gap-1 py-3 sm:grid-cols-[6.5rem_1fr_auto] sm:items-baseline sm:gap-3">
      <p className="text-sm font-medium text-amber">{reading.who}</p>
      <p className="min-w-0">
        <span className="block text-sm text-fg">{part.label}</span>
        <span className="mt-0.5 block text-pretty text-sm tabular-nums text-fg">{reading.math}</span>
        <span className="mt-0.5 block text-pretty text-sm text-muted">{reading.say}</span>
      </p>
      <p className={`text-sm tabular-nums ${tone}`}>{signedPoints(part.marginal)}</p>
    </li>
  );
}

function readPart(part: ScorePart) {
  const gap = part.observed - part.predicted;
  if (part.kind === "hero") {
    const yours = part.side === "yours";
    return {
      who: yours ? "Your hero" : "Their hero",
      math: `${pct(part.observed)} is ${signedLog(part.leftover)} log-odds`,
      say: yours
        ? `Own win rate over ${compact(part.matches)} games, against a field of ${pct(part.predicted)}. Added to your side.`
        : `Own win rate over ${compact(part.matches)} games. Subtracted, because this hero is on their side.`,
    };
  }
  if (part.kind === "pair") {
    const yours = part.side === "yours";
    return {
      who: yours ? "Your pair" : "Their pair",
      math: `together ${pct(part.observed)} − predicted ${pct(part.predicted)} = ${signedPoints(gap)}`,
      say: pairSay(part, yours),
    };
  }
  return {
    who: "Matchup",
    math: `versus ${pct(part.observed)} − predicted ${pct(part.predicted)} = ${signedPoints(gap)}`,
    say: `Only the gap after both strengths, over ${compact(part.matches)} games. Shrinkage keeps ${signedLog(part.leftover)} log-odds. A usual matchup is zero.`,
  };
}

function pairSay(part: ScorePart, yours: boolean) {
  const better = part.leftover > 0.005;
  const worse = part.leftover < -0.005;
  const gap =
    better
      ? "They win more together than their own rates already counted."
      : worse
        ? "They win less together than their own rates already counted."
        : "Together they land on what their own rates already counted.";
  const kept = `Shrinkage keeps ${signedLog(part.leftover)} log-odds of that gap, from ${compact(part.matches)} games.`;
  const side = yours
    ? "It is your pair, so a positive gap raises your chance."
    : "It is their pair, so a positive gap is subtracted and a negative gap raises your chance.";
  return `${gap} ${kept} ${side}`;
}

function signedLog(value: number) {
  const text = Math.abs(value).toFixed(3);
  if (value > 0) return `+${text}`;
  if (value < 0) return `−${text}`;
  return "0";
}

function signedPoints(marginal: number) {
  const points = Math.round(marginal * 1000) / 10;
  const body = Math.abs(points).toFixed(1);
  if (points > 0) return `+${body} pt`;
  if (points < 0) return `−${body} pt`;
  return "0.0 pt";
}

function TeamCard({
  title,
  active,
  ids,
  byId,
  onFocus,
  onRemove,
}: {
  title: string;
  active: boolean;
  ids: number[];
  byId: Map<number, { id: number; name: string; wins: number; matches: number }>;
  onFocus: () => void;
  onRemove: (id: number) => void;
}) {
  const seats = Array.from({ length: SEATS }, (_, index) => ids[index] ?? null);
  return (
    <section
      className={`rounded-card border p-4 ${active ? "border-amber bg-surface" : "border-line bg-surface"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-fg">{title}</h2>
        <button
          type="button"
          onClick={onFocus}
          className={`min-h-11 rounded-full px-3 text-sm ${
            active ? "bg-amber text-ink" : "border border-line text-fg"
          }`}
        >
          {active ? "Adding here" : "Add here"}
        </button>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {seats.map((id, index) => {
          const hero = id == null ? null : byId.get(id);
          return (
            <li key={index}>
              {hero ? (
                <button
                  type="button"
                  onClick={() => onRemove(hero.id)}
                  className="flex min-h-14 w-full items-center justify-between gap-2 rounded-card bg-raised px-3 text-left"
                >
                  <span className="truncate text-sm font-medium text-fg">{hero.name}</span>
                  <X className="size-4 shrink-0 text-muted" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onFocus}
                  className="flex min-h-14 w-full items-center rounded-card border border-dashed border-line px-3 text-sm text-muted"
                >
                  Empty seat
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
