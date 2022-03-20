import * as ROT from "rot-js";
import { D } from "./commands";
import { MonsterArchetypes } from "./data/monsters";
import { Game } from "./game";
import { contentsAt, moveMonster, playerCanSee, XYContents } from "./map";
import { Attacks } from "./monster";
import { msg } from "./msg";
import { roll100 } from "./utils";

type AIFunc = (c: XYContents) => number;

function tryAI(c: XYContents, ...ais: AIFunc[]): number {
  for (let ai of ais) {
    let spent = ai(c);
    if (spent > 0) {
      return spent;
    }
  }
  return 0.0;
}

function canSeePlayer(c: XYContents): boolean {
  return playerCanSee(c.x, c.y);
}

function doApproach(c: XYContents): number {
  if (canSeePlayer(c)) {
    let dx = Game.player.x - c.x;
    dx = dx == 0 ? 0 : dx / Math.abs(dx);
    let dy = Game.player.y - c.y;
    dy = dy == 0 ? 0 : dy / Math.abs(dy);
    moveMonster(c, contentsAt(c.x + dx, c.y + dy));
    return 1.0;
  } else {
    return 0.0;
  }
}

function doAttack(c: XYContents): number {
  let m = c.monster!;
  let arch = MonsterArchetypes[m.archetype];
  let attack = Attacks[arch.attack];
  if (attack.canReachFrom(c)) {
    attack.attackFrom(c);
    return 1.0;
  } else {
    return 0.0;
  }
}

function maybeDawdle(pct: number, message?: string): AIFunc {
  return (c) => {
    if (roll100(pct)) {
      // waste a turn
      if (message && canSeePlayer(c)) {
        // TODO: would like to have audible dawdles too
        msg.combat(message, D(c));
      }
      return 1.0;
    } else {
      return 0.0;
    }
  };
}

function maybeBlink(pct: number): AIFunc {
  return (c) => {
    let nx = c.x + ROT.RNG.getUniformInt(-4, 4);
    let ny = c.y + ROT.RNG.getUniformInt(-4, 4);
    let spot = contentsAt(nx, ny);
    if (!spot.blocked) {
      if (canSeePlayer(c)) {
        msg.combat(
          "%The disappears " +
            (canSeePlayer(spot) ? "from sight!" : "and reappears!"),
          D(c)
        );
      }
      moveMonster(c, spot);
      return 1.0;
    } else {
      return 0.0;
    }
  };
}

export const AI: { [id: string]: AIFunc } = {
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
  nipper: (c) => tryAI(c, doAttack, AI.wander),
  stationary: (c) => tryAI(c, maybeDawdle(25), doAttack, AI.passive),
  charge: (c) =>
    tryAI(c, doAttack, maybeDawdle(25), doApproach, AI.wander, AI.passive),
  prankster: (c) =>
    tryAI(
      c,
      maybeDawdle(20, "%The giggles!"),
      maybeDawdle(20, "%The chortles!"),
      maybeBlink(20),
      maybeDawdle(20, "%The makes a rude gesture!"),
      doAttack,
      AI.wander,
      AI.passive
    ),
};

export type Attack = {
  canReachFrom: (c: XYContents) => boolean;
  attackFrom: (c: XYContents) => void;
};
