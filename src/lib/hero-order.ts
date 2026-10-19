/** Sort key used by the hero select. A leading "The" is ignored, so Doorman sits with D. */
export function compareHeroNames(a: string, b: string): number {
  const key = (name: string) => name.replace(/^the\s+/i, "");
  return key(a).localeCompare(key(b), "en", { sensitivity: "base" });
}
