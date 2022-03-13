import * as ROT from "rot-js";

/// Utility

export function keysOf<T>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

/// Random value generation

// represents an NdS+M dice roll with modifier
export type Roll = {
  n: number;
  sides: number;
  mod: number;
};

export function asRoll(n: number, sides: number, mod: number): Roll {
  return { n, sides, mod };
}

export function doRoll(roll: Roll): number {
  let n = 0;
  for (let i = 0; i < roll.n; i += 1) {
    n += ROT.RNG.getUniformInt(1, roll.sides);
  }
  let v = n + roll.mod;
  return v;
}

export function describeRoll(roll: Roll): string {
  return roll.n + "d" + roll.sides + "+" + roll.mod;
}
