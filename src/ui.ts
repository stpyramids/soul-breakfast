import * as ROT from "rot-js";

import { Colors } from "./colors";
import { Commands, getPlayerSpeed, maxEssence } from "./commands";
import { Game, resetGame } from "./game";
import { Glyphs } from "./glyphs";
import {
  contentsAt,
  recomputeFOV,
  findTargets,
  seenXYs,
  getVictim,
  newMap,
  getMapDescription,
} from "./map";
import { MonsterArchetypes, AI, weakMonster, getSoul } from "./monster";
import { msg } from "./msg";
import { Soul, EmptySoul, describeSoulEffects } from "./souls";

export const UI = {
  commandQueue: [] as Array<keyof typeof Commands>,
  uiCallback: () => {},
  logCallback: (msg: string, msgType: string | undefined) => {},
};

function tick() {
  if (UI.commandQueue.length == 0) {
    return;
  }

  let noop = false;
  while (Game.player.energy >= 1.0) {
    let nextCommand = UI.commandQueue.shift();
    if (nextCommand) {
      noop = !Commands[nextCommand]();
      if (!noop) {
        Game.turns += 1;
      }
      UI.uiCallback();
    } else {
      break;
    }
  }

  // Don't let UI act when game is 'paused'
  if (!(noop || activeChoice)) {
    for (let i = 0; i < Game.map.w * Game.map.h; i++) {
      if (Game.map.monsters[i]) {
        // This is all pretty stupid
        const c = contentsAt(i % Game.map.w, Math.floor(i / Game.map.w));
        const m = c.monster!;
        if (!m.dying) {
          const arch = MonsterArchetypes[m.archetype];
          const ai = AI[arch.ai];
          m.energy += arch.speed;
          while (m.energy >= 1.0) {
            m.energy -= ai(c);
          }
        }
      }
    }

    if (Game.player.energy < 1.0) {
      Game.player.energy += getPlayerSpeed();
    }
  }

  recomputeFOV();
  UI.uiCallback();

  if (UI.commandQueue.length > 0) {
    tick();
  }
}

/// Input handling

function handleInput() {
  document.addEventListener("keydown", (e) => {
    if (activeChoice) {
      activeChoice.callbacks.onChoose(e.key);
      activeChoice = null;
      UI.uiCallback();
    } else {
      let command = Commands[e.key];
      if (command !== undefined) {
        UI.commandQueue.push(e.key);
        setTimeout(tick, 0);
      }
    }
  });
}

/// Graphics

function drawMap(display: ROT.Display) {
  display.clear();

  let sx = Game.player.x - Game.viewport.width / 2;
  let sy = Game.player.y - Game.viewport.height / 2;

  if (sx < 0) {
    sx = 0;
  }
  if (sy < 0) {
    sy = 0;
  }
  // Draw remembered tiles
  for (let ix = 0; ix < Game.viewport.width; ix += 1) {
    for (let iy = 0; iy < Game.viewport.height; iy += 1) {
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
    let bg = isTarget ? Colors.target : Colors.void;
    Game.map.memory[x + y * Game.map.w] = c.memory;
    if (c.player) {
      display.draw(x - sx, y - sy, Glyphs[Game.player.glyph], "#ccc", bg);
    } else if (c.monster) {
      let arch = MonsterArchetypes[c.monster.archetype];
      display.draw(
        x - sx,
        y - sy,
        Glyphs[arch.glyph],
        Colors[arch.color],
        c.monster.dying
          ? Colors.dying
          : isTarget
          ? Colors.target
          : weakMonster(c.monster)
          ? Colors.weak
          : Colors.critterBG
      );
    } else if (c.tile) {
      display.draw(x - sx, y - sy, Glyphs[c.tile.glyph], "#999", bg);
    } else {
      display.draw(x - sx, y - sy, Glyphs.rock, "#000", bg);
    }
  }
}

let activeChoice: {
  prompt: string;
  opts: Map<string, string>;
  callbacks: { onChoose: (key: string) => void };
} | null = null;

export function offerChoice(
  prompt: string,
  opts: Map<string, string>,
  callbacks: { onChoose: (key: string) => void }
) {
  activeChoice = { prompt, opts, callbacks };
  let choices = "";
  opts.forEach((v, k) => (choices += " (" + k + ") " + v));
  msg.log(prompt + choices);
}

// Initializes the game state and begins rendering to a ROT.js canvas.
export function runGame() {
  // This part of the ROT.js API is not exposed as a type definition.
  (ROT.Util.format as any).map.the = "the";
  // Set up the ROT.js playfield
  let playarea = document.getElementById("playarea")!;
  let messages = document.getElementById("messages")!;
  let display = new ROT.Display(Game.viewport);
  let dispC = display.getContainer()!;
  playarea.appendChild(dispC);
  let logEl = document.createElement("ul");
  logEl.className = "messageLog";
  messages.appendChild(logEl);
  let logMessages: Array<[string, string]> = [];
  UI.uiCallback = () => {
    // Draw the map
    drawMap(display);
    // Update message log
    if (logMessages.length > 0) {
      let logLine = document.createElement("li");
      for (let [msg, msgType] of logMessages) {
        let msgEl = document.createElement("span");
        msgEl.className = "msg-" + msgType;
        msgEl.innerHTML = msg + " ";
        logLine.appendChild(msgEl);
      }
      logEl.prepend(logLine);
      logMessages.length = 0;
    }
    // Update stat view
    document.getElementById("essence")!.innerText =
      Game.player.essence.toString();
    document.getElementById("maxEssence")!.innerText = maxEssence().toString();
    document.getElementById("turns")!.innerText = Game.turns.toString();
    document.getElementById("mapDanger")!.innerText =
      getMapDescription() + " [Danger: " + Game.map.danger + "]";

    // Update soul view
    let soulEl = document.getElementById("souls")!;
    let souls: Array<Soul> = [];
    let c = getVictim();
    if (c.monster) {
      let soul = getSoul(c.monster);
      document.getElementById("hereGlyph")!.innerHTML = Glyphs[soul.glyph];
      document.getElementById("hereWhat")!.innerHTML = soul.name;
      document.getElementById("hereDescription")!.innerHTML =
        describeSoulEffects(soul);
    } else if (c.tile) {
      document.getElementById("hereGlyph")!.innerHTML = Glyphs[c.tile.glyph];
      document.getElementById("hereWhat")!.innerHTML = c.tile.glyph;
      if (c.exitDanger) {
        document.getElementById("hereDescription")!.innerHTML =
          "Danger: " + c.exitDanger;
      } else {
        document.getElementById("hereDescription")!.innerHTML = "";
      }
    }
    soulEl.innerHTML = "";
    for (let soul of Game.player.soulSlots.generic) {
      let el = document.createElement("div");
      el.className = "soul-glyph";
      el.innerHTML = Glyphs[soul.glyph]; // TODO
      soulEl.appendChild(el);
      el = document.createElement("div");
      el.className = "soul-name";
      el.innerHTML = soul.name; // TODO
      soulEl.appendChild(el);
      el = document.createElement("div");
      el.className = "soul-effect";
      el.innerHTML = describeSoulEffects(soul);
      soulEl.appendChild(el);
    }
  };
  UI.logCallback = (msg: string, msgType: string | undefined) => {
    if (!msgType) {
      msgType = "info";
    }
    logMessages.push([msg, msgType]);
  };
  handleInput();
  startNewGame();
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
