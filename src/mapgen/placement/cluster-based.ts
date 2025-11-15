import * as ROT from "rot-js";
import { LevelMap, contentsAt, placeMonster } from "../../map";
import { MonsterFormation, spawnMonster } from "../../monster";
import { randInt, doRoll } from "../../utils";
import { TerrainResult, Region } from "../types";

export function placeMonstersByClusters(
  map: LevelMap,
  terrain: TerrainResult,
  formations: MonsterFormation[],
  formDist: { [key: number]: number },
  startRegionIndex: number
) {
  if (terrain.type !== "cellular" || !terrain.openAreas) {
    console.warn("placeMonstersByClusters called with non-cellular terrain");
    return;
  }

  // Strategy: Spread monster clusters across regions
  terrain.openAreas.forEach((region, index) => {
    if (index !== startRegionIndex) {
      const capacity = Math.floor(region.tiles.length * 0.1);  // 10% density
      const clusters = randInt(2, 4);  // 2-4 clusters per region

      placeCluster(map, region, capacity, clusters, formations, formDist);
    }
  });
}

function placeCluster(
  map: LevelMap,
  region: Region,
  capacity: number,
  numClusters: number,
  formations: MonsterFormation[],
  formDist: { [key: number]: number }
) {
  while (capacity > 0 && numClusters > 0) {
    // Pick random center point in region
    const centerTile = region.tiles[randInt(0, region.tiles.length - 1)];
    const [cx, cy] = centerTile;

    // Select formation
    const form = formations[parseInt(ROT.RNG.getWeightedValue(formDist)!)];

    // Place monsters in tight cluster around center
    for (let [arch, roll] of form.appearing) {
      let appearing = doRoll(roll);

      while (appearing > 0 && capacity > 0) {
        // Try to place near center (radius 0-5 tiles for tighter grouping)
        const angle = Math.random() * Math.PI * 2;
        const dist = randInt(0, 5);  // Increased from 3 to 5
        const mx = Math.round(cx + Math.cos(angle) * dist);
        const my = Math.round(cy + Math.sin(angle) * dist);

        const c = contentsAt(mx, my);
        if (!c.blocked) {
          placeMonster(map, spawnMonster(arch), mx, my);
          capacity--;
        }
        appearing--;
      }
    }
    numClusters--;
  }
}
