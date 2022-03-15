import { GlyphID } from "./glyphs";
import { Tile, RememberedCell } from "./map";
import { Monster } from "./monster";
import type { Soul } from "./souls";
import { EmptySoul } from "./souls";

export let Game = {
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
    knownMonsters: {} as { [id: string]: boolean },
    seenTutorials: {} as { [id: string]: boolean },
    soulSlots: {
      generic: [EmptySoul, EmptySoul, EmptySoul] as Array<Soul>,
    },
  },
  maxLevel: 30,
  map: {
    danger: 1,
    w: 80,
    h: 80,
    tiles: [] as Array<Tile>,
    monsters: [] as Array<Monster | null>,
    memory: [] as Array<RememberedCell>,
    exits: [] as Array<[number, number, number]>,
  },
  monsterSouls: {} as { [id: string]: Soul },
};

export type GameState = typeof Game;

let freshGame = JSON.parse(JSON.stringify(Game)) as GameState;

export function resetGame() {
  Game = freshGame;
}
