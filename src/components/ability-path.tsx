import { useMemo, useState } from "react";
import { abilityOrders } from "@/data/ability-orders";
import { dataWindow } from "@/data/data-window";
import { buildPath, MIN_BRANCH, type Click } from "@/lib/ability-path";
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
  const heroes = abilityOrders.heroes;
  const [heroId, setHeroId] = useState(heroes.find((hero) => hero.id === 84)?.id ?? heroes[0]?.id ?? 0);
  const hero = heroes.find((row) => row.id === heroId) ?? heroes[0];
  const path = useMemo(() => (hero ? buildPath(hero) : null), [hero]);
  if (!hero || !path) return null;
  const names = new Map(hero.abilities.map((ability) => [ability.id, ability.name]));
  const overall = wilson(hero.wins, hero.matches);

  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl text-fg">Ability order</h2>
          <p className="mt-1 text-pretty text-sm text-muted">
            A line is the best only when its Wilson 95% interval does not overlap the line with the
            most games, and both have at least 200 games. Otherwise the largest sample is shown and
            marked tied. A line under 200 games is marked thin. {dataWindow.label}. A newer patch
            stays mixed into the longer window until the median hero has {dataWindow.enough} games
            in it. Unlocks come as the boons arrive. The ultimate is the fourth unlock, at level
            8, after four ability points have already been earned. On every ability the 2-point
            rank needs the 1-point rank, so it has cost 3, and the 5-point rank needs both, so it
            has cost 8. A 5 is never bought before the ultimate unlocks, because those 8 points do
            not exist yet. This is not part of the comp chance above.
          </p>
        </div>
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
      <p className="mt-3 text-sm tabular-nums text-muted">
        {pct(overall.p)} ({pct(overall.low)}–{pct(overall.high)}) · {compact(hero.matches)} games ·{" "}
        {abilityOrders.fetchedAt.slice(0, 10)}
      </p>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {path.clicks.map((click, index) => (
          <li
            key={`${click.ability}-${click.rank}-${index}`}
            className="flex min-h-11 items-center justify-between gap-3 rounded-card border border-line bg-raised px-3 text-sm"
          >
            <span className="text-muted tabular-nums">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-fg">{names.get(click.ability)}</span>
            <span className="tabular-nums text-amber" title={rankTitle(click.rank)}>
              {rankLabel(click.rank)}
            </span>
          </li>
        ))}
      </ol>
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
