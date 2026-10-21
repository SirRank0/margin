export type Hero = {
  id: number;
  name: string;
  released: boolean;
};

/** Numeric hero ids from the Deadlock wiki release table. Field 2 of a build code is one of these. */
export const HEROES: Hero[] = [
  { id: 6, name: "Abrams", released: true },
  { id: 77, name: "Apollo", released: true },
  { id: 15, name: "Bebop", released: true },
  { id: 72, name: "Billy", released: true },
  { id: 16, name: "Calico", released: true },
  { id: 81, name: "Celeste", released: true },
  { id: 69, name: "Doorman", released: true },
  { id: 64, name: "Drifter", released: true },
  { id: 11, name: "Dynamo", released: true },
  { id: 76, name: "Graves", released: true },
  { id: 17, name: "Grey Talon", released: true },
  { id: 13, name: "Haze", released: true },
  { id: 14, name: "Holliday", released: true },
  { id: 1, name: "Infernus", released: true },
  { id: 20, name: "Ivy", released: true },
  { id: 12, name: "Kelvin", released: true },
  { id: 4, name: "Lady Geist", released: true },
  { id: 31, name: "Lash", released: true },
  { id: 8, name: "McGinnis", released: true },
  { id: 63, name: "Mina", released: true },
  { id: 52, name: "Mirage", released: true },
  { id: 18, name: "Mo & Krill", released: true },
  { id: 67, name: "Paige", released: true },
  { id: 10, name: "Paradox", released: true },
  { id: 50, name: "Pocket", released: true },
  { id: 84, name: "Rat King", released: true },
  { id: 79, name: "Rem", released: true },
  { id: 2, name: "Seven", released: true },
  { id: 19, name: "Shiv", released: true },
  { id: 80, name: "Silver", released: true },
  { id: 60, name: "Sinclair", released: true },
  { id: 65, name: "Venator", released: true },
  { id: 66, name: "Victor", released: true },
  { id: 3, name: "Vindicta", released: true },
  { id: 35, name: "Viscous", released: true },
  { id: 58, name: "Vyper", released: true },
  { id: 25, name: "Warden", released: true },
  { id: 7, name: "Wraith", released: true },
  { id: 27, name: "Yamato", released: true },
  { id: 88, name: "Baba", released: true },
  { id: 78, name: "Deadman Danny", released: true },
  { id: 87, name: "Nurse Harrow", released: true },
  { id: 85, name: "Solomon", released: true },
  { id: 86, name: "Violet", released: true },
];

const byId = new Map(HEROES.map((hero) => [hero.id, hero]));

export function heroById(id: number): Hero | undefined {
  return byId.get(id);
}

export function heroLabel(id: number): string {
  return byId.get(id)?.name ?? `Hero #${id}`;
}
