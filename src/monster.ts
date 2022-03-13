/// Monster data

import * as ROT from "rot-js";
import { Colors } from "./colors";
import { D } from "./commands";
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
import { EmptySoul, Soul, WandEffect, RingEffect } from "./souls";
import { keysOf, asRoll, doRoll, Roll, describeRoll } from "./utils";

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

export function doDamage(dmg: number) {
  msg.combat("Your essence wavers!");
  Game.player.essence -= dmg;
  if (Game.player.essence < 0) {
    let extra = Math.abs(Game.player.essence);
    Game.player.essence = 0;
    let soulChecked = false;
    let soulBroken = false;
    for (let slotGroup of keysOf(Game.player.soulSlots)) {
      let slots = Game.player.soulSlots[slotGroup];
      for (let i = 0; i < slots.length; i++) {
        if (slots[i].type !== "none") {
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
        newMap({
          danger: Game.map.danger - Math.floor(blowback / 2),
        });
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
      if (doRoll(asRoll(1, 100, 0)) > 100 - danger * 2) {
        // damage dice scale up with danger
        let dmgRoll = { ...damage, n: (danger / 2) * damage.n };
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
      if (doRoll(asRoll(1, 100, 0)) > 100 - danger * 2) {
        // damage dice scale up with danger
        let dmgRoll = { ...damage, n: (danger / 2) * damage.n };
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
  abjure: rangedAttack("abjures", asRoll(1, 8, 4)),
};

export type MonsterArchetype = {
  name: string;
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
    type: "none",
    essence: Math.floor((a.danger + 1) / 2),
    name: a.name,
  }),
  bulk: (a) => ({
    glyph: a.glyph,
    type: "generic",
    essence: a.danger,
    name: a.name,
  }),
  extraDamage: (a) => ({
    glyph: a.glyph,
    type: "wand",
    essence: a.danger,
    name: a.name,
    effects: [
      { type: "damage", damage: asRoll(Math.floor(a.danger / 2), 4, 1) },
    ],
  }),
  slow: (a) => ({
    glyph: a.glyph,
    type: "wand",
    essence: a.danger,
    name: a.name,
    effects: [
      { type: "status", status: "slow", power: Math.floor(a.danger / 2) },
    ],
  }),
  sight: (a) => ({
    glyph: a.glyph,
    type: "ring",
    essence: a.danger,
    name: a.name,
    effects: [
      { type: "stat-bonus", stat: "sight", power: Math.floor(a.danger / 2) },
    ],
  }),
  speed: (a) => ({
    glyph: a.glyph,
    type: "ring",
    essence: a.danger,
    name: a.name,
    effects: [
      {
        type: "stat-bonus",
        stat: "speed",
        power: 0.05 * Math.floor(a.danger / 2), // todo fix rounding
      },
    ],
  }),
};

function describeWandEffect(e: WandEffect): string {
  switch (e.type) {
    case "damage":
      return "damage " + describeRoll(e.damage);
    case "status":
      return e.status + " " + e.power;
    case "projectile":
      return e.projectile;
    case "targeting":
      return e.targeting;
  }
}

function describeRingEffect(e: RingEffect): string {
  switch (e.type) {
    case "stat-bonus":
      if (e.stat === "speed") {
        return "+" + Math.floor(e.power * 100) + "% " + e.stat;
      } else {
        return "+" + e.power + " " + e.stat;
      }
  }
}

export function describeSoulEffect(s: Soul): string {
  switch (s.type) {
    case "none":
      if (s.essence === 0) {
        return " ";
      } else {
        return "+" + s.essence + " essence";
      }
    case "generic":
      return "+" + s.essence + " max essence";
    case "wand":
      return describeWandEffect(s.effects[0]); // todo
    case "ring":
      return describeRingEffect(s.effects[0]); // todo
    default:
      return "???";
  }
}

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
        glyph: "insect",
        appearing: asRoll(2, 4, 0),
        ai: "wander",
      },
      {
        name: "soul grubs",
        danger: 5,
        glyph: "worm",
        color: "vermin",
      },
      {
        name: "soul butterflies",
        danger: 8,
        glyph: "insect",
        color: "vermin",
      },
      {
        name: "torpid ghost",
        danger: 10,
        glyph: "ghost",
        color: "vermin",
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "dusty rat",
      danger: 2,
      glyph: "rodent",
      color: "danger0",
      appearing: asRoll(1, 2, 1),
      hp: asRoll(1, 4, 1),
      speed: 0.5,
      ai: "nipper",
      attack: "bite",
      soul: "bulk",
    },
    variants: [
      {
        name: "hungry rat",
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
        danger: 7,
        color: "danger5",
        hp: asRoll(1, 4, 2),
        ai: "charge",
      },
      {
        name: "ambush spider",
        danger: 15,
        color: "danger15",
        ai: "charge",
        speed: 0.9,
        soul: "speed",
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "little ghost",
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
        danger: 9,
        color: "danger5",
        hp: asRoll(2, 8, 2),
        speed: 0.5,
      },
      {
        name: "howling ghost",
        danger: 16,
        color: "danger15",
        hp: asRoll(2, 5, 2),
        speed: 0.9,
        soul: "speed",
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "bleary eye",
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
        danger: 10,
        color: "danger10",
        appearing: asRoll(1, 1, 0),
        hp: asRoll(3, 4, 0),
        speed: 0.5,
      },
      {
        name: "gimlet eye",
        danger: 17,
        color: "danger15",
        // TODO esp
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "soul sucker",
      danger: 20,
      glyph: "insect",
      color: "danger20",
      appearing: asRoll(2, 2, 2),
      hp: asRoll(2, 2, 2),
      speed: 0.5,
      ai: "nipper",
      attack: "bite",
      soul: "bulk", // TODO essence drain
    },
    variants: [],
  }),
  ...expandProto({
    base: {
      name: "do-gooder",
      danger: 10,
      glyph: "player",
      color: "danger10",
      appearing: asRoll(1, 2, 0),
      hp: asRoll(2, 6, 4),
      speed: 0.5,
      ai: "charge",
      attack: "slice",
      soul: "bulk",
    },
    variants: [
      {
        name: "acolyte",
        danger: 15,
        color: "danger15",
        appearing: asRoll(1, 2, 0),
        hp: asRoll(2, 4, 2),
        attack: "abjure",
        speed: 0.2,
        soul: "extraDamage",
      },
      {
        name: "warrior",
        danger: 20,
        color: "danger20",
        appearing: asRoll(2, 1, 0),
        hp: asRoll(3, 6, 4),
        soul: "speed",
      },
      {
        name: "priest",
        danger: 25,
        color: "danger25",
        hp: asRoll(3, 6, 4),
        speed: 0.2,
        attack: "abjure",
      },
    ],
  }),
};

export type ArchetypeID = string;

export type Monster = {
  archetype: ArchetypeID;
  hp: number;
  energy: number;
  dying: boolean;
};

export function spawnMonster(archetype: ArchetypeID): Monster {
  return {
    archetype,
    hp: doRoll(MonsterArchetypes[archetype].hp),
    energy: 1.0,
    dying: false,
  };
}

export function weakMonster(m: Monster): boolean {
  return m.hp <= 1 || m.dying;
}

export function getSoul(m: Monster): Soul {
  let soul = Game.monsterSouls.get(m.archetype);
  if (soul) {
    return soul;
  } else {
    let arch = MonsterArchetypes[m.archetype];
    soul = SoulFactories[arch.soul](arch);
    Game.monsterSouls.set(m.archetype, soul);
    return soul;
  }
}

export const DeathMessages: { [type: string]: string } = {
  drain: "%The crumbles into dust.",
  force: "%The is blown to pieces.",
};

export type DeathType = keyof typeof DeathMessages;
