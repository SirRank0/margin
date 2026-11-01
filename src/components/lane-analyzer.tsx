import { useMemo, useState } from "react";
import { heroBases, type HeroBase } from "@/data/hero-base";
import { compareHeroNames } from "@/lib/hero-order";
import { formatDelta, readLane, statVaries, type StatGroup, type StatRead } from "@/lib/lane-stats";
import { HeroPortrait } from "@/components/hero-portrait";

const GROUPS: { id: StatGroup; title: string; note: string }[] = [
  { id: "weapon", title: "Weapon", note: "Gun and melee, before items" },
  { id: "vitality", title: "Vitality", note: "Health, resist, and movement" },
  { id: "spirit", title: "Spirit", note: "Spirit power at level 6. Base is 0" },
];

const TONE: Record<StatGroup, string> = {
  weapon: "text-weapon",
  vitality: "text-vitality",
  spirit: "text-spirit",
};

const SHEET: Record<StatGroup, string> = {
  weapon: "border-t-weapon bg-weapon/10",
  vitality: "border-t-vitality bg-vitality/10",
  spirit: "border-t-spirit bg-spirit/10",
};

type Mode = "average" | "matchup";

export function LaneAnalyzer() {
  const heroes = useMemo(() => [...heroBases].sort((a, b) => compareHeroNames(a.name, b.name)), []);
  const [mode, setMode] = useState<Mode>("average");
  const [leftId, setLeftId] = useState(76);
  const [rightId, setRightId] = useState(84);
  const [oppLeftId, setOppLeftId] = useState(6);
  const [oppRightId, setOppRightId] = useState(18);
  const left = heroes.find((hero) => hero.id === leftId) ?? heroes[0];
  const right = heroes.find((hero) => hero.id === rightId) ?? heroes[1];
  const oppLeft = heroes.find((hero) => hero.id === oppLeftId) ?? heroes[0];
  const oppRight = heroes.find((hero) => hero.id === oppRightId) ?? heroes[1];
  const same = left.id === right.id;
  const oppSame = oppLeft.id === oppRight.id;
  const reads = useMemo(
    () => (same ? [] : readLane(left, right).filter((row) => statVaries(row.stat.key))),
    [left, right, same],
  );
  const opponent = useMemo(
    () => (oppSame ? [] : readLane(oppLeft, oppRight).filter((row) => statVaries(row.stat.key))),
    [oppLeft, oppRight, oppSame],
  );

  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl text-fg">Lane</h2>
        <p className="mt-1 text-pretty text-sm text-muted">
          Base stats for a duo, in the shop colors. Compare the pair to the average duo, or pick a
          second lane and see the difference. Not who wins the lane.
        </p>
      </div>
      <div className="mt-4 flex gap-1" role="tablist" aria-label="Comparison">
        <ModeButton selected={mode === "average"} onClick={() => setMode("average")}>
          Vs average
        </ModeButton>
        <ModeButton selected={mode === "matchup"} onClick={() => setMode("matchup")}>
          Vs a lane
        </ModeButton>
      </div>
      <p className="mt-2 text-xs text-muted">
        {mode === "average"
          ? "The bright number is the pair. Under it is the average duo and the gap."
          : "The bright number is your lane minus theirs. Positive means you have more."}
      </p>
      <DuoPick
        label={mode === "matchup" ? "Your lane" : "Duo"}
        left={left}
        right={right}
        heroes={heroes}
        onLeft={setLeftId}
        onRight={setRightId}
      />
      {mode === "matchup" ? (
        <DuoPick
          label="Their lane"
          left={oppLeft}
          right={oppRight}
          heroes={heroes}
          onLeft={setOppLeftId}
          onRight={setOppRightId}
        />
      ) : null}
      {same || (mode === "matchup" && oppSame) ? (
        <p className="mt-4 text-sm text-muted">Pick two different heroes in each lane.</p>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {GROUPS.map((group) => (
            <StatSheet
              key={group.id}
              group={group}
              mode={mode}
              rows={reads.filter((row) => row.stat.group === group.id)}
              opponent={opponent.filter((row) => row.stat.group === group.id)}
              left={left}
              right={right}
              oppLeft={oppLeft}
              oppRight={oppRight}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ModeButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={
        "min-h-11 border-b-2 px-3 text-sm " +
        (selected ? "border-amber text-amber" : "border-transparent text-muted")
      }
    >
      {children}
    </button>
  );
}

function DuoPick({
  label,
  left,
  right,
  heroes,
  onLeft,
  onRight,
}: {
  label: string;
  left: HeroBase;
  right: HeroBase;
  heroes: HeroBase[];
  onLeft: (id: number) => void;
  onRight: (id: number) => void;
}) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs tracking-wide text-muted uppercase">{label}</p>
      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <HeroPick hero={left} heroes={heroes} onChange={onLeft} />
        <p className="text-center font-display text-lg text-amber" aria-hidden="true">
          +
        </p>
        <HeroPick hero={right} heroes={heroes} onChange={onRight} />
      </div>
    </div>
  );
}

function HeroPick({
  hero,
  heroes,
  onChange,
}: {
  hero: HeroBase;
  heroes: HeroBase[];
  onChange: (id: number) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-card border border-line bg-bg px-3 py-2">
      <HeroPortrait id={hero.id} name={hero.name} />
      <span className="sr-only">{hero.name}</span>
      <select
        value={hero.id}
        aria-label={hero.name}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-h-11 min-w-0 flex-1 rounded-card border border-line bg-bg px-3 text-sm text-fg"
      >
        {heroes.map((row) => (
          <option key={row.id} value={row.id}>
            {row.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatSheet({
  group,
  mode,
  rows,
  opponent,
  left,
  right,
  oppLeft,
  oppRight,
}: {
  group: (typeof GROUPS)[number];
  mode: Mode;
  rows: StatRead[];
  opponent: StatRead[];
  left: HeroBase;
  right: HeroBase;
  oppLeft: HeroBase;
  oppRight: HeroBase;
}) {
  const tone = TONE[group.id];
  return (
    <section className={`overflow-hidden rounded-card border border-t-2 border-line bg-bg ${SHEET[group.id]}`}>
      <header className="border-b border-line px-3 py-2.5">
        <h3 className={`font-display text-sm tracking-[0.16em] uppercase ${tone}`}>{group.title}</h3>
        <p className={`mt-0.5 text-xs ${tone} opacity-70`}>{group.note}</p>
      </header>
      <ul>
        {rows.map((row, index) => {
          const other = opponent[index];
          const delta = mode === "matchup" && other ? row.sum - other.sum : row.sum - row.average;
          return (
            <li key={row.stat.label} className="border-b border-line px-3 py-2 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className={`text-sm ${tone}`}>
                  {row.stat.label}
                  {row.tone === "mid" ? null : (
                    <span className="ml-2 text-xs tracking-wide uppercase opacity-70">
                      {row.tone === "high" ? "High" : "Low"}
                    </span>
                  )}
                </span>
                <span className={`text-sm font-medium tabular-nums ${tone}`}>
                  {mode === "matchup" ? formatDelta(row.stat, delta) : row.stat.format(row.sum)}
                </span>
              </div>
              {mode === "matchup" && other ? (
                <div className={`mt-1 grid gap-0.5 text-xs tabular-nums ${tone} opacity-70`}>
                  <span className="flex justify-between gap-3">
                    <span>
                      {left.name} + {right.name}
                    </span>
                    <span>{row.stat.format(row.sum)}</span>
                  </span>
                  <span className="flex justify-between gap-3">
                    <span>
                      {oppLeft.name} + {oppRight.name}
                    </span>
                    <span>{row.stat.format(other.sum)}</span>
                  </span>
                </div>
              ) : (
                <>
                  <p className={`mt-1 flex justify-between gap-3 text-xs tabular-nums ${tone} opacity-70`}>
                    <span>Avg duo {row.stat.format(row.average)}</span>
                    <span>{formatDelta(row.stat, delta)}</span>
                  </p>
                  <p className={`mt-0.5 flex justify-between gap-3 text-xs tabular-nums ${tone} opacity-70`}>
                    <span>
                      {left.name} {row.stat.format(row.left)}
                    </span>
                    <span>
                      {right.name} {row.stat.format(row.right)}
                    </span>
                  </p>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
