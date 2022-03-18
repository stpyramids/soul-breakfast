/// Monster data

import * as ROT from "rot-js";
import { Colors } from "./colors";
import { applySoak, D, killMonsterAt } from "./commands";
import { Game } from "./game";
import { GlyphID } from "./glyphs";
import {
  XYContents,
  contentsAt,
  moveMonster,
  playerCanSee,
  newMap,
} from "./map";
import { msg } from "./msg";
import { EmptySoul, Soul, isEmptySoul } from "./souls";
import { keysOf, asRoll, doRoll, Roll } from "./utils";

// "Vermin" creatures always spawn with 1 HP, this is a shorthand
const verminHP: Roll = { n: 1, sides: 1, mod: 0 };

export const AI: { [id: string]: (c: XYContents) => number } = {
  passive: (c) => {
    return 1.0;
  },
  wander: (c) => {
    let nx = c.x + ROT.RNG.getUniformInt(-1, 1);
    let ny = c.y + ROT.RNG.getUniformInt(-1, 1);
    let spot = contentsAt(nx, ny);
    moveMonster(c, spot);
    return 1.0;
  },
  nipper: (c) => {
    let m = c.monster!;
    let arch = MonsterArchetypes[m.archetype];
    let attack = Attacks[arch.attack];

    if (attack.canReachFrom(c)) {
      attack.attackFrom(c);
      return 1.0;
    } else {
      return AI.wander(c);
    }
  },
  stationary: (c) => {
    let m = c.monster!;
    let arch = MonsterArchetypes[m.archetype];
    let attack = Attacks[arch.attack];

    if (attack.canReachFrom(c)) {
      attack.attackFrom(c);
    }
    return 1.0;
  },
  charge: (c) => {
    // TODO these all have similar structures
    let m = c.monster!;
    let arch = MonsterArchetypes[m.archetype];
    let attack = Attacks[arch.attack];

    if (attack.canReachFrom(c)) {
      attack.attackFrom(c);
      return 1.0;
    } else if (ROT.RNG.getUniformInt(0, 3) == 0) {
      // Skip a turn to be nice to the player
      return 1.0;
    } else {
      // TODO should be _monster_ vision
      if (playerCanSee(c.x, c.y)) {
        let dx = Game.player.x - c.x;
        dx = dx == 0 ? 0 : dx / Math.abs(dx);
        let dy = Game.player.y - c.y;
        dy = dy == 0 ? 0 : dy / Math.abs(dy);
        moveMonster(c, contentsAt(c.x + dx, c.y + dy));
        return 1.0;
      } else {
        // TODO should have pursuit vs. idle
        return AI.wander(c);
      }
    }
  },
};

export type Attack = {
  canReachFrom: (c: XYContents) => boolean;
  attackFrom: (c: XYContents) => void;
};

const DamageDescriptions = [
  [0, "You absorb the attack"],
  [1, "Your essence trembles"],
  [5, "Your essence wavers"],
  [10, "You stagger as your essence is drained"],
  [20, "Your connection to the mortal world frays"],
  [30, "Your being is stretched to the breaking point"],
  [50, "You briefly swim through endless aeons of hell"],
];

