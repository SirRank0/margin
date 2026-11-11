/**
 * User-visible changes to the site, newest first.
 * Add an entry here whenever a change is something a player would notice
 * (a new section, a different number, a clearer explanation). Skip typo
 * fixes and internal refactors. Dates are calendar dates in America/Chicago.
 * When the change has a pull request, set `link` to that GitHub PR URL.
 */
export type ChangelogEntry = {
  date: string;
  text: string;
  link?: string;
};

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-11-11",
    text: "Hero cards now show the model win rate the chance uses, then the raw record, and mark small samples instead of leading with a raw rate from a handful of games.",
  },
  {
    date: "2026-11-11",
    text: "Assigning a street can change the chance again, using games at the rank you picked, instead of always adding nothing.",
    link: "https://github.com/SirRank0/margin/pull/15",
  },
  {
    date: "2026-11-11",
    text: "Pair and matchup stats now count heroes across the whole team, not just the same lane.",
    link: "https://github.com/SirRank0/margin/pull/14",
  },
  {
    date: "2026-11-11",
    text: "The ability order help text was rewritten in plain language.",
    link: "https://github.com/SirRank0/margin/pull/3",
  },
  {
    date: "2026-11-11",
    text: "Ability order can be filtered by rank.",
    link: "https://github.com/SirRank0/margin/pull/2",
  },
  {
    date: "2026-11-11",
    text: "Ability order rebuilt: compares whole upgrade plans (which ability to max first and second, rush vs spread) from real match data, with close alternatives you can switch to.",
    link: "https://github.com/SirRank0/margin/pull/1",
  },
];
