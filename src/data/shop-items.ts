/** Shop items from the Deadlock assets API. Abilities and unreleased mods are not included. */
export type ShopSlot = "weapon" | "vitality" | "spirit";

export type ShopScale = { v: number; t: "spirit" | "boon" | "weapon" };

export type ShopStat = {
  n: string;
  v: string;
  icon?: string;
  sc?: ShopScale;
};

export type ShopCast = "passive" | "active" | "press" | "toggle";

export type ShopItem = {
  id: number;
  name: string;
  cost: number;
  tier: number;
  slot: ShopSlot;
  active: boolean;
  cast: ShopCast;
  image: string;
  /** In-game description. Highlight and attribute spans are kept. */
  body: string;
  innate: ShopStat[];
  effects: ShopStat[];
  from: number[];
  cooldown?: string;
  imbue?: string;
};

export const shopItems: ShopItem[] = [
  {
    "id": 1342610602,
    "name": "Close Quarters",
    "cost": 800,
    "tier": 1,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/close_quarters.webp",
    "body": "Deal additional <span class=\"highlight\">Weapon Damage</span> when in <span class=\"highlight\">close range</span> to your target.",
    "innate": [
      {
        "n": "Melee Resist",
        "v": "+20%"
      }
    ],
    "effects": [
      {
        "n": "Weapon Damage",
        "v": "+20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Close Range",
        "v": "15m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": []
  },
  {
    "id": 1548066885,
    "name": "Extended Magazine",
    "cost": 800,
    "tier": 1,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/basic_magazine.webp",
    "body": "",
    "innate": [
      {
        "n": "Max Ammo",
        "v": "+30%"
      },
      {
        "n": "Weapon Damage",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "effects": [],
    "from": []
  },
  {
    "id": 2010028405,
    "name": "Headshot Booster",
    "cost": 800,
    "tier": 1,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/headshot_booster.webp",
    "body": "Your next <span class=\"highlight\">headshot</span> against an enemy Hero deals\n<span class=\"inline-attribute-label BonusWeaponDamage\">bonus weapon damage</span>.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+30",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Head Shot Bonus Damage",
        "v": "+45",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "from": [],
    "cooldown": "9s"
  },
  {
    "id": 3077079169,
    "name": "High-Velocity Rounds",
    "cost": 800,
    "tier": 1,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/high_velocity_rounds.webp",
    "body": "",
    "innate": [
      {
        "n": "Bullet Velocity",
        "v": "+45%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Weapon Damage",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "effects": [],
    "from": []
  },
  {
    "id": 1009965641,
    "name": "Monster Rounds",
    "cost": 800,
    "tier": 1,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/monster_rounds.webp",
    "body": "",
    "innate": [
      {
        "n": "Weapon Damage vs. NPCs",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Bullet Resist vs. NPCs",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+1",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [],
    "from": []
  },
  {
    "id": 668299740,
    "name": "Rapid Rounds",
    "cost": 800,
    "tier": 1,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/rapid_rounds.webp",
    "body": "",
    "innate": [
      {
        "n": "Fire Rate",
        "v": "+9%"
      }
    ],
    "effects": [],
    "from": []
  },
  {
    "id": 3862866912,
    "name": "Restorative Shot",
    "cost": 800,
    "tier": 1,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/restorative_shot.webp",
    "body": "Your next bullet will <span class=\"highlight\">heal</span> you based on what target you hit.",
    "innate": [
      {
        "n": "Weapon Damage",
        "v": "+6%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Healing From Heroes",
        "v": "50",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Healing From NPCs / Orbs",
        "v": "20",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "from": [],
    "cooldown": "6s"
  },
  {
    "id": 381961617,
    "name": "Active Reload",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/active_reload.webp",
    "body": "While reloading, pressing Reload during the highlighted portion will <span class=\"highlight\">instantly finish your reload</span> and grant you <span class=\"highlight\">Fire Rate</span>, <span class=\"highlight\">Bullet Lifesteal</span> and <span class=\"highlight\">Move Speed</span>.",
    "innate": [
      {
        "n": "Max Ammo",
        "v": "+20%"
      }
    ],
    "effects": [
      {
        "n": "Fire Rate",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Bullet Lifesteal",
        "v": "+16%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Move Speed",
        "v": "+0.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Duration",
        "v": "7s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "12s"
  },
  {
    "id": 3403085434,
    "name": "Fleetfoot",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/fleetfoot.webp",
    "body": "Removes the <span class=\"highlight\">Move Speed</span> penalty while shooting.\nGain bonus <span class=\"highlight\">Move Speed</span> and <span class=\"highlight\">Slow Resistance</span>.",
    "innate": [
      {
        "n": "Weapon Damage",
        "v": "+6%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Slide Distance",
        "v": "+35%"
      },
      {
        "n": "Bullet Resist",
        "v": "+6%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Move Speed",
        "v": "+3.0m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Slow Resist",
        "v": "+40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Duration",
        "v": "5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "16s"
  },
  {
    "id": 2407033488,
    "name": "Intensifying Magazine",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/intensifying_magazine.webp",
    "body": "Increases <span class=\"highlight\">Weapon Damage</span> as you continuously fire your weapon.",
    "innate": [
      {
        "n": "Max Ammo",
        "v": "+20%"
      }
    ],
    "effects": [
      {
        "n": "Max Weapon Damage",
        "v": "45%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Time for Max Damage",
        "v": "2.5s"
      }
    ],
    "from": []
  },
  {
    "id": 3977876567,
    "name": "Kinetic Dash",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/kinetic_dash.webp",
    "body": "When you <span class=\"highlight\">Dash-Jump</span> you gain <span class=\"highlight\">Fire Rate</span> and bonus <span class=\"highlight\">Ammo</span> until your next reload. Lasts up to 7s.",
    "innate": [
      {
        "n": "Stamina",
        "v": "+1"
      },
      {
        "n": "Stamina Recovery",
        "v": "+12%"
      }
    ],
    "effects": [
      {
        "n": "Fire Rate",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Temporary Ammo",
        "v": "+6",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/ammo_clip_size.svg"
      },
      {
        "n": "Duration",
        "v": "7s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      4139877411
    ]
  },
  {
    "id": 3331811235,
    "name": "Long Range",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/long_range.webp",
    "body": "Deal additional <span class=\"highlight\">Weapon Damage</span> when <span class=\"highlight\">beyond a minimum distance</span> from your target.",
    "innate": [
      {
        "n": "Weapon Fall-off Range",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Sprint Speed",
        "v": "+0.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "Weapon Damage",
        "v": "+40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Min. Distance",
        "v": "15m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": []
  },
  {
    "id": 26002154,
    "name": "Melee Charge",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/melee_charge.webp",
    "body": "Your next <span class=\"highlight\">Heavy Melee</span> attack against an enemy <span class=\"highlight\">deals increased damage</span>.",
    "innate": [
      {
        "n": "Heavy Melee Distance",
        "v": "+50%"
      },
      {
        "n": "Melee Damage",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/melee.svg"
      },
      {
        "n": "Bullet Resist",
        "v": "+6%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Bonus Heavy Damage",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/melee.svg"
      }
    ],
    "from": [],
    "cooldown": "5s"
  },
  {
    "id": 395867183,
    "name": "Mystic Shot",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/mystic_shot.webp",
    "body": "Your next bullet deals bonus\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span>.",
    "innate": [
      {
        "n": "Spirit Power",
        "v": "+7",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Spirit Damage",
        "v": "+40",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.9,
          "t": "spirit"
        }
      }
    ],
    "from": [],
    "cooldown": "8s"
  },
  {
    "id": 2064029594,
    "name": "Opening Rounds",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/opening_rounds.webp",
    "body": "Your attacks have additional <span class=\"highlight\">Weapon Damage</span> against <span class=\"highlight\">enemies above 50% health</span>.",
    "innate": [
      {
        "n": "Bullet Velocity",
        "v": "+60%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Weapon Damage",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+7"
      }
    ],
    "effects": [
      {
        "n": "Weapon Damage",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "from": [
      3077079169
    ]
  },
  {
    "id": 1763073141,
    "name": "Recharging Rush",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/recharging_rounds.webp",
    "body": "Dealing significant\n<span class=\"inline-attribute-label WeaponDamage\">weapon damage</span> replenishes a charge for <span class=\"highlight\">each of your charged abilities</span>.",
    "innate": [
      {
        "n": "Max Ammo",
        "v": "+20%"
      },
      {
        "n": "Weapon Damage",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Damage Threshold",
        "v": "200"
      },
      {
        "n": "Time Frame",
        "v": "3.5s"
      }
    ],
    "from": [],
    "cooldown": "25s"
  },
  {
    "id": 393974127,
    "name": "Slowing Bullets",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/slowing_bullets.webp",
    "body": "Your bullets build up a <span class=\"highlight\">Movement Slow</span> on enemies.",
    "innate": [],
    "effects": [
      {
        "n": "Move Speed",
        "v": "-24%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Dash Distance",
        "v": "-20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Slow Duration",
        "v": "3.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Buildup Per Shot",
        "v": "0.7%"
      }
    ],
    "from": []
  },
  {
    "id": 1144549437,
    "name": "Spirit Shredder",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/spirit_shredder_bullets.webp",
    "body": "Your bullets apply a debuff that reduces the <span class=\"highlight\">Spirit Resist</span> of the target and grants you and your allies <span class=\"highlight\">Spirit Lifesteal</span> against them.",
    "innate": [],
    "effects": [
      {
        "n": "Spirit Resist",
        "v": "-8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Spirit Lifesteal",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Debuff Duration",
        "v": "8s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 3647584222,
    "name": "Split Shot",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/split_shot.webp",
    "body": "Make your weapon fire <span class=\"highlight\">multishot</span>. <br><br> Hitting more than one Hero per attack will grant a <span class=\"highlight\">stacking weapon damage bonus</span>. <br><br><span class=\"diminish\">Targets can only be hit once per multishot.</span>",
    "innate": [],
    "effects": [
      {
        "n": "Weapon Multishot",
        "v": "5",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Weapon Damage per Stack",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Buff Duration",
        "v": "5s"
      },
      {
        "n": "Max Stacks",
        "v": "5"
      },
      {
        "n": "Stack Duration",
        "v": "12s"
      }
    ],
    "from": [],
    "cooldown": "27s"
  },
  {
    "id": 98582110,
    "name": "Stalker",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/backstabber.webp",
    "body": "Dealing\n<span class=\"inline-attribute-label WeaponDamage\">weapon damage</span> at close range opens a wound and grants you\n<span class=\"inline-attribute-label BonusMoveSpeed\" style=\"color: #0F9;\">bonus move speed</span>. <br><br>Wounded enemies take\n<span class=\"inline-attribute-label SpiritDPS\">spirit damage over time</span>, have reduced <img src=\"https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_bullet_armor.png\" class=\"inline-attribute BulletResist\" alt=\"bullet resist\"/><span class=\"inline-attribute-label BulletResist\" style=\"color: #EC9719;\">bullet resist</span>, and are revealed <span class=\"highlight\">through walls</span>.",
    "innate": [
      {
        "n": "Footstep Sound Distance",
        "v": "-50%"
      },
      {
        "n": "Bonus Health",
        "v": "+50",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Damage Per Second",
        "v": "17",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Bullet Resist",
        "v": "-6%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Move Speed",
        "v": "+1.5m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Debuff Duration",
        "v": "5s"
      },
      {
        "n": "Close Range",
        "v": "8m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": [],
    "cooldown": "6s"
  },
  {
    "id": 4104549924,
    "name": "Swift Striker",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/swift_striker.webp",
    "body": "",
    "innate": [
      {
        "n": "Fire Rate",
        "v": "+20%"
      },
      {
        "n": "Sprint Speed",
        "v": "+0.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [],
    "from": [
      668299740
    ]
  },
  {
    "id": 2356412290,
    "name": "Titanic Magazine",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/titanic_magazine.webp",
    "body": "",
    "innate": [
      {
        "n": "Max Ammo",
        "v": "+100%"
      },
      {
        "n": "Weapon Damage",
        "v": "+14%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "effects": [],
    "from": [
      1548066885
    ]
  },
  {
    "id": 1770441818,
    "name": "Weakening Headshot",
    "cost": 1600,
    "tier": 2,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/weakening_headshot.webp",
    "body": "Landing a <span class=\"highlight\">Headshot</span> reduces their <span class=\"highlight\">Bullet Resist</span>.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+60",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Bullet Resist",
        "v": "-12%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Debuff Duration",
        "v": "12s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 1932939246,
    "name": "Alchemical Fire",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/alchemical_fire.webp",
    "body": "Throw a flask that explodes on contact, creating an area that does increasing\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> <span class=\"highlight\">per second</span> and reduces enemy <span class=\"highlight\">Bullet Resist</span>.<br><br>50% less effective vs non-heroes.",
    "innate": [
      {
        "n": "Spirit Power",
        "v": "+10",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Damage Per Second",
        "v": "45",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.2,
          "t": "spirit"
        }
      },
      {
        "n": "Bullet Resist",
        "v": "-7%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg",
        "sc": {
          "v": -0.055,
          "t": "spirit"
        }
      },
      {
        "n": "Max DPS",
        "v": "95",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.4,
          "t": "spirit"
        }
      },
      {
        "n": "Radius",
        "v": "10m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Duration",
        "v": "5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "30s"
  },
  {
    "id": 3294954488,
    "name": "Ballistic Enchantment",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/alchemical_seal.webp",
    "body": "Imbue an ability with increased <span class=\"highlight\">range</span>. Dealing damage with that ability grants you increased <span class=\"highlight\">weapon damage</span> per <span class=\"highlight\">unique hero hit</span>. Has reduced effect on non-heroes.",
    "innate": [],
    "effects": [
      {
        "n": "Weapon Damage per Stack",
        "v": "+20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Ability Range",
        "v": "+22%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Duration",
        "v": "20s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Non-Hero Weapon Damage",
        "v": "+5%"
      },
      {
        "n": "Non-Hero Stack Limit",
        "v": "8"
      }
    ],
    "from": [
      754480263
    ],
    "imbue": "Imbues an ability"
  },
  {
    "id": 1414319208,
    "name": "Berserker",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/berserker.webp",
    "body": "Your <span class=\"highlight\">Weapon Damage</span> increases as you take sustained damage.",
    "innate": [
      {
        "n": "Bullet Resist",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Weapon Damage per Stack",
        "v": "+7%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Damage taken to Stack",
        "v": "120",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Max Stacks",
        "v": "10"
      },
      {
        "n": "Duration",
        "v": "10s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 989206714,
    "name": "Blood Tribute",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": true,
    "cast": "toggle",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/blood_tribute.webp",
    "body": "Toggle: Continually sacrifice Health to improve\n<span class=\"inline-attribute-label FireRate\" style=\"color: #EC9719;\">fire rate</span>, <span class=\"highlight\">Debuff Resistance</span> and <span class=\"highlight\">Move Speed</span>.",
    "innate": [
      {
        "n": "Debuff Resist",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Spirit Resist",
        "v": "+8%"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+4",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Health Drain",
        "v": "50/s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      },
      {
        "n": "Fire Rate",
        "v": "+35%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Debuff Resist",
        "v": "+35%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Move Speed",
        "v": "+2.0m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "from": []
  },
  {
    "id": 2739107182,
    "name": "Burst Fire",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/burst_fire.webp",
    "body": "Briefly gain <span class=\"highlight\">Fire Rate</span> and <span class=\"highlight\">Move Speed</span> when one of your bullets hits a hero.",
    "innate": [
      {
        "n": "Slide Distance",
        "v": "+50%"
      },
      {
        "n": "Fire Rate",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      }
    ],
    "effects": [
      {
        "n": "Fire Rate",
        "v": "+32%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Move Speed",
        "v": "+1.25m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Duration",
        "v": "4.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      668299740
    ],
    "cooldown": "9s"
  },
  {
    "id": 709540378,
    "name": "Cultist Sacrifice",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/cultist_sacrifice.webp",
    "body": "Target an enemy NPC and consume it for <span class=\"highlight\">170% Bonus Souls</span> and grants a powerful long lasting buff.",
    "innate": [
      {
        "n": "Out of Combat Regen",
        "v": "+2",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Weapon Damage vs. NPCs",
        "v": "+30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Bullet Resist vs. NPCs",
        "v": "+30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Weapon Damage",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg",
        "sc": {
          "v": 0.8,
          "t": "boon"
        }
      },
      {
        "n": "Bonus Health",
        "v": "+50",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg",
        "sc": {
          "v": 4,
          "t": "boon"
        }
      },
      {
        "n": "Ability Range",
        "v": "+12%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Duration",
        "v": "160s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      1009965641
    ],
    "cooldown": "270s"
  },
  {
    "id": 2463960640,
    "name": "Escalating Resilience",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/escalating_resilience.webp",
    "body": "Grants <span class=\"highlight\">Bullet Resist</span> when your bullets hit a hero. <span class=\"highlight\">Each shot can only grant one stack.</span>",
    "innate": [
      {
        "n": "Max Ammo",
        "v": "+35%"
      },
      {
        "n": "Bonus Health",
        "v": "+75",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Weapon Damage",
        "v": "+18%"
      }
    ],
    "effects": [
      {
        "n": "Max Bullet Resist",
        "v": "30%"
      },
      {
        "n": "Bullet Resist per Stack",
        "v": "2%"
      },
      {
        "n": "Stack Duration",
        "v": "24s"
      }
    ],
    "from": [
      1548066885
    ]
  },
  {
    "id": 690458959,
    "name": "Express Shot",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/express_shot.webp",
    "body": "Your next attack will <span class=\"highlight\">fire twice</span> in quick succession with <span class=\"highlight\">increased damage</span> and velocity. This attack consumes extra ammo.",
    "innate": [
      {
        "n": "Bullet Velocity",
        "v": "+60%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Weapon Damage",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Weapon Damage",
        "v": "+125%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg",
        "sc": {
          "v": 2,
          "t": "boon"
        }
      },
      {
        "n": "Secondary Fire Weapon Damage",
        "v": "+38%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg",
        "sc": {
          "v": 1.24,
          "t": "boon"
        }
      },
      {
        "n": "Bullet Velocity",
        "v": "+100%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Extra Ammo Consumed",
        "v": "2"
      }
    ],
    "from": [
      3077079169
    ],
    "cooldown": "8s"
  },
  {
    "id": 4053935515,
    "name": "Headhunter",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/headhunter.webp",
    "body": "Your next <span class=\"highlight\">headshot</span> against an enemy Hero deals\n<span class=\"inline-attribute-label BonusWeaponDamage\">bonus weapon damage</span>,\n<span class=\"inline-attribute-label Heal\" style=\"color: #0F9;\">heal</span> you, and briefly grants\n<span class=\"inline-attribute-label BonusMoveSpeed\" style=\"color: #0F9;\">bonus move speed</span>.",
    "innate": [
      {
        "n": "Weapon Damage",
        "v": "+5%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+50",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Head Shot Bonus Damage",
        "v": "+75",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg",
        "sc": {
          "v": 4,
          "t": "boon"
        }
      },
      {
        "n": "Heal Per Headshot",
        "v": "4%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg",
        "sc": {
          "v": 0.06,
          "t": "boon"
        }
      },
      {
        "n": "Move Speed",
        "v": "+1.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Move Speed Duration",
        "v": "3s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      2010028405
    ],
    "cooldown": "8s"
  },
  {
    "id": 2108215830,
    "name": "Heroic Aura",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/heroic_aura.webp",
    "body": "Provides <span class=\"highlight\">Bullet Resist</span> to nearby friendly units.\nProvides <span class=\"highlight\">\n<span class=\"inline-attribute-label MoveSpeed\" style=\"color: #0F9;\">move speed</span></span> and <span class=\"highlight\">\n<span class=\"inline-attribute-label FireRate\" style=\"color: #EC9719;\">fire rate</span></span> to you and nearby allies. <span class=\"highlight\">Minions</span> get double value.",
    "innate": [
      {
        "n": "Sprint Speed",
        "v": "+1.5m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "Bullet Resist",
        "v": "+17%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Radius",
        "v": "35m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Move Speed",
        "v": "+2.25m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Fire Rate",
        "v": "+26%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Active Radius",
        "v": "35m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Duration",
        "v": "7s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "22s"
  },
  {
    "id": 2678489038,
    "name": "Hollow Point",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/hollow_point.webp",
    "body": "When you are <span class=\"highlight\">above 65% health</span>, deal additional <span class=\"highlight\">Weapon Damage</span> and your bullets reduce enemy <span class=\"highlight\">Bullet Resist</span>.",
    "innate": [
      {
        "n": "Out of Combat Regen",
        "v": "+4.5",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+125",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Weapon Damage",
        "v": "+35%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Bullet Resist",
        "v": "-10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Debuff Duration",
        "v": "8s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 2481177645,
    "name": "Hunter's Aura",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/hunters_aura.webp",
    "body": "Reduces nearby enemies' <span class=\"highlight\">Bullet Resist and Fire Rate</span>. If there is only one enemy hero nearby, this <span class=\"highlight\">effect is doubled</span>.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+100",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Sprint Speed",
        "v": "+0.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "Bullet Resist",
        "v": "-10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Fire Rate",
        "v": "-15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Radius",
        "v": "15m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": []
  },
  {
    "id": 2095565695,
    "name": "Point Blank",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/point_blank.webp",
    "body": "When in <span class=\"highlight\">close range</span> to your target, gain <span class=\"highlight\">Weapon Damage</span> and your bullets apply a <span class=\"highlight\">Movement Slow</span>.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+75",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Melee Resist",
        "v": "+30%"
      }
    ],
    "effects": [
      {
        "n": "Weapon Damage",
        "v": "+50%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Move Speed",
        "v": "-20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Slow Duration",
        "v": "2.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Close Range",
        "v": "15m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": [
      1342610602
    ]
  },
  {
    "id": 1798666702,
    "name": "Shadow Weave",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/shadow_weave.webp",
    "body": "Become <span class=\"highlight\">Stealthed</span>. Whenever you take damage while Stealthed you get briefly revealed.\n<br>Attacking or using an ability will end your stealth and start an <span class=\"highlight\">ambush</span>, temporarily granting you bonus <span class=\"highlight\">Weapon Damage</span> and <span class=\"highlight\">Spirit Power</span>.",
    "innate": [
      {
        "n": "Out of Combat Regen",
        "v": "+5",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Sprint Speed",
        "v": "+2m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "Stealth Duration",
        "v": "13s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Spot Radius",
        "v": "20m"
      },
      {
        "n": "Invis Sprint Speed",
        "v": "+5m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Ambush Weapon Damage",
        "v": "+50%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Ambush Spirit Power",
        "v": "+25",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Ambush Duration",
        "v": "5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Time to Full Ambush",
        "v": "6s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      3399065363
    ]
  },
  {
    "id": 2152872419,
    "name": "Sharpshooter",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/sharp_shooter.webp",
    "body": "Deal additional <span class=\"highlight\">Weapon Damage</span> when <span class=\"highlight\">beyond a minimum distance</span> from your target.",
    "innate": [
      {
        "n": "Weapon Fall-off Range",
        "v": "+20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Weapon Zoom",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Bullet Velocity",
        "v": "+60%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Weapon Damage",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Sprint Speed",
        "v": "+1.0m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Move Speed",
        "v": "-0.7m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "Weapon Damage",
        "v": "+60%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Min. Distance",
        "v": "15m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": [
      3331811235,
      3077079169
    ]
  },
  {
    "id": 4075861416,
    "name": "Spirit Rend",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/spellslinger_headshots.webp",
    "body": "Your bullets apply a debuff that reduces the <span class=\"highlight\">Spirit Resist</span> of the target and grants you and your allies <span class=\"highlight\">Spirit Lifesteal</span> against them.\nLanding <span class=\"highlight\">headshots</span> against the target reduces their <span class=\"highlight\">Spirit Resist</span> further.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+75",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Spirit Resist",
        "v": "-8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Spirit Lifesteal",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Spirit Resist on Headshot",
        "v": "-7%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Debuff Duration",
        "v": "8s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Max Stacks",
        "v": "4"
      },
      {
        "n": "Max Frequency",
        "v": "2s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      }
    ],
    "from": [
      1144549437
    ]
  },
  {
    "id": 811521119,
    "name": "Tesla Bullets",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/tesla_bullets.webp",
    "body": "Your bullets have a chance to <span class=\"highlight\">shock</span> your target. The <span class=\"highlight\">shock</span> will jump to a nearby enemy.",
    "innate": [],
    "effects": [
      {
        "n": "Shock Damage",
        "v": "33",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.19,
          "t": "spirit"
        }
      },
      {
        "n": "Proc Chance",
        "v": "15%"
      },
      {
        "n": "Max Frequency",
        "v": "0.2s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      },
      {
        "n": "Max Jumps",
        "v": "4"
      },
      {
        "n": "Jump Radius",
        "v": "8m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": []
  },
  {
    "id": 3696726732,
    "name": "Toxic Bullets",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/toxic_bullets.webp",
    "body": "Your bullets build up a <span class=\"highlight\">Bleed</span> on enemies, causing them to lose a <span class=\"highlight\">percentage</span> of their <span class=\"highlight\">Max Health</span> over time. Also reduces <span class=\"highlight\">Incoming Healing</span> on the bleeding target.",
    "innate": [],
    "effects": [
      {
        "n": "Bleed Damage",
        "v": "1.9% DPS",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.006,
          "t": "spirit"
        }
      },
      {
        "n": "Incoming Healing",
        "v": "-40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      },
      {
        "n": "Duration",
        "v": "4s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Buildup Per Shot",
        "v": "1.28%"
      }
    ],
    "from": []
  },
  {
    "id": 3791587546,
    "name": "Weighted Shots",
    "cost": 3200,
    "tier": 3,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/weighted_shots.webp",
    "body": "Your bullets build up a <span class=\"highlight\">Movement Slow</span> on enemies.",
    "innate": [
      {
        "n": "Weapon Damage",
        "v": "+30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Debuff Resist",
        "v": "+22%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Stamina Recovery",
        "v": "-14%"
      },
      {
        "n": "Move Speed",
        "v": "-0.5m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "Move Speed",
        "v": "-24%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Dash Distance",
        "v": "-20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Slow Duration",
        "v": "3.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Buildup Per Shot",
        "v": "0.7%"
      }
    ],
    "from": [
      393974127
    ]
  },
  {
    "id": 673001892,
    "name": "Armor Piercer",
    "cost": 6400,
    "tier": 4,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/armor_piercing_rounds.webp",
    "body": "Your Bullets have a chance to become unavoidable, <span class=\"highlight\">piercing through</span> enemies and <span class=\"highlight\">ignoring their Bullet Resistance</span>.",
    "innate": [
      {
        "n": "Bullet Velocity",
        "v": "+60%"
      },
      {
        "n": "Weapon Damage",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Proc Chance",
        "v": "60%"
      }
    ],
    "from": [
      3077079169
    ]
  },
  {
    "id": 710436191,
    "name": "Capacitor",
    "cost": 6400,
    "tier": 4,
    "slot": "weapon",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/capacitor.webp",
    "body": "Your bullets have a chance to <span class=\"highlight\">shock</span> your target. The <span class=\"highlight\">shock</span> will jump to a nearby enemy.\nLaunch a projectile that deals <span class=\"highlight\">\ndamage</span>, applies a strong slow that recovers over time, <span class=\"highlight\">prevents Stamina usage</span> and <span class=\"highlight\">Silences</span> their <span class=\"highlight\">movement-based items and abilities</span>.",
    "innate": [
      {
        "n": "Fire Rate",
        "v": "+5%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      }
    ],
    "effects": [
      {
        "n": "Shock Damage",
        "v": "43",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.19,
          "t": "spirit"
        }
      },
      {
        "n": "Proc Chance",
        "v": "20%"
      },
      {
        "n": "Max Frequency",
        "v": "0.2s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      },
      {
        "n": "Max Jumps",
        "v": "6"
      },
      {
        "n": "Jump Radius",
        "v": "10m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Damage",
        "v": "100",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Max Move Speed",
        "v": "-60%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Slow Duration",
        "v": "3s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      811521119
    ],
    "cooldown": "40s"
  },
  {
    "id": 3884003354,
    "name": "Crippling Headshot",
    "cost": 6400,
    "tier": 4,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/crippling_headshot.webp",
    "body": "Landing a <span class=\"highlight\">Headshot</span> will reduce their <span class=\"highlight\">Bullet, Spirit Resist, and Incoming Healing</span>.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+125",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Bullet Resist",
        "v": "-16%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Spirit Resist",
        "v": "-16%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Incoming Healing",
        "v": "-40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      },
      {
        "n": "Debuff Duration",
        "v": "12s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      1770441818
    ]
  },
  {
    "id": 800008313,
    "name": "Crushing Fists",
    "cost": 6400,
    "tier": 4,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/crushing_fists.webp",
    "body": "Your next <span class=\"highlight\">Heavy Melee</span> attack against an enemy <span class=\"highlight\">deals increased damage</span>.\nYour <span class=\"highlight\"><img src=\"https://assets-bucket.deadlock-api.com/assets-api-res/images/hud/core/icon_damage_melee.png\" class=\"inline-attribute MeleeDamage\" alt=\"melee damage\"/><span class=\"inline-attribute-label MeleeDamage\" style=\"color: #EC9719;\">melee damage</span></span> will <span class=\"highlight\">restore ammo</span> and apply a <span class=\"highlight\">stacking bullet resist debuff</span> on enemies. Heavy melee applies 2 stacks. <br><br>If the target reaches max stacks, they will be <span class=\"highlight\">stunned</span>.",
    "innate": [
      {
        "n": "Heavy Melee Distance",
        "v": "+60%"
      },
      {
        "n": "Melee Damage",
        "v": "+22%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/melee.svg"
      },
      {
        "n": "Bullet Resist",
        "v": "+12%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Bonus Heavy Damage",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/melee.svg"
      },
      {
        "n": "Ammo",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/ammo_clip_size.svg"
      },
      {
        "n": "Bullet Resist",
        "v": "-5%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Max Stacks",
        "v": "6"
      },
      {
        "n": "Stun Duration",
        "v": "0.75s"
      },
      {
        "n": "Debuff Duration",
        "v": "8s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      26002154
    ],
    "cooldown": "5s"
  },
  {
    "id": 339443430,
    "name": "Frenzy",
    "cost": 6400,
    "tier": 4,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/frenzy.webp",
    "body": "While you are <span class=\"highlight\">below 50% health</span>, you gain stat bonuses for a duration and existing debuffs on you are reduced.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+160",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Fire Rate",
        "v": "+15%"
      },
      {
        "n": "Bullet Lifesteal",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Move Speed",
        "v": "4mm/s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Fire Rate",
        "v": "40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Debuff Resist",
        "v": "+40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Duration",
        "v": "10s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "16s"
  },
  {
    "id": 365620721,
    "name": "Glass Cannon",
    "cost": 6400,
    "tier": 4,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/glass_cannon.webp",
    "body": "Each hero kill grants <span class=\"highlight\">permanent Fire Rate</span> (up to a max of 8 times). Death results in the loss of 1 stack.",
    "innate": [
      {
        "n": "Weapon Damage",
        "v": "+85%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Max Health",
        "v": "-13%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Fire Rate per Kill",
        "v": "+7%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      }
    ],
    "from": []
  },
  {
    "id": 1396247347,
    "name": "Lucky Shot",
    "cost": 6400,
    "tier": 4,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/lucky_shot.webp",
    "body": "Your bullets have a chance to be empowered, causing them to deal <span class=\"highlight\">bonus weapon damage</span> on hit.<br><span class=\"diminish\">Bonus damage cannot Crit.</span>",
    "innate": [
      {
        "n": "Max Ammo",
        "v": "+30%"
      }
    ],
    "effects": [
      {
        "n": "Bonus Weapon Damage",
        "v": "+100%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Proc Chance",
        "v": "25%"
      }
    ],
    "from": []
  },
  {
    "id": 2480592370,
    "name": "Ricochet",
    "cost": 6400,
    "tier": 4,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/ricochet.webp",
    "body": "Your bullets will <span class=\"highlight\">ricochet</span> on enemies near your target, <span class=\"highlight\">applying any bullet procs</span> and <span class=\"highlight\">dealing a percentage of the original damage.</span>",
    "innate": [
      {
        "n": "Fire Rate",
        "v": "+18%"
      }
    ],
    "effects": [
      {
        "n": "Ricochet Damage",
        "v": "65%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Ricochet Targets",
        "v": "2"
      },
      {
        "n": "Ricochet Range",
        "v": "13m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": []
  },
  {
    "id": 1113837674,
    "name": "Silencer",
    "cost": 6400,
    "tier": 4,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/silencer.webp",
    "body": "Your bullets reduce the target's <span class=\"highlight\">outgoing spirit damage</span>.\nYour bullets build up to a <span class=\"highlight\">Silence</span>. Victims are immune to the build up for <span class=\"highlight\">10s</span> after silence expires.",
    "innate": [
      {
        "n": "Spirit Resist",
        "v": "+12%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Spirit Damage Reduction",
        "v": "-25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Debuff Duration",
        "v": "6s"
      },
      {
        "n": "Immunity Duration",
        "v": "10s"
      },
      {
        "n": "Buildup Per Shot",
        "v": "1.04%"
      }
    ],
    "from": []
  },
  {
    "id": 2221211450,
    "name": "Spellslinger",
    "cost": 6400,
    "tier": 4,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/spell_slinger.webp",
    "body": "While in-combat whenever you cast an ability or item, gain a stacking buff that improves fire rate and reload speed. <br><span class=\"diminish\">Each stack refreshes the duration.</span>",
    "innate": [
      {
        "n": "Ability Cooldown Reduction",
        "v": "+5%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      }
    ],
    "effects": [
      {
        "n": "Fire Rate",
        "v": "+11%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Reload Time",
        "v": "-10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/ammo_reload.svg"
      },
      {
        "n": "Max Stacks",
        "v": "6"
      },
      {
        "n": "Buff Duration",
        "v": "18s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 2226497419,
    "name": "Spiritual Overflow",
    "cost": 6400,
    "tier": 4,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/spiritual_overflow.webp",
    "body": "Gain bonus <span class=\"highlight\">Fire Rate</span>, <span class=\"highlight\">Spirit Power</span> and <span class=\"highlight\">Spirit Lifesteal</span> by <span class=\"highlight\">charging up</span> when shooting heroes.",
    "innate": [
      {
        "n": "Ability Duration",
        "v": "+13%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Spirit Lifesteal",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+90",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+8",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Fire Rate",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+30",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Spirit Lifesteal",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Buildup Per Shot",
        "v": "1.08%"
      },
      {
        "n": "Duration",
        "v": "15s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      876563814
    ]
  },
  {
    "id": 3568217437,
    "name": "Haunting Shot",
    "cost": 9999,
    "tier": 5,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/eldritch_shot.webp",
    "body": "Your next bullet applies a powerful debuff reducing the enemy's damage output, healing and movement speed. It also deals\n<span class=\"inline-attribute-label BonusSpiritDamage\">bonus spirit damage</span> based on the target's current Health. <br><br>The bullet is larger and penetrates through targets.",
    "innate": [],
    "effects": [
      {
        "n": "Current Health Damage",
        "v": "10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Damage Penalty",
        "v": "-40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      },
      {
        "n": "Incoming Healing",
        "v": "-40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      },
      {
        "n": "Bullet Radius",
        "v": "1.5m"
      },
      {
        "n": "Debuff Duration",
        "v": "4s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Move Speed",
        "v": "-32%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Dash Distance",
        "v": "-36%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      }
    ],
    "from": [],
    "cooldown": "2.5s"
  },
  {
    "id": 3269957497,
    "name": "Infinite Rounds",
    "cost": 9999,
    "tier": 5,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/infinite_rounds.webp",
    "body": "Your Bullets have a chance to become unavoidable, <span class=\"highlight\">piercing through</span> enemies and <span class=\"highlight\">ignoring their Bullet Resistance</span>.\nYou have <span class=\"highlight\">infinite</span> ammo.",
    "innate": [
      {
        "n": "Bullet Velocity",
        "v": "+200%"
      },
      {
        "n": "Fire Rate",
        "v": "+35%"
      }
    ],
    "effects": [
      {
        "n": "Proc Chance",
        "v": "65%"
      }
    ],
    "from": []
  },
  {
    "id": 64550694,
    "name": "Runed Gauntlets",
    "cost": 9999,
    "tier": 5,
    "slot": "weapon",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/runed_gauntlets.webp",
    "body": "Pierces through parry.\nEvery time you land a heavy melee, your existing cooldowns get reduced.",
    "innate": [
      {
        "n": "Heavy Melee Distance",
        "v": "+150%"
      },
      {
        "n": "Melee Resist",
        "v": "+50%"
      },
      {
        "n": "Melee Damage",
        "v": "+30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/melee.svg"
      }
    ],
    "effects": [
      {
        "n": "Cooldown Reduction on Hit",
        "v": "16%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      },
      {
        "n": "Min Reduction",
        "v": "4s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      }
    ],
    "from": [],
    "cooldown": "10s"
  },
  {
    "id": 3633614685,
    "name": "Extra Health",
    "cost": 800,
    "tier": 1,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/extra_health.webp",
    "body": "",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+210",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [],
    "from": []
  },
  {
    "id": 2829638276,
    "name": "Extra Regen",
    "cost": 800,
    "tier": 1,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/extra_regen.webp",
    "body": "",
    "innate": [
      {
        "n": "Health Regen",
        "v": "+2.5",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+1.5",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [],
    "from": []
  },
  {
    "id": 4139877411,
    "name": "Extra Stamina",
    "cost": 800,
    "tier": 1,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/extra_stamina.webp",
    "body": "",
    "innate": [
      {
        "n": "Stamina",
        "v": "+1"
      },
      {
        "n": "Stamina Recovery",
        "v": "+12%"
      }
    ],
    "effects": [],
    "from": []
  },
  {
    "id": 1672893796,
    "name": "Grit",
    "cost": 800,
    "tier": 1,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/grit.webp",
    "body": "Gain a <span class=\"highlight\">Barrier</span> for a short duration.",
    "innate": [
      {
        "n": "Out of Combat Regen",
        "v": "+1.0",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Barrier",
        "v": "200",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_alt.svg"
      },
      {
        "n": "Barrier Duration",
        "v": "4s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "60s"
  },
  {
    "id": 1710079648,
    "name": "Healing Rite",
    "cost": 800,
    "tier": 1,
    "slot": "vitality",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/healing_rite.webp",
    "body": "Grant <span class=\"highlight\">Regen</span> and <span class=\"highlight\">Sprint Speed</span> to the target. Gets dispelled if you take damage from enemy players or objectives. Can be self-cast.",
    "innate": [],
    "effects": [
      {
        "n": "Total HP Regen",
        "v": "300",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg",
        "sc": {
          "v": 1.1,
          "t": "spirit"
        }
      },
      {
        "n": "Sprint Speed",
        "v": "+2m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Regen Duration",
        "v": "20s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Cast Range",
        "v": "30m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      }
    ],
    "from": [],
    "cooldown": "70s"
  },
  {
    "id": 1437614329,
    "name": "Melee Lifesteal",
    "cost": 800,
    "tier": 1,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/melee_lifesteal.webp",
    "body": "Your next <span class=\"highlight\">Melee</span> attack <span class=\"highlight\">heals you</span>. <span class=\"diminish\"><br><br>This heal is 30% effective vs non-heroes. <br>Cooldown is 1.5x as long for Light Melee hits.</span>",
    "innate": [
      {
        "n": "Melee Damage",
        "v": "+12%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/melee.svg"
      }
    ],
    "effects": [
      {
        "n": "Heal on Melee Hit",
        "v": "100",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "from": [],
    "cooldown": "8s"
  },
  {
    "id": 4204808176,
    "name": "Rebuttal",
    "cost": 800,
    "tier": 1,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/rebuttal.webp",
    "body": "On a successful <span class=\"highlight\">Parry</span> against an enemy Hero, <span class=\"highlight\">Heal</span> yourself for the damage parried and returns that damage to the target, and temporarily gain increased <span class=\"highlight\">damage.</span>",
    "innate": [
      {
        "n": "Parry Cooldown",
        "v": "-1.25s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      },
      {
        "n": "Melee Resist",
        "v": "+18%"
      },
      {
        "n": "Bonus Health",
        "v": "+75",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Bonus Damage",
        "v": "+30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      },
      {
        "n": "Damage Parried as Heal",
        "v": "100%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Buff Duration",
        "v": "6s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 3399065363,
    "name": "Sprint Boots",
    "cost": 800,
    "tier": 1,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/sprint_boots.webp",
    "body": "",
    "innate": [
      {
        "n": "Sprint Speed",
        "v": "+2.0m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+2",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [],
    "from": []
  },
  {
    "id": 1235347618,
    "name": "Battle Vest",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/battle_vest.webp",
    "body": "While you are <span class=\"highlight\">above 65% health</span>, gain <span class=\"highlight\">\n<span class=\"inline-attribute-label WeaponDamage\">weapon damage</span></span> and <span class=\"highlight\">\n<span class=\"inline-attribute-label BonusFireRate\" style=\"color: #EC9719;\">bonus fire rate</span></span>.",
    "innate": [
      {
        "n": "Bullet Resist",
        "v": "+18%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+3",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Weapon Damage",
        "v": "+22%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Fire Rate",
        "v": "+7%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      }
    ],
    "from": []
  },
  {
    "id": 499683006,
    "name": "Bullet Lifesteal",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/bullet_lifesteal.webp",
    "body": "",
    "innate": [
      {
        "n": "Bullet Lifesteal",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+90",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Weapon Damage",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "effects": [],
    "from": []
  },
  {
    "id": 1047818222,
    "name": "Debuff Reducer",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/debuff_reducer.webp",
    "body": "Reduces the <span class=\"highlight\">duration</span> of all negative effects applied to you.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+90",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Debuff Resist",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 3970837787,
    "name": "Enchanter's Emblem",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/enchanters_emblem.webp",
    "body": "While you are <span class=\"highlight\">above 65% health</span>, gain bonus <span class=\"highlight\">\n<span class=\"inline-attribute-label Spirit\" style=\"color: #CE90FF;\">Spirit</span></span> and <span class=\"highlight\">Cooldown Reduction</span>.",
    "innate": [
      {
        "n": "Spirit Resist",
        "v": "+18%"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+2",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Spirit Power",
        "v": "+15",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Ability Cooldown Reduction",
        "v": "+5%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      }
    ],
    "from": []
  },
  {
    "id": 2447176615,
    "name": "Enduring Speed",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/enduring_speed.webp",
    "body": "Reduces the effect of enemy <span class=\"highlight\">Move Speed</span> penalties.",
    "innate": [
      {
        "n": "Move Speed",
        "v": "+2.0m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+2",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Slow Resist",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "from": [
      3399065363
    ]
  },
  {
    "id": 857669956,
    "name": "Guardian Ward",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/guardian_ward.webp",
    "body": "Provide the target with a <span class=\"highlight\">Barrier</span> and temporary <span class=\"highlight\">Move Speed</span>. <span class=\"diminish\"><br>Can be self-cast.<br>Cooldown is reduced by half when cast on someone else.</span>",
    "innate": [
      {
        "n": "Ability Range",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+1.5",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Barrier",
        "v": "250",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_alt.svg"
      },
      {
        "n": "Move Speed",
        "v": "+2.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Buff Duration",
        "v": "6s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Cast Range",
        "v": "40m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      }
    ],
    "from": [
      1672893796
    ],
    "cooldown": "60s"
  },
  {
    "id": 2603935618,
    "name": "Healbane",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/healbane.webp",
    "body": "Your\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> reduces the enemy's <span class=\"highlight\">Incoming Healing</span>. If an enemy hero dies under this effect, you receive a large heal.",
    "innate": [
      {
        "n": "Spirit Power",
        "v": "+7",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Incoming Healing",
        "v": "-35%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      },
      {
        "n": "Heal On Hero Kill",
        "v": "170",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg",
        "sc": {
          "v": 3,
          "t": "boon"
        }
      },
      {
        "n": "Duration",
        "v": "8s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 2566692615,
    "name": "Healing Booster",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/healing_booster.webp",
    "body": "Increases the effectiveness of your <span class=\"highlight\">healing</span>.",
    "innate": [
      {
        "n": "Out of Combat Regen",
        "v": "+2",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Outgoing Healing",
        "v": "+20%"
      }
    ],
    "from": []
  },
  {
    "id": 1644605047,
    "name": "Reactive Barrier",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/reactive_barrier.webp",
    "body": "Gain a <span class=\"highlight\">Barrier</span> when you are <span class=\"highlight\">Stunned, Chained, Immobilized, Slept or Silenced</span>.",
    "innate": [
      {
        "n": "Out of Combat Regen",
        "v": "+1.0",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Barrier",
        "v": "325",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_alt.svg",
        "sc": {
          "v": 1.8,
          "t": "spirit"
        }
      },
      {
        "n": "Duration",
        "v": "10s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      1672893796
    ],
    "cooldown": "55s"
  },
  {
    "id": 2059712766,
    "name": "Restorative Locket",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/restorative_locket.webp",
    "body": "When an enemy uses an ability within 32mm range from you, store one <span class=\"highlight\">Restoration Stack</span>. <br><br>Consume all stacks to <span class=\"highlight\">heal yourself</span> and replenish <span class=\"highlight\">up to 3 stamina</span> based on how many stacks you have.",
    "innate": [
      {
        "n": "Spirit Resist",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Heal Per Stack",
        "v": "16",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg",
        "sc": {
          "v": 0.45,
          "t": "boon"
        }
      },
      {
        "n": "Max Stacks",
        "v": "25"
      },
      {
        "n": "Max Stamina Restore",
        "v": "3"
      }
    ],
    "from": [],
    "cooldown": "20s"
  },
  {
    "id": 3361075077,
    "name": "Return Fire",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/return_fire.webp",
    "body": "Automatically <span class=\"highlight\">fire a bullet</span> towards any attacker who damages you with their abilities or weapon.",
    "innate": [
      {
        "n": "Bullet Resist",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Bullet Damage Returned",
        "v": "65%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Spirit Damage Returned",
        "v": "25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Duration",
        "v": "6.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "23s"
  },
  {
    "id": 876563814,
    "name": "Spirit Lifesteal",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/spirit_lifesteal.webp",
    "body": "",
    "innate": [
      {
        "n": "Spirit Lifesteal",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+90",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+8",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "effects": [],
    "from": []
  },
  {
    "id": 112198670,
    "name": "Spirit Shielding",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/spirit_shielding.webp",
    "body": "Gain a <span class=\"highlight\">Barrier</span> whenever you take significant\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> from enemy Heroes in a small time frame.",
    "innate": [
      {
        "n": "Out of Combat Regen",
        "v": "+2.5",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Barrier",
        "v": "300",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_alt.svg",
        "sc": {
          "v": 5,
          "t": "boon"
        }
      },
      {
        "n": "Spirit Resist",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Damage Threshold",
        "v": "225",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Time Frame",
        "v": "3.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Barrier Duration",
        "v": "8s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      1672893796
    ],
    "cooldown": "45s"
  },
  {
    "id": 3074274290,
    "name": "Trophy Collector",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/trophy_collector.webp",
    "body": "Whenever you score an <span class=\"highlight\">assist or kill</span>, gain extra <span class=\"highlight\">sprint</span>, <span class=\"highlight\">ability range</span> and <span class=\"highlight\">passive soul generation</span>. This effect stacks and persists through death.",
    "innate": [
      {
        "n": "Weapon Damage vs. NPCs",
        "v": "-15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Sprint Speed",
        "v": "+2.0m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+2",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Sprint Speed",
        "v": "+0.15m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Ability Range",
        "v": "+0.75%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Souls per Minute",
        "v": "16",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/hud/icons/icon_soul.svg"
      },
      {
        "n": "Max Stacks",
        "v": "16"
      }
    ],
    "from": [
      3399065363
    ]
  },
  {
    "id": 805079544,
    "name": "Weapon Shielding",
    "cost": 1600,
    "tier": 2,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/weapon_shielding.webp",
    "body": "Gain a <span class=\"highlight\">Barrier</span> whenever you take significant\n<span class=\"inline-attribute-label WeaponDamage\">weapon damage</span> from enemy Heroes in a small time frame.",
    "innate": [
      {
        "n": "Out of Combat Regen",
        "v": "+2.5",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Barrier",
        "v": "300",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_alt.svg",
        "sc": {
          "v": 5,
          "t": "boon"
        }
      },
      {
        "n": "Bullet Resist",
        "v": "+18%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Damage Threshold",
        "v": "250",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Time Frame",
        "v": "4.0s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Barrier Duration",
        "v": "8s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      1672893796
    ],
    "cooldown": "35s"
  },
  {
    "id": 3140772621,
    "name": "Bullet Resilience",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/bullet_resilience.webp",
    "body": "When below <span class=\"highlight\">50% health</span>, gain additional <span class=\"highlight\">Bullet Resist</span>.",
    "innate": [
      {
        "n": "Bullet Resist",
        "v": "+35%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+5",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Stat",
        "v": "50"
      },
      {
        "n": "Bullet Resist",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      }
    ],
    "from": []
  },
  {
    "id": 1414025773,
    "name": "Counterspell",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/counterspell.webp",
    "body": "Your next parry <span class=\"highlight\">protects you from the damage and effects of enemy abilities and items</span>. On a successful spell parry\n<span class=\"inline-attribute-label Heal\" style=\"color: #0F9;\">heal</span> and gain\n<span class=\"inline-attribute-label MoveSpeed\" style=\"color: #0F9;\">move speed</span> and\n<span class=\"inline-attribute-label Spirit\" style=\"color: #CE90FF;\">Spirit</span>.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+50",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+5",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Healing",
        "v": "150",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+20",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/spirit.svg"
      },
      {
        "n": "Move Speed",
        "v": "+1.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Buff Duration",
        "v": "6s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Spell Parry Duration",
        "v": "0.8s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "23s"
  },
  {
    "id": 3731635960,
    "name": "Dispel Magic",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/debuff_remover.webp",
    "body": "<span class=\"highlight\">Purge all non-ultimate negative effects</span> currently applied to you. If any effects were removed, <span class=\"highlight\">heal yourself</span> and gain a <span class=\"highlight\">move speed bonus</span>. <br><span class=\"diminish\">Cannot be used while Stunned or Slept.</span>",
    "innate": [
      {
        "n": "Spirit Resist",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Heal Amount",
        "v": "250",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Move Speed",
        "v": "+2m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Buff Duration",
        "v": "3s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "45s"
  },
  {
    "id": 3585132399,
    "name": "Fortitude",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/fortitude.webp",
    "body": "After not taking damage for a period, gain health regen.\nWhen you are <span class=\"highlight\">above 75% health</span>, you have bonus <span class=\"highlight\">Move Speed</span>.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+375",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Restore Delay",
        "v": "+10s"
      },
      {
        "n": "Max Health Regen",
        "v": "+2.25%"
      },
      {
        "n": "Move Speed",
        "v": "+1.5m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "from": [
      3633614685
    ]
  },
  {
    "id": 1409190604,
    "name": "Fury Trance",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/fury_trance.webp",
    "body": "Grants <span class=\"highlight\">Fire Rate</span>, <span class=\"highlight\">Spirit Resistance</span> and <span class=\"highlight\">Move Speed</span>, and removes the <span class=\"highlight\">Move Speed</span> penalty while shooting, but <span class=\"highlight\">Silences</span> you and <span class=\"highlight\">disables stamina usage and regeneration</span>.",
    "innate": [
      {
        "n": "Bullet Lifesteal",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+100",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Weapon Damage",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Fire Rate",
        "v": "32%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Move Speed",
        "v": "+1.5m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Spirit Resist",
        "v": "+40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Duration",
        "v": "6.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      499683006
    ],
    "cooldown": "18s"
  },
  {
    "id": 2956256701,
    "name": "Healing Nova",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/healing_nova.webp",
    "body": "<span class=\"highlight\">Heal</span> yourself and nearby allies.",
    "innate": [
      {
        "n": "Ability Range",
        "v": "+5%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+8",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Total HP Regen",
        "v": "325",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg",
        "sc": {
          "v": 1.1,
          "t": "spirit"
        }
      },
      {
        "n": "Regen Duration",
        "v": "2s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Radius",
        "v": "18m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": [
      1710079648
    ],
    "cooldown": "60s"
  },
  {
    "id": 1252627263,
    "name": "Lifestrike",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/lifestrike.webp",
    "body": "Your <span class=\"highlight\">Melee Attack</span> applies <span class=\"highlight\">Movement Slow</span> and <span class=\"highlight\">heals you</span> for a percentage of the <span class=\"highlight\">Melee Damage</span> dealt plus a fixed amount. <span class=\"diminish\"><br><br>This heal is 40% effective vs non-heroes. <br>Cooldown is 1.5x as long for Light Melee hits.</span>",
    "innate": [
      {
        "n": "Melee Damage",
        "v": "+16%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/melee.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+125",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Move Speed",
        "v": "-48%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Heal on Melee Hit",
        "v": "120",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg",
        "sc": {
          "v": 1.75,
          "t": "boon"
        }
      },
      {
        "n": "Melee Hit Heal",
        "v": "35%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg",
        "sc": {
          "v": 0.5,
          "t": "boon"
        }
      },
      {
        "n": "Slow Duration",
        "v": "2.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      1437614329
    ],
    "cooldown": "4s"
  },
  {
    "id": 600033864,
    "name": "Majestic Leap",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/majestic_leap.webp",
    "body": "<span class=\"highlight\">Launch yourself</span> high into the air and grant yourself a <span class=\"highlight\">Barrier</span>. While in the air, you can use the active again to drop down faster.<br><br><span class=\"diminish\">Cannot be used for 5s if attacked by enemy Hero.</span>",
    "innate": [],
    "effects": [
      {
        "n": "Barrier",
        "v": "200",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_alt.svg",
        "sc": {
          "v": 12,
          "t": "boon"
        }
      },
      {
        "n": "Interrupt Cooldown",
        "v": "5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      },
      {
        "n": "Barrier Duration",
        "v": "8s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Air Control",
        "v": "+50%"
      }
    ],
    "from": [],
    "cooldown": "45s"
  },
  {
    "id": 1378931225,
    "name": "Metal Skin",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/metal_skin.webp",
    "body": "Become <span class=\"highlight\">immune to bullets</span>.",
    "innate": [
      {
        "n": "Bullet Resist",
        "v": "+12%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Active Movespeed Penalty",
        "v": "-1.5m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Gravity Scale",
        "v": "+20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Dash Distance",
        "v": "-20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Duration",
        "v": "5.0s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "24s"
  },
  {
    "id": 1804594021,
    "name": "Rescue Beam",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/rescue_beam.webp",
    "body": "<span class=\"highlight\">Heals</span> a target allied hero and yourself for a percentage of <span class=\"highlight\">Max Health</span>. Once while healing, you can <span class=\"highlight\">Pull</span> the target towards you. Can be self-cast.",
    "innate": [
      {
        "n": "Sprint Speed",
        "v": "+0.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Ability Range",
        "v": "+6%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "effects": [
      {
        "n": "Heal Amount",
        "v": "20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Channel Duration",
        "v": "2.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_cast.png"
      },
      {
        "n": "Cast Range",
        "v": "35m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      }
    ],
    "from": [
      1710079648
    ],
    "cooldown": "60s"
  },
  {
    "id": 2163598980,
    "name": "Spirit Resilience",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/spirit_resilience.webp",
    "body": "When below <span class=\"highlight\">50% health</span>, gain additional Spirit Resist.",
    "innate": [
      {
        "n": "Spirit Resist",
        "v": "+30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+3",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Stat",
        "v": "50"
      },
      {
        "n": "Spirit Resist",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      }
    ],
    "from": []
  },
  {
    "id": 334300056,
    "name": "Stamina Mastery",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/stamina_mastery.webp",
    "body": "Allows an additional use of <span class=\"highlight\">Air Jump</span> or <span class=\"highlight\">Air Dash</span> before landing.",
    "innate": [
      {
        "n": "Stamina",
        "v": "+2"
      },
      {
        "n": "Stamina Recovery",
        "v": "+18%"
      },
      {
        "n": "Air Jump/Dash Distance",
        "v": "+23%"
      }
    ],
    "effects": [],
    "from": [
      4139877411
    ]
  },
  {
    "id": 865958998,
    "name": "Veil Walker",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/veil_walker.webp",
    "body": "Walking through a <span class=\"highlight\">cosmic veil</span> grants you <span class=\"highlight\">Stealth</span>, <span class=\"highlight\">Heal</span> and increased <span class=\"highlight\">Move Speed</span>.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+125",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+6",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Invis Move Speed",
        "v": "3.5m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Heal",
        "v": "85",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg",
        "sc": {
          "v": 8,
          "t": "boon"
        }
      },
      {
        "n": "Invisibility Duration",
        "v": "8s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "15s"
  },
  {
    "id": 3270001687,
    "name": "Warp Stone",
    "cost": 3200,
    "tier": 3,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/warp_stone.webp",
    "body": "<span class=\"highlight\">Teleport</span> straight ahead, gaining <span class=\"highlight\">Bullet Resist</span>.",
    "innate": [],
    "effects": [
      {
        "n": "Teleport Range",
        "v": "11m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      },
      {
        "n": "Bullet Resist",
        "v": "+30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Buff Duration",
        "v": "6s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "16s"
  },
  {
    "id": 3361811174,
    "name": "Cheat Death",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/cheat_death.webp",
    "body": "When you would take lethal damage, instead become <span class=\"highlight\">temporarily death immune</span> and <span class=\"highlight\">remove all non-stun debuffs</span>. <br><br>While death immune, you deal <span class=\"highlight\">reduced damage</span> and have <span class=\"highlight\">reduced healing</span>.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+200",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Bullet Resist",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Death Immunity Duration",
        "v": "4.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Damage Reduction",
        "v": "-60%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      },
      {
        "n": "Incoming Healing",
        "v": "-60%"
      }
    ],
    "from": [],
    "cooldown": "90s"
  },
  {
    "id": 2407781327,
    "name": "Colossus",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/colossus.webp",
    "body": "Grow <span class=\"highlight\">larger in size</span>, gaining <img src=\"https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_bullet_armor.png\" class=\"inline-attribute BulletResist\" alt=\"bullet resist\"/><span class=\"inline-attribute-label BulletResist\" style=\"color: #EC9719;\">bullet resist</span>, <img src=\"https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_tech_armor.png\" class=\"inline-attribute SpiritResist\" alt=\"spirit resist\"/><span class=\"inline-attribute-label SpiritResist\" style=\"color: #CE90FF;\">spirit resist</span>, and <img src=\"https://assets-bucket.deadlock-api.com/assets-api-res/images/hud/core/icon_damage_melee.png\" class=\"inline-attribute MeleeDamage\" alt=\"melee damage\"/><span class=\"inline-attribute-label MeleeDamage\" style=\"color: #EC9719;\">melee damage</span>. <br><br>Nearby enemies suffer from <img src=\"https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_slow_large.png\" class=\"inline-attribute Slow\" alt=\"slow\"/><span class=\"inline-attribute-label Slow\">slow</span> and have reduced <span class=\"highlight\">dash speed</span>.",
    "innate": [
      {
        "n": "Base Health",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Weapon Damage",
        "v": "+15%"
      }
    ],
    "effects": [
      {
        "n": "Bullet Resist",
        "v": "35%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Spirit Resist",
        "v": "35%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Melee Damage",
        "v": "+30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/melee.svg"
      },
      {
        "n": "Move Speed",
        "v": "-24%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Radius",
        "v": "14m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Duration",
        "v": "7s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Model Scale",
        "v": "20%"
      }
    ],
    "from": [
      3633614685
    ],
    "cooldown": "37s"
  },
  {
    "id": 1662311306,
    "name": "Divine Barrier",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/divine_barrier.webp",
    "body": "<span class=\"highlight\">Remove all non-stun debuffs</span> from the target and provide them with a <span class=\"highlight\">Barrier</span> and <span class=\"highlight\">Move Speed</span>. <span class=\"diminish\"><br>Can be self-cast. Cooldown is reduced by half when cast on someone else.</span>",
    "innate": [
      {
        "n": "Ability Range",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+1.5",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Barrier",
        "v": "600",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_alt.svg"
      },
      {
        "n": "Move Speed",
        "v": "+2.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Buff Duration",
        "v": "6s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Cast Range",
        "v": "40m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      }
    ],
    "from": [
      857669956
    ],
    "cooldown": "55s"
  },
  {
    "id": 2820116164,
    "name": "Diviner's Kevlar",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/diviners_kevlar.webp",
    "body": "Upon casting an <span class=\"highlight\">ultimate ability</span> gain a <span class=\"highlight\">Barrier</span> and temporary <span class=\"highlight\">Spirit Power</span>.",
    "innate": [
      {
        "n": "Ability Duration",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Ultimate Cooldown Reduction",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      }
    ],
    "effects": [
      {
        "n": "Barrier",
        "v": "1000",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_alt.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+40",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Buff Duration",
        "v": "20s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "40s"
  },
  {
    "id": 1427630806,
    "name": "Healing Tempo",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/healing_tempo.webp",
    "body": "Applying\n<span class=\"inline-attribute-label Heal\" style=\"color: #0F9;\">heal</span> to yourself or an ally grants the target\n<span class=\"inline-attribute-label BonusFireRate\" style=\"color: #EC9719;\">bonus fire rate</span> and\n<span class=\"inline-attribute-label BonusMoveSpeed\" style=\"color: #0F9;\">bonus move speed</span>.<br><br><span class=\"diminish\">Does not apply on innate Regen or passive Bullet/Spirit Lifesteals.</span>",
    "innate": [
      {
        "n": "Outgoing Healing",
        "v": "+25%"
      },
      {
        "n": "Spirit Resist",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Health Regen",
        "v": "+6",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+4",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Fire Rate",
        "v": "+35%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Move Speed",
        "v": "+1.25m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Buff Duration",
        "v": "7s"
      }
    ],
    "from": [
      2566692615
    ]
  },
  {
    "id": 951866250,
    "name": "Indomitable",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/indomitable.webp",
    "body": "The next <span class=\"highlight\">Stun, Chain, Immobilize, Sleep, Silence or Fear</span> is automatically cleansed. When this happens, you gain a <span class=\"highlight\">barrier</span> and all your <span class=\"highlight\">ability cooldowns</span> get reduced by 20%.",
    "innate": [
      {
        "n": "Bullet Resist",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Spirit Resist",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+2.0",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Barrier",
        "v": "325",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_alt.svg",
        "sc": {
          "v": 2,
          "t": "spirit"
        }
      },
      {
        "n": "Duration",
        "v": "10s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      1644605047
    ],
    "cooldown": "55s"
  },
  {
    "id": 1797283378,
    "name": "Infuser",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/infuser.webp",
    "body": "Gain <span class=\"highlight\">Spirit Lifesteal</span> and <span class=\"highlight\">Spirit Power</span>.",
    "innate": [
      {
        "n": "Spirit Lifesteal",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Spirit Resist",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+100"
      },
      {
        "n": "Spirit Power",
        "v": "+8",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Spirit Lifesteal",
        "v": "+75%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+30",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Duration",
        "v": "7s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      876563814
    ],
    "cooldown": "30s"
  },
  {
    "id": 2037039379,
    "name": "Inhibitor",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/inhibitor.webp",
    "body": "Your bullets build up to reduce the target's <span class=\"highlight\">outgoing damage</span> and apply <span class=\"highlight\">healing reduction</span>.",
    "innate": [
      {
        "n": "Weapon Damage",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+150",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Damage Penalty",
        "v": "-30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      },
      {
        "n": "Incoming Healing",
        "v": "-40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      },
      {
        "n": "Debuff Duration",
        "v": "5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Buildup Per Shot",
        "v": "0.77%"
      }
    ],
    "from": []
  },
  {
    "id": 1250307611,
    "name": "Juggernaut",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/juggernaut.webp",
    "body": "Enemies that shoot you have their <span class=\"highlight\">Fire Rate</span> slowed.",
    "innate": [
      {
        "n": "Slow Resist",
        "v": "+50%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Move Speed",
        "v": "+2.5m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Melee Resist",
        "v": "+25%"
      },
      {
        "n": "Health Regen",
        "v": "+15",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Fire Rate",
        "v": "-40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Duration",
        "v": "4s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      2447176615
    ]
  },
  {
    "id": 865846625,
    "name": "Leech",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/leech.webp",
    "body": "Reduces the effect of enemy applied <span class=\"highlight\">healing reduction</span>.",
    "innate": [
      {
        "n": "Spirit Lifesteal",
        "v": "+30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Bullet Lifesteal",
        "v": "+30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+180",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Weapon Damage",
        "v": "+12%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+12",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "effects": [],
    "from": [
      499683006,
      876563814
    ]
  },
  {
    "id": 1371725689,
    "name": "Phantom Strike",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/phantom_strike.webp",
    "body": "<span class=\"highlight\">Teleport</span> to an enemy target and pull them to the ground. Dealing <span class=\"highlight\">damage</span>, <span class=\"highlight\">Move speed</span> reduction and <span class=\"highlight\">Disarm</span>.",
    "innate": [
      {
        "n": "Weapon Damage",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+8",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Move Speed",
        "v": "-40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Impact Damage",
        "v": "75",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.93,
          "t": "spirit"
        }
      },
      {
        "n": "Cast Range",
        "v": "25m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      },
      {
        "n": "Debuff Duration",
        "v": "3s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "35s"
  },
  {
    "id": 3491236900,
    "name": "Plated Armor",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/plated_armor.webp",
    "body": "Gain a chance to either deflect incoming bullets, preventing all\n<span class=\"inline-attribute-label WeaponDamage\">weapon damage</span> or prevent all <span class=\"highlight\">on-hit effects</span> from bullets.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+130",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Deflection Percent",
        "v": "30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "On-Hit Prevention Percent",
        "v": "50%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      }
    ],
    "from": []
  },
  {
    "id": 1282141666,
    "name": "Siphon Bullets",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/siphon_bullets.webp",
    "body": "Your bullets temporarily <span class=\"highlight\">steal Max HP</span> from enemies. Enemies regain their stolen health when the debuff expires.",
    "innate": [
      {
        "n": "Weapon Damage",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Bullet Resist",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Max HP Steal",
        "v": "2.5%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Steal Duration",
        "v": "17s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Max Frequency",
        "v": "1.2s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      }
    ],
    "from": []
  },
  {
    "id": 1955841979,
    "name": "Spellbreaker",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/spellbreaker.webp",
    "body": "The next instance of high\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> you take is significantly reduced.",
    "innate": [
      {
        "n": "Spirit Resist",
        "v": "+18%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Debuff Resist",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+90",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Spirit Damage Reduction",
        "v": "65%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Damage Threshold",
        "v": "175",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "from": [
      1047818222
    ],
    "cooldown": "9s"
  },
  {
    "id": 3357231760,
    "name": "Unstoppable",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/unstoppable.webp",
    "body": "Temporarily suppress <span class=\"highlight\">negative status effects</span> and become <span class=\"highlight\">immune</span> to <span class=\"highlight\">Stun, Silence, Sleep, Root, and Disarm</span>. <br>Cannot be used while <span class=\"highlight\">Stunned</span> or <span class=\"highlight\">Slept</span>.",
    "innate": [
      {
        "n": "Debuff Resist",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+125",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Duration",
        "v": "5.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      1047818222
    ],
    "cooldown": "60s"
  },
  {
    "id": 1055679805,
    "name": "Vampiric Burst",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/vampiric_burst.webp",
    "body": "Grants <span class=\"highlight\">Lifesteal</span>, <span class=\"highlight\">Fire Rate</span>, and <span class=\"highlight\">Ammo</span>. This added Ammo is not limited by your max magazine size.",
    "innate": [
      {
        "n": "Bullet Lifesteal",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Bullet Resist",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+100"
      },
      {
        "n": "Weapon Damage",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Bullet Lifesteal",
        "v": "75%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Fire Rate",
        "v": "34%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Ammo",
        "v": "+75%"
      },
      {
        "n": "Duration",
        "v": "5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      499683006
    ],
    "cooldown": "30s"
  },
  {
    "id": 3028234315,
    "name": "Witchmail",
    "cost": 6400,
    "tier": 4,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/witchmail.webp",
    "body": "Taking heavy hits of\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> from an enemy reduces a <span class=\"highlight\">random ability cooldown</span>.",
    "innate": [
      {
        "n": "Spirit Resist",
        "v": "+22%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+14",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Cooldown Reduction per Hit",
        "v": "4s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      },
      {
        "n": "Damage Threshold",
        "v": "75",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "from": [],
    "cooldown": "1s"
  },
  {
    "id": 3729138568,
    "name": "Celestial Blessing",
    "cost": 9999,
    "tier": 5,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/celestial_guidance.webp",
    "body": "Applies an extremely powerful cleanse that replenishes your allies globally.",
    "innate": [],
    "effects": [
      {
        "n": "Heal Amount",
        "v": "60%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Stamina Recovery",
        "v": "+100%"
      },
      {
        "n": "Move Speed",
        "v": "+5m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Min. Heal",
        "v": "400",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Buff Duration",
        "v": "6s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 3523480953,
    "name": "Cloak of Opportunity",
    "cost": 9999,
    "tier": 5,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/cloak_of_opportunity.webp",
    "body": "Block the next debuff that would apply <span class=\"highlight\">movement lock, Stun, Chained, Immobilize, or Sleep</span> and become <span class=\"highlight\">Unstoppable</span>. Also gain a <span class=\"highlight\">Barrier</span> and bonus\n<span class=\"inline-attribute-label MoveSpeed\" style=\"color: #0F9;\">move speed</span>",
    "innate": [],
    "effects": [
      {
        "n": "Barrier",
        "v": "500",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_alt.svg"
      },
      {
        "n": "Move Speed",
        "v": "+3m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Unstoppable Duration",
        "v": "4s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Buff Duration",
        "v": "6s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "12s"
  },
  {
    "id": 1825399334,
    "name": "Electric Slippers",
    "cost": 9999,
    "tier": 5,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/electric_slippers.webp",
    "body": "When sliding, evade bullets, gain fire rate and deal damage to enemies around you. <span class=\"diminish\"><br><br>Cooldown is per target.</span>",
    "innate": [
      {
        "n": "Stamina",
        "v": "+2"
      },
      {
        "n": "Slide Distance",
        "v": "+80%"
      }
    ],
    "effects": [
      {
        "n": "Damage",
        "v": "100",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Evasion While Sliding",
        "v": "60"
      },
      {
        "n": "Fire Rate While Sliding",
        "v": "60%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Radius",
        "v": "12m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Max Frequency",
        "v": "0.3s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      }
    ],
    "from": []
  },
  {
    "id": 230297145,
    "name": "Eternal Gift",
    "cost": 9999,
    "tier": 5,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/eternal_gift.webp",
    "body": "Periodically gain a random permanent stat buff.\nReduces your next death's respawn timer.",
    "innate": [],
    "effects": [
      {
        "n": "Buff Frequency",
        "v": "2s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Respawn Time",
        "v": "-70%"
      }
    ],
    "from": [],
    "cooldown": "165s"
  },
  {
    "id": 3949773228,
    "name": "Nullification Burst",
    "cost": 9999,
    "tier": 5,
    "slot": "vitality",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/nullification_aura.webp",
    "body": "Removes any positive buffs and prevents stamina usage and healing effects on enemies.",
    "innate": [
      {
        "n": "Debuff Resist",
        "v": "+40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+300",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Duration",
        "v": "7s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Damage",
        "v": "250",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.465,
          "t": "spirit"
        }
      },
      {
        "n": "End Radius",
        "v": "20m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": [],
    "cooldown": "18s"
  },
  {
    "id": 1736094134,
    "name": "Seraphim Wings",
    "cost": 9999,
    "tier": 5,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/icarus_wings.webp",
    "body": "When Airborne, You deal more damage and take reduced damage. Allows <span class=\"highlight\">unlimited</span> Air Dash and Jumping.",
    "innate": [
      {
        "n": "Stamina Recovery",
        "v": "+120%"
      },
      {
        "n": "Gravity Scale",
        "v": "-70%"
      },
      {
        "n": "Air Control",
        "v": "+100%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Air Acceleration",
        "v": "+50%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "In Air Damage",
        "v": "+40%"
      },
      {
        "n": "In Air Damage Received",
        "v": "-40%"
      }
    ],
    "from": []
  },
  {
    "id": 2319629810,
    "name": "Shadow Strike",
    "cost": 9999,
    "tier": 5,
    "slot": "vitality",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/shadow_strike.webp",
    "body": "Go <span class=\"highlight\">Invisible</span> on <span class=\"highlight\">Stamina use</span> with no detection range. Doing a <span class=\"highlight\">melee attack</span> while invisible will cause you to <span class=\"highlight\">steal bullet and spirit resistance</span> from them and deal <span class=\"highlight\">damage over time</span>.",
    "innate": [
      {
        "n": "Stamina",
        "v": "+3"
      },
      {
        "n": "Bonus Health",
        "v": "+350",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Damage Per Second",
        "v": "125",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.4,
          "t": "spirit"
        }
      },
      {
        "n": "Invisibility Duration",
        "v": "3s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Steal Duration",
        "v": "6s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Resist Stolen",
        "v": "40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Fade Time",
        "v": "0.2s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 3776945997,
    "name": "Extra Charge",
    "cost": 800,
    "tier": 1,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/extra_charge.webp",
    "body": "",
    "innate": [
      {
        "n": "Bonus Ability Charges",
        "v": "+1",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_cast.png"
      },
      {
        "n": "Bonus Spirit Power for Charged Abilities",
        "v": "+7"
      }
    ],
    "effects": [],
    "from": []
  },
  {
    "id": 968099481,
    "name": "Extra Spirit",
    "cost": 800,
    "tier": 1,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/extra_spirit.webp",
    "body": "",
    "innate": [
      {
        "n": "Spirit Power",
        "v": "+10"
      }
    ],
    "effects": [],
    "from": []
  },
  {
    "id": 2462046703,
    "name": "Golden Goose Egg",
    "cost": 800,
    "tier": 1,
    "slot": "spirit",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/goose_egg.webp",
    "body": "Hatch the egg, gaining <span class=\"highlight\">souls</span> and <span class=\"highlight\">permanent buffs</span>.<br><br>The value of the egg grows the longer you hold onto it.<br><br><span class=\"diminish\">Gain a permanent buff per 80 Souls accrued when hatched.",
    "innate": [
      {
        "n": "Damage Penalty",
        "v": "-12%"
      },
      {
        "n": "Sprint Speed",
        "v": "+1m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+1",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Soul Value per Minute",
        "v": "80",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/hud/icons/icon_soul.svg"
      }
    ],
    "from": []
  },
  {
    "id": 1998374645,
    "name": "Mystic Burst",
    "cost": 800,
    "tier": 1,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/mystic_burst.webp",
    "body": "Charges up over time with\n<span class=\"inline-attribute-label BonusSpiritDamage\">bonus spirit damage</span>, causing abilities dealing more than <span class=\"highlight\">80</span> damage to deal additional damage.",
    "innate": [],
    "effects": [
      {
        "n": "Bonus Damage",
        "v": "40",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Charge-Up Time",
        "v": "14s"
      }
    ],
    "from": []
  },
  {
    "id": 754480263,
    "name": "Mystic Expansion",
    "cost": 800,
    "tier": 1,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/mystic_reach.webp",
    "body": "Imbue an ability to increase its <span class=\"highlight\">range</span> and <span class=\"highlight\">effect radius</span>.",
    "innate": [],
    "effects": [
      {
        "n": "Ability Range",
        "v": "+20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": [],
    "imbue": "Imbues an ability"
  },
  {
    "id": 1439347412,
    "name": "Mystic Regeneration",
    "cost": 800,
    "tier": 1,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/mystic_regen.webp",
    "body": "Dealing\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> to enemy Heroes grants you Bonus\n<span class=\"inline-attribute-label Regen\" style=\"color: #0F9;\">regeneration</span>. Stacks when dealing damage to different heroes.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+50",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Regeneration",
        "v": "4HP/s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Regeneration Duration",
        "v": "7s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 2922054143,
    "name": "Rusted Barrel",
    "cost": 800,
    "tier": 1,
    "slot": "spirit",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/rusted_barrel.webp",
    "body": "Target an enemy to reduce their <span class=\"highlight\">Fire Rate</span> and <span class=\"highlight\">Bullet Resistance</span>.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+60",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Sprint Speed",
        "v": "+0.5m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "Fire Rate",
        "v": "-32%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Bullet Resist",
        "v": "-8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Cast Range",
        "v": "32m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      },
      {
        "n": "Duration",
        "v": "5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "16s"
  },
  {
    "id": 465043967,
    "name": "Spirit Strike",
    "cost": 800,
    "tier": 1,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/spirit_strike.webp",
    "body": "When you perform a <span class=\"highlight\">Light or Heavy Melee</span> attack against a hero, deal extra\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> with the attack and reduce the target's <span class=\"highlight\">Spirit Resist</span>.<span class=\"diminish\"><br><br>Cooldown is 2x longer for Light Melee hits.</span>",
    "innate": [],
    "effects": [
      {
        "n": "Spirit Damage",
        "v": "40",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.372,
          "t": "spirit"
        }
      },
      {
        "n": "Spirit Resist",
        "v": "-6%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Duration",
        "v": "6s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "8s"
  },
  {
    "id": 1150006784,
    "name": "Arcane Surge",
    "cost": 1600,
    "tier": 2,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/arcane_surge.webp",
    "body": "After you <span class=\"highlight\">Dash-Jump</span>, the <span class=\"highlight\">next ability you use</span> within 7s will have bonus <span class=\"highlight\">Range, Duration,</span> and <span class=\"highlight\">Spirit Power</span>.",
    "innate": [
      {
        "n": "Stamina",
        "v": "+1"
      },
      {
        "n": "Stamina Recovery",
        "v": "+12%"
      }
    ],
    "effects": [
      {
        "n": "Ability Range",
        "v": "+12%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Ability Duration",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+20",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Cast Window",
        "v": "7s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      4139877411
    ]
  },
  {
    "id": 2971868509,
    "name": "Bullet Resist Shredder",
    "cost": 1600,
    "tier": 2,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/bullet_resist_shredder.webp",
    "body": "Reduces <span class=\"highlight\">Bullet Resist</span> on enemies when you deal\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span>.",
    "innate": [
      {
        "n": "Bullet Resist",
        "v": "+9%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Weapon Damage",
        "v": "+9%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Bullet Resist",
        "v": "-10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Duration",
        "v": "8s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 1976391348,
    "name": "Cold Front",
    "cost": 1600,
    "tier": 2,
    "slot": "spirit",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/cold_front.webp",
    "body": "Release an expanding ice blast that deals\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> and <span class=\"highlight\">Slows</span> targets it hits.",
    "innate": [
      {
        "n": "Spirit Resist",
        "v": "+6%"
      }
    ],
    "effects": [
      {
        "n": "Damage",
        "v": "95",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.465,
          "t": "spirit"
        }
      },
      {
        "n": "Move Speed",
        "v": "-48%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Duration",
        "v": "4s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "End Radius",
        "v": "10m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": [],
    "cooldown": "25s"
  },
  {
    "id": 380806748,
    "name": "Compress Cooldown",
    "cost": 1600,
    "tier": 2,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/improved_cooldown.webp",
    "body": "Imbue an ability to reduce its <span class=\"highlight\">Cooldown</span>.",
    "innate": [],
    "effects": [
      {
        "n": "Ability Cooldown Reduction",
        "v": "+18%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      }
    ],
    "from": [],
    "imbue": "Imbues an ability"
  },
  {
    "id": 2951612397,
    "name": "Duration Extender",
    "cost": 1600,
    "tier": 2,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/duration_extender.webp",
    "body": "Imbue an ability to increase its <span class=\"highlight\">Duration</span>.",
    "innate": [],
    "effects": [
      {
        "n": "Ability Duration",
        "v": "+22%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "imbue": "Imbues an ability"
  },
  {
    "id": 7409189,
    "name": "Improved Spirit",
    "cost": 1600,
    "tier": 2,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/improved_spirit.webp",
    "body": "",
    "innate": [
      {
        "n": "Spirit Power",
        "v": "+18"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+1.5",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [],
    "from": [
      968099481
    ]
  },
  {
    "id": 1102081447,
    "name": "Mystic Slow",
    "cost": 1600,
    "tier": 2,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/mystic_slow.webp",
    "body": "When the target takes\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span>, they have their <span class=\"highlight\">Move Speed</span> reduced.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+50",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Sprint Speed",
        "v": "+0.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "Move Speed",
        "v": "-24%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Dash Distance",
        "v": "-12%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Duration",
        "v": "2s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 2081037738,
    "name": "Mystic Vulnerability",
    "cost": 1600,
    "tier": 2,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/mystic_vulnerability.webp",
    "body": "When an enemy takes\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span>, they have their <img src=\"https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_tech_armor.png\" class=\"inline-attribute SpiritResist\" alt=\"spirit resist\"/><span class=\"inline-attribute-label SpiritResist\" style=\"color: #CE90FF;\">spirit resist</span> reduced.",
    "innate": [
      {
        "n": "Spirit Resist",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Spirit Resist",
        "v": "-8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Duration",
        "v": "7s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 84321454,
    "name": "Quicksilver Reload",
    "cost": 1600,
    "tier": 2,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/quicksilver_reload.webp",
    "body": "Your imbued ability charges up over time with\n<span class=\"inline-attribute-label BonusSpiritDamage\">bonus spirit damage</span>,\n<span class=\"inline-attribute-label BonusFireRate\" style=\"color: #EC9719;\">bonus fire rate</span>, and <span class=\"highlight\">reloads bullets</span> on use.",
    "innate": [],
    "effects": [
      {
        "n": "Damage",
        "v": "44",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.16,
          "t": "spirit"
        }
      },
      {
        "n": "Fire Rate",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Bullets Reloaded",
        "v": "100%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/ammo_clip_size.svg"
      },
      {
        "n": "Charge-Up Time",
        "v": "18s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      }
    ],
    "from": [],
    "imbue": "Imbues an ability"
  },
  {
    "id": 1813726886,
    "name": "Slowing Hex",
    "cost": 1600,
    "tier": 2,
    "slot": "spirit",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/slowing_hex.webp",
    "body": "<span class=\"highlight\">Slows movement</span> of enemy target. Also <span class=\"highlight\">Silences</span> their <span class=\"highlight\">movement-based items and abilities</span>.<br><span class=\"diminish\">Increases the target's gravity.<br>Does not affect target's stamina usage.</span>",
    "innate": [
      {
        "n": "Sprint Speed",
        "v": "+0.5m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "Move Speed",
        "v": "-16%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Dash Distance",
        "v": "-26%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Cast Range",
        "v": "25m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      },
      {
        "n": "Duration",
        "v": "3.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "29s"
  },
  {
    "id": 1219329868,
    "name": "Spirit Sap",
    "cost": 1600,
    "tier": 2,
    "slot": "spirit",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/spirit_sap.webp",
    "body": "Target an enemy to <span class=\"highlight\">reduce their Spirit Resist</span> and <span class=\"highlight\">Spirit Power</span>.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+50",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Spirit Resist",
        "v": "-9%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Spirit Power",
        "v": "-30",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/hud/core/icon_spirit.svg"
      },
      {
        "n": "Duration",
        "v": "12s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Cast Range",
        "v": "35m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      }
    ],
    "from": [],
    "cooldown": "22s"
  },
  {
    "id": 1925087134,
    "name": "Suppressor",
    "cost": 1600,
    "tier": 2,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/suppressor.webp",
    "body": "When you deal\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> to enemies, you also reduce their <span class=\"highlight\">Fire Rate</span>.",
    "innate": [
      {
        "n": "Spirit Power",
        "v": "+6",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Bullet Resist",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Fire Rate",
        "v": "-28%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Duration",
        "v": "4.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": []
  },
  {
    "id": 3144988365,
    "name": "Decay",
    "cost": 3200,
    "tier": 3,
    "slot": "spirit",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/decay.webp",
    "body": "Inflict <span class=\"highlight\">damage over time</span> to a target, dealing damage based on their current health.<br>Decay's damage is non-lethal and does not apply item procs.",
    "innate": [
      {
        "n": "Spirit Power",
        "v": "+8",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+65",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Bleed Damage",
        "v": "1.95% DPS",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.003,
          "t": "spirit"
        }
      },
      {
        "n": "Incoming Healing",
        "v": "-55%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      },
      {
        "n": "Cast Range",
        "v": "20m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg",
        "sc": {
          "v": 0.1,
          "t": "spirit"
        }
      },
      {
        "n": "Duration",
        "v": "12s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "30s"
  },
  {
    "id": 2061878743,
    "name": "Disarming Hex",
    "cost": 3200,
    "tier": 3,
    "slot": "spirit",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/disarming_hex.webp",
    "body": "<span class=\"highlight\">Disarms</span> enemy target and reduces their <span class=\"highlight\">Bullet Resist</span>.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+75",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Sprint Speed",
        "v": "+0.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "Bullet Resist",
        "v": "-13%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      },
      {
        "n": "Cast Range",
        "v": "32m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      },
      {
        "n": "Duration",
        "v": "4.25s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      2922054143
    ],
    "cooldown": "16s"
  },
  {
    "id": 1193964439,
    "name": "Greater Expansion",
    "cost": 3200,
    "tier": 3,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/greater_expansion.webp",
    "body": "Increases the <span class=\"highlight\">range</span> and <span class=\"highlight\">effect radius</span> of your abilities and items.",
    "innate": [
      {
        "n": "Spirit Resist",
        "v": "+10%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Ability Range",
        "v": "+30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": [
      754480263
    ]
  },
  {
    "id": 1254091416,
    "name": "Knockdown",
    "cost": 3200,
    "tier": 3,
    "slot": "spirit",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/knockdown.webp",
    "body": "Apply a <span class=\"highlight\">Stun</span> after <span class=\"highlight\">2s</span>. Stun duration is increased against <span class=\"highlight\">airborne</span> targets.<br><br><span class=\"diminish\">Increases the target's gravity for the duration of the stun.</span>",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+75",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Ability Range",
        "v": "+5%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "effects": [
      {
        "n": "Cast Range",
        "v": "45m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      }
    ],
    "from": []
  },
  {
    "id": 2947183272,
    "name": "Radiant Regeneration",
    "cost": 3200,
    "tier": 3,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/radiant_regeneration.webp",
    "body": "Dealing\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> to enemy Heroes grants you Bonus\n<span class=\"inline-attribute-label Regen\" style=\"color: #0F9;\">regeneration</span>. Stacks when dealing damage to different heroes.\nWhile in-combat, <span class=\"highlight\">Heal</span> and gain bonus <span class=\"highlight\">Movement Speed</span> for a short duration when you cast an ability.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+90",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Regeneration",
        "v": "4HP/s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg",
        "sc": {
          "v": 0.025,
          "t": "spirit"
        }
      },
      {
        "n": "Regeneration Duration",
        "v": "7s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Healing on Ability Cast",
        "v": "40",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg",
        "sc": {
          "v": 1.4,
          "t": "boon"
        }
      },
      {
        "n": "Move Speed",
        "v": "+1.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Duration",
        "v": "3s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      1439347412
    ],
    "cooldown": "6s"
  },
  {
    "id": 787198704,
    "name": "Rapid Recharge",
    "cost": 3200,
    "tier": 3,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/rapid_recharge.webp",
    "body": "",
    "innate": [
      {
        "n": "Bonus Ability Charges",
        "v": "+2",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_cast.png"
      },
      {
        "n": "Faster Time Between Charges",
        "v": "+30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      },
      {
        "n": "Cooldown Reduction For Charged Abilities",
        "v": "+14%"
      },
      {
        "n": "Bonus Spirit Power for Charged Abilities",
        "v": "+14"
      }
    ],
    "effects": [],
    "from": [
      3776945997
    ]
  },
  {
    "id": 619484391,
    "name": "Silence Wave",
    "cost": 3200,
    "tier": 3,
    "slot": "spirit",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/silence_glyph.webp",
    "body": "Launch an expanding projectile which <span class=\"highlight\">Silences</span> enemies for a short duration and deals impact damage. <br><br><span class=\"diminish\">Silence does not interrupt channeling abilities.</span>",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+90",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Damage",
        "v": "75",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.7,
          "t": "spirit"
        }
      },
      {
        "n": "Cast Range",
        "v": "40m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      }
    ],
    "from": [],
    "cooldown": "42s"
  },
  {
    "id": 3190916303,
    "name": "Spirit Snatch",
    "cost": 3200,
    "tier": 3,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/spirit_snatch.webp",
    "body": "When you perform a <span class=\"highlight\">Light or Heavy Melee</span> attack against a hero, the attack deals extra\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> and steals <span class=\"highlight\">Spirit Resist</span> and <span class=\"highlight\">Spirit Power</span>.<span class=\"diminish\"><br><br>Effects are reduced by 30% for Light Melee hits.</span>",
    "innate": [
      {
        "n": "Melee Damage",
        "v": "+7%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/melee.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+75",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Spirit Damage",
        "v": "50",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.84,
          "t": "spirit"
        }
      },
      {
        "n": "Spirit Resist Steal",
        "v": "12%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Spirit Power Steal",
        "v": "25",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Duration",
        "v": "10s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      465043967
    ],
    "cooldown": "6s"
  },
  {
    "id": 3261353684,
    "name": "Superior Cooldown",
    "cost": 3200,
    "tier": 3,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/superior_cooldown.webp",
    "body": "Reduces the <span class=\"highlight\">Cooldown</span> of your abilities.",
    "innate": [
      {
        "n": "Out of Combat Regen",
        "v": "+4",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Ability Cooldown Reduction",
        "v": "+20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      }
    ],
    "from": [
      380806748
    ]
  },
  {
    "id": 2717651715,
    "name": "Superior Duration",
    "cost": 3200,
    "tier": 3,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/superior_duration.webp",
    "body": "Increases the <span class=\"highlight\">duration</span> of your abilities and items.",
    "innate": [
      {
        "n": "Bullet Resist",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Ability Duration",
        "v": "+28%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      2951612397
    ]
  },
  {
    "id": 1292979587,
    "name": "Surge of Power",
    "cost": 3200,
    "tier": 3,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/surge_of_power.webp",
    "body": "Imbue an ability with <span class=\"highlight\">permanent Spirit Power</span>. When that ability is used, gain bonus <span class=\"highlight\">Move Speed</span> and maintain full speed while attacking.",
    "innate": [],
    "effects": [
      {
        "n": "Imbued Ability Spirit Power",
        "v": "+28",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Fire Rate Bonus",
        "v": "20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Move Speed",
        "v": "+1.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Move Speed Duration",
        "v": "8s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      968099481
    ],
    "cooldown": "14s",
    "imbue": "Imbues an ability"
  },
  {
    "id": 2121044373,
    "name": "Tankbuster",
    "cost": 3200,
    "tier": 3,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/tankbuster.webp",
    "body": "Charges up over time with\n<span class=\"inline-attribute-label BonusSpiritDamage\">bonus spirit damage</span>, causing abilities dealing more than <span class=\"highlight\">165</span> damage to deal additional damage. <span class=\"highlight\">Ignores Spirit Resistance.</span>",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+50",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Damage",
        "v": "40",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Current Health Bonus Damage",
        "v": "7.5%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Charge-Up Time",
        "v": "14s"
      }
    ],
    "from": [
      1998374645
    ]
  },
  {
    "id": 395944548,
    "name": "Torment Pulse",
    "cost": 3200,
    "tier": 3,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/torment_pulse.webp",
    "body": "Periodically deals\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> to the closest two enemies nearby.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+100",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Melee Resist",
        "v": "+22%"
      }
    ],
    "effects": [
      {
        "n": "Pulse Damage",
        "v": "25",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.23,
          "t": "spirit"
        }
      },
      {
        "n": "Pulse Radius",
        "v": "9m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": [],
    "cooldown": "1.4s"
  },
  {
    "id": 3812615317,
    "name": "Arctic Blast",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/arctic_blast.webp",
    "body": "Release an expanding ice blast that deals\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span>, <span class=\"highlight\">Freezing</span> and then <span class=\"highlight\">Slowing</span> targets it hits.<br><br>Slowed targets have their <span class=\"highlight\">stamina regen frozen</span>",
    "innate": [
      {
        "n": "Spirit Resist",
        "v": "+10%"
      }
    ],
    "effects": [
      {
        "n": "Damage",
        "v": "175",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.698,
          "t": "spirit"
        }
      },
      {
        "n": "Freeze Duration",
        "v": "1s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "End Radius",
        "v": "16m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": [
      1976391348
    ],
    "cooldown": "24s"
  },
  {
    "id": 2519598785,
    "name": "Boundless Spirit",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/boundless_spirit.webp",
    "body": "",
    "innate": [
      {
        "n": "Spirit Power",
        "v": "+15%"
      },
      {
        "n": "Spirit Power",
        "v": "+30"
      },
      {
        "n": "Bonus Health",
        "v": "+75",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Out of Combat Regen",
        "v": "+4",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [],
    "from": [
      7409189
    ]
  },
  {
    "id": 2617435668,
    "name": "Cursed Relic",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/curse.webp",
    "body": "Curses an enemy - <span class=\"highlight\">interrupting, Silencing, Disarming</span>, and <span class=\"highlight\">preventing item usage</span>. <span class=\"highlight\">Removes all non-ultimate buffs</span>.<br><br>Your own <span class=\"highlight\">Damage Output</span> is reduced for the duration.",
    "innate": [],
    "effects": [
      {
        "n": "Duration",
        "v": "3.25s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Cast Range",
        "v": "20m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      },
      {
        "n": "Damage Penalty",
        "v": "-25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      }
    ],
    "from": [],
    "cooldown": "55s"
  },
  {
    "id": 630839635,
    "name": "Echo Shard",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/echo_shard.webp",
    "body": "<span class=\"highlight\">Reset the cooldown</span> of the imbued non-ultimate ability.<br><br>This item's cooldown is increased by <span class=\"highlight\">the cooldown of the imbued ability</span>.",
    "innate": [
      {
        "n": "Spirit Resist",
        "v": "+5%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Bullet Resist",
        "v": "+5%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_bullet_color.svg"
      }
    ],
    "effects": [
      {
        "n": "Imbued Ability Cooldown",
        "v": "100%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      }
    ],
    "from": [],
    "imbue": "Imbues a non-ultimate ability"
  },
  {
    "id": 3005970438,
    "name": "Escalating Exposure",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/escalating_exposure.webp",
    "body": "Dealing\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> applies a stacking <span class=\"highlight\">Spirit Amp</span> that increases your\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> to the target.",
    "innate": [
      {
        "n": "Spirit Resist On Spirit Damage",
        "v": "-8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Spirit Resist",
        "v": "+17%"
      }
    ],
    "effects": [
      {
        "n": "Spirit Amp per Stack",
        "v": "+4.5%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Max Stacks",
        "v": "12"
      },
      {
        "n": "Duration",
        "v": "12s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Max Frequency Per Target",
        "v": "0.7s"
      }
    ],
    "from": [
      2081037738
    ]
  },
  {
    "id": 2533252781,
    "name": "Ethereal Shift",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/ethereal_shift.webp",
    "body": "Instantly enter a void state and become Invulnerable for a short duration.\nAfterwards, gain a variety of temporary buffs:",
    "innate": [],
    "effects": [
      {
        "n": "Duration",
        "v": "4.0s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+20",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Spirit Resist",
        "v": "+30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Move Speed",
        "v": "+3m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Buff Duration",
        "v": "5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "37s"
  },
  {
    "id": 2142980412,
    "name": "Focus Lens",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/focus_lens.webp",
    "body": "Target an enemy to <span class=\"highlight\">Silence</span> them. A portion of <span class=\"highlight\">all damage dealt</span> during the silence gets applied to the target when the silence wears off.",
    "innate": [
      {
        "n": "Fire Rate",
        "v": "+10%"
      }
    ],
    "effects": [
      {
        "n": "Damage On Expire",
        "v": "35%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      },
      {
        "n": "Spirit Resist",
        "v": "-9%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Resist Reduction Duration",
        "v": "12s"
      },
      {
        "n": "Cast Range",
        "v": "25m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      },
      {
        "n": "Spirit Power",
        "v": "-30",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/hud/core/icon_spirit.svg"
      }
    ],
    "from": [
      1219329868
    ],
    "cooldown": "40s"
  },
  {
    "id": 493591231,
    "name": "Lightning Scroll",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/lightning_scroll.webp",
    "body": "Damage from your ultimate applies a\n<span class=\"inline-attribute-label Stun\">stun</span> and deals\n<span class=\"inline-attribute-label BonusSpiritDamage\">bonus spirit damage</span> after a short delay.</span>\n<span class=\"diminish\">This effect can only trigger once per target per ultimate.</span>\n<span class=\"highlight\">Mystic Slow effects</span>",
    "innate": [
      {
        "n": "Move Speed on Spirit Damage",
        "v": "-24%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+50",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Sprint Speed",
        "v": "+0.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "Damage",
        "v": "150",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.35,
          "t": "spirit"
        }
      },
      {
        "n": "Delay Before Effect",
        "v": "3s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [
      1102081447
    ]
  },
  {
    "id": 2800629741,
    "name": "Magic Carpet",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/magic_carpet.webp",
    "body": "Summon a Magic Carpet that will <span class=\"highlight\">fly</span> you away. While flying you are immune to slows and doing any action will dismiss the carpet. <span class=\"diminish\"><br>Cannot use abilities while the carpet is being summoned.</span>",
    "innate": [
      {
        "n": "Ability Duration",
        "v": "+15%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+125",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Spirit Power",
        "v": "+14"
      },
      {
        "n": "Gravity Scale",
        "v": "-15%"
      },
      {
        "n": "Air Control",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "Duration",
        "v": "12s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Bonus Fly Speed",
        "v": "+7m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Summon Duration",
        "v": "1.3s"
      }
    ],
    "from": []
  },
  {
    "id": 3919289022,
    "name": "Mercurial Magnum",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/mercurial_magnum.webp",
    "body": "Your imbued ability charges up over time with\n<span class=\"inline-attribute-label BonusSpiritDamage\">bonus spirit damage</span>,\n<span class=\"inline-attribute-label BonusFireRate\" style=\"color: #EC9719;\">bonus fire rate</span>, and <span class=\"highlight\">reloads bullets</span> on use. Until your next reload, your <span class=\"highlight\">bullets deal\n<span class=\"inline-attribute-label BonusSpiritDamage\">bonus spirit damage</span></span> based on your Spirit Power.",
    "innate": [
      {
        "n": "Max Ammo",
        "v": "+20%"
      },
      {
        "n": "Spirit Power",
        "v": "+7"
      }
    ],
    "effects": [
      {
        "n": "Base Bullet Damage",
        "v": "+20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.38,
          "t": "spirit"
        }
      },
      {
        "n": "Damage",
        "v": "60",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.16,
          "t": "spirit"
        }
      },
      {
        "n": "Fire Rate",
        "v": "+22%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/fire_rate.svg"
      },
      {
        "n": "Bullets Reloaded",
        "v": "100%"
      },
      {
        "n": "Charge-Up Time",
        "v": "14s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      }
    ],
    "from": [
      84321454
    ],
    "imbue": "Imbues an ability"
  },
  {
    "id": 3577481646,
    "name": "Mystic Reverb",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/mystic_reverb.webp",
    "body": "Imbue an ability with <span class=\"highlight\">Lifesteal</span> and to apply <span class=\"highlight\">slow</span> on a hit target and deal an <span class=\"highlight\">additional percentage of the damage dealt</span> to enemies around the target after a short delay.",
    "innate": [
      {
        "n": "Spirit Lifesteal",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Damage",
        "v": "50%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_crit.svg"
      },
      {
        "n": "Imbued Lifesteal",
        "v": "+22%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Move Speed",
        "v": "-32%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Radius",
        "v": "16m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Delay Duration",
        "v": "3s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "6.25s",
    "imbue": "Imbues an ability"
  },
  {
    "id": 677738769,
    "name": "Refresher",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/refresher.webp",
    "body": "<span class=\"highlight\">Reset the cooldown</span> of all your abilities and <span class=\"highlight\">restore all your charges</span>.",
    "innate": [],
    "effects": [],
    "from": [],
    "cooldown": "300s"
  },
  {
    "id": 2417568017,
    "name": "Scourge",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/scourge.webp",
    "body": "Apply <span class=\"highlight\">Spirit Resist</span>, <span class=\"highlight\">Debuff Resist</span> and an aura on a friendly target that deals <span class=\"highlight\">\ndamage</span> to enemies proportional to their max health. Existing debuffs on the target are reduced.<br>Can be self cast.",
    "innate": [
      {
        "n": "Bonus Health",
        "v": "+100",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      }
    ],
    "effects": [
      {
        "n": "Max Health per second",
        "v": "2.3%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.005,
          "t": "spirit"
        }
      },
      {
        "n": "Spirit Resist",
        "v": "+40%"
      },
      {
        "n": "Debuff Resist",
        "v": "+20%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Duration",
        "v": "10s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Cast Range",
        "v": "35m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      },
      {
        "n": "Radius",
        "v": "10m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": [],
    "cooldown": "35s"
  },
  {
    "id": 343572757,
    "name": "Spirit Burn",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/spirit_burn.webp",
    "body": "Dealing significant\n<span class=\"inline-attribute-label SpiritDamage\">spirit damage</span> to an enemy within 5s causes an explosion dealing damage and a burn to that enemy. While burning, enemies take damage over time and receive reduced healing.<br><span class=\"diminish\">The cooldown is per enemy, so each target can only be burned once per cooldown. Deals half-damage on non-heroes.</span>",
    "innate": [
      {
        "n": "Ability Range",
        "v": "+6%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "effects": [
      {
        "n": "Damage Threshold",
        "v": "500",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Explosion Damage",
        "v": "50",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Damage Per Second",
        "v": "24",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 0.06,
          "t": "spirit"
        }
      },
      {
        "n": "Immunity Duration",
        "v": "20s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      },
      {
        "n": "Debuff Duration",
        "v": "8s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Incoming Healing",
        "v": "-70%"
      }
    ],
    "from": []
  },
  {
    "id": 915014646,
    "name": "Transcendent Cooldown",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/transcendent_cooldown.webp",
    "body": "Reduces the <span class=\"highlight\">Cooldown</span> of your abilities and items.",
    "innate": [
      {
        "n": "Out of Combat Regen",
        "v": "+4",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      }
    ],
    "effects": [
      {
        "n": "Ability Cooldown Reduction",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      },
      {
        "n": "Item Cooldown Reduction",
        "v": "+25%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      }
    ],
    "from": [
      3261353684
    ]
  },
  {
    "id": 1152158042,
    "name": "Vortex Web",
    "cost": 6400,
    "tier": 4,
    "slot": "spirit",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/vortex_web.webp",
    "body": "Throw a <span class=\"highlight\">vacuum</span> grenade, pulling all enemies into a small area and applying <span class=\"highlight\">Slowing Hex</span>. <span class=\"diminish\"><br><br>Alt Cast to Target Unit Directly.</span>",
    "innate": [
      {
        "n": "Ability Range",
        "v": "+8%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Sprint Speed",
        "v": "+0.75m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      }
    ],
    "effects": [
      {
        "n": "Capture Radius",
        "v": "12m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Move Speed",
        "v": "-28%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      },
      {
        "n": "Duration",
        "v": "4.0s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Tether Duration",
        "v": "0.5s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Dash Distance",
        "v": "-36%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/condition_slow.svg"
      }
    ],
    "from": [
      1813726886
    ],
    "cooldown": "42s"
  },
  {
    "id": 2068250483,
    "name": "Frostbite Charm",
    "cost": 9999,
    "tier": 5,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/frostbite.webp",
    "body": "Imbued ability has its <span class=\"highlight\">Cooldown reduced</span> and gains <span class=\"highlight\">Spirit Power</span>. When the ability deals damage, <span class=\"highlight\">freeze</span> the target and apply <span class=\"highlight\">bonus damage</span>. <span class=\"diminish\"><br><br>Cooldown is per target.</span>",
    "innate": [],
    "effects": [
      {
        "n": "Imbued Ability Cooldown Reduction",
        "v": "+50%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      },
      {
        "n": "Imbued Ability Spirit Power",
        "v": "+70",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Damage",
        "v": "200",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Freeze Duration",
        "v": "1s"
      }
    ],
    "from": [],
    "imbue": "Imbues an ability"
  },
  {
    "id": 4050602737,
    "name": "Mystic Conduit",
    "cost": 9999,
    "tier": 5,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/patrons_blessing.webp",
    "body": "Provides yourself and allies with a powerful spirit focused aura. Has reduced values on allies.\nDealing significant <span class=\"highlight\">Damage</span> to an enemy Hero within 5s causes you to heal yourself and nearby allies.",
    "innate": [],
    "effects": [
      {
        "n": "Ability Range",
        "v": "+40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Ability Cooldown Reduction",
        "v": "+40%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      },
      {
        "n": "Ally Percentage",
        "v": "+50%"
      },
      {
        "n": "Radius",
        "v": "25m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Heal Amount",
        "v": "700",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/heal.svg"
      },
      {
        "n": "Heal Radius",
        "v": "35m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      },
      {
        "n": "Damage Threshold",
        "v": "300",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/armor_spirit_color.svg"
      },
      {
        "n": "Stat",
        "v": "5"
      }
    ],
    "from": [],
    "cooldown": "25s"
  },
  {
    "id": 2054088113,
    "name": "Mystical Piano",
    "cost": 9999,
    "tier": 5,
    "slot": "spirit",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/mystical_piano.webp",
    "body": "After a short delay, enemies in the target area will be stunned and have their stamina depleted. After the stun they will be temporarily dazed.",
    "innate": [],
    "effects": [
      {
        "n": "Daze Duration",
        "v": "2s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Stun Delay",
        "v": "1.7s"
      },
      {
        "n": "Radius",
        "v": "12m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/range.svg"
      }
    ],
    "from": []
  },
  {
    "id": 424779525,
    "name": "Omnicharge Signet",
    "cost": 9999,
    "tier": 5,
    "slot": "spirit",
    "active": false,
    "cast": "passive",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/omnicharge_pendant.webp",
    "body": "Imbue any active non-ultimate ability with <span class=\"highlight\">Bonus Ability Charges</span>. Already charged abilities receive more bonus charges.",
    "innate": [
      {
        "n": "Faster Time Between Charges",
        "v": "+70%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/cooldown.svg"
      },
      {
        "n": "Cooldown Reduction For Charged Abilities",
        "v": "+30%"
      },
      {
        "n": "Bonus Spirit Power for Charged Abilities",
        "v": "+50"
      }
    ],
    "effects": [
      {
        "n": "Charged Ability",
        "v": "+4",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_cast.png"
      },
      {
        "n": "Non Charged Ability",
        "v": "+2",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_cast.png"
      }
    ],
    "from": [],
    "imbue": "Imbues a non-ultimate ability"
  },
  {
    "id": 1132564516,
    "name": "Prism Blast",
    "cost": 9999,
    "tier": 5,
    "slot": "spirit",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/prism_blast.webp",
    "body": "You enter a void state and become <span class=\"highlight\">untargetable and invincible</span> for a short duration, during which lasers blast out and rotate around you.",
    "innate": [],
    "effects": [
      {
        "n": "Damage Per Second",
        "v": "270",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg",
        "sc": {
          "v": 1.75,
          "t": "spirit"
        }
      },
      {
        "n": "Duration",
        "v": "6.0s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      }
    ],
    "from": [],
    "cooldown": "40s"
  },
  {
    "id": 4121584236,
    "name": "Shrink Ray",
    "cost": 9999,
    "tier": 5,
    "slot": "spirit",
    "active": true,
    "cast": "press",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/shrink_ray.webp",
    "body": "Reduces <span class=\"highlight\">Model Size</span> and grants <span class=\"highlight\">Move Speed</span> to the target. Allows <span class=\"highlight\">usage of tunnels</span> in this mode. Can be self-cast.",
    "innate": [],
    "effects": [
      {
        "n": "Model Scale",
        "v": "-50%"
      },
      {
        "n": "Move Speed",
        "v": "+5.0m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Fire Rate",
        "v": "+20%"
      },
      {
        "n": "Shrink Duration",
        "v": "60s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Cast Range",
        "v": "40m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/upgrades/property_range.svg"
      }
    ],
    "from": [],
    "cooldown": "30s"
  },
  {
    "id": 1558545403,
    "name": "Unstable Concoction",
    "cost": 9999,
    "tier": 5,
    "slot": "spirit",
    "active": true,
    "cast": "active",
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/brawl/unstable_concoction.webp",
    "body": "Consume a concoction that grants you <span class=\"highlight\">Unstoppable</span> and increased <span class=\"highlight\">speed, health, spirit and weapon damage</span>. After a short duration <span class=\"highlight\">you die and explode</span>, stunning nearby enemies and dealing damage based on your maximum health. Dying this way reduces your respawn time by <span class=\"highlight\">50%</span>.",
    "innate": [],
    "effects": [
      {
        "n": "Max Health Damage",
        "v": "30%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      },
      {
        "n": "Stun Duration",
        "v": "3.0s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Move Speed",
        "v": "+10m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/move_speed.svg"
      },
      {
        "n": "Bonus Health",
        "v": "+3000",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/health.svg"
      },
      {
        "n": "Duration",
        "v": "4.0s",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/duration.svg"
      },
      {
        "n": "Weapon Damage",
        "v": "+150%",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_bullet_color.svg"
      },
      {
        "n": "Radius",
        "v": "22m"
      },
      {
        "n": "Spirit Power",
        "v": "+150",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/icons/properties/damage_magic_color.svg"
      }
    ],
    "from": []
  }
];
