import * as ROT from "rot-js";
import { Game } from "./game";
import { UI } from "./ui";

/// Game transcript
function mkSay(type: string): Function {
  return (fmt: string, ...args: any[]) => {
    UI.logCallback(ROT.Util.format(fmt, ...args), type);
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
    if (!Game.player.seenTutorials[fmt]) {
      msg.help(fmt, ...args);
      Game.player.seenTutorials[fmt] = true;
    }
  },
  break: () => {
    UI.logCallback("", "break");
  },
};
