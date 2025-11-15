import * as ROT from "rot-js";
import { LevelMap, contentsAt, placeMonster } from "../../map";
import { MonsterFormation, spawnMonster } from "../../monster";
import { randInt, doRoll } from "../../utils";
import { TerrainResult, Room } from "../types";

export function placeMonstersByRoom(
  map: LevelMap,
  terrain: TerrainResult,
  formations: MonsterFormation[],
  formDist: { [key: number]: number },
  startRegionIndex: number
) {
  if (terrain.type !== "rooms" || !terrain.rooms) {
    console.warn("placeMonstersByRoom called with non-room terrain");
    return;
  }

  terrain.rooms.forEach((room, index) => {
    if (index !== startRegionIndex) {
      placeMonsterGroup(map, room, formations, formDist);
    }
  });
}

function placeMonsterGroup(
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
