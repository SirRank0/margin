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

export type CounterStat = {
  hero: number;
  enemy: number;
  wins: number;
  matches: number;
};

/** Duo versus the duo they shared a lane with. a < b and c < d. */
export type LaneStat = {
  a: number;
  b: number;
  c: number;
  d: number;
  wins: number;
  matches: number;
};

export type LaneAssignment = {
  yours: number[];
  theirs: number[];
};

export type MarginMeta = {
  heroes: HeroStat[];
  pairs: PairStat[];
  /** Directed: hero's team win rate when enemy is on the other team. */
  counters?: CounterStat[];
  /** Duo-versus-duo lane records. Streets are pooled. */
  lanes?: LaneStat[];
  items: ItemStat[];
  fetchedAt: string;
};

export type ScoreStep = {
  label: string;
  detail: string;
  probability: number;
};

export type ScorePart = {
  kind: "hero" | "pair" | "counter" | "lane";
  /** Whose record this is. A counter is always from your side's point of view. */
  side: "yours" | "theirs";
  label: string;
  /** Log-odds added to your chance. Positive helps your side. */
  logOdds: number;
  /** How far your chance moves if this one line is removed. */
  marginal: number;
  matches: number;
  /** This record's own win rate. */
  observed: number;
  /** What the strengths already counted predict, before this line. */
  predicted: number;
  /**
   * Shrunk gap in log-odds, from the record's own point of view.
   * For a pair, positive means they win more together than their own rates.
   * For a hero, this is that hero's strength.
   */
  leftover: number;
};

