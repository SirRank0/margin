/**
 * User-visible changes to the site, newest first.
 * Add an entry here whenever a change is something a player would notice
 * (a new section, a different number, a clearer explanation). Skip typo
 * fixes and internal refactors. Dates are calendar dates in America/Chicago.
 */
export type ChangelogEntry = {
  date: string;
  text: string;
};

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-11-11",
    text: "Pair and matchup stats now count heroes across the whole team, not just the same lane.",
  },
  {
    date: "2026-11-11",
    text: "Ability order can be filtered by rank.",
  },
  {
    date: "2026-11-11",
    text: "Ability order rebuilt: compares whole upgrade plans (which ability to max first and second, rush vs spread) from real match data, with close alternatives you can switch to.",
  },
];
