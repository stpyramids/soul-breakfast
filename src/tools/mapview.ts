import * as ROT from "rot-js";
import { MonsterArchetypes } from "../data/monsters";
import { Game, getMap } from "../game";
import { contentsAt } from "../map";
import { newMap } from "../mapgen";
import { monsterHasStatus, weakMonster } from "../monster";
import { ColorID, glyphChar, rgb, rgba } from "../token";
import { UI } from "../ui";

function bgColor(color: ColorID): string {
  return rgb(color);
}

function fgColor(color: ColorID, alpha?: number): string {
  if (alpha === undefined) {
    alpha = 1.0;
  }
  return rgb(color);
}

function drawMap(display: ROT.Display) {
  display.clear();
  const map = getMap();

  for (let x = 0; x < map.w; x += 1) {
    for (let y = 0; y < map.h; y += 1) {
      let c = contentsAt(x, y);

      let bg = bgColor("void");
      if (c.player) {
        display.draw(x, y, glyphChar(Game.player.glyph), fgColor("player"), bg);
      } else if (c.monster) {
        let arch = MonsterArchetypes[c.monster.archetype];
        display.draw(
          x,
          y,
          glyphChar(arch.glyph),
          fgColor(arch.color, 0.75),
          bgColor(
            monsterHasStatus(c.monster, "dying")
              ? "dying"
              : weakMonster(c.monster)
              ? "weak"
              : "critterBG"
          )
        );
      } else if (c.tile) {
        display.draw(
          x,
          y,
          glyphChar(c.tile.glyph),
          fgColor(c.tile.blocks ? "terrain" : "floor", 1.0),
          bg
        );
      } else {
        display.draw(x, y, glyphChar("rock"), "#000", bg);
      }
    }
  }
}

export function startTool() {
  let logMessages: Array<Array<[string, string]>> = [];

  // This part of the ROT.js API is not exposed as a type definition.
  (ROT.Util.format as any).map.the = "the";

  // Set up the ROT.js playfield
  let playarea = document.body;
  let display = new ROT.Display({ fontSize: 16, width: 100, height: 100 });
  let dispC = display.getContainer()!;
  playarea.appendChild(dispC);
  newMap();
  drawMap(display);
  // Secret experimental tiles mode (very broken)
  /*
    if (UI.doTiles) {
      let tileSet = document.createElement("img");
      tileSet.src = "sprites.png";
      let T: (x: number, y: number) => [number, number] = (x, y) => [
        x * 32,
        y * 32,
      ];
      UI.viewport.width /= 2;
      UI.viewport.height /= 2;
      options = {
        ...UI.viewport,
        tileWidth: 32,
        tileHeight: 32,
        tileSet: tileSet,
        tileColorize: true,
        tileMap: {
          [glyphChar("player")]: T(0, 0),
          [glyphChar("worm")]: T(1, 0),
          [glyphChar("insect")]: T(2, 0),
          [glyphChar("wall")]: T(3, 0),
          [glyphChar("exit")]: T(4, 0),
          [glyphChar("floor")]: T(5, 0),
          [glyphChar("none")]: T(6, 0),
          [glyphChar("rodent")]: T(0, 1),
          [glyphChar("spider")]: T(1, 1),
          [glyphChar("ghost")]: T(2, 1),
          [glyphChar("eyeball")]: T(3, 1),
          [glyphChar("do-gooder")]: T(4, 1),
        },
        layout: "tile",
      };
    }
    */
}
