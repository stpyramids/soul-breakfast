import * as ROT from "rot-js";
import { D } from "./commands";
import { MonsterArchetypes } from "./data/monsters";
import { getMap, getPlayerXY } from "./game";
import {
  DeathMessages,
  Monster,
  monsterHasStatus,
  weakMonster,
} from "./monster";
import { msg } from "./msg";
import { getPlayerVision, getSoulEffect, getWand } from "./player";
import { GlyphID } from "./token";
import { xyDistance } from "./utils";

export const baseMap = {
  danger: 1,
  w: 80,
  h: 80,
  tiles: [] as Array<Tile>,
  monsters: [] as Array<Monster | null>,
  memory: [] as Array<RememberedCell>,
  exits: [] as Array<[number, number, number]>,
};

export type LevelMap = typeof baseMap;

export function forEachMonster(
  map: LevelMap,
  func: (m: Monster, x: number, y: number) => void
): void {
  map.monsters.forEach((m, i) => {
    if (m) {
      const [x, y] = idxToXY(i);
      func(m, x, y);
    }
  });
}

function deleteMonster(map: LevelMap, monster: Monster): void {
  while (true) {
    const idx = map.monsters.indexOf(monster);
    if (idx === -1) {
      break;
    }
    map.monsters[idx] = null;
  }
}

export function placeMonster(
  map: LevelMap,
  monster: Monster,
  x: number,
  y: number
): void {
  map.monsters[x + y * map.w] = monster;
}

export function reapDead(map: LevelMap): void {
  forEachMonster(map, (m, x, y) => {
    if (m.deathCause) {
      const c = contentsAt(x, y);
      msg.combat(DeathMessages[m.deathCause], D(c));
      deleteMonster(map, m);
    }
  });
}

/// Map tiles

export type Tile = {
  glyph: GlyphID;
  blocks: boolean;
};

const DangerDescriptions: [number, string][] = [
  [1, "cobwebbed catacomb"],
  [5, "ruined crypt"],
  [10, "murky tomb"],
  [15, "silent mausoleum"],
  [20, "tranquil sepulcher"],
  [25, "teeming necropolis"],
];

export function getMapDescription(map: LevelMap): string {
  for (let i = DangerDescriptions.length - 1; i >= 0; i--) {
    if (DangerDescriptions[i][0] < map.danger) {
      return DangerDescriptions[i][1];
    }
  }
  return DangerDescriptions[0][1];
}

export function moveMonster(
  map: LevelMap,
  from: XYContents,
  to: XYContents
): boolean {
  if (!to.blocked && from.monster) {
    deleteMonster(map, from.monster);
    placeMonster(map, from.monster, to.x, to.y);
    return true;
  } else {
    return false;
  }
}

let seenIdxs: Set<number> = new Set();
const FOV = new ROT.FOV.PreciseShadowcasting((x, y) => {
  let c = contentsAt(x, y);
  // Nothing but tiles block FOV (for now)
  return !(!c.tile || c.tile.blocks);
});
function idxToXY(i: number): [number, number] {
  return [i % getMap().w, Math.floor(i / getMap().w)];
}
function xyToIdx(x: number, y: number): number {
  return x + y * getMap().w;
}
export function seenXYs(): [number, number][] {
  return Array.from(seenIdxs.values()).map(idxToXY);
}

export function recomputeFOV() {
  const map = getMap();
  seenIdxs.clear();
  FOV.compute(
    getPlayerXY().x,
    getPlayerXY().y,
    getPlayerVision(),
    (fx, fy, r, v) => {
      seenIdxs.add(xyToIdx(fx, fy));
    }
  );
  let dvision = getSoulEffect("death vision");
  if (dvision) {
    forEachMonster(map, (m, x, y) => {
      if (monsterHasStatus(m, "dying")) {
        FOV.compute(x, y, dvision!.power, (fx, fy, r, v) => {
          // this should be a SET
          seenIdxs.add(xyToIdx(fx, fy));
        });
      }
    });
  }
  for (let [x, y] of seenXYs()) {
    map.memory[x + y * map.w] = contentsAt(x, y).memory;
  }
}

