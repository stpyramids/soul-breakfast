import * as ROT from "rot-js";
import { Commands } from "./commands";
import { Game, GameState, resetGame } from "./game";
import {
  findTargets,
  getMapDescription,
  getVictim,
  monstersByDistance,
  newMap,
  recomputeFOV,
  XYContents,
} from "./map";
import { msg } from "./msg";
import { maxEssence } from "./player";
import { tick } from "./tick";
import { renderControls } from "./ui/controls";
import * as ROTRender from "./ui/render/rotjs";
import * as PIXIRender from "./ui/render/pixi";

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
  viewport: {
    width: 30,
    height: 30,
  },
};

export type UIState = typeof UI;

export interface Renderer {
  drawMap(ui: UIState, game: GameState): void;
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

// Initializes the game state and begins rendering.
export function runGame() {
  let logMessages: Array<Array<[string, string]>> = [];

  // This part of the ROT.js API is not exposed as a type definition.
  (ROT.Util.format as any).map.the = "the";

  // Render the UI for the first time
  renderControls(Game, UI, logMessages);

  // Set up the playfield
  let playarea = document.getElementById("playarea")!;
  PIXIRender.initPlayarea(UI, playarea, (display) => {
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
      display.drawMap(UI, Game);
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
  });
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
