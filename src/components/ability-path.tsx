import { useEffect, useMemo, useRef, useState } from "react";
import { abilityOrders } from "@/data/ability-orders";
import { dataWindow } from "@/data/data-window";
import { buildPath, MIN_BRANCH, type Click } from "@/lib/ability-path";
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
  if (rank === 0) return "Ability unlock. The ultimate is the fourth of these, once the soul gate opens.";
  if (rank === 1) return "1 ability point. Required before the 2-point rank.";
  if (rank === 2) return "2 ability points. This ability has now had 3 points spent on it.";
  return "5 ability points. This ability has now had 8 points spent on it.";
}

export function AbilityPathSection() {
  const heroes = [...abilityOrders.heroes].sort((a, b) => compareHeroNames(a.name, b.name));
  const [heroId, setHeroId] = useState(heroes.find((hero) => hero.id === 84)?.id ?? heroes[0]?.id ?? 0);
  const hero = heroes.find((row) => row.id === heroId) ?? heroes[0];
  const path = useMemo(() => (hero ? buildPath(hero) : null), [hero]);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [pinKey, setPinKey] = useState<string | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const listRef = useRef<HTMLOListElement>(null);
  const hideTimer = useRef(0);
  if (!hero || !path) return null;
  const names = new Map(hero.abilities.map((ability) => [ability.id, ability.name]));
  const overall = wilson(hero.wins, hero.matches);
  const activeKey = hoverKey ?? pinKey;
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

  useEffect(() => {
    if (!pinKey) return;
    const pinned = pinKey;
    function onDocClick(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      const row = rows.current.get(pinned);
      const tip = document.querySelector('[role="tooltip"]');
      if (row?.contains(target) || tip?.contains(target)) return;
      setPinKey(null);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [pinKey]);

  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl text-fg">Ability order</h2>
          <p className="mt-1 text-pretty text-sm text-muted">
            A line is the best only when its Wilson 95% interval does not overlap the line with the
            most games, and both have at least 200 games. Otherwise the largest sample is shown and
            marked tied. A line under 200 games is marked thin. The first four points use the
            opening with the most games, unless another opening's range sits entirely above it.
            That opening is one ability's 2-point rank, or the three 1-point ranks. Each 5-point
            rank is chosen from the games that already bought the earlier ones, including the
            ultimate. Before each 5, the 2-point ranks already bought are compared the same way.
            When those games also record the next 5, that next result can change which 5 is picked
            now. {dataWindow.label}. The next patch stays on the last 30 days until the median hero
            has {dataWindow.enough.toLocaleString()} games in it. The ultimate is the fourth unlock.
            On every ability the 2-point rank needs the 1-point rank, so it has cost 3, and the
            5-point rank needs both, so it has cost 8. A 5 is never bought before the ultimate
            unlocks. This is not part of the comp odds, and it is not split by rank.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <HeroPortrait id={hero.id} name={hero.name} size="card" />
          <label className="flex flex-col gap-1 text-sm text-muted">
          Hero
          <select
            value={hero.id}
            onChange={(event) => setHeroId(Number(event.target.value))}
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
              onMouseEnter={() => show(key)}
              onMouseLeave={hideSoon}
              onFocus={() => show(key)}
              onBlur={hideSoon}
              onClick={() => setPinKey((current) => (current === key ? null : key))}
              title="Click to pin this ability card"
              className={`flex min-h-11 cursor-help items-center justify-between gap-3 rounded-card border px-3 text-sm outline-none focus-visible:border-amber ${
                key === pinKey ? "border-amber bg-amber/5 ring-1 ring-amber/40" : "border-line bg-raised"
              }`}
            >
              <span className="text-muted tabular-nums">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-fg">{abilityName}</span>
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
          onEnter={() => show(activeKey!)}
          onLeave={hideSoon}
        />
      )}
      <div className="mt-4 grid gap-3">
        {path.decisions.map((decision) => {
          const chosen = wilson(decision.chosen.wins, decision.chosen.matches);
          const other = decision.other ? wilson(decision.other.wins, decision.other.matches) : null;
          return (
            <div key={decision.label} className="text-sm">
              <p className="font-medium text-fg">
                {decision.label}
                <span className="ml-2 font-normal text-amber">
                  {decision.chosen.matches < MIN_BRANCH ? "thin" : decision.separated ? "separated" : "tied"}
                </span>
              </p>
              <p className="mt-1 text-pretty text-muted">
                {decision.chosen.name} {pct(chosen.p)} ({pct(chosen.low)}–{pct(chosen.high)}) ·{" "}
                {compact(decision.chosen.matches)}
                {decision.other && other
                  ? `. ${decision.other.name} ${pct(other.p)} (${pct(other.low)}–${pct(other.high)}) · ${compact(decision.other.matches)}`
                  : ""}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
