import * as PIXI from "pixi.js";
import { MonsterArchetypes } from "../../data/monsters";
import { GameState } from "../../game";
import { contentsAt, seenXYs } from "../../map";
import { monsterHasStatus, weakMonster } from "../../monster";
import { glyphChar, ColorID, rgb, hex } from "../../token";
import { UIState, Renderer } from "../../ui";
import { MultiColorReplaceFilter } from "@pixi/filter-multi-color-replace";

const app = new PIXI.Application();
const scale = 2.0;
const tileW = 32 * scale;

export function initPlayarea(
  ui: UIState,
  playarea: HTMLElement,
  onload: (r: Renderer) => void
) {
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

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

const glyphAtlas = new Map<string, PIXI.Sprite>();
const tileMapping = new Map<string, string>([
  ["@", "gourmand.png"],
  ["#", "masonry.png"],
  ["█", "rock.png"],
  [".", "dirt.png"],
  ["e", "eyebeast.png"],
  ["g", "ghost.png"],
  ["h", "acolyte.png"],
  ["w", "maggots.png"],
  ["i", "gnats.png"],
  ["s", "spider.png"],
  ["r", "rat.png"],
]);
const tileAtlas = new Map<string, PIXI.Sprite>();
function getGlyph(ch: string, fg: string, bg: string): PIXI.Sprite {
  const key = `${ch}-${fg}-${bg}`;
  let mapping = tileMapping.get(ch);
  if (mapping) {
    let tile = tileAtlas.get(key);
    if (!tile) {
      let comp = new PIXI.Container();

      let sheet = PIXI.Loader.shared.resources["spritesheet.json"].spritesheet!;
      let baseTile = new PIXI.Sprite(sheet.textures[mapping]);
      let filter = new MultiColorReplaceFilter([
        [0x9badb7, parseInt(fg.substring(1), 16)],
      ]);
      baseTile.filters = [filter];
      baseTile.setTransform(
        Math.floor((tileW - baseTile.width * scale) / 2),
        Math.floor(tileW - baseTile.height * scale),
        scale,
        scale
      );
      comp.addChild(baseTile);

      // add a legend for monsters
      if (ch.match(/[a-z]/i)) {
        let lowercase = !!ch.match(/[a-z]/);
        const style = new PIXI.TextStyle({
          fill: fg,
          fontFamily: "'Courier', 'Courier New'",
          fontSize: 12 * scale + "px",
        });
        let glyph = new PIXI.Text(ch, style);
        glyph.setTransform(2 * scale, 2 * scale - (lowercase ? 4 : 0) * scale);
        comp.addChild(glyph);
      }

      let renderTexture = PIXI.RenderTexture.create({
        width: tileW,
        height: tileW,
      });
      app.renderer.render(comp, { renderTexture });
      tile = PIXI.Sprite.from(renderTexture);
      tileAtlas.set(key, tile);
    }
    return tile;
  } else {
    let glyph = glyphAtlas.get(key);
    if (!glyph) {
      const style = new PIXI.TextStyle({
        fill: fg,
        fontFamily: "'Courier', 'Courier New'",
        fontSize: 32 * scale + "px",
      });
      let baseGlyph = new PIXI.Text(ch, style);
      baseGlyph.setTransform(
        Math.floor((tileW - baseGlyph.width) / 2),
        Math.floor(tileW - baseGlyph.height)
      );
      let renderTexture = PIXI.RenderTexture.create({
        width: tileW,
        height: tileW,
      });
      app.renderer.render(baseGlyph, { renderTexture });
      glyph = PIXI.Sprite.from(renderTexture);
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
  let glyphTemplate = getGlyph("#", "#FFF", "#FFF");

  let vpw = Math.floor(ui.viewport.width / tileW);
  let vph = Math.floor(ui.viewport.height / tileW);

  let sx = game.player.x - Math.floor(vpw / 2);
  let sy = game.player.y - Math.floor(vph / 2);

  if (sx < 0) {
    sx = 0;
  }
  if (sy < 0) {
    sy = 0;
  }

  let targets = ui.state.targets;
  for (let ix = 0; ix < vpw; ix += 1) {
    for (let iy = 0; iy < vph; iy += 1) {
      let x = sx + ix;
      let y = sy + iy;
      let c = contentsAt(x, y);
      let ch = glyphChar("none");
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
        fg = "#000000";
        bg = fgColor(arch.color);
      } else {
        let mem = game.map.memory[x + y * game.map.w];
        if (mem) {
          let [mtile, mmons] = mem;
          if (mmons) {
            ch = glyphChar(MonsterArchetypes[mmons].glyph);
            fg = "#666666";
            bg = "#000000";
          } else if (mtile) {
            ch = glyphChar(mtile.glyph);
            fg = "#666666";
            bg = "#000000";
          }
        }
      }

      if (ch !== glyphChar("none")) {
        underlay.beginFill(parseInt(bg.substring(1), 16));
        underlay.drawRect(ix * tileW, iy * tileW, tileW, tileW);
        underlay.endFill();
        const text = getGlyph(ch, fg, bg);
        const sprite = new PIXI.Sprite(text.texture);
        sprite.filters = text.filters;
        sprite.x = ix * tileW + (tileW - text.width) / 2;
        sprite.y = iy * tileW + (tileW - text.height) / 2;
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
