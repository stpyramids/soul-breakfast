import * as ROT from "rot-js";
import { LevelMap, Tile } from "../../map";
import { TerrainResult, Room } from "../types";

const Tiles: { [name: string]: Tile } = {
  wall: { glyph: "wall", blocks: true },
  floor: { glyph: "floor", blocks: false },
};

export function generateDigger(map: LevelMap): TerrainResult {
  // Create digger with short corridors
  let digger = new ROT.Map.Digger(map.w, map.h, { corridorLength: [1, 5] });
  digger.create();

  // Create rooms
  let rooms = digger.getRooms();
  for (let room of rooms) {
    room.create((x, y, v) => {
      map.tiles[x + y * map.w] = v === 1 ? Tiles.wall : Tiles.floor;
    });
  }

  // Create corridors
  let corridors = digger.getCorridors();
  for (let corridor of corridors) {
    corridor.create((x, y, v) => {
      map.tiles[x + y * map.w] = Tiles.floor;
    });
  }

  return {
    type: "rooms",
    rooms: rooms as Room[],
    corridors: corridors,
  };
}
