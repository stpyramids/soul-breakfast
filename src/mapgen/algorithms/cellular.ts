import * as ROT from "rot-js";
import { LevelMap, Tile } from "../../map";
import { TerrainResult, Region } from "../types";

const Tiles: { [name: string]: Tile } = {
  wall: { glyph: "wall", blocks: true },
  floor: { glyph: "floor", blocks: false },
};

export function generateCellular(map: LevelMap): TerrainResult {
  // 1. Create cellular automaton (leave 1-tile border as rock)
  const innerW = map.w - 2;
  const innerH = map.h - 2;
  let cellular = new ROT.Map.Cellular(innerW, innerH, {
    born: [4, 5, 6, 7, 8],      // Cells with 4-8 neighbors become walls
    survive: [2, 3, 4, 5],      // Walls with 2-5 neighbors survive
    topology: 4                  // 4-connectivity (no diagonals)
  });

  // 2. Randomize initial state
  cellular.randomize(0.5);  // 50% initial fill

  // 3. Run iterations to smooth out caves
  for (let i = 0; i < 5; i++) {
    cellular.create();
  }

  // 4. Apply to map tiles (offset by 1 to preserve rock border)
  // ROT.Map.Cellular: 0 = floor, 1 = wall
  cellular.create((x, y, value) => {
    const mapX = x + 1;
    const mapY = y + 1;
    map.tiles[mapX + mapY * map.w] = value === 0 ? Tiles.floor : Tiles.wall;
  });

  // 5. Identify separate cave regions
  let openAreas = findOpenRegions(map);

  // 6. Connect only the largest regions (keep some separation for variety)
  // Only connect if we have very isolated small regions
  if (openAreas.length > 1) {
    const largestRegion = openAreas[0];
    // Connect only regions that are significantly smaller than the largest
    const regionsToConnect = openAreas.filter((region, i) =>
      i > 0 && region.tiles.length < largestRegion.tiles.length * 0.3
    );

    for (const region of regionsToConnect) {
      carveTunnel(map, region.center, largestRegion.center);
    }
  }

  // 7. Subdivide large regions into zones for better monster/exit distribution
  openAreas = subdivideRegions(openAreas);

  return {
    type: "cellular",
    openAreas: openAreas,
  };
}

function findOpenRegions(map: LevelMap): Region[] {
  const visited = new Set<number>();
  const regions: Region[] = [];

  // Flood-fill to find connected components
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const idx = x + y * map.w;
      if (visited.has(idx)) continue;

      const tile = map.tiles[idx];
      if (!tile || tile.blocks) continue;

      // Found unvisited floor tile - start new region
      const regionTiles = floodFill(map, x, y, visited);

      if (regionTiles.length > 10) {  // Ignore tiny pockets
        const center = calculateCentroid(regionTiles);
        regions.push({
          tiles: regionTiles,
          center: center,
        });
      }
    }
  }

  // Sort by size (largest first)
  return regions.sort((a, b) => b.tiles.length - a.tiles.length);
}

function floodFill(
  map: LevelMap,
  startX: number,
  startY: number,
  visited: Set<number>
): Array<[number, number]> {
  const tiles: Array<[number, number]> = [];
  const queue: Array<[number, number]> = [[startX, startY]];

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const idx = x + y * map.w;

    if (visited.has(idx)) continue;
    if (x < 0 || x >= map.w || y < 0 || y >= map.h) continue;

    const tile = map.tiles[idx];
    if (!tile || tile.blocks) continue;

    visited.add(idx);
    tiles.push([x, y]);

    // Add neighbors (4-connectivity)
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return tiles;
}

function calculateCentroid(tiles: Array<[number, number]>): [number, number] {
  const sumX = tiles.reduce((sum, [x, _]) => sum + x, 0);
  const sumY = tiles.reduce((sum, [_, y]) => sum + y, 0);
  return [
    Math.floor(sumX / tiles.length),
    Math.floor(sumY / tiles.length),
  ];
}

function connectRegions(map: LevelMap, regions: Region[]): void {
  if (regions.length <= 1) return;

  // Connect each region to the largest region
  for (let i = 1; i < regions.length; i++) {
    const current = regions[i];
    const target = regions[0];  // Always connect to largest region

    // Carve a tunnel between centroids
    carveTunnel(map, current.center, target.center);
  }
}

function carveTunnel(
  map: LevelMap,
  from: [number, number],
  to: [number, number]
): void {
  let [x, y] = from;
  const [tx, ty] = to;

  // Simple L-shaped tunnel
  while (x !== tx) {
    map.tiles[x + y * map.w] = Tiles.floor;
    x += x < tx ? 1 : -1;
  }
  while (y !== ty) {
    map.tiles[x + y * map.w] = Tiles.floor;
    y += y < ty ? 1 : -1;
  }
}

function subdivideRegions(regions: Region[]): Region[] {
  const subdivided: Region[] = [];

  for (const region of regions) {
    // Only subdivide large regions (> 500 tiles)
    if (region.tiles.length <= 500) {
      subdivided.push(region);
      continue;
    }

    // Calculate bounding box
    const minX = Math.min(...region.tiles.map(([x, _]) => x));
    const maxX = Math.max(...region.tiles.map(([x, _]) => x));
    const minY = Math.min(...region.tiles.map(([_, y]) => y));
    const maxY = Math.max(...region.tiles.map(([_, y]) => y));

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    // Determine grid size based on region size
    const targetZoneSize = 400; // Aim for ~400 tiles per zone
    const numZones = Math.ceil(region.tiles.length / targetZoneSize);
    const gridSize = Math.ceil(Math.sqrt(numZones));

    const zoneWidth = Math.ceil(width / gridSize);
    const zoneHeight = Math.ceil(height / gridSize);

    // Create grid zones
    const zones: Map<string, Array<[number, number]>> = new Map();

    for (const [x, y] of region.tiles) {
      const zoneX = Math.floor((x - minX) / zoneWidth);
      const zoneY = Math.floor((y - minY) / zoneHeight);
      const zoneKey = `${zoneX},${zoneY}`;

      if (!zones.has(zoneKey)) {
        zones.set(zoneKey, []);
      }
      zones.get(zoneKey)!.push([x, y]);
    }

    // Convert zones to regions
    for (const zoneTiles of zones.values()) {
      if (zoneTiles.length > 10) {  // Ignore tiny zones
        const center = calculateCentroid(zoneTiles);
        subdivided.push({
          tiles: zoneTiles,
          center: center,
        });
      }
    }
  }

  return subdivided;
}
