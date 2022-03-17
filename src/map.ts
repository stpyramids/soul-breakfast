import * as ROT from "rot-js";
import { getPlayerVision, getWand } from "./commands";
import { Game } from "./game";
import { GlyphID } from "./glyphs";
import {
  MonsterArchetypes,
  ArchetypeID,
  spawnMonster,
  Monster,
  weakMonster,
  MonsterArchetype,
} from "./monster";
import { msg } from "./msg";
import { keysOf, doRoll } from "./utils";

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
    if (DangerDescriptions[i][0] < Game.map.danger) {
      return DangerDescriptions[i][1];
    }
  }
  return DangerDescriptions[0][1];
}

export function moveMonster(from: XYContents, to: XYContents): boolean {
  if (!to.blocked) {
    Game.map.monsters[from.x + from.y * Game.map.w] = null;
    Game.map.monsters[to.x + to.y * Game.map.w] = from.monster;
    return true;
  } else {
    return false;
  }
}

export let seenXYs: Array<[number, number]> = [];
const FOV = new ROT.FOV.PreciseShadowcasting((x, y) => {
  let c = contentsAt(x, y);
  // Nothing but tiles block FOV (for now)
  return !(!c.tile || c.tile.blocks);
});

export function recomputeFOV() {
  seenXYs.length = 0;
  FOV.compute(
    Game.player.x,
    Game.player.y,
    getPlayerVision(),
    (fx, fy, r, v) => {
      seenXYs.push([fx, fy]);
    }
  );
}

export function playerCanSee(x: number, y: number): boolean {
  return !!seenXYs.find(([sx, sy]) => x == sx && y == sy);
}

export function canSeeThreat(): boolean {
  for (let [x, y] of seenXYs) {
    let c = contentsAt(x, y);
    if (c.monster && !weakMonster(c.monster)) {
      return true;
    }
  }
  return false;
}

export function findTargets(): Array<XYContents> {
  let targets: Array<XYContents> = [];
  let targetEffect = getWand().targeting;
  switch (targetEffect.targeting) {
    case "seek closest":
      let monstersByDistance: Array<[number, XYContents]> = [];
      for (let [x, y] of seenXYs) {
        if (x == Game.player.x && y == Game.player.y) {
          continue;
        }
        let c = contentsAt(x, y);
        if (c.monster) {
          let dist = Math.sqrt(
            Math.pow(Math.abs(Game.player.x - x), 2) +
              Math.pow(Math.abs(Game.player.y - y), 2)
          );
          monstersByDistance.push([dist, c]);
        }
      }
      monstersByDistance.sort(([a, _v], [b, _v2]) => a - b);
      for (
        let i = 0;
        i < targetEffect.count && i < monstersByDistance.length;
        i++
      ) {
        targets.push(monstersByDistance[i][1]);
      }
  }
  return targets;
}

// Initialize a new map

export type NewMapOptions = {
  w?: number;
  h?: number;
  danger?: number;
};

