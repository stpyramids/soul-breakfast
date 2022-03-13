import * as ROT from "rot-js";
import { Glyphs, GlyphID } from "./glyphs";
import { Tile, contentsAt, RememberedCell } from "./map";
import { Monster } from "./monster";
import type { Soul } from "./souls";
import { EmptySoul } from "./souls";
import { Commands } from "./command";

export const Game = {
  turns: 0,
  viewport: {
    width: 30,
    height: 30,
  },
  player: {
    x: 10,
    y: 10,
    essence: 0,
    maxEssence: 10,
    speed: 1.0,
    energy: 1.0,
    glyph: "player" as GlyphID,
    knownMonsters: new Map<string, boolean>(),
    seenTutorials: new Map<string, boolean>(),
    soulSlots: {
      generic: [EmptySoul, EmptySoul, EmptySoul] as Array<Soul>,
    },
  },
  map: {
    danger: 2,
    w: 80,
    h: 80,
    tiles: [] as Array<Tile>,
    monsters: [] as Array<Monster | null>,
    memory: [] as Array<RememberedCell>,
    exits: [] as Array<[number, number, number]>,
    fov: new ROT.FOV.PreciseShadowcasting((x, y) => {
      let c = contentsAt(x, y);
      // Nothing but tiles block FOV (for now)
      return !(!c.tile || c.tile.blocks);
    }),
  },
  commandQueue: [] as Array<keyof typeof Commands>,
  uiCallback: () => {},
  logCallback: (msg: string, msgType: string | undefined) => {},
};
