import * as ROT from "rot-js";
import { MonsterArchetypes } from "../../data/monsters";
import { GameState } from "../../game";
import { contentsAt, seenXYs } from "../../map"; // TODO: shouldn't be necessary
import { monsterHasStatus, weakMonster } from "../../monster"; // TODO: shouldn't be necessary
import { glyphChar, ColorID, rgb } from "../../token";
import { Renderer, UIState } from "../../ui";

export function initPlayarea(
  ui: UIState,
  playarea: HTMLElement,
  onload: (r: Renderer) => void
) {
  let display = new ROT.Display({ ...ui.viewport, fontSize: 16 });
  let dispC = display.getContainer()!;
  playarea.appendChild(dispC);

  onload({
    drawMap: (ui, game) => {
      drawMap(display, ui, game);
    },
  });
}

function drawMap(display: ROT.Display, ui: UIState, game: GameState) {
  display.clear();

  let sx = game.player.x - ui.viewport.width / 2;
  let sy = game.player.y - ui.viewport.height / 2;

  if (sx < 0) {
    sx = 0;
  }
  if (sy < 0) {
    sy = 0;
  }

  let targets = ui.state.targets;

  for (let ix = 0; ix < ui.viewport.width; ix += 1) {
    for (let iy = 0; iy < ui.viewport.height; iy += 1) {
      let x = sx + ix;
      let y = sy + iy;
      let c = contentsAt(x, y);

      if (seenXYs().find(([ex, ey]) => x == ex && y == ey)) {
        let isTarget = !!targets.find((c) => c.x === x && c.y === y);
        let bg = isTarget ? bgColor("target") : bgColor("void");
        // TODO: this should not be where we save memory!
        game.map.memory[x + y * game.map.w] = c.memory;
        if (c.player) {
          display.draw(
            x - sx,
            y - sy,
            glyphChar(game.player.glyph),
            fgColor("player"),
            bg
          );
        } else if (c.monster) {
          let arch = MonsterArchetypes[c.monster.archetype];
          display.draw(
            x - sx,
            y - sy,
            glyphChar(arch.glyph),
            fgColor(arch.color, 0.75),
            bgColor(
              monsterHasStatus(c.monster, "dying")
                ? "dying"
                : isTarget
                ? "target"
                : weakMonster(c.monster)
                ? "weak"
                : "critterBG"
            )
          );
        } else if (c.tile) {
          display.draw(
            x - sx,
            y - sy,
            glyphChar(c.tile.glyph),
            fgColor(c.tile.blocks ? "terrain" : "floor", 1.0),
            bg
          );
        } else {
          display.draw(x - sx, y - sy, glyphChar("rock"), "#000", bg);
        }
      } else if (c.sensedDanger && c.monster) {
        let arch = MonsterArchetypes[c.monster.archetype];
        display.draw(ix, iy, "?", "#000", fgColor(arch.color));
      } else {
        let mem = game.map.memory[x + y * game.map.w];
        if (mem) {
          let [mtile, mmons] = mem;
          if (mmons) {
            display.draw(
              ix,
              iy,
              glyphChar(MonsterArchetypes[mmons].glyph),
              "#666",
              "#000"
            );
          } else if (mtile) {
            display.draw(ix, iy, glyphChar(mtile.glyph), "#666", "#000");
          }
        }
      }
    }
  }
}

function bgColor(color: ColorID): string {
  return rgb(color);
}

function fgColor(color: ColorID, alpha?: number): string {
  if (alpha === undefined) {
    alpha = 1.0;
  }
  return rgb(color);
}