export function newMap(opts?: NewMapOptions) {
  // Erase the existing map
  Game.map.tiles = [];
  Game.map.monsters = [];
  Game.map.memory = [];
  Game.map.exits = [];

  // Update map properties
  if (opts) {
    Game.map = {
      ...Game.map,
      ...opts,
    };
  }

  // Fill in an empty map
  Game.map.tiles.fill(Tiles.rock, 0, Game.map.h * Game.map.w);
  Game.map.monsters.fill(null, 0, Game.map.w * Game.map.h);
  Game.map.memory.fill([null, null], 0, Game.map.w * Game.map.h);

  // Dig a new map
  let map = new ROT.Map.Digger(Game.map.w, Game.map.h);
  map.create();

  // Create rooms
  let rooms = map.getRooms();
  for (let room of rooms) {
    room.create((x, y, v) => {
      Game.map.tiles[x + y * Game.map.w] = v === 1 ? Tiles.wall : Tiles.floor;
    });
  }

  // Place the PC in the center of a random room
  rooms = ROT.RNG.shuffle(rooms);
  const startRoom = rooms.shift()!;
  const [px, py] = startRoom.getCenter();
  Game.player.x = px;
  Game.player.y = py;

  // Place monsters and exits in other rooms
  const eligibleMonsters: { [key: ArchetypeID]: number } = {};
  for (let key in MonsterArchetypes) {
    if (MonsterArchetypes[key].danger <= Game.map.danger + 2) {
      eligibleMonsters[key] =
        Game.map.danger -
        Math.abs(Game.map.danger - MonsterArchetypes[key].danger);
    }
  }

  // todo this sucks
  let exits = ROT.RNG.shuffle([
    Game.map.danger > 1 ? Math.floor(Game.map.danger / 2) : 1,
    Game.map.danger,
    Game.map.danger,
    Game.map.danger + 1,
    Game.map.danger + 1,
    Game.map.danger + 1,
    Game.map.danger + 2,
    Game.map.danger + 2,
    Game.map.danger + 2,
    Game.map.danger + 2,
    Game.map.danger + 2,
    Game.map.danger + 2,
    Game.map.danger + 3,
    Game.map.danger + 3,
    Game.map.danger + 3,
    ROT.RNG.getUniformInt(Game.map.danger, Game.map.danger * 2) + 1,
    ROT.RNG.getUniformInt(Game.map.danger, Game.map.danger * 2) + 1,
    ROT.RNG.getUniformInt(Game.map.danger, Game.map.danger * 2) + 1,
  ]);
  for (let room of rooms) {
    // todo This is a bad way to place exits but it should work
    if (exits.length > 0 && ROT.RNG.getUniformInt(1, exits.length / 4) === 1) {
      let exit = exits.shift()!;
      let ex = ROT.RNG.getUniformInt(room.getLeft(), room.getRight());
      let ey = ROT.RNG.getUniformInt(room.getTop(), room.getBottom());
      Game.map.exits.push([ex, ey, exit]);
      Game.map.tiles[ex + ey * Game.map.w] = Tiles.exit;
    }
    const mArch = ROT.RNG.getWeightedValue(eligibleMonsters)!;
    let appearing = doRoll(MonsterArchetypes[mArch].appearing);
    while (appearing > 0) {
      let mx = ROT.RNG.getUniformInt(room.getLeft(), room.getRight());
      let my = ROT.RNG.getUniformInt(room.getTop(), room.getBottom());
      let c = contentsAt(mx, my);
      if (!c.blocked) {
        Game.map.monsters[mx + my * Game.map.w] = spawnMonster(mArch);
      }
      appearing -= 1;
    }
  }

  // Create corridors
  for (let corridor of map.getCorridors()) {
    corridor.create((x, y, v) => {
      Game.map.tiles[x + y * Game.map.w] = Tiles.floor;
    });
  }

  if (Game.map.danger >= Game.maxLevel) {
    msg.tutorial(
      "Congratulations! You have regained enough of your lost power to begin making longer-term plans for world domination."
    );
    msg.break();
    msg.tutorial(
      "You reached danger level %s in %s turns.",
      Game.map.danger,
      Game.turns
    );
    msg.break();
    msg.tutorial("Thanks for playing!");
  }
}

// Reading map contents

export type RememberedCell = readonly [Tile | null, ArchetypeID | null];

export type XYContents = {
  x: number;
  y: number;
  tile: Tile | null;
  monster: Monster | null;
  player: boolean;
  blocked: boolean;
  memory: RememberedCell;
  exitDanger: number | null;
};

export function tileAt(x: number, y: number): Tile | null {
  return Game.map.tiles[x + y * Game.map.w];
}

export function monsterAt(x: number, y: number): Monster | null {
  return Game.map.monsters[x + y * Game.map.w];
}

export function playerAt(x: number, y: number): boolean {
  return Game.player.x === x && Game.player.y === y;
}

export function contentsAt(x: number, y: number): XYContents {
  let tile = tileAt(x, y);
  let monster = monsterAt(x, y);
  let player = playerAt(x, y);
  let archetype = monster?.archetype || null;
  let blocked = player;
  if (!tile || tile.blocks) {
    blocked = true;
  }
  if (monster) {
    blocked = true;
  }
  let exitDanger = null;
  if (tile?.glyph === "exit") {
    let exit = Game.map.exits.find(([ex, ey, _]) => ex === x && ey === y);
    exitDanger = exit?.[2] || null;
  }
  return {
    x,
    y,
    tile,
    monster,
    player,
    blocked,
    memory: [tile, archetype],
    exitDanger,
  };
}

export function getVictim(): XYContents {
  return contentsAt(Game.player.x, Game.player.y);
}
