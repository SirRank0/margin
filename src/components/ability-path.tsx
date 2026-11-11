import { useEffect, useMemo, useRef, useState } from "react";
import { abilityOrders } from "@/data/ability-orders";
import { dataWindow } from "@/data/data-window";
import {
  ALL_RANKS,
  applySwitch,
  buildPath,
  LOW_CONFIDENCE_GAMES,
  MIN_BRANCH,
  STRATEGY_DECISION,
  ultOptionLabel,
  type BandTree,
  type Click,
} from "@/lib/ability-path";
import { compareHeroNames } from "@/lib/hero-order";
import { HeroPortrait } from "@/components/hero-portrait";
import { AbilityTip } from "@/components/ability-card";
import { wilson } from "@/lib/odds";

function pct(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function compact(matches: number) {
  if (matches >= 1_000_000) return `${(matches / 1_000_000).toFixed(1)}m`;
  if (matches >= 1000) return `${Math.round(matches / 1000)}k`;
  return String(matches);
}

function rankLabel(rank: Click["rank"]) {
  if (rank === 0) return "unlock";
  if (rank === 1) return "1";
  if (rank === 2) return "2";
  return "5";
}

function rankTitle(rank: Click["rank"]) {
  if (rank === 0) return "Ability unlock. Uses an unlock, not points. The ultimate's unlock is the fourth, at boon level 7.";
  if (rank === 1) return "1 ability point. Required before the 2-point rank.";
  if (rank === 2) return "2 ability points. This ability has now had 3 points spent on it.";
  return "5 ability points. This ability has now had 8 points spent on it.";
}

const BANDS = abilityOrders.bands ?? [{ band: ALL_RANKS, label: "All ranks" }];

/** Rank bands other than all ranks live in public/ability-orders/<band>/<heroId>.json. */
type Loaded = BandTree | "missing";

export function AbilityPathSection() {
  const heroes = [...abilityOrders.heroes].sort((a, b) => compareHeroNames(a.name, b.name));
  const [heroId, setHeroId] = useState(heroes.find((hero) => hero.id === 84)?.id ?? heroes[0]?.id ?? 0);
  const [bandId, setBandId] = useState(ALL_RANKS);
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({});
  const [branches, setBranches] = useState<Record<string, number>>({});
  const baseHero = heroes.find((row) => row.id === heroId) ?? heroes[0];
  const bandKey = `${bandId}/${baseHero?.id ?? 0}`;
  const bandTree = bandId === ALL_RANKS ? null : loaded[bandKey];
  const hero = useMemo(
    () => (baseHero && bandTree && bandTree !== "missing" ? { ...baseHero, bands: [...baseHero.bands, bandTree] } : baseHero),
    [baseHero, bandTree],
  );
  const shownBand = bandTree && bandTree !== "missing" ? bandId : ALL_RANKS;
  const path = useMemo(() => (hero ? buildPath(hero, branches, shownBand) : null), [hero, branches, shownBand]);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [pinKey, setPinKey] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [coarse, setCoarse] = useState(false);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const listRef = useRef<HTMLOListElement>(null);
  const hideTimer = useRef(0);

  useEffect(() => {
    if (bandId === ALL_RANKS || !baseHero || loaded[bandKey] !== undefined) return;
    let live = true;
    const url = `${import.meta.env.BASE_URL}ability-orders/${bandId}/${baseHero.id}.json`;
    async function load(): Promise<Loaded> {
      try {
        const response = await fetch(url);
        return response.ok ? ((await response.json()) as BandTree) : "missing";
      } catch {
        return "missing";
      }
    }
    void load().then((tree) => {
      if (live) setLoaded((current) => ({ ...current, [bandKey]: tree }));
    });
    return () => {
      live = false;
    };
  }, [bandId, baseHero, bandKey, loaded]);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const apply = () => setCoarse(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  useEffect(() => {
    if (!pinKey && !openKey) return;
    function onDocClick(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      const tip = document.querySelector('[role="tooltip"]');
      if (tip?.contains(target)) return;
      // A tap on a row is handled by that row. Anything else dismisses.
      if (listRef.current?.contains(target)) return;
      setPinKey(null);
      setOpenKey(null);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [pinKey, openKey]);

  if (!hero || !path) return null;
  const names = new Map(hero.abilities.map((ability) => [ability.id, ability.name]));
  const strategy = path.decisions.find((decision) => decision.kind === "strategy");
  const strategySwitched = strategy ? branches[strategy.id] !== undefined : false;
  const overall = wilson(hero.wins, hero.matches);
  const activeKey = coarse ? (openKey ?? pinKey) : (hoverKey ?? pinKey);
  const activeIndex = path.clicks.findIndex((click, index) => `${click.ability}-${click.rank}-${index}` === activeKey);
  const active = activeIndex >= 0 ? path.clicks[activeIndex] : null;
  const activeName = active ? names.get(active.ability) : undefined;
  const activeRow = activeKey ? rows.current.get(activeKey) : undefined;
  const firstKey = path.clicks.length > 0 ? `${path.clicks[0].ability}-${path.clicks[0].rank}-0` : null;
  const firstRow = firstKey ? rows.current.get(firstKey) : undefined;
  const placeTarget = firstRow ?? activeRow;

  function show(key: string) {
    window.clearTimeout(hideTimer.current);
    setHoverKey(key);
  }
  function hideSoon() {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setHoverKey(null), 160);
  }

  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl text-fg">Ability order</h2>
          <p className="mt-1 text-pretty text-sm text-muted">
            The ability order that won most often in public matches for this hero. Follow the
            clicks top to bottom as you level: each one tells you which ability to unlock or
            upgrade next. Pick your rank to see what wins at your level.
          </p>
          <details className="mt-2 text-sm text-muted">
            <summary className="cursor-pointer text-fg">How this is worked out</summary>
            <ul className="mt-2 grid list-disc gap-1 pl-5 text-pretty">
              <li>
                It compares whole plans: which ability you max first and second, and whether you
                rush that first max or put points into the others along the way. The plan with the
                best win rate is shown.
              </li>
              <li>
                Plans that come out about as good are listed as alternatives. Switch to one to see
                its full order.
              </li>
              <li>
                A rare order can&apos;t win on a lucky streak. An option needs at least{" "}
                {MIN_BRANCH.toLocaleString()} games, and small samples are pulled toward the
                average.
              </li>
              <li>
                &ldquo;Low confidence&rdquo; means fewer than{" "}
                {LOW_CONFIDENCE_GAMES.toLocaleString()} games back that step, or your rank
                didn&apos;t have enough games and all ranks were used instead.
              </li>
              <li>
                Plans are judged on games long enough to max two abilities, so they lean slightly
                toward longer games.
              </li>
              <li>
                {dataWindow.label}. Unlocks come at boon levels 0, 2, 4 and 7 (the fourth is the
                ultimate), and each ability&apos;s upgrades cost 1, 2 and 5 points.
              </li>
            </ul>
          </details>
        </div>
        <div className="flex items-end gap-3">
          <HeroPortrait id={hero.id} name={hero.name} size="card" />
          <label className="flex flex-col gap-1 text-sm text-muted">
            Rank
            <select
              value={bandId}
              onChange={(event) => { setBandId(event.target.value); setBranches({}); }}
              className="min-h-11 rounded-card border border-line bg-bg px-3 text-sm text-fg"
            >
              {BANDS.map((row) => (
                <option key={row.band} value={row.band}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted">
          Hero
          <select
            value={hero.id}
            onChange={(event) => { setHeroId(Number(event.target.value)); setBranches({}); }}
            className="min-h-11 rounded-card border border-line bg-bg px-3 text-sm text-fg"
          >
            {heroes.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
        </div>
      </div>
      <p className="mt-3 text-sm tabular-nums text-muted">
        {pct(overall.p)} ({pct(overall.low)}–{pct(overall.high)}) · {compact(hero.matches)} games ·{" "}
        {abilityOrders.fetchedAt.slice(0, 10)}
      </p>
      {bandId !== ALL_RANKS && (
        <p className="mt-1 text-sm text-muted">
          {!bandTree
            ? "Loading this rank band. Showing all ranks until it arrives."
            : bandTree === "missing"
              ? "No data for this rank band. Showing all ranks."
              : `${BANDS.find((row) => row.band === bandId)?.label ?? bandId}: ${compact(bandTree.matches ?? 0)} games. Picks this band has too few games for use all ranks and are marked low confidence.`}
        </p>
      )}
      <p className="mt-2 text-sm text-fg">
        Unlock order: {path.unlockOrder.map((id) => names.get(id) ?? "Unknown").join(" → ")} ·{" "}
        {ultOptionLabel(path.ult)}
      </p>
      {strategy && (
        <div className="mt-3 rounded-card border border-line bg-raised p-3 text-sm">
          <p className="font-medium text-fg">
            {strategy.chosen.name}
            <span className="ml-2 font-normal text-amber">
              {strategy.separated ? "separated" : "tied"}
            </span>
            {strategy.lowConfidence && <span className="ml-2 font-normal text-muted">low confidence</span>}
          </p>
          <p className="mt-1 tabular-nums text-muted">
            {pct(strategy.chosen.rate)} shrunk · {pct(wilson(strategy.chosen.wins, strategy.chosen.matches).p)} ·{" "}
            {compact(strategy.chosen.matches)} games
          </p>
          {strategySwitched && (
            <button
              type="button"
              className="mt-1 text-amber underline-offset-2 hover:underline"
              onClick={() => setBranches((current) => applySwitch(current, STRATEGY_DECISION, null))}
            >
              Back to the best strategy
            </button>
          )}
          {path.alternatives.length > 0 && (
            <ul className="mt-2 grid gap-1">
              {path.alternatives.map((alternative) => (
                <li key={alternative.strategy} className="text-muted">
                  <span className="text-fg">{alternative.name}</span> · {pct(alternative.rate)} shrunk ·{" "}
                  {compact(alternative.matches)} games
                  {alternative.best
                    ? " · the best strategy"
                    : ` · ${Math.round(alternative.pBestBetter * 100)}% chance the best is better`}
                  <button
                    type="button"
                    className="ml-2 text-amber underline-offset-2 hover:underline"
                    onClick={() =>
                      setBranches((current) => applySwitch(current, STRATEGY_DECISION, alternative.strategy))
                    }
                  >
                    Switch
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <ol ref={listRef} className="mt-4 grid gap-2 sm:grid-cols-2">
        {path.clicks.map((click, index) => {
          const abilityName = names.get(click.ability) ?? "Unknown";
          const key = `${click.ability}-${click.rank}-${index}`;
          return (
            <li
              key={key}
              ref={(node) => {
                if (node) rows.current.set(key, node);
                else rows.current.delete(key);
              }}
              tabIndex={0}
              onMouseEnter={() => {
                if (!coarse) show(key);
              }}
              onMouseLeave={() => {
                if (!coarse) hideSoon();
              }}
              onFocus={() => {
                if (!coarse) show(key);
              }}
              onBlur={() => {
                if (!coarse) hideSoon();
              }}
              onClick={() => {
                if (coarse) {
                  setOpenKey((current) => (current === key ? null : key));
                  if (pinKey && pinKey !== key) setPinKey(null);
                  return;
                }
                setPinKey((current) => (current === key ? null : key));
              }}
              title={coarse ? "Tap to open this ability card" : "Click to pin this ability card"}
              className={`flex min-h-11 cursor-help items-center justify-between gap-3 rounded-card border px-3 text-sm outline-none focus-visible:border-amber ${
                key === pinKey
                  ? "border-amber bg-amber/5 ring-1 ring-amber/40"
                  : key === openKey
                    ? "border-amber/60 bg-amber/5"
                    : "border-line bg-raised"
              }`}
            >
              <span className="text-muted tabular-nums">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-fg">{abilityName}</span>
              <span className="text-xs tabular-nums text-muted" title="Boon level of this click on the schedule.">
                L{path.steps[index]?.level ?? "?"}
              </span>
              <span className="tabular-nums text-amber" title={rankTitle(click.rank)}>
                {rankLabel(click.rank)}
              </span>
            </li>
          );
        })}
      </ol>
      {active && activeName && activeRow && placeTarget && (
        <AbilityTip
          target={placeTarget}
          row={activeRow}
          list={listRef.current}
          name={activeName}
          rank={active.rank}
          pinned={pinKey === activeKey}
          onTogglePin={() => setPinKey((current) => (current === activeKey ? null : activeKey))}
          onDismiss={coarse ? () => { setOpenKey(null); setPinKey(null); } : undefined}
          onEnter={() => show(activeKey!)}
          onLeave={hideSoon}
        />
      )}
      <div className="mt-4 grid gap-3">
        {path.decisions.filter((decision) => decision.kind !== "strategy").map((decision) => {
          const chosen = wilson(decision.chosen.wins, decision.chosen.matches);
          const other = decision.other ? wilson(decision.other.wins, decision.other.matches) : null;
          const switched = branches[decision.id] !== undefined;
          return (
            <div key={decision.id} className="text-sm">
              <p className="font-medium text-fg">
                {decision.kind === "spend"
                  ? `Upgrade ${decision.index - STRATEGY_DECISION}: ${decision.label}`
                  : `${decision.label}: ${decision.chosen.name}`}
                <span className="ml-2 font-normal text-amber" title={decision.separated ? "At least a 95% chance this line is better." : "Under a 95% chance, so the lines are tied."}>
                  {decision.separated ? "separated" : "tied"}
                </span>
                {decision.lowConfidence && (
                  <span className="ml-2 font-normal text-muted" title={
                      decision.source === "fallback"
                        ? "Nothing had enough games, so the most-played legal choice was taken."
                        : decision.source === "state"
                          ? "From all games at the same upgrades, unlocks and points spent, not this exact line."
                          : decision.source === "pooled"
                            ? "Too few games in this rank band, so all ranks were used."
                          : `Under ${LOW_CONFIDENCE_GAMES.toLocaleString()} games.`
                    }>
                    low confidence
                  </span>
                )}
              </p>
              <p className="mt-1 text-pretty text-muted">
                {decision.chosen.name} {pct(decision.chosen.rate)} shrunk · {pct(chosen.p)} ({pct(chosen.low)}–{pct(chosen.high)}) · {compact(decision.chosen.matches)}
                {decision.other && other
                  ? `. ${decision.other.name} ${pct(decision.other.rate)} shrunk · ${pct(other.p)} · ${compact(decision.other.matches)}`
                  : ""}
                {decision.other ? ` · ${(decision.pBetter * 100).toFixed(0)}%` : ""}
              </p>
              {(switched || (decision.alternateId !== null && decision.other)) && (
                <button
                  type="button"
                  className="mt-1 text-amber underline-offset-2 hover:underline"
                  onClick={() =>
                    setBranches((current) =>
                      applySwitch(current, decision.index, switched ? null : decision.alternateId),
                    )
                  }
                >
                  {switched ? "Back to the main line" : `Switch to ${decision.other?.name ?? ""}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
