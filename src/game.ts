import { baseMap, LevelMap } from "./map";
import { msg } from "./msg";
import { newPlayer } from "./player";
import type { Soul } from "./souls";
import { offerChoice, startNewGame } from "./ui";

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
