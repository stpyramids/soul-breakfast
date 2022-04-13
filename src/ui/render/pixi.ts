import * as PIXI from "pixi.js";
import { MonsterArchetypes } from "../../data/monsters";
import { GameState } from "../../game";
import { contentsAt, seenXYs, Tile, XYContents } from "../../map";
import {
  Monster,
  monsterHasStatus,
  MonsterStatus,
  MonsterStatusType,
  weakMonster,
} from "../../monster";
import { glyphChar, ColorID, rgb, hex, GlyphID } from "../../token";
import { UIState, Renderer } from "../../ui";
import { MultiColorReplaceFilter } from "@pixi/filter-multi-color-replace";

const app = new PIXI.Application();
let scale = 2.0;
let tileW = 32 * scale;
let doTiles = true;

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
        if (ui.flags.zoom) {
          scale = 1.0;
        } else {
          scale = 2.0;
        }
        tileW = 32 * scale;
        doTiles = !ui.flags.ascii;
        if (!doTiles) {
          scale /= 2.0;
        }

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

type TileSpec = {
  glyph: GlyphID;
  identityC: ColorID;
  highlightC: ColorID;
  fade: boolean;
  status?: MonsterStatusType;
};

function mkTile(pspec: Partial<TileSpec>): TileSpec {
  return {
    glyph: "none",
    identityC: "void",
    highlightC: "void",
    fade: false,
    ...pspec,
  };
}

