import { AI } from "./ai";
import { Commands, D } from "./commands";
import { MonsterArchetypes } from "./data/monsters";
import { GameState } from "./game";
import {
  contentsAt,
  deleteMonster,
  forEachMonster,
  reapDead,
  recomputeFOV,
} from "./map";
import {
  DeathMessages,
  monsterHasStatus,
  monsterSpeed,
  monsterStatusTick,
} from "./monster";
import { msg } from "./msg";
import { getPlayerSpeed, tickPlayerStatus } from "./player";
import { UIState } from "./ui";

export function tick(game: GameState, ui: UIState) {
  if (ui.commandQueue.length == 0) {
    return;
  }

  let noop = false;
  while (game.player.energy >= 1.0) {
    let nextCommand = ui.commandQueue.shift();
    if (nextCommand) {
      noop = !Commands[nextCommand]();
      ui.uiCallback();
    } else {
      break;
    }
  }

  // Monsters should still die, even if they don't get to act.
  reapDead(game.map);

  if (game.player.energy < 1.0) {
    // Don't let UI act when game is 'paused'
    if (!(noop || ui.activeChoice)) {
      forEachMonster(game.map, (m, x, y) => {
        const c = contentsAt(x, y);
        monsterStatusTick(m);
        if (!m.deathCause && !monsterHasStatus(m, "dying")) {
          const arch = MonsterArchetypes[m.archetype];
          const ai = AI[arch.ai];
          m.energy += monsterSpeed(m);
          while (m.energy >= 1.0) {
            m.energy -= ai(c);
          }
        }
      });
      reapDead(game.map);
      game.turns += 1;
      game.player.energy += getPlayerSpeed();
      tickPlayerStatus();
    }
  }

  recomputeFOV();
  ui.uiCallback();

  if (ui.commandQueue.length > 0) {
    tick(game, ui);
  }
}
