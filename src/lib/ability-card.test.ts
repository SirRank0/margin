import assert from "node:assert/strict";
import test from "node:test";
import { abilityCards } from "../data/ability-cards.ts";
import {
  applyRank,
  formatNumber,
  formatStat,
  shownScales,
  statVisible,
  upgradeState,
} from "./ability-card.ts";

const leech = abilityCards["Leech Therapy"];

test("Leech Therapy base card matches the unupgraded tooltip", () => {
  assert.ok(leech);
  const view = applyRank(leech, 0);
  assert.equal(formatStat(view.cooldown!.v, view.cooldown!.u), "30s");
  const radius = view.pills.find((pill) => pill.k === "Radius");
  assert.equal(formatStat(radius!.v, radius!.u), "6.5m");
  const dps = view.sections[0].main.find((stat) => stat.k === "DPS");
  assert.equal(formatNumber(shownScales(dps!)[0].v), "0.19");
  const stacks = view.sections[1].alt.find((stat) => stat.k === "MaxLeechBonusStacks");
  assert.equal(formatStat(stacks!.v), "10");
  const stamina = view.sections[1].alt.find((stat) => stat.k === "LeechStaminaDrain");
  assert.equal(statVisible(stamina!), false);
  assert.equal(upgradeState(0, 0), "idle");
});

test("the 1-point rank reveals stamina drain and leaves cooldown alone", () => {
  const view = applyRank(leech, 1);
  const stamina = view.sections[1].alt.find((stat) => stat.k === "LeechStaminaDrain");
  assert.equal(formatStat(stamina!.v, stamina!.u), "0.3/s");
  assert.equal(formatStat(view.cooldown!.v, view.cooldown!.u), "30s");
  assert.equal(upgradeState(0, 1), "active");
  assert.equal(upgradeState(1, 1), "idle");
});

test("the 5-point rank shows every earlier upgrade on the numbers", () => {
  const view = applyRank(leech, 5);
  assert.equal(formatStat(view.cooldown!.v, view.cooldown!.u), "20s");
  const radius = view.pills.find((pill) => pill.k === "Radius");
  assert.equal(formatStat(radius!.v, radius!.u), "7.5m");
  const dps = view.sections[0].main.find((stat) => stat.k === "DPS");
  assert.equal(formatNumber(shownScales(dps!)[0].v), "0.49");
  const alt = view.sections[1].alt;
  assert.equal(formatStat(alt.find((stat) => stat.k === "MaxLeechBonusStacks")!.v), "18");
  assert.equal(formatStat(alt.find((stat) => stat.k === "SpiritPowerPerLeechStack")!.v), "4");
  assert.equal(formatStat(alt.find((stat) => stat.k === "LeechStaminaDrain")!.v, "/s"), "0.3/s");
  assert.equal(upgradeState(0, 5), "owned");
  assert.equal(upgradeState(2, 5), "active");
});
