// Path stability for scripts/tune-prior.py: build the board's path from each data
// half with each K and report how often the halves agree. Prints JSON.
import { readFileSync } from "node:fs";
import { buildPath, type AbilityOrders } from "../src/lib/ability-path.ts";

const [aFile, bFile, ksArg] = process.argv.slice(2);
const a = JSON.parse(readFileSync(aFile, "utf8")) as AbilityOrders;
const b = JSON.parse(readFileSync(bFile, "utf8")) as AbilityOrders;
const out: Record<string, { sameStrategy: number; sameUnlock: number; sameClicks: number; clickAgreement: number }> = {};
for (const k of ksArg.split(",").map(Number)) {
  let strategy = 0;
  let unlock = 0;
  let clicks = 0;
  let positions = 0;
  for (const heroA of a.heroes) {
    const heroB = b.heroes.find((hero) => hero.id === heroA.id);
    if (!heroB) continue;
    const pa = buildPath(heroA, {}, "all", { priorK: k, alternatives: false });
    const pb = buildPath(heroB, {}, "all", { priorK: k, alternatives: false });
    if (pa.strategy === pb.strategy) strategy += 1;
    if (pa.unlockOrder.join() === pb.unlockOrder.join()) unlock += 1;
    if (JSON.stringify(pa.clicks) === JSON.stringify(pb.clicks)) clicks += 1;
    const same = pa.clicks.filter((click, i) => click.ability === pb.clicks[i]?.ability && click.rank === pb.clicks[i]?.rank).length;
    positions += same / Math.max(1, pa.clicks.length);
  }
  const n = a.heroes.length || 1;
  out[k] = { sameStrategy: strategy / n, sameUnlock: unlock / n, sameClicks: clicks / n, clickAgreement: positions / n };
}
process.stdout.write(JSON.stringify(out));