export type Score = {
  probability: number;
  low: number;
  high: number;
  steps: ScoreStep[];
  parts: ScorePart[];
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

/**
 * Haldane-Anscombe logit. Adding 1/2 win and 1/2 loss keeps a 0% or 100%
 * record finite, and it barely moves a record with thousands of matches.
 */
function adjustedLogit(wins: number, matches: number) {
  const n = matches + 1;
  const p = (wins + 0.5) / n;
  return { y: logit(p), v: 1 / (n * p * (1 - p)) };
}

/** Paule-Mandel random-effects estimate. tau2 = 0 means the spread is noise. */
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

/** Wilson score interval for a binomial win rate. */
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

/**
 * Bradley-Terry win chance with partial pooling.
 *
 * A hero's strength is the log-odds of its win rate, shrunk toward the
 * field by a Paule-Mandel random-effects model. An empty seat is an average
 * hero, so its strength is zero. A same-team pair contributes only the
 * leftover log-odds after the two hero strengths. A counter contributes only
 * the leftover after the ally's strength and the enemy's strength. Both
 * leftovers are shrunk toward a typical record. Items are not in the chance:
 * purchase is confounded with already being ahead.
 *
 * The interval treats each record as an independent binomial sample. Real
 * matches sit inside several records at once, so the interval is too narrow.
 */
export function scoreLobby(
  meta: MarginMeta,
  yours: number[],
  theirs: number[],
  laneAssignments: LaneAssignment[] = [],
): Score {
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
  const pairRecord = new Map<string, { observed: number; predicted: number; matches: number }>();
  for (const pair of meta.pairs) {
    const left = heroPost.get(pair.a);
    const right = heroPost.get(pair.b);
    if (!left || !right || pair.matches <= 0) continue;
    const fit = adjustedLogit(pair.wins, pair.matches);
    // The two strengths are already in the sum. The leftover is only the gap.
    const y = fit.y - center - left.mean - right.mean;
    const key = pairKey(pair.a, pair.b);
    pairObs.push({ y, v: fit.v });
    pairIndex.push({ key, y, v: fit.v });
    pairRecord.set(key, {
      observed: winRate(pair.wins, pair.matches),
      predicted: sigmoid(center + left.mean + right.mean),
      matches: pair.matches,
    });
  }
  const pairPool = pauleMandel(pairObs);
  const pairPost = new Map<string, Post>();
  for (const pair of pairIndex) {
    const post = shrink(pair.y, pair.v, pairPool.mu, pairPool.tau2);
    pairPost.set(pair.key, { mean: post.mean - pairPool.mu, variance: post.variance });
  }

  // Other ten seats are treated as the field, so a matchup's expected
  // log-odds is this hero's strength minus that enemy's strength.
  const counterObs: Obs[] = [];
  const counterIndex: { key: string; y: number; v: number }[] = [];
  const counterRecord = new Map<string, { observed: number; predicted: number; matches: number }>();
  for (const row of meta.counters ?? []) {
    const ally = heroPost.get(row.hero);
    const enemy = heroPost.get(row.enemy);
    if (!ally || !enemy || row.matches <= 0 || row.hero === row.enemy) continue;
    const fit = adjustedLogit(row.wins, row.matches);
    const y = fit.y - center - ally.mean + enemy.mean;
    const key = `${row.hero}>${row.enemy}`;
    counterObs.push({ y, v: fit.v });
    counterIndex.push({ key, y, v: fit.v });
    counterRecord.set(key, {
      observed: winRate(row.wins, row.matches),
      predicted: sigmoid(center + ally.mean - enemy.mean),
      matches: row.matches,
    });
  }
  const counterPool = pauleMandel(counterObs);
  const directed = new Map<string, Post>();
  for (const row of counterIndex) {
    const post = shrink(row.y, row.v, counterPool.mu, counterPool.tau2);
    directed.set(row.key, { mean: post.mean - counterPool.mu, variance: post.variance });
  }
  // A matchup and its reverse are the same games. Keep only the antisymmetric part
  // so swapping the two lineups complements the chance.
  const counterPost = new Map<string, Post>();
  for (const [key, post] of directed) {
    if (counterPost.has(key)) continue;
    const [hero, enemy] = key.split(">");
    const reverseKey = `${enemy}>${hero}`;
    const reverse = directed.get(reverseKey);
    if (!reverse) {
      counterPost.set(key, post);
      counterPost.set(reverseKey, { mean: -post.mean, variance: post.variance });
      continue;
    }
    const mean = (post.mean - reverse.mean) / 2;
    const variance = (post.variance + reverse.variance) / 4;
    counterPost.set(key, { mean, variance });
    counterPost.set(reverseKey, { mean: -mean, variance });
  }

  // A lane record is the match win rate when these four shared a street.
  // Subtract the strengths, the same-team gaps, and the four one-versus-one gaps
  // already in the sum. What remains is the duo-versus-duo leftover.
  const laneKey = (a: number, b: number, c: number, d: number) =>
    `${pairKey(a, b)}|${pairKey(c, d)}`;
  const laneObs: Obs[] = [];
  const laneIndex: { key: string; y: number; v: number }[] = [];
  const laneRecord = new Map<string, { observed: number; predicted: number; matches: number }>();
  for (const row of meta.lanes ?? []) {
    const ta = heroPost.get(row.a);
    const tb = heroPost.get(row.b);
    const tc = heroPost.get(row.c);
    const td = heroPost.get(row.d);
    if (!ta || !tb || !tc || !td || row.matches <= 0) continue;
    const fit = adjustedLogit(row.wins, row.matches);
    const rab = pairPost.get(pairKey(row.a, row.b))?.mean ?? 0;
    const rcd = pairPost.get(pairKey(row.c, row.d))?.mean ?? 0;
    let counters = 0;
    for (const ally of [row.a, row.b]) {
      for (const enemy of [row.c, row.d]) counters += counterPost.get(`${ally}>${enemy}`)?.mean ?? 0;
    }
    const expected = center + ta.mean + tb.mean - tc.mean - td.mean + rab - rcd + counters;
    const y = fit.y - expected;
    const key = laneKey(row.a, row.b, row.c, row.d);
    laneObs.push({ y, v: fit.v });
    laneIndex.push({ key, y, v: fit.v });
    laneRecord.set(key, {
      observed: winRate(row.wins, row.matches),
      predicted: sigmoid(expected),
      matches: row.matches,
    });
  }
  const lanePool = pauleMandel(laneObs);
  const laneDirected = new Map<string, Post>();
  for (const row of laneIndex) {
    const post = shrink(row.y, row.v, lanePool.mu, lanePool.tau2);
    laneDirected.set(row.key, { mean: post.mean - lanePool.mu, variance: post.variance });
  }
  const lanePost = new Map<string, Post>();
  for (const [key, post] of laneDirected) {
    if (lanePost.has(key)) continue;
    const [ally, enemy] = key.split("|");
    const reverseKey = `${enemy}|${ally}`;
    const reverse = laneDirected.get(reverseKey);
    if (!reverse) {
      lanePost.set(key, post);
      lanePost.set(reverseKey, { mean: -post.mean, variance: post.variance });
      continue;
    }
    const mean = (post.mean - reverse.mean) / 2;
    const variance = (post.variance + reverse.variance) / 4;
    lanePost.set(key, { mean, variance });
    lanePost.set(reverseKey, { mean: -mean, variance });
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
  const pairLogOdds = yourFull.z - theirFull.z;
  let counterLogOdds = 0;
  let counterVariance = 0;
  const allies = [...new Set(yours)].filter((id) => heroes.has(id));
  const enemies = [...new Set(theirs)].filter((id) => heroes.has(id));
  for (const ally of allies) {
    for (const enemy of enemies) {
      const post = counterPost.get(`${ally}>${enemy}`);
      if (!post) continue;
      counterLogOdds += post.mean;
      counterVariance += post.variance;
    }
  }
  let laneLogOdds = 0;
  let laneVariance = 0;
  const laneHits: { key: string; label: string }[] = [];
  const seenLane = new Set<string>();
  for (const lane of laneAssignments) {
    const ys = [...new Set(lane.yours)].filter((id) => allies.includes(id));
    const ts = [...new Set(lane.theirs)].filter((id) => enemies.includes(id));
    if (ys.length !== 2 || ts.length !== 2) continue;
    const key = laneKey(ys[0], ys[1], ts[0], ts[1]);
    if (seenLane.has(key)) continue;
    seenLane.add(key);
    const label = `${[...ys].sort((a, b) => a - b).map((id) => heroes.get(id)?.name ?? id).join(" + ")} vs ${[...ts].sort((a, b) => a - b).map((id) => heroes.get(id)?.name ?? id).join(" + ")}`;
    laneHits.push({ key, label });
    const post = lanePost.get(key);
    if (!post) continue;
    laneLogOdds += post.mean;
    laneVariance += post.variance;
  }
  const matchupLogOdds = pairLogOdds + counterLogOdds;
  const logOdds = matchupLogOdds + laneLogOdds;
  const se = Math.sqrt(yourFull.v + theirFull.v + counterVariance + laneVariance);
  const probability = sigmoid(logOdds);
  const name = (id: number) => heroes.get(id)?.name ?? String(id);
  const draft: Omit<ScorePart, "marginal">[] = [];
  for (const id of allies) {
    const post = heroPost.get(id);
    const hero = heroes.get(id);
    if (!post || !hero) continue;
    draft.push({
      kind: "hero",
      side: "yours",
      label: hero.name,
      logOdds: post.mean,
      matches: hero.matches,
      observed: winRate(hero.wins, hero.matches),
      predicted: sigmoid(center),
      leftover: post.mean,
    });
  }
  for (const id of enemies) {
    const post = heroPost.get(id);
    const hero = heroes.get(id);
    if (!post || !hero) continue;
    draft.push({
      kind: "hero",
      side: "theirs",
      label: hero.name,
      logOdds: -post.mean,
      matches: hero.matches,
      observed: winRate(hero.wins, hero.matches),
      predicted: sigmoid(center),
      leftover: post.mean,
    });
  }
  const pushPairs = (ids: number[], sign: number, owner: "yours" | "theirs") => {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = pairKey(ids[i], ids[j]);
        const post = pairPost.get(key);
        const record = pairRecord.get(key);
        if (!post || !record) continue;
        draft.push({
          kind: "pair",
          side: owner,
          label: `${name(ids[i])} + ${name(ids[j])}`,
          logOdds: sign * post.mean,
          matches: record.matches,
          observed: record.observed,
          predicted: record.predicted,
          leftover: post.mean,
        });
      }
    }
  };
  pushPairs(allies, 1, "yours");
  pushPairs(enemies, -1, "theirs");
  for (const ally of allies) {
    for (const enemy of enemies) {
      const key = `${ally}>${enemy}`;
      const post = counterPost.get(key);
      const record = counterRecord.get(key) ?? counterRecord.get(`${enemy}>${ally}`);
      if (!post || !record) continue;
      draft.push({
        kind: "counter",
        side: "yours",
        label: `${name(ally)} vs ${name(enemy)}`,
        logOdds: post.mean,
        matches: record.matches,
        observed: counterRecord.get(key)?.observed ?? 1 - record.observed,
        predicted: counterRecord.get(key)?.predicted ?? 1 - record.predicted,
        leftover: post.mean,
      });
    }
  }
  for (const hit of laneHits) {
    const post = lanePost.get(hit.key);
    const record = laneRecord.get(hit.key);
    draft.push({
      kind: "lane",
      side: "yours",
      label: hit.label,
      logOdds: post?.mean ?? 0,
      matches: record?.matches ?? 0,
      observed: record?.observed ?? 0.5,
      predicted: record?.predicted ?? 0.5,
      leftover: post?.mean ?? 0,
    });
  }
  const parts: ScorePart[] = draft.map((part) => ({
    ...part,
    marginal: probability - sigmoid(logOdds - part.logOdds),
  }));

  const steps: ScoreStep[] = [
    {
      label: "Average hero",
      detail: "No picks yet. An empty seat is defined as the field average, so the chance is one half.",
      probability: sigmoid(0),
    },
    {
      label: "Hero win rates",
      detail:
        "Each picked hero adds its own win rate, on a log-odds scale, pulled toward the field when that hero's sample is thin. Their heroes are subtracted.",
      probability: sigmoid(heroLogOdds),
    },
    {
      label: "Same-team leftovers",
      detail:
        "Two allies add only what is left after both of their own rates. More than expected is synergy. Less is anti-synergy. Their pairs are subtracted.",
      probability: sigmoid(pairLogOdds),
    },
    {
      label: "Matchup leftovers",
      detail:
        "Each of your heroes against each of theirs adds only what is left after both strengths. A usual matchup adds nothing.",
      probability: sigmoid(matchupLogOdds),
    },
    {
      label: "Lane leftovers",
      detail:
        "A duo against the duo they shared a lane with adds only what is left after strengths, same-team gaps, and the four one-versus-one gaps. Solo lanes are not in the table.",
      probability,
    },
  ];

  return {
    probability,
    low: sigmoid(logOdds - 1.96 * se),
    high: sigmoid(logOdds + 1.96 * se),
    steps,
    parts,
  };
}
