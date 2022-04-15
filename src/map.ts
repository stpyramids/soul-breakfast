import * as ROT from "rot-js";
import { MonsterFormations } from "./data/formations";
import { MonsterArchetypes } from "./data/monsters";
import { getMap, getPlayerXY, maybeWin, setMap, setPlayerXY } from "./game";
import {
  ArchetypeID,
  Monster,
  MonsterFormation,
  monsterHasStatus,
  spawnMonster,
  weakMonster,
} from "./monster";
import { getPlayerVision, getSoulEffect, getWand } from "./player";
import { GlyphID } from "./token";
import { doRoll, randInt, xyDistance } from "./utils";

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

/// Map tiles

export type Tile = {
  glyph: GlyphID;
  blocks: boolean;
};

export const Tiles: { [name: string]: Tile } = {
  rock: { glyph: "rock", blocks: true },
  wall: { glyph: "wall", blocks: true },
  floor: { glyph: "floor", blocks: false },
  exit: { glyph: "exit", blocks: false },
};

const DangerDescriptions: [number, string][] = [
  [1, "cobwebbed catacomb"],
  [5, "ruined crypt"],
  [10, "murky tomb"],
  [15, "silent mausoleum"],
  [20, "tranquil sepulcher"],
  [25, "teeming necropolis"],
];

export function getMapDescription(): string {
  for (let i = DangerDescriptions.length - 1; i >= 0; i--) {
    if (DangerDescriptions[i][0] < getMap().danger) {
      return DangerDescriptions[i][1];
    }
  }
  return DangerDescriptions[0][1];
}

export function moveMonster(from: XYContents, to: XYContents): boolean {
  if (!to.blocked) {
    const map = getMap();
    map.monsters[from.x + from.y * map.w] = null;
    map.monsters[to.x + to.y * map.w] = from.monster;
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
    map.monsters.forEach((m, i) => {
      if (m && monsterHasStatus(m, "dying")) {
        FOV.compute(
          i % map.w,
          Math.floor(i / map.w),
          dvision!.power,
          (fx, fy, r, v) => {
            // this should be a SET
            seenIdxs.add(xyToIdx(fx, fy));
          }
        );
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

function mapGenSimple(input: MapGenInput): MapGenOutput {
  const w = input.segW * 10;
  const h = input.segH * 10;
  const map: LevelMap = {
    danger: input.danger,
    w,
    h,
    tiles: Array(w * h),
    monsters: Array(w * h),
    memory: Array(w * h),
    exits: [],
  };

  map.tiles.fill(Tiles.rock, 0, map.h * map.w);
  map.monsters.fill(null, 0, map.w * map.h);
  map.memory.fill([null, null], 0, map.w * map.h);

  return { map };
}

// Initialize a new map

export type NewMapOptions = {
  w?: number;
  h?: number;
  danger?: number;
};

export function newMap(opts?: NewMapOptions) {
  const map = mapGenSimple({
    segH: 8,
    segW: 8,
    danger: opts?.danger ? opts.danger : getMap().danger,
  }).map;
  setMap(map);

  // Dig a new map
  let digger = new ROT.Map.Digger(map.w, map.h, { corridorLength: [1, 5] });
  digger.create();

  // Create rooms
  let rooms = digger.getRooms();
  for (let room of rooms) {
    room.create((x, y, v) => {
      map.tiles[x + y * map.w] = v === 1 ? Tiles.wall : Tiles.floor;
    });
  }

  // Place the PC in the center of a random room
  rooms = ROT.RNG.shuffle(rooms);
  const startRoom = rooms.shift()!;
  const [px, py] = startRoom.getCenter();
  if (map.danger === 1) {
    // Leave a mint under the pillow
    placeMonsters(map, startRoom, [MonsterFormations[0]], { [0]: 1 });
  }
  setPlayerXY(px, py);

  // Place monsters and exits in other rooms
  const formations = MonsterFormations.filter(
    (f) => f.danger <= map.danger + 2
  );
  const formDist = formations.reduce((d, form, i) => {
    d[i] = map.danger - Math.abs(map.danger - form.danger) / 2;
    return d;
  }, {} as { [key: number]: number });

  // todo this sucks
  let exits = ROT.RNG.shuffle([
    map.danger > 1 ? Math.floor(map.danger / 2) : 1,
    map.danger,
    map.danger,
    map.danger + 1,
    map.danger + 1,
    map.danger + 1,
    map.danger + 2,
    map.danger + 2,
    map.danger + 2,
    map.danger + 2,
    map.danger + 2,
    map.danger + 2,
    map.danger + 3,
    map.danger + 3,
    map.danger + 3,
    randInt(map.danger, map.danger * 2) + 1,
    randInt(map.danger, map.danger * 2) + 1,
    randInt(map.danger, map.danger * 2) + 1,
  ]);
  for (let room of rooms) {
    if (exits.length > 0) {
      let exit = exits.shift()!;
      let ex = randInt(room.getLeft(), room.getRight());
      let ey = randInt(room.getTop(), room.getBottom());
      map.exits.push([ex, ey, exit]);
      map.tiles[ex + ey * map.w] = Tiles.exit;
    }
    // New monster placement logic. Calculate a capacity for each room and try to fill it.
    placeMonsters(map, room, formations, formDist);
  }

  // Create corridors
  for (let corridor of digger.getCorridors()) {
    corridor.create((x, y, v) => {
      map.tiles[x + y * map.w] = Tiles.floor;
    });
  }

  recomputeFOV();
  maybeWin();
}

interface Room {
  getRight(): number;
  getLeft(): number;
  getBottom(): number;
  getTop(): number;
}

function placeMonsters(
  map: LevelMap,
  room: Room,
  formations: MonsterFormation[],
  formDist: {
    [key: number]: number;
  }
) {
  let capacity = Math.floor(
    0.5 *
      (room.getRight() - room.getLeft()) *
      (room.getBottom() - room.getTop())
  );
  let groups = randInt(0, 3);
  while (capacity > 0 && groups > 0) {
    let form = formations[parseInt(ROT.RNG.getWeightedValue(formDist)!)];
    for (let [arch, roll] of form.appearing) {
      let appearing = doRoll(roll);
      while (appearing > 0) {
        let mx = randInt(room.getLeft(), room.getRight());
        let my = randInt(room.getTop(), room.getBottom());
        let c = contentsAt(mx, my);
        if (!c.blocked) {
          map.monsters[mx + my * map.w] = spawnMonster(arch);
        }
        capacity--;
        appearing--;
      }
    }
    groups--;
  }
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
