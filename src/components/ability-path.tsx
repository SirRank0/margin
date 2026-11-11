import { useEffect, useMemo, useRef, useState } from "react";
import { abilityOrders } from "@/data/ability-orders";
import { dataWindow } from "@/data/data-window";
import {
  applySwitch,
  buildPath,
  LOW_CONFIDENCE_GAMES,
  MIN_BRANCH,
  MIN_SHARE,
  PRIOR_K,
  SEPARATED_P,
  TOTAL_POINTS,
  ultOptionLabel,
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

export function AbilityPathSection() {
  const heroes = [...abilityOrders.heroes].sort((a, b) => compareHeroNames(a.name, b.name));
  const [heroId, setHeroId] = useState(heroes.find((hero) => hero.id === 84)?.id ?? heroes[0]?.id ?? 0);
  const [branches, setBranches] = useState<Record<string, number>>({});
  const hero = heroes.find((row) => row.id === heroId) ?? heroes[0];
  const path = useMemo(() => (hero ? buildPath(hero, branches) : null), [hero, branches]);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [pinKey, setPinKey] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [coarse, setCoarse] = useState(false);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const listRef = useRef<HTMLOListElement>(null);
  const hideTimer = useRef(0);

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
            Unlocking and upgrading are separate. Unlocks arrive at boon levels 0, 2, 4 and 7: the
            first three go on basic abilities in any order, the fourth is the ultimate&apos;s. Points
            arrive at the other levels, {TOTAL_POINTS} in all, and each ability&apos;s 1-, 2- and
            5-point upgrades are bought in turn. So the path makes two decisions from public games.
            First the order of the three basic unlocks, and where the ultimate unlock went. Then,
            under that unlock order, the order the 12 upgrades were bought in. Upgrades bought within
            a few seconds of each other count as one purchase, so their order inside it is not a
            choice. Each choice takes the best win rate after pulling it toward the win rate of the
            games that got this far ({PRIOR_K.toLocaleString()} games of pull), so a small sample
            cannot win on luck. A choice needs at least {MIN_BRANCH.toLocaleString()} games and at
            least {Math.round(MIN_SHARE * 100)}% of the most-played choice&apos;s games. It is marked
            separated when there is at least a {Math.round(SEPARATED_P * 100)}% chance it beats the
            runner-up shown next to it, and tied otherwise. A tied choice can be switched, and every
            choice after it is walked again. When the exact line runs out of games, the next upgrade
            comes from all games at the same upgrades, unlocks and points spent, and if nothing has
            enough games the most-played legal one is taken. Both are marked low confidence, as is any
            choice under {LOW_CONFIDENCE_GAMES.toLocaleString()} games. The list lays both decisions
            on the level schedule: each unlock is used when it arrives, and each upgrade is bought as
            soon as its points are there. &quot;Saved&quot; marks an upgrade that points were held for.
            {" "}{dataWindow.label}. The next patch stays on the last 30 days until the median hero
            has {dataWindow.enough.toLocaleString()} games in it. This is not part of the comp odds,
            and it is not split by rank.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <HeroPortrait id={hero.id} name={hero.name} size="card" />
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
      <p className="mt-2 text-sm text-fg">
        Unlock order: {path.unlockOrder.map((id) => names.get(id) ?? "Unknown").join(" → ")} ·{" "}
        {ultOptionLabel(path.ult)}
      </p>
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
              {path.steps[index]?.saved && (
                <span className="text-xs text-muted" title="Points were held across a level for this upgrade.">
                  saved
                </span>
              )}
              <span className="text-xs tabular-nums text-muted" title="Earliest boon level for this click.">
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
        {path.decisions.map((decision) => {
          const chosen = wilson(decision.chosen.wins, decision.chosen.matches);
          const other = decision.other ? wilson(decision.other.wins, decision.other.matches) : null;
          const switched = branches[decision.id] !== undefined;
          return (
            <div key={decision.id} className="text-sm">
              <p className="font-medium text-fg">
                {decision.kind === "spend"
                  ? `Upgrade ${decision.index - 1}: ${decision.label}`
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
