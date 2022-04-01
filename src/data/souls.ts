import { MonsterArchetype, SoulFactory } from "../monster";
import { SoulEffect } from "../souls";
import { R, Rnd, roll100 } from "../utils";

function mkSoulF(
  effects: (arch: MonsterArchetype) => (SoulEffect | null)[]
): SoulFactory {
  return (a) => ({
    token: [a.glyph, a.color],
    essence: a.essence,
    name: a.name,
    effects: effects(a).filter((f) => f) as SoulEffect[],
  });
}
export const SoulFactories = {
  vermin: mkSoulF((a) => []),
  maxEssence: mkSoulF((a) => [
    { type: "stat bonus", stat: "max essence", power: a.essence },
  ]),
  extraDamage: mkSoulF((a) => [
    {
      type: "stat bonus",
      stat: "max essence",
      power: Math.floor(a.essence / 2) + 1,
    },
    { type: "damage", damage: R(Math.floor(a.essence / 2), 4, Rnd(1, 4)) },
  ]),
  slow: mkSoulF((a) => [
    {
      type: "stat bonus",
      stat: "max essence",
      power: Math.floor(a.essence / 2) + 1,
    },
    {
      type: "status",
      status: "slow",
      power: Math.floor(a.essence / 2) + Rnd(1, 3),
    },
  ]),
  sight: mkSoulF((a) => [
    {
      type: "stat bonus",
      stat: "max essence",
      power: Math.floor(a.essence * 0.7),
    },
    roll100(20 + a.essence)
      ? {
          type: "danger sense",
          power: Math.floor(a.essence / 8) + 2,
        }
      : null,
    {
      type: "stat bonus",
      stat: "sight",
      power: Math.floor(a.essence / 4) + 1,
    },
  ]),
  clairvoyance: mkSoulF((a) => [
    {
      type: "stat bonus",
      stat: "max essence",
      power: Math.floor(a.essence * 0.7),
    },
    roll100(20 + a.essence)
      ? {
          type: "danger sense",
          power: Math.floor(a.essence / 8) + 2,
        }
      : null,
    {
      type: "ability",
      ability: "clairvoyance",
      power: Math.floor(a.essence / 2) + Rnd(1, 3),
    },
  ]),
  speed: mkSoulF((a) => [
    {
      type: "stat bonus",
      stat: "max essence",
      power: Math.floor(a.essence * 0.8),
    },
    {
      type: "stat bonus",
      stat: "speed",
      power: 0.05 * (Math.floor(a.essence / 2) + Rnd(1, 3)),
    },
  ]),
  soak: mkSoulF((a) => [
    {
      type: "stat bonus",
      stat: "max essence",
      power: Math.floor(a.essence / 2) + 1,
    },
    {
      type: "soak damage",
      power: Math.floor(a.essence / Rnd(1, 2, 3)),
    },
  ]),
  umbra: mkSoulF((a) => [
    {
      type: "stat bonus",
      stat: "max essence",
      power: Math.floor(a.essence / 2) + 1,
    },
    {
      type: "ability",
      ability: "shadow cloak",
      power: Math.floor(a.essence / 5) + 2,
    },
  ]),
  blink: mkSoulF((a) => [
    {
      type: "stat bonus",
      stat: "max essence",
      power: Math.floor(a.essence / 2) + 1,
    },
    {
      type: "ability",
      ability: "blink",
      power: 0,
    },
  ]),
  // Debug mode test soul
  protolich: mkSoulF((a) => [
    {
      type: "stat bonus",
      stat: "max essence",
      power: 200,
    },
    {
      type: "death vision",
      power: 5
    },
    {
      type: "soul trap",
      power: 2.0,
    }
  ]),
  // Debug mode super-soul
  megalich: mkSoulF((a) => [
    {
      type: "stat bonus",
      stat: "max essence",
      power: 200,
    },
    {
      type: "soak damage",
      power: 500,
    },
    {
      type: "stat bonus",
      stat: "speed",
      power: 10.0,
    },
    { type: "damage", damage: R(10, 100, 50) },
    {
      type: "danger sense",
      power: 20,
    },
    {
      type: "ability",
      ability: "clairvoyance",
      power: 50,
    },
    {
      type: "ability",
      ability: "shadow cloak",
      power: 10,
    },
  ]),
};
