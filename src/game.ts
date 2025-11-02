import { baseMap, LevelMap, recomputeFOV } from "./map";
import { msg } from "./msg";
import { newPlayer } from "./player";
import type { Soul } from "./souls";
import { offerChoice, startNewGame } from "./ui";

declare var APP_VERSION: string;

const SAVE_KEY = "soul-breakfast-save";

export let Game = {
  turns: 0,
  player: newPlayer,
  maxLevel: 30,
  map: baseMap,
  monsterSouls: {} as { [id: string]: Soul },
};

export type GameState = typeof Game;

let freshGame = JSON.stringify(Game);

export function resetGame() {
  Game = JSON.parse(freshGame) as GameState;
}

export function saveGame(): void {
  try {
    const saveData = {
      version: APP_VERSION,
      game: {
        turns: Game.turns,
        player: Game.player,
        maxLevel: Game.maxLevel,
        map: Game.map,
        monsterSouls: Game.monsterSouls,
      },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (e) {
    console.error("Failed to save game:", e);
  }
}

export function loadGame(): boolean {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) {
      return false;
    }

    const data = JSON.parse(saved);

    // Basic version check - could add migration logic here
    if (!data.version || !data.game) {
      console.warn("Invalid save data format");
      return false;
    }

    // Restore game state
    Game.turns = data.game.turns;
    Game.player = data.game.player;
    Game.maxLevel = data.game.maxLevel;
    Game.map = data.game.map;
    Game.monsterSouls = data.game.monsterSouls;

    // Rebuild non-serializable state
    recomputeFOV();

    return true;
  } catch (e) {
    console.error("Failed to load game:", e);
    return false;
  }
}

export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.error("Failed to delete save:", e);
  }
}

export function setMap(map: LevelMap) {
  Game.map = map;
}

export function getMap(): LevelMap {
  return Game.map;
}

export function getPlayerXY(): { x: number; y: number } {
  return { x: Game.player.x, y: Game.player.y };
}

export function setPlayerXY(x: number, y: number) {
  Game.player.x = x;
  Game.player.y = y;
}

export function getMonsterSoul(key: string, maker: () => Soul): Soul {
  let soul = Game.monsterSouls[key];
  if (!soul) {
    soul = maker();
    Game.monsterSouls[key] = soul;
  }
  return soul;
}

export function maybeWin() {
  if (Game.map.danger >= Game.maxLevel) {
    msg.break();
    msg.tutorial(
      "Congratulations! You have regained enough of your lost power to begin making longer-term plans for world domination."
    );
    msg.break();
    msg.tutorial(
      "You reached danger level %s in %s turns.",
      Game.map.danger,
      Game.turns
    );
    msg.break();
    msg.tutorial("Thanks for playing!");
    offerChoice(
      "Thanks for playing! You have reached the end of the currently implemented content.",
      new Map([
        ["q", "Start a new run"],
        ["c", "Continue playing"],
      ]),
      {
        onChoose: (key) => {
          switch (key) {
            case "q":
              startNewGame();
              return true;
            case "c":
              msg.tutorial(
                "Use Q (shift-q) to restart, or just reload the page."
              );
              return true;
          }
          return false;
        },
      }
    );
  }
}
