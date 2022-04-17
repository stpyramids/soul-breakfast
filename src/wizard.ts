import { doClaimSoul } from "./commands";
import { MonsterArchetypes } from "./data/monsters";
import { Game } from "./game";
import { doMagicMap } from "./map";
import { newMap } from "./mapgen";
import { makeSoul } from "./monster";
import { gainEssence, maxEssence } from "./player";
import { glyphChar } from "./token";
import { offerBasicChoice, offerChoice } from "./ui";

export function wizard() {
  offerBasicChoice("WIZARD MODE", [
    [
      "e",
      "Fill essence",
      () => {
        gainEssence(maxEssence());
      },
    ],
    [
      "m",
      "Magic map",
      () => {
        doMagicMap(50);
      },
    ],
    [
      "s",
      "Get soul",
      () => {
        wizardSoul();
      },
    ],
    [
      ">",
      "Descend 5 levels",
      () => {
        newMap({ danger: Game.map.danger + 5 });
      },
    ],
    [
      "<",
      "Ascend 5 levels",
      () => {
        newMap({ danger: Game.map.danger - 5 });
      },
    ],
    [
      "d",
      "Dump game state to console",
      () => {
        console.log(Game);
      },
    ],
  ]);
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
