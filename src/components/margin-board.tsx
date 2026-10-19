import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, RotateCcw, Search, X } from "lucide-react";
import { AbilityPathSection } from "@/components/ability-path";
import { BuildCourier } from "@/components/build-courier";
import { HeroPortrait } from "@/components/hero-portrait";
import { scoreLobby, wilson, type Score, type ScorePart } from "@/lib/odds";
import { compareHeroNames, compareHeroSearch, heroSearchRank } from "@/lib/hero-order";
import { dataWindow } from "@/data/data-window";
import { laneMatchups } from "@/data/margin-lanes";
import { rankSlices } from "@/data/margin-ranks";

const SEATS = 6;
const LANE_NAMES = ["York", "Broadway", "Greenwich"] as const;
const TABS = [
  { id: "odds", label: "Comp odds" },
  { id: "order", label: "Ability order" },
  { id: "courier", label: "Build courier" },
] as const;

type Tab = (typeof TABS)[number]["id"];

type Side = "yours" | "theirs";
type LaneSlots = { yours: number[]; theirs: number[] };

function emptyLanes(): LaneSlots[] {
  return LANE_NAMES.map(() => ({ yours: [], theirs: [] }));
}

function pct(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function compact(matches: number) {
  if (matches >= 1_000_000) return `${(matches / 1_000_000).toFixed(1)}m`;
  if (matches >= 1000) return `${Math.round(matches / 1000)}k`;
  return String(matches);
}

export function MarginBoard() {
  const [tab, setTab] = useState<Tab>("odds");

  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.replace("#", "");
      setTab(TABS.some((item) => item.id === hash) ? (hash as Tab) : "odds");
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  function chooseTab(next: Tab) {
    setTab(next);
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", next === "odds" ? base : `${base}#${next}`);
  }

  return (
    <div>
      <SiteNav tab={tab} onChoose={chooseTab} />
      {tab === "odds" ? <OddsBoard /> : null}
      {tab === "order" ? (
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <AbilityPathSection />
        </main>
      ) : null}
      {tab === "courier" ? (
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <BuildCourier />
        </main>
      ) : null}
    </div>
  );
}

function SiteNav({ tab, onChoose }: { tab: Tab; onChoose: (tab: Tab) => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <p className="font-display text-lg tracking-[0.22em] text-amber uppercase">Margin</p>
        <nav aria-label="Sections" className="flex gap-1">
          {TABS.map((item) => {
            const selected = item.id === tab;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onChoose(item.id)}
                className={
                  "min-h-11 border-b-2 px-3 text-sm " +
                  (selected ? "border-amber text-amber" : "border-transparent text-muted")
                }
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function OddsBoard() {
  const [rankId, setRankId] = useState(rankSlices[0].id);
  const slice = rankSlices.find((row) => row.id === rankId) ?? rankSlices[0];
  const meta = slice.meta;
  const [yours, setYours] = useState<number[]>([]);
  const [theirs, setTheirs] = useState<number[]>([]);
  const [lanes, setLanes] = useState<LaneSlots[]>(emptyLanes);
  const [side, setSide] = useState<Side>("yours");
  const [query, setQuery] = useState("");

  const byId = useMemo(() => new Map(meta.heroes.map((hero) => [hero.id, hero])), [meta.heroes]);
  const taken = useMemo(() => new Set([...yours, ...theirs]), [yours, theirs]);
  const scored = useMemo(() => ({ ...meta, lanes: laneMatchups }), [meta]);
  const score = useMemo(
    () => scoreLobby(scored, yours, theirs, lanes),
    [scored, yours, theirs, lanes],
  );

  const openHeroes = [...meta.heroes]
    .filter((hero) => !taken.has(hero.id))
    .sort((a, b) => compareHeroNames(a.name, b.name));

  function addHero(id: number, which: Side = side) {
    const list = which === "yours" ? yours : theirs;
    const setList = which === "yours" ? setYours : setTheirs;
    if (taken.has(id) || list.length >= SEATS) return;
    setList([...list, id]);
    setSide(which);
    if (list.length + 1 >= SEATS && which === "yours" && theirs.length < SEATS) {
      setSide("theirs");
    }
  }

  function removeHero(which: Side, id: number) {
    const setList = which === "yours" ? setYours : setTheirs;
    setList((current) => current.filter((hero) => hero !== id));
    setLanes((current) =>
      current.map((lane) => ({
        yours: lane.yours.filter((hero) => hero !== id),
        theirs: lane.theirs.filter((hero) => hero !== id),
      })),
    );
  }

  function clear() {
    setYours([]);
    setTheirs([]);
    setLanes(emptyLanes());
    setSide("yours");
  }

  function swap() {
    setYours(theirs);
    setTheirs(yours);
    setLanes((current) => current.map((lane) => ({ yours: lane.theirs, theirs: lane.yours })));
  }

  function assignLane(index: number, which: Side, id: number) {
    if (!id) return;
    const removing = id < 0;
    const heroId = Math.abs(id);
    setLanes((current) => {
      const destination = current[index]?.[which] ?? [];
      if (!removing && !destination.includes(heroId) && destination.length >= 2) return current;
      return current.map((lane, laneIndex) => {
        const next = {
          yours: lane.yours.filter((hero) => hero !== heroId),
          theirs: lane.theirs.filter((hero) => hero !== heroId),
        };
        if (removing || laneIndex !== index) return next;
        const list = which === "yours" ? next.yours : next.theirs;
        if (list.length < 2) list.push(heroId);
        return next;
      });
    });
  }

  const shown = openHeroes
    .filter((hero) => heroSearchRank(hero.name, query, hero.id) !== null)
    .sort(compareHeroSearch(query));
  const yoursFull = yours.length >= SEATS;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-4xl text-fg sm:text-5xl">Comp odds</h1>
          <p className="mt-2 text-pretty text-muted">
            Pick both lineups. The chance is a shrunk log-odds model of those heroes, the
            leftover from allies sharing a team, the leftover from each enemy matchup, and the
            leftover from a street when you name both duos. Items are shown, but not added in.
            It is not a ban solver.
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

      <MathNotes />

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
          Approximate 95% interval {pct(score.low)}–{pct(score.high)}, if each hero, pair, matchup,
          and lane were its own sample. Shared matches make the true interval wider. {slice.label}.
          Window: {dataWindow.label}
          {slice.id === "all" ? "." : ", and both teams averaged that badge."}{" "}
          The next patch stays on the last 30 days until the median hero has {dataWindow.enough.toLocaleString()} games in it.
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
          choices={openHeroes}
          onFocus={() => setSide("yours")}
          onAdd={(id) => addHero(id, "yours")}
          onRemove={(id) => removeHero("yours", id)}
        />
        <TeamCard
          title="Their side"
          active={side === "theirs"}
          ids={theirs}
          byId={byId}
          choices={openHeroes}
          onFocus={() => setSide("theirs")}
          onAdd={(id) => addHero(id, "theirs")}
          onRemove={(id) => removeHero("theirs", id)}
        />
      </div>

      <LaneBoard
        lanes={lanes}
        yours={yours}
        theirs={theirs}
        byId={byId}
        score={score}
        onAssign={assignLane}
      />

      <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl text-fg">Heroes</h2>
            <p className="text-sm text-muted">
              Adding to {side === "yours" ? "your side" : "their side"}. An empty seat can pick from its own menu.
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
                <HeroPortrait id={hero.id} name={hero.name} />
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

function LaneBoard({
  lanes,
  yours,
  theirs,
  byId,
  score,
  onAssign,
}: {
  lanes: LaneSlots[];
  yours: number[];
  theirs: number[];
  byId: Map<number, { id: number; name: string }>;
  score: Score;
  onAssign: (index: number, which: Side, id: number) => void;
}) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <h2 className="font-display text-2xl text-fg">Lanes</h2>
      <p className="mt-1 max-w-2xl text-pretty text-sm text-muted">
        Put the two who shared a street on the left, and the two they laned into on the right.
        The chance keeps only what is left after their hero rates, their pair gaps, and the four
        one-versus-one matchups. A hero in no street is not a lane term. York, Broadway, and
        Greenwich are pooled.
      </p>
      <div className="mt-4 grid gap-3">
        {LANE_NAMES.map((name, index) => {
          const note = laneNote(score, lanes[index], byId);
          return (
            <div key={name} className="grid gap-2 sm:grid-cols-[7rem_1fr_1fr] sm:items-start">
              <p className="pt-7 text-sm font-medium text-amber">{name}</p>
              <LaneSelect
                label="Yours"
                ids={yours}
                value={lanes[index].yours}
                byId={byId}
                onChange={(id) => onAssign(index, "yours", id)}
              />
              <LaneSelect
                label="Theirs"
                ids={theirs}
                value={lanes[index].theirs}
                byId={byId}
                onChange={(id) => onAssign(index, "theirs", id)}
              />
              {note ? <p className="text-pretty text-sm text-muted sm:col-span-3">{note}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function laneNote(
  score: Score,
  lane: LaneSlots,
  byId: Map<number, { id: number; name: string }>,
) {
  if (lane.yours.length !== 2 || lane.theirs.length !== 2) return null;
  const names = (ids: number[]) =>
    [...ids]
      .sort((a, b) => a - b)
      .map((id) => byId.get(id)?.name ?? id)
      .join(" + ");
  const label = `${names(lane.yours)} vs ${names(lane.theirs)}`;
  const part = score.parts.find((row) => row.kind === "lane" && row.label === label);
  if (!part || part.matches <= 0) return "Not in the lane table, so this street adds nothing.";
  const seen = `Won ${pct(part.observed)} over ${part.matches.toLocaleString()} streets, against ${pct(part.predicted)} already predicted by the heroes.`;
  if (Math.abs(part.leftover) < 0.005) return `${seen} That gap is inside the noise, so it adds nothing.`;
  return `${seen} Kept ${signedPoints(part.marginal)}.`;
}

function LaneSelect({
  label,
  ids,
  value,
  byId,
  onChange,
}: {
  label: string;
  ids: number[];
  value: number[];
  byId: Map<number, { id: number; name: string }>;
  onChange: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const chosen = value
    .map((id) => byId.get(id))
    .filter((hero): hero is { id: number; name: string } => Boolean(hero));
  const choices = ids
    .filter((id) => !value.includes(id))
    .map((id) => byId.get(id))
    .filter((hero): hero is { id: number; name: string } => Boolean(hero))
    .filter((hero) => heroSearchRank(hero.name, query, hero.id) !== null)
    .sort(compareHeroSearch(query));

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative grid gap-1">
      <p className="text-sm text-muted">{label}</p>
      <div className="grid gap-1">
        {chosen.map((hero) => (
          <button
            key={hero.id}
            type="button"
            onClick={() => onChange(-hero.id)}
            className="flex min-h-11 items-center justify-between gap-2 rounded-card bg-bg px-2 text-left"
          >
            <span className="flex min-w-0 items-center gap-2">
              <HeroPortrait id={hero.id} name={hero.name} />
              <span className="truncate text-sm text-fg">{hero.name}</span>
            </span>
            <X className="size-4 shrink-0 text-muted" aria-hidden />
          </button>
        ))}
        {value.length < 2 ? (
          <button
            type="button"
            aria-expanded={open}
            disabled={ids.length === 0}
            onClick={() => {
              setQuery("");
              setOpen((current) => !current);
            }}
            className="min-h-11 rounded-card border border-dashed border-line px-3 text-left text-sm text-muted disabled:cursor-not-allowed"
          >
            {ids.length === 0 ? "Pick this side first" : "Choose a hero"}
          </button>
        ) : null}
      </div>
      {open && ids.length > 0 ? (
        <div className="absolute inset-x-0 top-full z-30 mt-1 rounded-card border border-amber bg-bg shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
          <label className="flex items-center gap-2 border-b border-line px-3">
            <Search className="size-4 text-muted" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label={`Search ${label} lane heroes`}
              className="min-h-11 w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
            />
          </label>
          {choices.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">No heroes match.</p>
          ) : (
            <ul className="max-h-60 overflow-y-auto p-1">
              {choices.map((hero) => (
                <li key={hero.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(hero.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex min-h-11 w-full items-center gap-2 rounded-card px-2 text-left hover:bg-raised"
                  >
                    <HeroPortrait id={hero.id} name={hero.name} />
                    <span className="truncate text-sm text-fg">{hero.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MathNotes() {
  return (
    <details className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <summary className="cursor-pointer font-display text-2xl text-fg">
        How to read the math
      </summary>
      <div className="mt-4 grid max-w-2xl gap-4 text-sm text-pretty text-muted">
        <p>
          <span className="text-fg">The big percentage is your team's chance to win the match.</span>{" "}
          An empty seat adds nothing, the same as an average hero. It does not pull the heroes you
          did pick back toward 50%. It is not a score for one player, and it is not a ban
          recommendation.
        </p>
        <p>
          <span className="text-fg">Short hero records are pulled toward average.</span> A hero who
          won 8 of 10 looks huge and is usually a streak. The model moves that record toward how
          often teams win in general. A hero with thousands of games barely moves.
        </p>
        <p>
          <span className="text-fg">A pair only adds the extra.</span> Two strong heroes will win a
          lot together even if they do nothing special as a pair. That expected rate is subtracted.
          What remains is synergy if they win more than expected, or anti-synergy if they win less.
          An ordinary pair adds nothing.
        </p>
        <p>
          <span className="text-fg">A matchup works the same way.</span> "We win because our hero
          is strong and theirs is weak" is already counted in the two hero rates. Only a real
          counter, beyond that, is added.
        </p>
        <p>
          <span className="text-fg">A lane is the same idea for a street.</span> It is used only
          when you name two of yours and two of theirs. The model subtracts their hero rates, the
          pair extras, and the four one-versus-one matchups, and keeps whatever is still left.
          York, Broadway, and Greenwich are pooled. A solo lane is not in the table.
        </p>
        <p>
          <span className="text-fg">The pieces are not added as percentages.</span> 60% plus 60%
          cannot be 120%. The model adds the advantages on a stretched scale, then turns the total
          back into a chance. The point shifts in the ledger are on that curve, so they will not
          sum to the gap from 50%.
        </p>
        <p>
          <span className="text-fg">The range beside the chance is a rough 95% band.</span> It
          pretends each hero, pair, matchup, and lane is its own pile of games. One match sits in
          several of those piles, so the true band is wider than the one shown.
        </p>
        <p>
          <span className="text-fg">The rank menu changes which games are counted.</span> All ranks
          uses every game in the window. A named rank keeps games in that window where both teams
          averaged that badge. The ability order is not split by rank. It always uses every game
          in the same window.
        </p>
        <p>
          <span className="text-fg">Items are listed and then left out.</span> The rate is how
          often the buyer's team won, with a Wilson range. People buy them more often when the
          match is already going well, so the rate is not the effect of buying the item.
        </p>
        <p>
          <span className="text-fg">A Wilson range is the win rates that could still have produced
          that record.</span> The middle is wins divided by games. The range gets tighter as the
          games pile up, and a short streak is not allowed to claim a rate near 0% or 100%. If two
          ranges overlap, both records are still compatible with one shared rate.
        </p>
        <p>
          <span className="text-fg">Ability order is a separate section.</span> It asks which
          upgrade won more often for that hero, among games that had already bought the earlier
          upgrades. The line with the most games is kept unless another line's Wilson range does
          not overlap it and both have at least 200 games. A line under 200 games is marked thin.
          The first four points, the ones before the ultimate unlocks, use the opening with the
          most games, unless another opening's range sits entirely above it. That opening is one
          ability's 2-point rank, or the three 1-point ranks. Each 5-point rank is chosen from
          the games that already maxed the earlier ones. When those games also record the next 5,
          that next result can change which 5 is picked now. A later 5 is not compared with an
          earlier 5 as if they were the same decision. On every ability the 2-point rank needs
          the 1, so it has cost 3, and the 5-point rank needs both, so it has cost 8. A 5 is
          never shown before the ultimate unlocks. The list uses the same window as the comp
          odds, and it is not split by the rank menu: games since the latest balance patch once
          the median hero has 2,400 of them, which keeps a 50% Wilson range inside about 2
          points, and the last 30 days until then.
        </p>
      </div>
    </details>
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
    <details className="mt-5 border-t border-line pt-5">
      <summary className="cursor-pointer font-display text-2xl text-fg">How this number is built</summary>
      <p className="mt-3 max-w-2xl text-pretty text-sm text-muted">
        Same layout as a worked sum: the term, the arithmetic, and what it does. A pair is not
        entered as its win rate. That win rate is only compared with the rate the two heroes
        already implied.
      </p>
      <div className="mt-4 grid gap-2">
        <details className="rounded-card border border-line bg-bg">
          <summary className="cursor-pointer px-3 py-3 text-sm font-medium text-fg">Formulas</summary>
          <ol className="grid gap-2 px-3 pb-3 text-sm">
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
              who="Lane"
              math="λ = logit(duo vs duo) − θs − r − d"
              say="Only the gap after both duos' rates, their together-gaps, and the four one-versus-one gaps. York, Broadway, and Greenwich are pooled. A solo lane is not in the table."
            />
            <MethodRow
              who="Chance"
              math="σ( Σθyou + Σryou − Σθthem − Σrthem + Σd + Σλ )"
              say="The sum is on a log-odds scale, then turned back into a chance. The point shifts share that curve, so they do not add up to the gap from 50%."
            />
          </ol>
        </details>
        {score.parts.length === 0 ? (
          <p className="text-sm text-muted">
            No heroes yet, so every term is zero and the chance stays at one half.
          </p>
        ) : (
          <>
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
            <TermGroup
              title="Lanes"
              parts={score.parts.filter((part) => part.kind === "lane")}
              empty="Put two of yours and two of theirs in the same street to see a lane."
            />
          </>
        )}
      </div>
    </details>
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
    <details className="rounded-card border border-line bg-bg">
      <summary className="flex cursor-pointer items-baseline justify-between gap-3 px-3 py-3 text-sm font-medium text-fg">
        {title}
        <span className="tabular-nums text-muted">{parts.length}</span>
      </summary>
      <div className="px-3 pb-3">
        {parts.length === 0 ? (
          <p className="text-sm text-muted">{empty}</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {parts.map((part) => (
              <TermRow key={`${part.kind}-${part.side}-${part.label}`} part={part} />
            ))}
          </ul>
        )}
        {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
      </div>
    </details>
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
  if (part.kind === "lane") {
    if (part.matches <= 0) {
      return {
        who: "Lane",
        math: "not in the lane table",
        say: "These four have not shared a street at least 30 times in this window, so the street adds nothing.",
      };
    }
    return {
      who: "Lane",
      math: `lane ${pct(part.observed)} − predicted ${pct(part.predicted)} = ${signedPoints(gap)}`,
      say: Math.abs(part.leftover) < 0.005
        ? `Match win rate when these four shared a street, ${compact(part.matches)} lanes. The gap after the rates already counted is inside the noise of this table, so it is not added.`
        : `Match win rate when these four shared a street, over ${compact(part.matches)} lanes, minus the strengths, together-gaps, and one-versus-one gaps already counted. Shrinkage keeps ${signedLog(part.leftover)} log-odds.`,
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
  choices,
  onFocus,
  onAdd,
  onRemove,
}: {
  title: string;
  active: boolean;
  ids: number[];
  byId: Map<number, { id: number; name: string; wins: number; matches: number }>;
  choices: { id: number; name: string }[];
  onFocus: () => void;
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const seats = Array.from({ length: SEATS }, (_, index) => ids[index] ?? null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const listed = choices
    .filter((hero) => heroSearchRank(hero.name, query, hero.id) !== null)
    .sort(compareHeroSearch(query));

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <section
      ref={menuRef}
      className={`relative rounded-card border p-4 ${active ? "border-amber bg-surface" : "border-line bg-surface"}`}
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
                  <span className="flex min-w-0 items-center gap-2">
                    <HeroPortrait id={hero.id} name={hero.name} />
                    <span className="truncate text-sm font-medium text-fg">{hero.name}</span>
                  </span>
                  <X className="size-4 shrink-0 text-muted" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  aria-expanded={open}
                  aria-haspopup="listbox"
                  onClick={() => {
                    onFocus();
                    setQuery("");
                    setOpen((value) => !value);
                  }}
                  className={
                    "flex min-h-14 w-full items-center rounded-card border border-dashed px-3 text-left text-sm " +
                    (open ? "border-amber text-amber" : "border-line text-muted")
                  }
                >
                  Choose a hero
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {open ? (
        <div className="absolute inset-x-4 top-full z-30 -mt-1 rounded-card border border-amber bg-bg shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
          <label className="flex items-center gap-2 border-b border-line px-3">
            <Search className="size-4 text-muted" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label={`Search heroes for ${title}`}
              className="min-h-11 w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
            />
          </label>
          {listed.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">No heroes match.</p>
          ) : (
            <ul className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto p-2 sm:grid-cols-2" role="listbox">
              {listed.map((hero) => (
                <li key={hero.id}>
                  <button
                    type="button"
                    role="option"
                    onClick={() => {
                      onAdd(hero.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex min-h-12 w-full items-center gap-2 rounded-card px-2 text-left hover:bg-raised"
                  >
                    <HeroPortrait id={hero.id} name={hero.name} />
                    <span className="truncate text-sm text-fg">{hero.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
