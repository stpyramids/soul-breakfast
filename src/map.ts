import * as ROT from "rot-js";
import { MonsterFormations } from "./data/formations";
import { MonsterArchetypes } from "./data/monsters";
import { Game } from "./game";
import { ArchetypeID, Monster, spawnMonster, weakMonster } from "./monster";
import { msg } from "./msg";
import { getPlayerVision, getSoulEffect, getWand } from "./player";
import { GlyphID } from "./token";
import { offerChoice, startNewGame } from "./ui";
import { doRoll } from "./utils";

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
  console.log("recomputing FOV! vision: ", getPlayerVision());
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

export function monstersByDistance(): Array<[number, XYContents]> {
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
  return monstersByDistance;
}

export function findTargets(): Array<XYContents> {
  let targets: Array<XYContents> = [];
  let targetEffect = getWand().targeting;
  switch (targetEffect.targeting) {
    case "seek closest":
      let monsters = monstersByDistance();
      for (let i = 0; i < targetEffect.count && i < monsters.length; i++) {
        targets.push(monsters[i][1]);
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
  if (Game.map.danger < 1) {
    Game.map.danger = 1;
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
  const formations = MonsterFormations.filter(
    (f) => f.danger <= Game.map.danger + 2
  );
  const formDist = formations.reduce((d, form, i) => {
    d[i] = Game.map.danger - Math.abs(Game.map.danger - form.danger) / 2;
    return d;
  }, {} as { [key: number]: number });

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
    // New monster placement logic. Calculate a capacity for each room and try to fill it.
    let capacity = Math.floor(
      0.5 *
        (room.getRight() - room.getLeft()) *
        (room.getBottom() - room.getTop())
    );
    let groups = ROT.RNG.getUniformInt(0, 3);
    while (capacity > 0 && groups > 0) {
      let form = formations[parseInt(ROT.RNG.getWeightedValue(formDist)!)];
      for (let [arch, roll] of form.appearing) {
        let appearing = doRoll(roll);
        while (appearing > 0) {
          let mx = ROT.RNG.getUniformInt(room.getLeft(), room.getRight());
          let my = ROT.RNG.getUniformInt(room.getTop(), room.getBottom());
          let c = contentsAt(mx, my);
          if (!c.blocked) {
            Game.map.monsters[mx + my * Game.map.w] = spawnMonster(arch);
          }
          capacity--;
          appearing--;
        }
      }
      groups--;
    }
  }

  // Create corridors
  for (let corridor of map.getCorridors()) {
    corridor.create((x, y, v) => {
      Game.map.tiles[x + y * Game.map.w] = Tiles.floor;
    });
  }

  recomputeFOV();

  if (Game.map.danger >= Game.maxLevel) {
    msg.break();
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
    offerChoice(
      "Thanks for playing! You have reached the end of the currently implemented content.",
      new Map([
        ["q", "Start a new run"],
        ["c", "Continue playing"],
      ]),
      {
        onChoose: (key) => {
          switch (key) {
            case "q":
              startNewGame();
              return true;
            case "c":
              msg.tutorial(
                "Use Q (shift-q) to restart, or just reload the page."
              );
              return true;
          }
          return false;
        },
      }
    );
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
  sensedDanger: number | null;
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
  let sensedDanger = null;

  if (!tile || tile.blocks) {
    blocked = true;
  }
  if (monster) {
    blocked = true;
    let esp = getSoulEffect("danger sense");
    if (esp) {
      let dx = Math.abs(Game.player.x - x);
      let dy = Math.abs(Game.player.y - y);
      let dist = Math.floor(Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)));
      if (dist <= esp.power) {
        sensedDanger = MonsterArchetypes[archetype!].essence;
      }
    }
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
    sensedDanger,
  };
}

export function getVictim(): XYContents {
  return contentsAt(Game.player.x, Game.player.y);
}
