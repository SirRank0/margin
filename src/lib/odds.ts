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
  low: number;
  high: number;
  steps: ScoreStep[];
};

export function winRate(wins: number, matches: number) {
  if (matches <= 0) return 0.5;
  return wins / matches;
}

export function logit(p: number) {
  const x = Math.min(1 - 1e-6, Math.max(1e-6, p));
  return Math.log(x / (1 - x));
}

export function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
}

type Obs = { y: number; v: number };
type Post = { mean: number; variance: number };

function adjustedLogit(wins: number, matches: number) {
  const n = matches + 1;
  const p = (wins + 0.5) / n;
  return { y: logit(p), v: 1 / (n * p * (1 - p)) };
}

function pauleMandel(obs: Obs[]): { mu: number; tau2: number } {
  const k = obs.length;
  if (k === 0) return { mu: 0, tau2: 0 };
  if (k === 1) return { mu: obs[0].y, tau2: 0 };

  const fit = (tau2: number) => {
    let weight = 0;
    let weighted = 0;
    for (const row of obs) {
      const w = 1 / (row.v + tau2);
      weight += w;
      weighted += w * row.y;
    }
    const mu = weighted / weight;
    let q = 0;
    for (const row of obs) {
      const diff = row.y - mu;
      q += (diff * diff) / (row.v + tau2);
    }
    return { mu, q };
  };

  if (fit(0).q <= k - 1) return { mu: fit(0).mu, tau2: 0 };

  let lo = 0;
  let hi = 1;
  while (fit(hi).q > k - 1 && hi < 1e6) hi *= 2;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (fit(mid).q > k - 1) lo = mid;
    else hi = mid;
  }
  const tau2 = (lo + hi) / 2;
  return { mu: fit(tau2).mu, tau2 };
}

function shrink(y: number, v: number, mu: number, tau2: number): Post {
  if (!(tau2 > 0)) return { mean: mu, variance: 0 };
  const precision = 1 / v + 1 / tau2;
  return { mean: (y / v + mu / tau2) / precision, variance: 1 / precision };
}

export function wilson(wins: number, matches: number, z = 1.96) {
  if (matches <= 0) return { p: 0.5, low: 0, high: 1 };
  const p = wins / matches;
  const z2 = z * z;
  const denom = 1 + z2 / matches;
  const center = (p + z2 / (2 * matches)) / denom;
  const half =
    (z * Math.sqrt((p * (1 - p)) / matches + z2 / (4 * matches * matches))) / denom;
  return {
    p,
    low: Math.max(0, center - half),
    high: Math.min(1, center + half),
  };
}

function pairKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function scoreLobby(meta: MarginMeta, yours: number[], theirs: number[]): Score {
  const heroes = new Map(meta.heroes.map((hero) => [hero.id, hero]));
  const total = meta.heroes.reduce(
    (sum, hero) => {
      sum.wins += hero.wins;
      sum.matches += hero.matches;
      return sum;
    },
    { wins: 0, matches: 0 },
  );
  const center = logit(winRate(total.wins, total.matches));
  const heroObs = new Map<number, Obs>();
  for (const hero of meta.heroes) {
    if (hero.matches <= 0) continue;
    const fit = adjustedLogit(hero.wins, hero.matches);
    heroObs.set(hero.id, { y: fit.y - center, v: fit.v });
  }
  const heroPool = pauleMandel([...heroObs.values()]);
  const heroPost = new Map<number, Post>();
  for (const [id, obs] of heroObs) {
    const post = shrink(obs.y, obs.v, heroPool.mu, heroPool.tau2);
    heroPost.set(id, { mean: post.mean - heroPool.mu, variance: post.variance });
  }

  const pairObs: Obs[] = [];
  const pairIndex: { key: string; y: number; v: number }[] = [];
  for (const pair of meta.pairs) {
    const left = heroObs.get(pair.a);
    const right = heroObs.get(pair.b);
    if (!left || !right || pair.matches <= 0) continue;
    const fit = adjustedLogit(pair.wins, pair.matches);
    const y = fit.y - center - left.y - right.y;
    pairObs.push({ y, v: fit.v });
    pairIndex.push({ key: pairKey(pair.a, pair.b), y, v: fit.v });
  }
  const pairPool = pauleMandel(pairObs);
  const pairPost = new Map<string, Post>();
  for (const pair of pairIndex) {
    const post = shrink(pair.y, pair.v, pairPool.mu, pairPool.tau2);
    pairPost.set(pair.key, { mean: post.mean - pairPool.mu, variance: post.variance });
  }

  const side = (ids: number[], withPairs: boolean) => {
    let z = 0;
    let v = 0;
    const unique = [...new Set(ids)].filter((id) => heroes.has(id));
    for (const id of unique) {
      const post = heroPost.get(id);
      if (!post) continue;
      z += post.mean;
      v += post.variance;
    }
    if (withPairs) {
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const post = pairPost.get(pairKey(unique[i], unique[j]));
          if (!post) continue;
          z += post.mean;
          v += post.variance;
        }
      }
    }
    return { z, v };
  };

  const yourHeroes = side(yours, false);
  const theirHeroes = side(theirs, false);
  const yourFull = side(yours, true);
  const theirFull = side(theirs, true);
  const heroLogOdds = yourHeroes.z - theirHeroes.z;
  const logOdds = yourFull.z - theirFull.z;
  const se = Math.sqrt(yourFull.v + theirFull.v);
  const probability = sigmoid(logOdds);

  const steps: ScoreStep[] = [
    {
      label: "Average hero",
      detail: "No picks yet. An empty seat is defined as the field average, so the chance is one half.",
      probability: sigmoid(0),
    },
    {
      label: "Shrunk hero strengths",
      detail:
        "Each strength is the hero's log-odds win rate, pulled toward the field in proportion to how thin its sample is.",
      probability: sigmoid(heroLogOdds),
    },
    {
      label: "Leftover pair effects",
      detail:
        "A pair adds only the log-odds left after the two hero strengths. Typical pairs are pulled to zero.",
      probability,
    },
  ];

  return {
    probability,
    low: sigmoid(logOdds - 1.96 * se),
    high: sigmoid(logOdds + 1.96 * se),
    steps,
  };
}
