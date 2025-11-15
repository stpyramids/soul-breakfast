import * as ROT from "rot-js";
import { LevelMap, Tile } from "../../map";
import { randInt } from "../../utils";
import { TerrainResult } from "../types";

const Tiles: { [name: string]: Tile } = {
  exit: { glyph: "exit", blocks: false },
};

export function generateExitList(danger: number): number[] {
  // One "retreat" exit, a couple of safe exits, and a variety of easy or hard exits
  // Progression gets faster as the game goes on
  return ROT.RNG.shuffle([
    danger > 1 ? Math.floor(danger / 2) : 1,
    danger,
    danger + 1,
    danger + 2,
    randInt(danger, danger * 1.25) + 1,
    randInt(danger, danger * 1.25) + 1,
    randInt(danger, danger * 1.25) + 1,
    randInt(danger, danger * 1.25) + 1,
    randInt(danger, danger * 1.5) + 1,
    randInt(danger, danger * 1.5) + 1,
    randInt(danger, danger * 1.5) + 1,
    randInt(danger, danger * 2) + 1,
    randInt(danger, danger * 2) + 1,
    randInt(danger, danger * 2) + 1,
    randInt(danger, danger * 2) + 1,
  ]);
}

export function placeExitsInRooms(
  map: LevelMap,
  terrain: TerrainResult,
  exits: number[],
  startRegionIndex: number
) {
  if (terrain.type !== "rooms" || !terrain.rooms) {
    console.warn("placeExitsInRooms called with non-room terrain");
    return;
  }

  terrain.rooms.forEach((room, index) => {
    if (index !== startRegionIndex && exits.length > 0) {
      let exit = exits.shift()!;
      let ex = randInt(room.getLeft(), room.getRight());
      let ey = randInt(room.getTop(), room.getBottom());
      map.exits.push([ex, ey, exit]);
      map.tiles[ex + ey * map.w] = Tiles.exit;
    }
  });
}

export function placeExitsInOpenAreas(
  map: LevelMap,
  terrain: TerrainResult,
  exits: number[],
  startRegionIndex: number
): void {
  if (terrain.type !== "cellular" || !terrain.openAreas) {
    console.warn("placeExitsInOpenAreas called with non-cellular terrain");
    return;
  }

  // Filter out starting region
  const validRegions = terrain.openAreas.filter((_, index) => index !== startRegionIndex);

  // Strategy: Place exits at periphery of regions
  for (const exit of exits) {
    if (validRegions.length === 0) break;

    // Pick a random region (weighted by size)
    const region = pickWeightedRegion(validRegions);

    // Find tile on the edge (far from center)
    const edgeTile = findEdgeTile(region, map);
    const [ex, ey] = edgeTile;

    map.exits.push([ex, ey, exit]);
    map.tiles[ex + ey * map.w] = Tiles.exit;
  }
}

function pickWeightedRegion(regions: import("../types").Region[]): import("../types").Region {
  const weights = regions.reduce((acc, region, i) => {
    acc[i] = region.tiles.length;
    return acc;
  }, {} as { [key: number]: number });

  const idx = parseInt(ROT.RNG.getWeightedValue(weights)!);
  return regions[idx];
}

function findEdgeTile(region: import("../types").Region, map: LevelMap): [number, number] {
  const [cx, cy] = region.center;

  // Find tile farthest from center (on the edge of the region)
  let farthest = region.tiles[0];
  let maxDist = 0;

  for (const tile of region.tiles) {
    const [x, y] = tile;
    const dist = Math.abs(x - cx) + Math.abs(y - cy);

    // Bonus for being near a wall (truly on edge)
    const nearWall = isNearWall(map, x, y) ? 10 : 0;

    if (dist + nearWall > maxDist) {
      maxDist = dist + nearWall;
      farthest = tile;
    }
  }

  return farthest;
}

function isNearWall(map: LevelMap, x: number, y: number): boolean {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= map.w || ny < 0 || ny >= map.h) continue;

      const tile = map.tiles[nx + ny * map.w];
      if (tile && tile.blocks) return true;
    }
  }
  return false;
}
