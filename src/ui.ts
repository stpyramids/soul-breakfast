import * as ROT from "rot-js";
import { Commands } from "./commands";
import { MonsterArchetypes } from "./data/monsters";
import { Game, resetGame } from "./game";
import {
  contentsAt,
  findTargets,
  getMapDescription,
  getVictim,
  monstersByDistance,
  newMap,
  recomputeFOV,
  seenXYs,
  XYContents,
} from "./map";
import { monsterHasStatus, weakMonster } from "./monster";
import { msg } from "./msg";
import { maxEssence } from "./player";
import { tick } from "./tick";
import { ColorID, glyphChar, rgb, rgba, tokenChar, tokenRGBA } from "./token";
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
    visible: [] as XYContents[],
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

function bgColor(color: ColorID): string {
  return rgb(color);
}

function fgColor(color: ColorID, alpha?: number): string {
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

  let targets = findTargets();

  for (let ix = 0; ix < UI.viewport.width; ix += 1) {
    for (let iy = 0; iy < UI.viewport.height; iy += 1) {
      let x = sx + ix;
      let y = sy + iy;
      let c = contentsAt(x, y);

      if (seenXYs.find(([ex, ey]) => x == ex && y == ey)) {
        let isTarget = !!targets.find((c) => c.x === x && c.y === y);
        let bg = isTarget ? bgColor("target") : bgColor("void");
        Game.map.memory[x + y * Game.map.w] = c.memory;
        if (c.player) {
          display.draw(
            x - sx,
            y - sy,
            glyphChar(Game.player.glyph),
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
            tokenChar(c.tile.token),
            tokenRGBA(c.tile.token, 1.0),
            bg
          );
        } else {
          display.draw(x - sx, y - sy, glyphChar("rock"), "#000", bg);
        }
      } else if (c.sensedDanger && c.monster) {
        let arch = MonsterArchetypes[c.monster.archetype];
        display.draw(ix, iy, "?", "#000", fgColor(arch.color));
      } else {
        let mem = Game.map.memory[x + y * Game.map.w];
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
            display.draw(
              ix,
              iy,
              tokenChar(mtile.token),
              tokenRGBA(mtile.token, 0.5),
              "#000"
            );
          }
        }
      }
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
  let options: any = { ...UI.viewport, fontSize: 18 };
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
  let display = new ROT.Display(options);
  let dispC = display.getContainer()!;
  playarea.appendChild(dispC);

  // Set up UI rendering
  UI.uiCallback = () => {
    UI.state = {
      playerEssence: Game.player.essence,
      playerMaxEssence: maxEssence(),
      targets: findTargets(),
      visible: monstersByDistance().map((n) => n[1]),
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
      recomputeFOV();
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
