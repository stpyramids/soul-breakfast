import { AI, Attack } from "./ai";
import { D } from "./commands";
import { MonsterArchetypes } from "./data/monsters";
import { SoulFactories } from "./data/souls";
import { getMonsterSoul } from "./game";
import { playerCanSee } from "./map";
import { msg } from "./msg";
import { doDamage, getSoulEffect } from "./player";
import { Soul } from "./souls";
import { ColorID, GlyphID } from "./token";
import { doRoll, R, Roll } from "./utils";

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

export function meleeAttack(verb: string, damage: Roll): Attack {
  return {
    canReachFrom: (from, target) =>
      (target.x === from.x ||
        target.x === from.x - 1 ||
        target.x === from.x + 1) &&
      (target.y === from.y ||
        target.y === from.y - 1 ||
        target.y === from.y + 1),
    attackFrom: (c) => {
      msg.combat("%The %s you!", D(c), verb);
      let m = c.monster;
      let danger = m ? MonsterArchetypes[m.archetype].essence : 1;
      // TODO combat parameters
      if (doRoll(R(1, 100, 0)) > 90 - danger * 2) {
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
    canReachFrom: (from, target) => playerCanSee(from.x, from.y),
    attackFrom: (from, target) => {
      msg.combat("%The %s you!", D(from), verb);
      let m = from.monster;
      let danger = m ? MonsterArchetypes[m.archetype].essence : 1;
      // TODO combat parameters
      if (doRoll(R(1, 100, 0)) > 90 - danger * 2) {
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
    canReachFrom: (c, t) => false,
    attackFrom: (c, t) => {},
  },
  bite: meleeAttack("snaps at", R(1, 4, 0)),
  touch: meleeAttack("reaches into", R(1, 4, 2)),
  slice: meleeAttack("slices at", R(1, 8, 4)),
  shock: meleeAttack("shocks", R(3, 4, 1)),
  gaze: rangedAttack("gazes at", R(1, 4, 0)),
  abjure: rangedAttack("abjures", R(1, 4, 2)),
  rock: rangedAttack("pitches a rock at", R(1, 2, 0)),
};

export type MonsterArchetype = {
  name: string;
  description: string;
  essence: number;
  glyph: GlyphID;
  color: ColorID;
  hp: Roll;
  speed: number;
  ai: keyof typeof AI;
  attack: keyof typeof Attacks;
  soul: keyof typeof SoulFactories;
};

export type SoulFactory = (arch: MonsterArchetype) => Soul;

export type ArchetypeID = string;

export type MonsterFormation = {
  danger: number;
  appearing: [ArchetypeID, Roll][];
};

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
  escape: "The soul of %the escapes your grasp."
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
  let trap = getSoulEffect("soul trap");
  for (let st of m.statuses) {
    switch (st.type) {
      case "dying":
        st.timer--;
        if (st.timer <= 0) {
          killMonster(m, trap ? "escape" : "bleedout");
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
  let f = SoulFactories[arch.soul];
  return f(arch);
}

export function getSoul(m: Monster): Soul {
  return getMonsterSoul(m.archetype, () => {
    return makeSoul(MonsterArchetypes[m.archetype]);
  });
}
