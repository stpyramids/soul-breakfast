import * as ROT from "rot-js";

import { Colors, rgb, rgba } from "./colors";
import { Commands, maxEssence } from "./commands";
import { Game, resetGame } from "./game";
import { Glyphs } from "./glyphs";
import {
  contentsAt,
  recomputeFOV,
  findTargets,
  seenXYs,
  newMap,
  getMapDescription,
  getVictim,
  XYContents,
} from "./map";
import { MonsterArchetypes, weakMonster, monsterHasStatus } from "./monster";
import { msg } from "./msg";
import { tick } from "./tick";
import { renderControls } from "./ui/controls";

type Choice = {
  prompt: string;
  opts: Map<string, string>;
  callbacks: { onChoose: (key: string) => boolean };
};

export const UI = {
  commandQueue: [] as Array<keyof typeof Commands>,
  uiCallback: () => {},
  logCallback: (msg: string, msgType: string | undefined) => {},
  activeChoice: null as Choice | null,
  nextChoice: null as Choice | null,
  state: {
    playerEssence: 0,
    playerMaxEssence: 0,
    targets: [] as XYContents[],
    mapDescription: "",
    onGround: null as XYContents | null,
  },
  doTiles: document.location.hash.includes("tiles"),
  viewport: {
    width: 30,
    height: 30,
  },
};

export type UIState = typeof UI;

/// Graphics

function bgColor(color: keyof typeof Colors): string {
  return rgb(color);
}

function fgColor(color: keyof typeof Colors, alpha?: number): string {
  if (alpha === undefined) {
    alpha = 1.0;
  }
  if (UI.doTiles) {
    return rgba(color, alpha);
  } else {
    return rgb(color);
  }
}
function drawMap(display: ROT.Display) {
  display.clear();

  let sx = Game.player.x - UI.viewport.width / 2;
  let sy = Game.player.y - UI.viewport.height / 2;

  if (sx < 0) {
    sx = 0;
  }
  if (sy < 0) {
    sy = 0;
  }
  // Draw remembered tiles
  for (let ix = 0; ix < UI.viewport.width; ix += 1) {
    for (let iy = 0; iy < UI.viewport.height; iy += 1) {
      let mem = Game.map.memory[sx + ix + (sy + iy) * Game.map.w];
      if (mem) {
        let [mtile, mmons] = mem;
        if (mmons) {
          display.draw(
            ix,
            iy,
            Glyphs[MonsterArchetypes[mmons].glyph],
            "#666",
            "#000"
          );
        } else if (mtile) {
          display.draw(ix, iy, Glyphs[mtile.glyph], "#666", "#000");
        }
      }
    }
  }
  // Draw seen tiles
  let targets = findTargets();
  for (let [x, y] of seenXYs) {
    if (x < sx) {
      return;
    }
    if (y < sy) {
      return;
    }
    let c = contentsAt(x, y);
    let isTarget = !!targets.find((c) => c.x === x && c.y === y);
    let bg = isTarget ? bgColor("target") : bgColor("void");
    Game.map.memory[x + y * Game.map.w] = c.memory;
    if (c.player) {
      display.draw(
        x - sx,
        y - sy,
        Glyphs[Game.player.glyph],
        fgColor("player"),
        bg
      );
    } else if (c.monster) {
      let arch = MonsterArchetypes[c.monster.archetype];
      display.draw(
        x - sx,
        y - sy,
        Glyphs[arch.glyph],
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
        Glyphs[c.tile.glyph],
        fgColor(c.tile.blocks ? "terrain" : "floor", 0.75),
        bg
      );
    } else {
      display.draw(x - sx, y - sy, Glyphs.rock, "#000", bg);
    }
  }
}

export function offerChoice(
  prompt: string,
  opts: Map<string, string>,
  callbacks: { onChoose: (key: string) => boolean }
) {
  if (UI.activeChoice) {
    UI.nextChoice = { prompt, opts, callbacks };
  } else {
    UI.activeChoice = { prompt, opts, callbacks };
  }
}

// Initializes the game state and begins rendering to a ROT.js canvas.
export function runGame() {
  let logMessages: Array<Array<[string, string]>> = [];

  // This part of the ROT.js API is not exposed as a type definition.
  (ROT.Util.format as any).map.the = "the";

  // Render the UI for the first time
  renderControls(Game, UI, logMessages);

  // Set up the ROT.js playfield
  let playarea = document.getElementById("playarea")!;
  let options: any = { ...UI.viewport };
  // Secret experimental tiles mode (very broken)
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
        [Glyphs.player]: T(0, 0),
        [Glyphs.worm]: T(1, 0),
        [Glyphs.insect]: T(2, 0),
        [Glyphs.wall]: T(3, 0),
        [Glyphs.exit]: T(4, 0),
        [Glyphs.floor]: T(5, 0),
        [Glyphs.none]: T(6, 0),
        [Glyphs.rodent]: T(0, 1),
        [Glyphs.spider]: T(1, 1),
        [Glyphs.ghost]: T(2, 1),
        [Glyphs.eyeball]: T(3, 1),
        [Glyphs["do-gooder"]]: T(4, 1),
      },
      layout: "tile",
    };
  }
  let display = new ROT.Display(options);
  let dispC = display.getContainer()!;
  playarea.appendChild(dispC);

  // Set up UI rendering
  UI.uiCallback = () => {
    UI.state = {
      playerEssence: Game.player.essence,
      playerMaxEssence: maxEssence(),
      targets: findTargets(),
      mapDescription: getMapDescription(),
      onGround: getVictim(),
    };
    drawMap(display);
    renderControls(Game, UI, logMessages);
  };
  UI.logCallback = (msg: string, msgType: string | undefined) => {
    if (!msgType) {
      msgType = "info";
    }
    if (!logMessages[Game.turns]) {
      logMessages[Game.turns] = [];
    }
    logMessages[Game.turns].push([msg, msgType]);
  };
  handleInput();
  startNewGame();
}

const KeyAliases: { [key: string]: string } = {
  ArrowUp: "k",
  ArrowDown: "j",
  ArrowLeft: "h",
  ArrowRight: "l",
};

function handleInput() {
  document.addEventListener("keydown", (e) => {
    let key = e.key;
    if (key === "Shift") {
      return;
    }
    if (UI.activeChoice) {
      if (UI.activeChoice.callbacks.onChoose(key)) {
        UI.activeChoice = UI.nextChoice;
        UI.nextChoice = null;
      }
      UI.uiCallback();
    } else {
      let alias = KeyAliases[key];
      if (alias) {
        key = alias;
      }
      if (e.shiftKey) {
        key = key.toUpperCase();
      }
      let command = Commands[key];
      if (command !== undefined) {
        UI.commandQueue.push(key);
        setTimeout(() => tick(Game, UI), 0);
      }
    }
  });
}

export function startNewGame() {
  resetGame();
  newMap();
  recomputeFOV();
  msg.think("The world thought me forever sleeping, yet I arise.");
  msg.think(
    "But my essence is still weak. I can barely sustain these remnants of what I once was."
  );
  msg.think("I hunger... I must recover my essence and rebuild my power.");
  msg.break();
  msg.angry("And then they will all pay!");
  msg.break();
  msg.help(
    "Use 'h'/'j'/'k'/'l' to move. You can enter the squares of weak and dying creatures. Go forth and feast!"
  );
  msg.break();
  msg.help("Reach danger level %s to win.", Game.maxLevel);
  UI.uiCallback();
}
