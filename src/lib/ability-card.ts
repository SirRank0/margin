/** A hover card for one hero ability, built from the Deadlock wiki card data. */

export type AbilityRank = 0 | 1 | 2 | 5;

export type CardScale = { v: number; t: string; mul?: true };

export type CardStat = {
  k: string;
  n: string;
  v: number;
  ty?: string;
  u?: string;
  sc?: CardScale[];
};

export type CardSection = {
  desc?: string;
  main: CardStat[];
  alt: CardStat[];
  /** Upgrade index (0 = 1-point, 2 = 5-point) required before this block is shown. */
  req?: number;
};

export type CardChange = {
  k: string;
  v?: number;
  mul?: true;
  sc?: CardScale;
};

export type CardUpgrade = {
  cost: 1 | 2 | 5;
  desc: string;
  changes: CardChange[];
};

export type AbilityCard = {
  name: string;
  icon?: string;
  cooldown?: CardStat;
  charge?: CardStat;
  charges?: number;
  pills: CardStat[];
  sections: CardSection[];
  upgrades: CardUpgrade[];
};

const APPLIED: Record<AbilityRank, number> = { 0: 0, 1: 1, 2: 2, 5: 3 };

function cloneCard(card: AbilityCard): AbilityCard {
  return JSON.parse(JSON.stringify(card)) as AbilityCard;
}

function addScale(stat: CardStat, scale: CardScale) {
  const next = stat.sc ? stat.sc.map((item) => ({ ...item })) : [];
  const found = next.find((item) => item.t === scale.t);
  if (!found) {
    next.push({ ...scale });
  } else if (scale.mul) {
    found.v *= scale.v;
  } else {
    found.v += scale.v;
  }
  stat.sc = next;
}

function applyChange(stat: CardStat, change: CardChange) {
  if (change.v != null) {
    stat.v = change.mul ? stat.v * change.v : stat.v + change.v;
  }
  if (change.sc) addScale(stat, change.sc);
}

function eachStat(card: AbilityCard, visit: (stat: CardStat) => void) {
  if (card.cooldown) visit(card.cooldown);
  if (card.charge) visit(card.charge);
  for (const pill of card.pills) visit(pill);
  for (const section of card.sections) {
    for (const stat of section.main) visit(stat);
    for (const stat of section.alt) visit(stat);
  }
}

/** Stats through this rank. A 2 includes the 1-point rank; a 5 includes both. */
export function applyRank(card: AbilityCard, rank: AbilityRank): AbilityCard {
  const next = cloneCard(card);
  const count = APPLIED[rank];
  for (let index = 0; index < count; index += 1) {
    const upgrade = next.upgrades[index];
    if (!upgrade) continue;
    for (const change of upgrade.changes) {
      eachStat(next, (stat) => {
        if (stat.k === change.k) applyChange(stat, change);
      });
    }
  }
  next.sections = next.sections.filter((section) => section.req == null || section.req < count);
  return next;
}

export function upgradeState(index: number, rank: AbilityRank): "idle" | "owned" | "active" {
  const count = APPLIED[rank];
  if (index === count - 1) return "active";
  if (index < count - 1) return "owned";
  return "idle";
}

const SHOWN_SCALE = new Set([
  "spirit",
  "stats_count",
  "weapon_power",
  "weapon_damage_increase",
  "melee",
  "heavy_melee",
  "power_increase",
]);

export function shownScales(stat: CardStat): CardScale[] {
  return (stat.sc ?? []).filter((scale) => SHOWN_SCALE.has(scale.t) && Math.abs(scale.v) > 1e-6);
}

export function statVisible(stat: CardStat): boolean {
  return Math.abs(stat.v) > 1e-6 || shownScales(stat).length > 0;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 100) / 100;
  if (Object.is(rounded, -0) || rounded === 0) return "0";
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}

export function formatStat(value: number, unit?: string): string {
  const text = formatNumber(value);
  if (!unit) return text;
  if (unit === "s" || unit === "m" || unit === "%" || unit === "/s") return text + unit;
  return `${text} ${unit}`;
}