export function getDamageDescription(dmg: number) {
  for (let i = DamageDescriptions.length - 1; i >= 0; i--) {
    if (DamageDescriptions[i][0] <= dmg) {
      return DamageDescriptions[i][1];
    }
  }
  return DamageDescriptions[0][1];
}
export function doDamage(dmg: number) {
  dmg = applySoak(dmg);
  if (dmg <= 0) {
    msg.combat("You absorb the attack!");
    return;
  }
  msg.combat("%s (%s)%s", getDamageDescription(dmg), dmg, dmg > 8 ? "!" : ".");
  let wasZero = Game.player.essence === 0;
  Game.player.essence -= dmg;
  if (Game.player.essence < 0) {
    let extra = Math.abs(Game.player.essence);
    Game.player.essence = 0;
    let soulChecked = false;
    let soulBroken = false;
    if (wasZero) {
      for (let slotGroup of keysOf(Game.player.soulSlots)) {
        let slots = Game.player.soulSlots[slotGroup];
        for (let i = 0; i < slots.length; i++) {
          if (!isEmptySoul(slots[i])) {
            soulChecked = true;
            let roll = asRoll(1, slots[i].essence, 1);
            if (doRoll(roll) < extra) {
              soulBroken = true;
              msg.angry("No!");
              msg.essence("The %s soul breaks free!", slots[i].name);
              slots[i] = EmptySoul;
              break;
            }
          }
        }
      }
      if (!soulChecked) {
        let blowback = doRoll(asRoll(1, extra, -3));
        if (blowback > 0) {
          msg.angry("I cannot hold together! I must flee!");
          let newDanger = Game.map.danger - ROT.RNG.getUniformInt(1, blowback);
          if (newDanger < 1) {
            newDanger = 1;
          }
          newMap({
            danger: newDanger,
          });
        }
      }
    } else {
      msg.tutorial(
        "Watch out! Taking damage at zero essence can free souls you have claimed or blow you out of the level."
      );
    }
  }
}

export function meleeAttack(verb: string, damage: Roll): Attack {
  return {
    canReachFrom: (c) =>
      (Game.player.x === c.x ||
        Game.player.x === c.x - 1 ||
        Game.player.x === c.x + 1) &&
      (Game.player.y === c.y ||
        Game.player.y === c.y - 1 ||
        Game.player.y === c.y + 1),
    attackFrom: (c) => {
      msg.combat("%The %s you!", D(c), verb);
      let m = c.monster;
      let danger = m ? MonsterArchetypes[m.archetype].danger : 1;
      // TODO combat parameters
      if (doRoll(asRoll(1, 100, 0)) > 90 - danger * 2) {
        // damage dice scale up with danger
        let dmgRoll = { ...damage, n: damage.n + Math.floor(danger / 5) };
        let dmg = doRoll(dmgRoll);
        doDamage(dmg);
      }
    },
  };
}

export function rangedAttack(verb: string, damage: Roll): Attack {
  return {
    canReachFrom: (c) => playerCanSee(c.x, c.y),
    attackFrom: (c) => {
      msg.combat("%The %s you!", D(c), verb);
      let m = c.monster;
      let danger = m ? MonsterArchetypes[m.archetype].danger : 1;
      // TODO combat parameters
      if (doRoll(asRoll(1, 100, 0)) > 90 - danger * 2) {
        // damage dice scale up with danger
        let dmgRoll = { ...damage, n: damage.n + Math.floor(danger / 5) };
        let dmg = doRoll(dmgRoll);
        doDamage(dmg);
        // TODO some kind of effect
      }
    },
  };
}

export const Attacks: { [id: string]: Attack } = {
  none: {
    canReachFrom: (c) => false,
    attackFrom: (c) => {},
  },
  bite: meleeAttack("snaps at", asRoll(1, 4, 0)),
  touch: meleeAttack("reaches into", asRoll(1, 4, 2)),
  slice: meleeAttack("slices at", asRoll(1, 8, 4)),
  gaze: rangedAttack("gazes at", asRoll(1, 4, 0)),
  abjure: rangedAttack("abjures", asRoll(1, 4, 2)),
};

export type MonsterArchetype = {
  name: string;
  description: string;
  danger: number;
  glyph: GlyphID;
  color: keyof typeof Colors;
  appearing: Roll;
  hp: Roll;
  speed: number;
  ai: keyof typeof AI;
  attack: keyof typeof Attacks;
  soul: keyof typeof SoulFactories;
};

export type SoulFactory = (arch: MonsterArchetype) => Soul;

