import { AI } from "./ai";
import { Commands, D } from "./commands";
import { GameState } from "./game";
import { contentsAt, recomputeFOV } from "./map";
import {
  monsterStatusTick,
  DeathMessages,
  monsterHasStatus,
  MonsterArchetypes,
  monsterSpeed,
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
  game.map.monsters.forEach((m, i) => {
    if (m && m.deathCause) {
      const c = contentsAt(i % game.map.w, Math.floor(i / game.map.w));
      msg.combat(DeathMessages[m.deathCause], D(c));
      game.map.monsters[i] = null;
    }
  });

  if (game.player.energy < 1.0) {
    // Don't let UI act when game is 'paused'
    if (!(noop || ui.activeChoice)) {
      game.map.monsters.forEach((m, i) => {
        if (m) {
          const c = contentsAt(i % game.map.w, Math.floor(i / game.map.w));
          monsterStatusTick(m);
          if (m.deathCause) {
            msg.combat(DeathMessages[m.deathCause], D(c));
            game.map.monsters[i] = null;
          } else {
            if (!monsterHasStatus(m, "dying")) {
              const arch = MonsterArchetypes[m.archetype];
              const ai = AI[arch.ai];
              m.energy += monsterSpeed(m);
              while (m.energy >= 1.0) {
                m.energy -= ai(c);
              }
            }
          }
        }
      });
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
