import * as PIXI from "pixi.js";
import { MonsterArchetypes } from "../../data/monsters";
import { GameState } from "../../game";
import { contentsAt, seenXYs } from "../../map";
import { monsterHasStatus, weakMonster } from "../../monster";
import { glyphChar, ColorID, rgb, hex } from "../../token";
import { UIState, Renderer } from "../../ui";

export function initPlayarea(
  ui: UIState,
  playarea: HTMLElement,
  onload: (r: Renderer) => void
) {
  const app = new PIXI.Application();
  playarea.appendChild(app.view);
  const playfield = new PIXI.Container();
  app.stage.addChild(playfield);

  PIXI.Loader.shared.add("spritesheet.json").load(() => {
    onload({
      drawMap: (ui, game) => {
        drawMap(
          app,
          playfield,
          {
            ...ui,
            viewport: {
              width: playarea.clientWidth,
              height: playarea.clientHeight,
            },
          },
          game
        );
      },
    });
  });
}

const glyphAtlas = new Map<string, PIXI.Text>();
const tileMapping = new Map<string, string>([["@", "gourmand.png"]]);
const tileAtlas = new Map<string, PIXI.Sprite>();
function getGlyph(ch: string, fg: string, bg: string): PIXI.Sprite {
  const key = `${ch}-${fg}-${bg}`;
  let mapping = tileMapping.get(ch);
  if (mapping) {
    let tile = tileAtlas.get(key);
    if (!tile) {
      let sheet = PIXI.Loader.shared.resources["spritesheet.json"].spritesheet!;
      tile = new PIXI.Sprite(sheet.textures[mapping]);
    }
    return tile;
  } else {
    let glyph = glyphAtlas.get(key);
    if (!glyph) {
      const style = new PIXI.TextStyle({
        fill: fg,
        fontFamily: "monospace",
        fontSize: "32px",
      });
      glyph = new PIXI.Text(ch, style);
      glyphAtlas.set(key, glyph);
    }
    return glyph;
  }
}

function drawMap(
  app: PIXI.Application,
  playfield: PIXI.Container,
  ui: UIState,
  game: GameState
) {
  playfield.removeChildren();
  let backdropC = new PIXI.Container();
  let foregroundC = new PIXI.Container();
  playfield.addChild(backdropC);
  playfield.addChild(foregroundC);

  let underlay = new PIXI.Graphics();
  let glyphTemplate = getGlyph("@", "#FFF", "#FFF");
  let tileW = glyphTemplate.width;
  let tileH = glyphTemplate.height;

  console.log({ tileW, tileH });
  let vpw = Math.floor(ui.viewport.width / tileW);
  let vph = Math.floor(ui.viewport.height / tileH);

  let sx = game.player.x - Math.floor(vpw / 2);
  let sy = game.player.y - Math.floor(vph / 2);

  if (sx < 0) {
    sx = 0;
  }
  if (sy < 0) {
    sy = 0;
  }

  let targets = ui.state.targets;
  console.log({ sx, sy });
  for (let ix = 0; ix < vpw; ix += 1) {
    for (let iy = 0; iy < vph; iy += 1) {
      let x = sx + ix;
      let y = sy + iy;
      let c = contentsAt(x, y);
      let ch = glyphChar("rock");
      let fg = fgColor("void");
      let bg = bgColor("void");

      if (seenXYs().find(([ex, ey]) => x == ex && y == ey)) {
        let isTarget = !!targets.find((c) => c.x === x && c.y === y);
        bg = isTarget ? bgColor("target") : bgColor("void");

        // TODO: this should not be where we save memory!
        game.map.memory[x + y * game.map.w] = c.memory;
        if (c.player) {
          ch = glyphChar(game.player.glyph);
          fg = fgColor("player");
        } else if (c.monster) {
          let arch = MonsterArchetypes[c.monster.archetype];
          ch = glyphChar(arch.glyph);
          fg = fgColor(arch.color, 0.75);
          bg = bgColor(
            monsterHasStatus(c.monster, "dying")
              ? "dying"
              : isTarget
              ? "target"
              : weakMonster(c.monster)
              ? "weak"
              : "critterBG"
          );
        } else if (c.tile) {
          ch = glyphChar(c.tile.glyph);
          fg = fgColor(c.tile.blocks ? "terrain" : "floor", 1.0);
        }
      } else if (c.sensedDanger && c.monster) {
        let arch = MonsterArchetypes[c.monster.archetype];
        ch = "?";
        fg = "#000";
        bg = fgColor(arch.color);
      } else {
        let mem = game.map.memory[x + y * game.map.w];
        if (mem) {
          let [mtile, mmons] = mem;
          if (mmons) {
            ch = glyphChar(MonsterArchetypes[mmons].glyph);
            fg = "#666";
            bg = "#000";
          } else if (mtile) {
            ch = glyphChar(mtile.glyph);
            fg = "#666";
            bg = "#000";
          }
        }
      }

      if (ch !== glyphChar("rock")) {
        underlay.beginFill(parseInt(bg.substring(1), 16));
        underlay.drawRect(ix * tileW, iy * tileH, tileW, tileH);
        underlay.endFill();
        const text = getGlyph(ch, fg, bg);
        const sprite = new PIXI.Sprite(text.texture);
        sprite.x = ix * tileW + (tileW - text.width) / 2;
        sprite.y = iy * tileH + (tileH - text.height) / 2;
        foregroundC.addChild(sprite);
      }
    }
  }

  backdropC.addChild(underlay);
}

function bgColor(color: ColorID): string {
  return hex(color);
}

function fgColor(color: ColorID, alpha?: number): string {
  if (alpha === undefined) {
    alpha = 1.0;
  }
  return hex(color);
}
