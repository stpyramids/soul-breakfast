import { doClaimSoul, maxEssence } from "./commands";
import { Game } from "./game";
import { newMap } from "./map";
import { MonsterArchetypes, makeSoul } from "./monster";
import { glyphChar } from "./token";
import { offerChoice } from "./ui";

export function wizard() {
  offerChoice(
    "WIZARD MODE",
    new Map([
      ["d", "Dump game state to console"],
      ["e", "Fill essence"],
      ["s", "Get soul"],
      ["w", "Teleport to danger level 50"],
      [">", "Descend 5 levels"],
    ]),
    {
      onChoose: (key) => {
        switch (key) {
          case "w":
            newMap({ danger: 50 });
            return true;
          case "d":
            console.log(Game);
            return true;
          case "e":
            Game.player.essence = maxEssence();
            return true;
          case "s":
            wizardSoul();
            return true;
          case ">":
            newMap({ danger: Game.map.danger + 5 });
            return true;
        }
        return true;
      },
    }
  );
}

function wizardSoul() {
  let byLetter = Object.keys(MonsterArchetypes).reduce((m, name) => {
    let k = glyphChar(MonsterArchetypes[name].glyph);
    let l = m.get(k);
    if (l) {
      l.push(name);
    } else {
      m.set(k, [name]);
    }
    return m;
  }, new Map<string, string[]>());
  let opts = new Map(
    Array.from(byLetter).map(([l, names]) => [
      l,
      names[0] + "... (" + names.length + ")",
    ])
  );
  offerChoice("Claim what soul?", opts, {
    onChoose: (k) => {
      let archs = byLetter.get(k);
      if (archs !== undefined) {
        let opts = new Map(archs.map((v, i) => [(i + 1).toString(), v]));
        offerChoice("Claim what soul?", opts, {
          onChoose: (k) => {
            let i = parseInt(k);
            if (i > 0) {
              let arch = archs![i - 1];
              if (arch) {
                doClaimSoul(makeSoul(MonsterArchetypes[arch]));
              }
            }
            return true;
          },
        });
      }
      return true;
    },
  });
}