export function playerCanSee(x: number, y: number): boolean {
  return seenIdxs.has(xyToIdx(x, y));
}

export function canSeeThreat(): boolean {
  for (let idx of seenIdxs) {
    let [x, y] = idxToXY(idx);
    let c = contentsAt(x, y);
    if (c.monster && !weakMonster(c.monster)) {
      return true;
    }
  }
  return false;
}

export function monstersByDistance(): Array<[number, XYContents]> {
  let monstersByDistance: Array<[number, XYContents]> = [];
  for (let idx of seenIdxs) {
    let [x, y] = idxToXY(idx);
    if (x == getPlayerXY().x && y == getPlayerXY().y) {
      continue;
    }
    let c = contentsAt(x, y);
    if (c.monster) {
      let dist = Math.sqrt(
        Math.pow(Math.abs(getPlayerXY().x - x), 2) +
          Math.pow(Math.abs(getPlayerXY().y - y), 2)
      );
      monstersByDistance.push([dist, c]);
    }
  }
  monstersByDistance.sort(([a, _v], [b, _v2]) => a - b);
  return monstersByDistance;
}

export function findTargets(): Array<XYContents> {
  let targets: Array<XYContents> = [];
  let targetEffect = getWand().targeting;
  let monsters = monstersByDistance();
  switch (targetEffect.targeting) {
    case "seek closest":
      for (let i = 0; i < targetEffect.count && i < monsters.length; i++) {
        targets.push(monsters[i][1]);
      }
      break;
    case "seek strong":
      monsters = monsters.filter(([_, c]) => c.monster!.maxHP > 1);
      for (let i = 0; i < targetEffect.count && i < monsters.length; i++) {
        targets.push(monsters[i][1]);
      }
  }
  return targets;
}

export function doMagicMap(radius: number) {
  let { x, y } = getPlayerXY();
  let fov = new ROT.FOV.PreciseShadowcasting((_x, _y) => true);
  let map = getMap();
  fov.compute(x, y, radius, (cx, cy) => {
    map.memory[cx + cy * map.w] = contentsAt(cx, cy).memory;
  });
}

type MapGenInput = {
  segW: number;
  segH: number;
  danger: number;
};

type MapGenOutput = {
  map: LevelMap;
};

interface MapGenFunc {
  (input: MapGenInput): MapGenOutput;
}

// Reading map contents

export type RememberedCell = readonly [Tile | null, Monster | null];

export type XYContents = {
  x: number;
  y: number;
  tile: Tile | null;
  monster: Monster | null;
  player: boolean;
  blocked: boolean;
  memory: RememberedCell;
  exitDanger: number | null;
  sensedDanger: number | null;
};

export function tileAt(x: number, y: number): Tile | null {
  return getMap().tiles[x + y * getMap().w];
}

export function monsterAt(x: number, y: number): Monster | null {
  return getMap().monsters[x + y * getMap().w];
}

export function playerAt(x: number, y: number): boolean {
  return getPlayerXY().x === x && getPlayerXY().y === y;
}

export function contentsAt(x: number, y: number): XYContents {
  let tile = tileAt(x, y);
  let monster = monsterAt(x, y);
  let player = playerAt(x, y);
  let archetype = monster?.archetype || null;
  let blocked = player;
  let sensedDanger = null;

  if (!tile || tile.blocks) {
    blocked = true;
  }
  if (monster) {
    blocked = true;
    let esp = getSoulEffect("danger sense");
    if (esp) {
      let dist = xyDistance({ x, y }, getPlayerXY());
      if (dist <= esp.power) {
        sensedDanger = MonsterArchetypes[archetype!].essence;
      }
    }
  }
  let exitDanger = null;
  if (tile?.glyph === "exit") {
    let exit = getMap().exits.find(([ex, ey, _]) => ex === x && ey === y);
    exitDanger = exit?.[2] || null;
  }

  return {
    x,
    y,
    tile,
    monster,
    player,
    blocked,
    memory: [tile, monster],
    exitDanger,
    sensedDanger,
  };
}

export function getVictim(): XYContents {
  let { x, y } = getPlayerXY();
  return contentsAt(x, y);
}
