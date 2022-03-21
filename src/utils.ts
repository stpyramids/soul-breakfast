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

export function asRoll(n: number, sides: number, mod?: number): Roll {
  return { n, sides, mod: mod ? mod : 0 };
}

export const R = asRoll;

export function doRoll(roll: Roll): number {
  let n = 0;
  for (let i = 0; i < roll.n; i += 1) {
    n += ROT.RNG.getUniformInt(1, roll.sides);
  }
  let v = n + roll.mod;
  return v;
}

export function Rnd(n: number, sides: number, mod?: number): number {
  return doRoll(asRoll(n, sides, mod));
}

export function describeRoll(roll: Roll): string {
  return roll.n + "d" + roll.sides + (roll.mod > 0 ? "+" + roll.mod : "");
}

export function roll100(under: number): boolean {
  return ROT.RNG.getUniformInt(1, 100) <= under;
}

export function randInt(low: number, high: number): number {
  return ROT.RNG.getUniformInt(low, high);
}

export interface XY {
  x: number;
  y: number;
}

export function xyDistance(from: XY, to: XY): number {
  let dx = Math.abs(from.x - to.x);
  let dy = Math.abs(from.y - to.y);
  return Math.floor(Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)));
}

export function sample<T>(items: T[]): T | null {
  return ROT.RNG.getItem(items);
}
