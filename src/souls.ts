import { GlyphID } from "./glyphs";
import { Roll, asRoll, describeRoll } from "./utils";

export type Status = "slow";

export type Targeting = "seek closest" | "seek strong";
export type TargetingEffect = {
  type: "targeting";
  targeting: Targeting;
  count: number;
};
export const isTargeting = (t: WandEffect): t is TargetingEffect =>
  t.type === "targeting";

export type Projectile = "bolt";
export type ProjectileEffect = { type: "projectile"; projectile: Projectile };
export const isProjectile = (t: WandEffect): t is ProjectileEffect =>
  t.type === "projectile";

export type DamageEffect = { type: "damage"; damage: Roll };
export const isDamage = (t: WandEffect): t is DamageEffect =>
  t.type === "damage";

export type StatusEffect = { type: "status"; status: Status; power: number };
export const isStatus = (t: WandEffect): t is DamageEffect =>
  t.type === "status";

export type WandEffect =
  | TargetingEffect
  | ProjectileEffect
  | DamageEffect
  | StatusEffect;

export const WandEffects: { [id: string]: WandEffect } = {
  seek_closest: { type: "targeting", targeting: "seek closest", count: 1 },
  bolt: { type: "projectile", projectile: "bolt" },
  weakMana: { type: "damage", damage: asRoll(1, 4, 0) },
};

export type StatBonus = "sight" | "speed" | "max essence";
export type StatBonusEffect = {
  type: "stat bonus";
  stat: StatBonus;
  power: number;
};
export type SoakDamageEffect = {
  type: "soak damage";
  power: number;
};

export type RingEffect = SoakDamageEffect;
export type GenericEffect = StatBonusEffect;
export type SoulEffect = RingEffect | WandEffect | GenericEffect;

// TODO:
// Eventually I want separate slots for wand, ring, and crown souls.
// This is probably too complicated to implement in the short term.
// Instead, there's just a fixed set of generic slots.
// TODO: instead of separate soul types, a single soul can have effects
// of various types
export type Soul = {
  glyph: GlyphID;
  name: string;
  essence: number;
  effects: Array<SoulEffect>;
};

export const EmptySoul: Soul = {
  glyph: "none",
  name: "-",
  essence: 0,
  effects: [],
};
export function isEmptySoul(soul: Soul): boolean {
  return soul.essence === 0;
}

function describeSoulEffect(e: SoulEffect) {
  switch (e.type) {
    case "soak damage":
      return "soak " + e.power + " damage";
    case "stat bonus":
      if (e.stat === "speed") {
        return "+" + Math.floor(e.power * 100) + "% " + e.stat;
      } else {
        return "+" + e.power + " " + e.stat;
      }
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

export function describeSoulEffects(s: Soul): string {
  if (isEmptySoul(s)) {
    return " ";
  } else if (s.effects.length === 0) {
    return "+" + s.essence + " essence";
  } else {
    let d = [];
    for (let effect of s.effects) {
      d.push(describeSoulEffect(effect));
    }
    return d.join(", ");
  }
}