export const SoulFactories: { [id: string]: SoulFactory } = {
  vermin: (a) => ({
    glyph: a.glyph,
    essence: Math.floor((a.danger + 1) / 2),
    name: a.name,
    effects: [],
  }),
  maxEssence: (a) => ({
    glyph: a.glyph,
    essence: a.danger,
    name: a.name,
    effects: [{ type: "stat bonus", stat: "max essence", power: a.danger }],
  }),
  extraDamage: (a) => ({
    glyph: a.glyph,
    essence: a.danger,
    name: a.name,
    effects: [
      {
        type: "stat bonus",
        stat: "max essence",
        power: Math.floor(a.danger / 2) + 1,
      },
      { type: "damage", damage: asRoll(Math.floor(a.danger / 2), 4, 1) },
    ],
  }),
  slow: (a) => ({
    glyph: a.glyph,
    essence: a.danger,
    name: a.name,
    effects: [
      {
        type: "stat bonus",
        stat: "max essence",
        power: Math.floor(a.danger / 2) + 1,
      },
      { type: "status", status: "slow", power: Math.floor(a.danger / 2) + 1 },
    ],
  }),
  sight: (a) => ({
    glyph: a.glyph,
    essence: a.danger,
    name: a.name,
    effects: [
      { type: "stat bonus", stat: "max essence", power: a.danger },
      {
        type: "stat bonus",
        stat: "sight",
        power: Math.floor(a.danger / 2) + 1,
      },
    ],
  }),
  speed: (a) => ({
    glyph: a.glyph,
    type: "ring",
    essence: a.danger,
    name: a.name,
    effects: [
      {
        type: "stat bonus",
        stat: "max essence",
        power: Math.floor(a.danger * 0.8),
      },
      {
        type: "stat bonus",
        stat: "speed",
        power: 0.05 * Math.floor(a.danger / 2),
      },
    ],
  }),
  soak: (a) => ({
    glyph: a.glyph,
    type: "ring",
    essence: a.danger,
    name: a.name,
    effects: [
      {
        type: "stat bonus",
        stat: "max essence",
        power: Math.floor(a.danger / 2) + 1,
      },
      {
        type: "soak damage",
        power: Math.floor(a.danger / 5),
      },
    ],
  }),
};

type MonsterProto = {
  base: MonsterArchetype;
  variants: Array<Partial<MonsterArchetype>>;
};

function expandProto(proto: MonsterProto): {
  [id: ArchetypeID]: MonsterArchetype;
} {
  let archs = { [proto.base.name]: proto.base };
  for (let variant of proto.variants) {
    // todo can we enforce having a name
    archs[variant.name!] = { ...proto.base, ...variant };
  }
  return archs;
}

