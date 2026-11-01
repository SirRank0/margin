import { heroBases, type HeroBase } from "@/data/hero-base";

export type StatGroup = "weapon" | "vitality" | "spirit";

export type LaneStat = {
  key: keyof HeroBase;
  group: StatGroup;
  label: string;
  format: (value: number) => string;
};

function num(value: number, digits: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function signed(value: number) {
  const body = num(value, value % 1 === 0 ? 0 : 1);
  return value > 0 ? `+${body}%` : `${body}%`;
}

export const laneStats: LaneStat[] = [
  { key: "dps", group: "weapon", label: "Weapon DPS", format: (value) => num(value, 1) },
  { key: "bullet", group: "weapon", label: "Bullet damage", format: (value) => num(value, 1) },
  { key: "fire", group: "weapon", label: "Fire rate", format: (value) => `${num(value, 2)}/s` },
  { key: "clip", group: "weapon", label: "Magazine", format: (value) => num(value, 0) },
  { key: "light", group: "weapon", label: "Light melee", format: (value) => num(value, 0) },
  { key: "heavy", group: "weapon", label: "Heavy melee", format: (value) => num(value, 0) },
  { key: "health", group: "vitality", label: "Health", format: (value) => num(value, 0) },
  { key: "regen", group: "vitality", label: "Health regen", format: (value) => num(value, 1) },
  { key: "bulletResist", group: "vitality", label: "Bullet resist", format: signed },
  { key: "spiritResist", group: "vitality", label: "Spirit resist", format: signed },
  { key: "move", group: "vitality", label: "Move speed", format: (value) => `${num(value, 1)} m/s` },
  { key: "sprint", group: "vitality", label: "Sprint", format: (value) => `+${num(value, 1)} m/s` },
  { key: "stamina", group: "vitality", label: "Stamina", format: (value) => num(value, 0) },
  { key: "dash", group: "vitality", label: "Dash", format: (value) => `${num(value, 0)} m` },
  { key: "spirit", group: "spirit", label: "Spirit power by level 6", format: (value) => num(value, 1) },
];

export type StatRead = {
  stat: LaneStat;
  left: number;
  right: number;
  sum: number;
  /** Mean of every unordered pair. Equals twice the hero average. */
  average: number;
  low: number;
  high: number;
  /** 0 is the lowest duo, 1 is the highest. */
  place: number;
  tone: "high" | "low" | "mid";
};

const pairSums = new Map<keyof HeroBase, number[]>();
const pairAverage = new Map<keyof HeroBase, number>();

function sumsFor(key: keyof HeroBase) {
  const cached = pairSums.get(key);
  if (cached) return cached;
  const values: number[] = [];
  for (let i = 0; i < heroBases.length; i++) {
    for (let j = i + 1; j < heroBases.length; j++) {
      values.push(Number(heroBases[i][key]) + Number(heroBases[j][key]));
    }
  }
  values.sort((a, b) => a - b);
  pairSums.set(key, values);
  return values;
}

function averageFor(key: keyof HeroBase) {
  const cached = pairAverage.get(key);
  if (cached !== undefined) return cached;
  const total = heroBases.reduce((sum, hero) => sum + Number(hero[key]), 0);
  const average = heroBases.length === 0 ? 0 : (2 * total) / heroBases.length;
  pairAverage.set(key, average);
  return average;
}

export function readStat(left: HeroBase, right: HeroBase, stat: LaneStat): StatRead {
  const a = Number(left[stat.key]);
  const b = Number(right[stat.key]);
  const sum = a + b;
  const all = sumsFor(stat.key);
  const below = all.filter((value) => value < sum).length;
  const tied = all.filter((value) => value === sum).length;
  // Ties share the middle of their rank, so a stat every duo has is not "low".
  const place = all.length <= 1 ? 0.5 : (below + (tied - 1) / 2) / (all.length - 1);
  const tone = place >= 0.75 ? "high" : place <= 0.25 ? "low" : "mid";
  return {
    stat,
    left: a,
    right: b,
    sum,
    average: averageFor(stat.key),
    low: all[0] ?? sum,
    high: all[all.length - 1] ?? sum,
    place,
    tone,
  };
}

export function statVaries(key: keyof HeroBase) {
  const first = Number(heroBases[0][key]);
  return heroBases.some((hero) => Number(hero[key]) !== first);
}

export function readLane(left: HeroBase, right: HeroBase) {
  return laneStats.map((stat) => readStat(left, right, stat));
}

export function formatDelta(stat: LaneStat, delta: number) {
  const body = stat.format(Math.abs(delta)).replace(/^\+/, "");
  if (delta > 0) return `+${body}`;
  if (delta < 0) return `−${body}`;
  return body;
}
