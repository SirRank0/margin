export type HeroStat = {
  id: number;
  name: string;
  wins: number;
  matches: number;
};

export type PairStat = {
  a: number;
  b: number;
  wins: number;
  matches: number;
};

export type ItemStat = {
  id: number;
  name: string;
  wins: number;
  matches: number;
};

export type MarginMeta = {
  heroes: HeroStat[];
  pairs: PairStat[];
  items: ItemStat[];
  fetchedAt: string;
};

export type ScoreStep = {
  label: string;
  detail: string;
  probability: number;
};

export type Score = {
  probability: number;
  steps: ScoreStep[];
};

const PAIR_WEIGHT = 0.22;
const ITEM_WEIGHT = 0.28;

export function winRate(wins: number, matches: number) {
  if (matches <= 0) return 0.5;
  return wins / matches;
}

export function logit(p: number) {
  const x = Math.min(0.98, Math.max(0.02, p));
  return Math.log(x / (1 - x));
}

export function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
}

function pairKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function heroEdge(ids: number[], byId: Map<number, HeroStat>, center: number) {
  let z = 0;
  for (const id of ids) {
    const hero = byId.get(id);
    if (!hero || hero.matches < 200) continue;
    z += logit(winRate(hero.wins, hero.matches)) - logit(center);
  }
  return z;
}

function pairEdge(
  ids: number[],
  byId: Map<number, HeroStat>,
  pairs: Map<string, PairStat>,
) {
  let z = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const pair = pairs.get(pairKey(ids[i], ids[j]));
      const left = byId.get(ids[i]);
      const right = byId.get(ids[j]);
      if (!pair || pair.matches < 400 || !left || !right) continue;
      if (left.matches < 200 || right.matches < 200) continue;
      const expected =
        (winRate(left.wins, left.matches) + winRate(right.wins, right.matches)) / 2;
      const residual = winRate(pair.wins, pair.matches) - expected;
      z += residual * 4 * PAIR_WEIGHT;
    }
  }
  return z;
}

function itemEdge(ids: number[], byId: Map<number, ItemStat>) {
  let z = 0;
  for (const id of ids) {
    const item = byId.get(id);
    if (!item) continue;
    z += (logit(winRate(item.wins, item.matches)) - logit(0.5)) * ITEM_WEIGHT;
  }
  return z;
}

export function scoreLobby(
  meta: MarginMeta,
  yours: number[],
  theirs: number[],
  yourItems: number[],
  theirItems: number[],
): Score {
  const heroes = new Map(meta.heroes.map((hero) => [hero.id, hero]));
  const pairs = new Map(meta.pairs.map((pair) => [pairKey(pair.a, pair.b), pair]));
  const items = new Map(meta.items.map((item) => [item.id, item]));
  const weighted = meta.heroes.reduce(
    (sum, hero) => {
      sum.wins += hero.wins;
      sum.matches += hero.matches;
      return sum;
    },
    { wins: 0, matches: 0 },
  );
  const center = winRate(weighted.wins, weighted.matches);

  const heroesZ =
    heroEdge(yours, heroes, center) - heroEdge(theirs, heroes, center);
  const pairsZ =
    pairEdge(yours, heroes, pairs) - pairEdge(theirs, heroes, pairs);
  const itemsZ =
    itemEdge(yourItems, items) - itemEdge(theirItems, items);

  const steps: ScoreStep[] = [
    {
      label: "Even lobby",
      detail: "No heroes yet, so neither side is ahead.",
      probability: sigmoid(0),
    },
    {
      label: "Hero win rates",
      detail: "Each pick moves the log-odds by how far that hero sits from the average.",
      probability: sigmoid(heroesZ),
    },
    {
      label: "Same-team pairs",
      detail: "A pair counts only by how much it beats the average of the two heroes.",
      probability: sigmoid(heroesZ + pairsZ),
    },
    {
      label: "Items kept",
      detail: "A small tilt from items still in the inventory. Buying while ahead inflates this.",
      probability: sigmoid(heroesZ + pairsZ + itemsZ),
    },
  ];

  return { probability: steps[3].probability, steps };
}