export const MonsterArchetypes: { [id: ArchetypeID]: MonsterArchetype } = {
  ...expandProto({
    base: {
      name: "maggot heap",
      description:
        "A writhing mass of sickly pale grubs, clinging to a few scraps of moldering flesh for sustenance... and now they sustain me.",
      danger: 1,
      glyph: "worm",
      color: "vermin",
      appearing: asRoll(1, 4, 3),
      hp: verminHP,
      speed: 0.2,
      ai: "passive",
      attack: "none",
      soul: "vermin",
    },
    variants: [
      {
        name: "gnat swarm",
        description:
          "Harmless pests, birthed from some forgotten corpse. They would have irritated me in life. Now they are my bread.",
        glyph: "insect",
        appearing: asRoll(2, 4, 0),
        ai: "wander",
      },
      {
        name: "luminous grub",
        description:
          "A fat worm with a glowing aura. It must have learned to feed on ambient essence, which is now mine for the taking.",
        danger: 5,
        glyph: "worm",
        color: "vermin",
      },
      {
        name: "soul butterfly",
        description:
          "This strange insect leaves trails of essence behind its wings. A beautiful aberration, but also delicious.",
        danger: 8,
        glyph: "insect",
        color: "vermin",
        speed: 0.4,
        ai: "wander",
      },
      {
        name: "torpid ghost",
        description:
          "A pathetic lost soul that has been ensnared here and reduced to a nearly sessile state.",
        danger: 10,
        glyph: "ghost",
        color: "vermin",
        speed: 0.1,
        ai: "wander",
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "dusty rat",
      description:
        "A skinny, worn creature, barely alive, but with just enough of a soul remaining to remove intact.",
      danger: 2,
      glyph: "rodent",
      color: "danger0",
      appearing: asRoll(1, 2, 1),
      hp: asRoll(1, 4, 1),
      speed: 0.5,
      ai: "nipper",
      attack: "bite",
      soul: "maxEssence",
    },
    variants: [
      {
        name: "hungry rat",
        description:
          "A brown-hided rat that gnaws old bones for food. It seems to think my skull is its next meal.",
        danger: 6,
        color: "danger5",
        hp: asRoll(2, 4, 1),
        ai: "charge",
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "crypt spider",
      description:
        "A cobwebbed arachnid that feeds on gnats and maggots, and in turn is fed upon by me.",
      danger: 3,
      glyph: "spider",
      color: "danger0",
      appearing: asRoll(1, 2, 0),
      hp: asRoll(1, 2, 2),
      speed: 0.8,
      ai: "nipper",
      attack: "bite",
      soul: "extraDamage",
    },
    variants: [
      {
        name: "wolf spider",
        description:
          "This furry gray arachnid is the size of my skull and intent on defending its hunting grounds. But they are my hunting grounds, now.",
        danger: 7,
        color: "danger5",
        hp: asRoll(1, 4, 2),
        ai: "charge",
      },
      {
        name: "ambush spider",
        description: "An obnoxious creature that springs out to attack!",
        danger: 15,
        color: "danger15",
        // TODO they should have a double-move
        ai: "charge",
        speed: 0.9,
        soul: "speed",
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "little ghost",
      description:
        "A weak spirit, barely clinging to the mortal world. I wandered for decades in a state like this.",
      danger: 4,
      glyph: "ghost",
      color: "danger0",
      appearing: asRoll(1, 1, 0),
      hp: asRoll(2, 4, 0),
      speed: 0.25,
      ai: "charge",
      attack: "touch",
      soul: "slow",
    },
    variants: [
      {
        name: "weeping ghost",
        description:
          "This decrepit spirit moans and mewls in a manner that would turn my stomach, if I still had one. Its suffering shall soon be over.",
        danger: 9,
        color: "danger5",
        hp: asRoll(2, 8, 2),
        speed: 0.5,
      },
      {
        name: "howling ghost",
        description:
          "A vigorous spirit, for once! Its yawping does grate, but I have a cure for that.",
        danger: 12,
        color: "danger10",
        hp: asRoll(2, 5, 2),
        speed: 0.9,
        soul: "speed",
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "bleary eye",
      description:
        "The gummy, sluglike body of this repulsive creature clings fast to surfaces and moves exceedingly slowly, but its gaze pierces the veil and disrupts my essence.",
      danger: 5,
      glyph: "eyeball",
      color: "danger5",
      appearing: asRoll(1, 2, 1),
      hp: asRoll(2, 4, 0),
      speed: 0.25,
      ai: "stationary",
      attack: "gaze",
      soul: "sight",
    },
    variants: [
      {
        name: "peering eye",
        description: "This disgusting creature will pay for its insolent gaze!",
        danger: 10,
        color: "danger10",
        appearing: asRoll(1, 1, 0),
        hp: asRoll(3, 4, 0),
        speed: 0.5,
      },
      {
        name: "gimlet eye",
        description:
          "These remind me of the steely, courageous gaze of someone I once knew. Just like then, I'm going to tear its soul to shreds.",
        danger: 17,
        color: "danger15",
        // TODO esp
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "soul sucker",
      description:
        "A giant, bloated mosquito, glowing with essence. Another result of the luminous grubs? When I am restored, I should build a laboratory to study this phenomenon.",
      danger: 15,
      glyph: "insect",
      color: "danger15",
      appearing: asRoll(2, 2, 2),
      hp: asRoll(2, 2, 2),
      speed: 1.0,
      ai: "nipper",
      attack: "bite",
      soul: "maxEssence", // TODO essence drain
    },
    variants: [],
  }),
  ...expandProto({
    base: {
      name: "do-gooder",
      description:
        "Ha! If my captors are reduced to such a feeble state, armed with weapons little better than a child's toy, my restoration will be swift indeed.",
      danger: 7,
      glyph: "player",
      color: "danger5",
      appearing: asRoll(1, 2, 0),
      hp: asRoll(2, 6, 4),
      speed: 0.6,
      ai: "charge",
      attack: "slice",
      soul: "soak",
    },
    variants: [
      {
        name: "acolyte",
        description:
          "This child has read a book or two and learned enough to be dangerous, but I am a much harsher tutor than any they have ever known.",
        danger: 12,
        color: "danger10",
        appearing: asRoll(1, 2, 0),
        hp: asRoll(2, 4, 2),
        attack: "abjure",
        speed: 0.5,
        soul: "extraDamage",
      },
      {
        name: "warrior",
        description:
          "A muscular oaf, but able enough to swing a sword. This merits caution.",
        danger: 16,
        color: "danger15",
        appearing: asRoll(2, 1, 0),
        hp: asRoll(3, 6, 4),
        soul: "soak",
      },
      {
        name: "priest",
        description:
          "Ah, a god-speaker. No doubt sent here to soothe the restless dead. I have a better solution.",
        danger: 20,
        color: "danger20",
        hp: asRoll(3, 6, 4),
        speed: 0.5,
        attack: "abjure",
      },
    ],
  }),
};

export type ArchetypeID = string;

export type MonsterStatusType = "dying" | "slow";
export type MonsterStatus =
  | {
      type: "dying";
      timer: number;
    }
  | {
      type: "slow";
      timer: number;
    };

export const DeathMessages = {
  drain: "%The crumbles into dust.",
  force: "%The is blown to pieces.",
  bleedout: "The soul of %the departs.",
};

export type DeathType = keyof typeof DeathMessages;

export type Monster = {
  archetype: ArchetypeID;
  hp: number;
  maxHP: number;
  energy: number;
  statuses: MonsterStatus[];
  deathCause?: DeathType;
};

export function spawnMonster(archetype: ArchetypeID): Monster {
  let hp = doRoll(MonsterArchetypes[archetype].hp);
  return {
    archetype,
    hp: hp,
    maxHP: hp,
    energy: 1.0,
    statuses: [],
  };
}

export function killMonster(m: Monster, cause: DeathType) {
  if (!m.deathCause) {
    m.deathCause = cause;
  }
}

export function monsterHasStatus(
  m: Monster,
  status: MonsterStatusType
): boolean {
  return !!m.statuses.find((s) => s.type === status);
}

export function inflictStatus(m: Monster, s: MonsterStatus) {
  // For now, all statuses just reapply -- no stacking
  m.statuses = m.statuses.filter((s) => s.type !== s.type);
  m.statuses.push(s);
}

export function cureStatus(m: Monster, st: MonsterStatusType) {
  m.statuses = m.statuses.filter((s) => s.type !== st);
}

export function monsterStatusTick(m: Monster) {
  for (let st of m.statuses) {
    switch (st.type) {
      case "dying":
        st.timer--;
        if (st.timer <= 0) {
          killMonster(m, "bleedout");
        }
        break;
      case "slow":
        st.timer--;
        if (st.timer <= 0) {
          cureStatus(m, "slow");
        }
        break;
    }
  }
}

export function monsterSpeed(m: Monster): number {
  let speed = MonsterArchetypes[m.archetype].speed;
  if (monsterHasStatus(m, "slow")) {
    speed /= 2;
  }
  return speed;
}

export function weakMonster(m: Monster): boolean {
  return m.hp <= 1 || monsterHasStatus(m, "dying");
}

export function makeSoul(arch: MonsterArchetype): Soul {
  return SoulFactories[arch.soul](arch);
}

export function getSoul(m: Monster): Soul {
  let soul = Game.monsterSouls[m.archetype];
  if (soul) {
    return soul;
  } else {
    let arch = MonsterArchetypes[m.archetype];
    soul = makeSoul(arch);
    Game.monsterSouls[m.archetype] = soul;
    return soul;
  }
}
