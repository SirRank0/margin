/** Sort key used by the hero select. A leading "The" is ignored, so Doorman sits with D. */
export function compareHeroNames(a: string, b: string): number {
  const key = (name: string) => name.replace(/^the\s+/i, "");
  return key(a).localeCompare(key(b), "en", { sensitivity: "base" });
}

function plain(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^the /, "");
}

function edits(left: string, right: string): number {
  if (Math.abs(left.length - right.length) > 1) return 2;
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const saved = row[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + cost);
      previous = saved;
    }
  }
  return row[right.length];
}

/**
 * Higher is a closer match. Null means the query missed.
 * A blank query matches everything equally, so the alphabetical order stays.
 */
export function heroSearchRank(name: string, query: string, id?: number): number | null {
  const needle = plain(query);
  if (!needle) return 0;
  if (id !== undefined && String(id) === needle) return 900;
  const hay = plain(name);
  const words = hay.split(" ").filter(Boolean);
  const initials = words.map((word) => word[0]).join("");
  const flat = hay.replace(/ /g, "");
  const flatNeedle = needle.replace(/ /g, "");
  if (hay === needle || flat === flatNeedle) return 1000;
  if (hay.startsWith(needle) || flat.startsWith(flatNeedle)) return 800;
  if (flatNeedle.length > 1 && initials.startsWith(flatNeedle)) return 750;
  const tokens = needle.split(" ").filter((token) => token && token !== "and");
  if (tokens.length > 0 && tokens.every((token) => words.some((word) => word.startsWith(token)))) return 650;
  if (flatNeedle.length >= 2 && flat.includes(flatNeedle)) return 500;
  if (flatNeedle.length >= 4 && (edits(flatNeedle, flat) <= 1 || words.some((word) => edits(flatNeedle, word) <= 1))) {
    return 300;
  }
  return null;
}

export function compareHeroSearch<T extends { name: string; id?: number }>(query: string) {
  return (a: T, b: T) => {
    const rank = (heroSearchRank(b.name, query, b.id) ?? -1) - (heroSearchRank(a.name, query, a.id) ?? -1);
    return rank || compareHeroNames(a.name, b.name);
  };
}