const glyphAtlas = new Map<string, PIXI.Sprite>();
const tileMapping = new Map<GlyphID, string>([
  ["player", "gourmand.png"],
  ["wall", "masonry.png"],
  ["rock", "rock.png"],
  ["floor", "dirt.png"],
  ["eyeball", "eyebeast.png"],
  ["ghost", "ghost.png"],
  ["do-gooder", "acolyte.png"],
  ["maggots", "maggots.png"],
  ["grub", "grub.png"],
  ["butterfly", "butterfly.png"],
  ["insect", "gnats.png"],
  ["spider", "spider.png"],
  ["rodent", "rat.png"],
]);
const tileAtlas = new Map<string, PIXI.Sprite>();
function getTile(
  specs: TileSpec[],
  tileW: number,
  tileH: number
): PIXI.Container {
  const container = new PIXI.Container();
  if (!doTiles) {
    // Don't layer ASCII
    specs = [specs[specs.length - 1]];
  }
  for (let spec of specs) {
    const tile = getBaseTile(spec);
    const sprite = PIXI.Sprite.from(tile.texture);
    sprite.x = (tileW - tile.width) / 2;
    sprite.y = (tileH - tile.height) / 2;
    container.addChild(sprite);
    if (doTiles && spec.status) {
      let texture =
        PIXI.Loader.shared.resources["spritesheet.json"].spritesheet!.textures[
          "status-" + spec.status + ".png"
        ];
      if (texture) {
        let statusSprite = new PIXI.Sprite(texture);
        statusSprite.setTransform(
          tileW - statusSprite.width * scale - scale,
          scale,
          scale,
          scale
        );
        container.addChild(statusSprite);
      }
    }
  }
  return container;
}
function getBaseTile(spec: TileSpec): PIXI.Sprite {
  return getTileGraphic(spec) || getTileGlyph(spec);
}
function getTileGraphic(spec: TileSpec): PIXI.Sprite | null {
  const key = `${spec.glyph}-${spec.identityC}-${spec.highlightC}-${spec.fade}-${scale}-${doTiles}`;
  const ch = glyphChar(spec.glyph);
  const fg = hex(spec.identityC);
  let mapping = doTiles ? tileMapping.get(spec.glyph) : null;
  if (mapping) {
    let tile = tileAtlas.get(key);
    if (!tile) {
      let comp = new PIXI.Container();

      let sheet = PIXI.Loader.shared.resources["spritesheet.json"].spritesheet!;
      let baseTile = new PIXI.Sprite(sheet.textures[mapping]);
      baseTile.filters = [
        new MultiColorReplaceFilter([
          [0x9badb7, parseInt(fg.substring(1), 16)],
        ]),
      ];
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

      if (spec.fade) {
        let filter = new PIXI.filters.ColorMatrixFilter();
        filter.desaturate();
        filter.brightness(0.7, true);
        comp.filters = [filter];
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
  }
  return null;
}
function getTileGlyph(spec: TileSpec): PIXI.Sprite {
  const key = `${spec.glyph}-${spec.identityC}-${spec.highlightC}-${spec.fade}-${scale}-${doTiles}`;
  const ch = glyphChar(spec.glyph);
  const fg = hex(spec.identityC);
  let glyph = glyphAtlas.get(key);
  if (!glyph) {
    const style = new PIXI.TextStyle({
      fill: fg,
      fontFamily: "'Courier', 'Courier New'",
      fontSize: 28 * scale + "px",
    });
    let baseGlyph = new PIXI.Text(ch, style);
    if (spec.fade) {
      let filter = new PIXI.filters.ColorMatrixFilter();
      filter.desaturate();
      filter.brightness(0.7, true);
      baseGlyph.filters = [filter];
    }
    if (doTiles) {
      baseGlyph.setTransform(
        Math.floor((tileW - baseGlyph.width) / 2),
        Math.floor(tileW - baseGlyph.height)
      );
    }
    let renderTexture = PIXI.RenderTexture.create({
      width: doTiles ? tileW : baseGlyph.width,
      height: doTiles ? tileW : baseGlyph.height,
    });
    app.renderer.render(baseGlyph, { renderTexture });
    glyph = PIXI.Sprite.from(renderTexture);
    glyphAtlas.set(key, glyph);
  }
  return glyph;
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
  let glyphTemplate = getBaseTile(mkTile({ glyph: "wall" }));
  let tileW = glyphTemplate.width;
  let tileH = glyphTemplate.height;

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
  for (let ix = 0; ix < vpw; ix += 1) {
    for (let iy = 0; iy < vph; iy += 1) {
      let x = sx + ix;
      let y = sy + iy;
      let c = contentsAt(x, y);
      let tilespecs: TileSpec[] = [];
      let isTarget = !!targets.find((c) => c.x === x && c.y === y);

      if (seenXYs().find(([ex, ey]) => x == ex && y == ey)) {
        tilespecs = visibleTile(c, isTarget);
      } else if (c.sensedDanger && c.monster) {
        let arch = MonsterArchetypes[c.monster.archetype];
        tilespecs.push(
          mkTile({
            glyph: "unknown",
            highlightC: arch.color,
          })
        );
      } else {
        let mem = game.map.memory[x + y * game.map.w];
        if (mem) {
          let [tile, monster] = mem;
          tilespecs = visibleTile({ tile, monster }, false);
          tilespecs.forEach((t) => (t.fade = true));
        }
      }

      if (tilespecs.length > 0) {
        const bg = hex(tilespecs[tilespecs.length - 1].highlightC);
        underlay.beginFill(parseInt(bg.substring(1), 16));
        underlay.drawRect(ix * tileW, iy * tileH, tileW, tileH);
        underlay.endFill();
        const tile = getTile(tilespecs, tileW, tileH);
        tile.x = ix * tileW;
        tile.y = iy * tileH;
        foregroundC.addChild(tile);
        if (isTarget) {
          const target = new PIXI.Graphics();
          target.lineStyle(scale, 0x3040d0, 1, 0);
          target.drawRoundedRect(0, 0, tileW, tileH, 4 * scale);
          target.x = ix * tileW;
          target.y = iy * tileH;
          foregroundC.addChild(target);
        }
      }
    }
  }

  backdropC.addChild(underlay);
}

function visibleTile(
  c: {
    player?: boolean;
    monster?: Monster | null;
    tile?: Tile | null;
  },
  isTarget: boolean
): TileSpec[] {
  let tiles = [];
  if (c.tile) {
    tiles.push(
      mkTile({
        glyph: c.tile.glyph,
        identityC: c.tile.blocks ? "terrain" : "floor",
      })
    );
  }
  if (c.player) {
    tiles.push(
      mkTile({
        glyph: "player",
        identityC: "player",
      })
    );
  } else if (c.monster) {
    let arch = MonsterArchetypes[c.monster.archetype];
    tiles.push(
      mkTile({
        glyph: arch.glyph,
        identityC: arch.color,
        highlightC: monsterHasStatus(c.monster, "dying")
          ? "dying"
          : isTarget
          ? "target"
          : weakMonster(c.monster)
          ? "weak"
          : "critterBG",
        status: monsterHasStatus(c.monster, "dying")
          ? "dying"
          : monsterHasStatus(c.monster, "slow")
          ? "slow"
          : undefined,
      })
    );
  }
  return tiles;
}
