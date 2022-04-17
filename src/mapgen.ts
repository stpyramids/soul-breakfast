import * as ROT from "rot-js";

import { MonsterFormations } from "./data/formations";
import { getMap, setMap, setPlayerXY, maybeWin } from "./game";
import { LevelMap, recomputeFOV, contentsAt, placeMonster, Tile } from "./map";
import { MonsterFormation, spawnMonster } from "./monster";
import { randInt, doRoll } from "./utils";

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

const Tiles: { [name: string]: Tile } = {
  rock: { glyph: "rock", blocks: true },
  wall: { glyph: "wall", blocks: true },
  floor: { glyph: "floor", blocks: false },
  exit: { glyph: "exit", blocks: false },
};

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
          placeMonster(map, spawnMonster(arch), mx, my);
        }
        capacity--;
        appearing--;
      }
    }
    groups--;
  }
}
