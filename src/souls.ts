import { GlyphID } from "./glyphs";
import { Roll, asRoll } from "./utils";

export type Status = "slow";

export type Targeting = "seeker";
export type TargetingEffect = { type: "targeting"; targeting: Targeting };
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
  seeker: { type: "targeting", targeting: "seeker" },
  bolt: { type: "projectile", projectile: "bolt" },
  weakMana: { type: "damage", damage: asRoll(1, 4, 0) },
};

export type StatBonus = "sight" | "speed";
export type StatBonusEffect = {
  type: "stat-bonus";
  stat: StatBonus;
  power: number;
};

export type RingEffect = StatBonusEffect;

// TODO:
// Eventually I want separate slots for wand, ring, and crown souls.
// This is probably too complicated to implement in the short term.
// Instead, there's just a fixed set of generic slots.
export type WandSoul = {
  type: "wand";
  glyph: GlyphID;
  essence: number;
  name: string;
  effects: Array<WandEffect>;
};
export type RingSoul = {
  type: "ring";
  glyph: GlyphID;
  essence: number;
  name: string;
  effects: Array<RingEffect>;
};
export type CrownSoul = {
  type: "crown";
  glyph: GlyphID;
  essence: number;
  name: string;
};
export type GenericSoul = {
  type: "generic";
  glyph: GlyphID;
  essence: number;
  name: string;
};
export type NoSoul = {
  type: "none";
  glyph: GlyphID;
  essence: number;
  name: string;
};
export type Soul = WandSoul | RingSoul | CrownSoul | GenericSoul | NoSoul;

export const EmptySoul: NoSoul = {
  type: "none",
  glyph: "none",
  essence: 0,
  name: "-",
};
