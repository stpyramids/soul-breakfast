import { D } from "./commands";
import { MonsterArchetypes } from "./data/monsters";
import { getMap, getPlayerXY } from "./game";
import { contentsAt, moveMonster, playerCanSee, XYContents } from "./map";
import { Attacks } from "./monster";
import { msg } from "./msg";
import { randInt, roll100 } from "./utils";

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

function getTarget(c: XYContents): XYContents | null {
  if (canSeePlayer(c)) {
    let { x, y } = getPlayerXY();
    return contentsAt(x, y);
  } else {
    return null;
  }
}

function doApproach(c: XYContents): number {
  let target = getTarget(c);
  if (target) {
    let dx = target.x - c.x;
    dx = dx == 0 ? 0 : dx / Math.abs(dx);
    let dy = target.y - c.y;
    dy = dy == 0 ? 0 : dy / Math.abs(dy);
    if (dx + dy > 0) {
      moveMonster(getMap(), c, contentsAt(c.x + dx, c.y + dy));
      return 1.0;
    } else {
      return 0.0;
    }
  } else {
    return 0.0;
  }
}

function doAttack(c: XYContents): number {
  let target = getTarget(c);
  let m = c.monster!;
  let arch = MonsterArchetypes[m.archetype];
  let attack = Attacks[arch.attack];
  if (target && attack.canReachFrom(c, target)) {
    attack.attackFrom(c, target);
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
    if (!roll100(pct)) {
      return 0.0;
    }
    let nx = c.x + randInt(-4, 4);
    let ny = c.y + randInt(-4, 4);
    let spot = contentsAt(nx, ny);
    if (!spot.blocked) {
      if (canSeePlayer(c)) {
        msg.combat(
          "%The disappears " +
            (canSeePlayer(spot) ? "from sight!" : "and reappears!"),
          D(c)
        );
      }
      moveMonster(getMap(), c, spot);
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
    for (let tries = 5; tries > 0; tries--) {
      let nx = c.x + randInt(-1, 1);
      let ny = c.y + randInt(-1, 1);
      let spot = contentsAt(nx, ny);
      if (!spot.blocked) {
        moveMonster(getMap(), c, spot);
        return 1.0;
      }
    }
    return 1.0;
  },
  nipper: (c) => tryAI(c, maybeDawdle(25), doAttack, AI.wander),
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
  blinker: (c) =>
    tryAI(c, maybeBlink(30), maybeDawdle(50), doAttack, doApproach), // should "blink close"
};

export type Attack = {
  canReachFrom: (from: XYContents, target: XYContents) => boolean;
  attackFrom: (from: XYContents, target: XYContents) => void;
};
