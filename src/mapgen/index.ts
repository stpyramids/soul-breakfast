import * as ROT from "rot-js";
import { MonsterFormations } from "../data/formations";
import { getMap, setMap, setPlayerXY, maybeWin } from "../game";
import { LevelMap, recomputeFOV, placeMonster, Tile } from "../map";
import { spawnMonster } from "../monster";
import { MapAlgorithm, TerrainResult } from "./types";
import { MapAlgorithms, DangerRanges } from "./config";
import { generateExitList, placeExitsInRooms } from "./placement/exit-placement";

type MapGenInput = {
  segW: number;
  segH: number;
  danger: number;
};

type MapGenOutput = {
  map: LevelMap;
};

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

export type NewMapOptions = {
  w?: number;
  h?: number;
  danger?: number;
};

function selectAlgorithm(danger: number): MapAlgorithm {
  // Find the appropriate danger range
  let range = DangerRanges.find(
    (r) => danger >= r.minDanger && danger <= r.maxDanger
  );

  // Fallback to last range for danger > max
  if (!range) {
    range = DangerRanges[DangerRanges.length - 1];
  }

  // Build weights object for ROT.js weighted selection
  const weights = range.algorithms.reduce(
    (acc, aw) => {
      acc[aw.algorithm] = aw.weight;
      return acc;
    },
    {} as { [key: string]: number }
  );

  const selectedName = ROT.RNG.getWeightedValue(weights)!;
  return MapAlgorithms[selectedName];
}

export function newMap(opts?: NewMapOptions) {
  // 1. Initialize base map
  const map = mapGenSimple({
    segH: 8,
    segW: 8,
    danger: opts?.danger ? opts.danger : getMap().danger,
  }).map;
  setMap(map);

  // 2. Select algorithm based on danger level
  const algorithm = selectAlgorithm(map.danger);

  // 3. Generate terrain using selected algorithm
  const terrain = algorithm.generator(map);

  // 4. Place player and mark starting area (to exclude from spawns)
  const { startRegionIndex } = placePlayer(map, terrain);

  // 5. Calculate monster formations and weights
  const formations = MonsterFormations.filter(
    (f) => f.danger <= map.danger + 2
  );
  const formDist = formations.reduce(
    (d, form, i) => {
      d[i] = map.danger - Math.abs(map.danger - form.danger) / 2;
      return d;
    },
    {} as { [key: number]: number }
  );

  // 6. Place exits using algorithm-specific or default strategy
  const exits = generateExitList(map.danger);
  if (algorithm.exitPlacer) {
    algorithm.exitPlacer(map, terrain, exits, startRegionIndex);
  } else {
    // Fallback to default room-based exit placement
    placeExitsInRooms(map, terrain, exits, startRegionIndex);
  }

  // 7. Place monsters using algorithm-specific strategy
  algorithm.monsterPlacer(map, terrain, formations, formDist, startRegionIndex);

  // 8. Finalize
  recomputeFOV();
  maybeWin();
}

function placePlayer(map: LevelMap, terrain: TerrainResult): { startPos: [number, number], startRegionIndex: number } {
  if (terrain.type === "rooms" && terrain.rooms) {
    // Room-based: place in center of a random room
    const shuffledIndices = ROT.RNG.shuffle([...Array(terrain.rooms.length).keys()]);
    const startIndex = shuffledIndices[0];
    const startRoom = terrain.rooms[startIndex];
    const [px, py] = startRoom.getCenter();

    // On danger 1, place a friendly starter monster
    if (map.danger === 1) {
      const starterArch = MonsterFormations[0].appearing[0][0];
      placeMonster(map, spawnMonster(starterArch), px + 1, py);
    }

    setPlayerXY(px, py);
    return { startPos: [px, py], startRegionIndex: startIndex };
  } else if (terrain.type === "open" && terrain.centerPoint) {
    // Open/arena: place at center point
    const [px, py] = terrain.centerPoint;
    setPlayerXY(px, py);
    return { startPos: [px, py], startRegionIndex: -1 };
  } else if (terrain.type === "cellular" && terrain.openAreas) {
    // Cellular/caves: place in largest open area (index 0 after sorting)
    const startZone = terrain.openAreas[0];

    // Find a valid floor tile in the zone (centroid might be a wall)
    let [px, py] = startZone.center;
    const tile = map.tiles[px + py * map.w];

    if (!tile || tile.blocks) {
      // Centroid is blocked, find any open tile in the zone
      const openTile = startZone.tiles.find(([x, y]) => {
        const t = map.tiles[x + y * map.w];
        return t && !t.blocks;
      });

      if (openTile) {
        [px, py] = openTile;
      }
    }

    setPlayerXY(px, py);
    return { startPos: [px, py], startRegionIndex: 0 };
  }

  // Fallback: find any open floor tile
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const tile = map.tiles[x + y * map.w];
      if (tile && !tile.blocks) {
        setPlayerXY(x, y);
        return { startPos: [x, y], startRegionIndex: -1 };
      }
    }
  }

  // Last resort: place at center
  const px = Math.floor(map.w / 2);
  const py = Math.floor(map.h / 2);
  setPlayerXY(px, py);
  return { startPos: [px, py], startRegionIndex: -1 };
}
