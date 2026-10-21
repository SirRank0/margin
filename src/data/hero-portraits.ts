/** Official portraits from the Deadlock assets API. Keyed by hero id. */
export type HeroShot = { icon: string; card: string };

export const heroPortraits: Record<number, HeroShot> = {
  6: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_card.webp" }, // Abrams
  77: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_card.webp" }, // Apollo
  88: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/baba_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/baba_card.webp" }, // Baba
  15: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_card.webp" }, // Bebop
  72: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_card.webp" }, // Billy
  54: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/cadence_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/cadence_sm.webp" }, // Cadence
  16: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_card.webp" }, // Calico
  81: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_card.webp" }, // Celeste
  78: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/deadpack_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/deadpack_card.webp" }, // Deadman Danny
  64: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_card.webp" }, // Drifter
  73: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/druid_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/druid_card.webp" }, // Druid
  11: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_card.webp" }, // Dynamo
  53: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/slork_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/slork_card.webp" }, // Fathom
  75: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fortuna_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fortuna_card.webp" }, // Fortuna
  74: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/graf_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/graf_card.webp" }, // Graf
  76: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_card.webp" }, // Graves
  17: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_card.webp" }, // Grey Talon
  38: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gunslinger_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gunslinger_sm.webp" }, // Gunslinger
  13: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_card.webp" }, // Haze
  83: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_card.webp" }, // hero_testhero
  14: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_card.webp" }, // Holliday
  1: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_card.webp" }, // Infernus
  20: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_card.webp" }, // Ivy
  21: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_card.webp" }, // Kali
  12: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_card.webp" }, // Kelvin
  4: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_card.webp" }, // Lady Geist
  31: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_card.webp" }, // Lash
  8: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_card.webp" }, // McGinnis
  63: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_card.webp" }, // Mina
  52: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_card.webp" }, // Mirage
  18: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_card.webp" }, // Mo & Krill
  67: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_card.webp" }, // Paige
  10: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_card.webp" }, // Paradox
  50: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_card.webp" }, // Pocket
  84: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/ratking_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/ratking_card.webp" }, // Rat King
  62: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/operative_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/operative_card.webp" }, // Raven
  79: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_card.webp" }, // Rem
  49: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/rutger_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/rutger_card.webp" }, // Rutger
  2: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_card.webp" }, // Seven
  19: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_card.webp" }, // Shiv
  80: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_card.webp" }, // Silver
  60: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_card.webp" }, // Sinclair
  70: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/skyrunner_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/skyrunner_card.webp" }, // Skyrunner
  85: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chessmaster_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chessmaster_card.webp" }, // Solomon
  71: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/swan_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/swan_card.webp" }, // Swan
  39: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yakuza_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yakuza_sm.webp" }, // The Boss
  69: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_card.webp" }, // The Doorman
  51: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/thumper_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/thumper_sm.webp" }, // Thumper
  61: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/trapper_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/trapper_card.webp" }, // Trapper
  59: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vandal_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vandal_card.webp" }, // Vandal
  65: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_card.webp" }, // Venator
  66: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_card.webp" }, // Victor
  3: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_card.webp" }, // Vindicta
  86: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/artist_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/artist_card.webp" }, // Violet
  87: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nurse_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nurse_card.webp" }, // Nurse Harrow
  35: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_card.webp" }, // Viscous
  58: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_card.webp" }, // Vyper
  25: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_card.webp" }, // Warden
  7: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_card.webp" }, // Wraith
  48: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wrecker_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wrecker_card.webp" }, // Wrecker
  27: { icon: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_sm.webp", card: "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_card.webp" }, // Yamato
};

export function heroPortrait(id: number): HeroShot | undefined {
  return heroPortraits[id];
}
