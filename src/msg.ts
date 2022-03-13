import * as ROT from "rot-js";
import { Game } from "./game";

/// Game transcript
function mkSay(type: string): Function {
  return (fmt: string, ...args: any[]) => {
    Game.logCallback(ROT.Util.format(fmt, ...args), type);
  };
}

export const msg = {
  log: mkSay("normal"),
  think: mkSay("thought"),
  angry: mkSay("angry"),
  essence: mkSay("essence"),
  combat: mkSay("combat"),
  help: mkSay("help"),
  tutorial: (fmt: string, ...args: any[]) => {
    if (!Game.player.seenTutorials.get(fmt)) {
      msg.help(fmt, ...args);
      Game.player.seenTutorials.set(fmt, true);
    }
  },
  break: () => {
    Game.logCallback("", "break");
  },
};
