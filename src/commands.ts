/// Game commands

import { MonsterArchetypes } from "./data/monsters";
import { Game } from "./game";
import {
  canSeeThreat,
  contentsAt,
  findTargets,
  newMap,
  playerCanSee,
  XYContents,
} from "./map";
import {
  DeathType,
  getSoul,
  inflictStatus,
  killMonster,
  weakMonster,
} from "./monster";
import { msg } from "./msg";
import {
  gainEssence,
  getSoulEffect,
  getSoulEffects,
  getWand,
  invokeAbility,
  loseEssence,
} from "./player";
import {
  DamageEffect,
  describeSoulEffect,
  EmptySoul,
  isEmptySoul,
  Soul,
  StatusEffect,
} from "./souls";
import { offerBasicChoice, offerChoice, startNewGame, UI } from "./ui";
import { doRoll } from "./utils";
import { wizard } from "./wizard";

function tryReleaseSoul(prompt?: string, onRelease?: () => void): boolean {
  prompt = prompt ? prompt : "Release which soul?";
  let slots = Game.player.soulSlots.generic;
  let opts: Map<string, string> = new Map();
  for (let i in slots) {
    if (!isEmptySoul(slots[i])) {
      opts.set((parseInt(i) + 1).toString(), slots[i].name);
    }
  }
  if (opts.size === 0) {
    msg.think("I have no souls to release.");
  } else {
    offerChoice(prompt, opts, {
      onChoose: (key) => {
        if (opts.has(key)) {
          let slot = parseInt(key) - 1;
          msg.essence("The %s soul dissipates into aether.", slots[slot].name);
          let gain = slots[slot].essence;
          slots[slot] = EmptySoul;
          gainEssence(gain);
          if (onRelease) {
            onRelease();
          }
        } else {
          msg.log("Release cancelled.");
        }
        return true;
      },
    });
  }
  return false;
}

export function doClaimSoul(soul: Soul): "claimed" | "dupe" | "full" {
  let slots = Game.player.soulSlots.generic;
  for (let i = 0; i < slots.length; i++) {
    if (isEmptySoul(slots[i])) {
      slots[i] = soul;
      // ugly, but...
      if (soul.effects.find((e) => e.type === "ability")) {
        msg.tutorial("You can activate abilities with (a).");
      }
      return "claimed";
    } else if (slots[i].name === soul.name) {
      return "dupe";
    }
  }
  return "full";
}

function tryClaimSoul(c: XYContents): boolean {
  if (c.monster) {
    let soul = getSoul(c.monster);
    if (soul.effects.length === 0) {
      msg.angry("This vermin has no soul worthy of claiming.");
      msg.tutorial("Vermin can be (d)evoured for essence.");
    } else {
      Game.player.energy -= 1.0;
      if (weakMonster(c.monster)) {
        let claimed = doClaimSoul(soul);
        if (claimed === "full") {
          tryReleaseSoul("You must release a soul to claim another.", () => {
            tryClaimSoul(c);
          });
        } else if (claimed === "dupe") {
          msg.essence("You already have claimed this soul.");
        } else if (claimed === "claimed") {
          msg.essence("You claim the soul of %the.", D(c));
          msg.tutorial(
            "Claiming souls increases your maximum essence and may grant new powers."
          );
          killMonsterAt(c, "drain");
          return true;
        }
      } else {
        msg.angry("The wretched creature resists!");
      }
    }
  } else {
    msg.think("No soul is here to claim.");
  }
  return false;
}

function doMovePlayer(dx: number, dy: number): boolean {
  const p = Game.player;
  const nx = p.x + dx;
  const ny = p.y + dy;
  const c = contentsAt(nx, ny);
  let blocked = c.blocked;
  // The player can phase through monsters.
  if (blocked && c.monster) {
    blocked = false;
  }
  if (!blocked) {
    p.x = nx;
    p.y = ny;
    p.energy -= 1.0;
    if (c.monster) {
      if (weakMonster(c.monster)) {
        if (!Game.player.knownMonsters[c.monster.archetype]) {
          msg.essence(
            "You feel the essence of %the awaiting your grasp.",
            D(c)
          );
          Game.player.knownMonsters[c.monster.archetype] = true;
          let archetype = MonsterArchetypes[c.monster.archetype];
          if (archetype.soul === "vermin") {
            msg.angry("Petty vermin!");
            msg.tutorial("Use 'd' to devour essence from weak creatures.");
          } else {
            msg.tutorial("Use 'c' to claim a weakened creature's soul.");
          }
        }
      } else {
        msg.think("The essence of %the resists my grasp.", D(c));
        msg.tutorial("Fire spells using SPACE to weaken creatures.");
      }
    }
    if (c.exitDanger) {
      msg.log(
        "There is a passage to another area here. [Danger: %s]",
        c.exitDanger
      ); // todo: cooler descriptions
      // todo: danger descriptions
      msg.tutorial("Spend essence to pass into newer, more difficult areas.");
    }
    return true;
  } else {
    return false;
  }
}

function movePlayer(dx: number, dy: number): () => boolean {
  return () => {
    if (!doMovePlayer(dx, dy)) {
      const p = Game.player;
      const nx = p.x + dx;
      const ny = p.y + dy;
      const c = contentsAt(nx, ny);
      msg.think("There is no passing this way.");
      return false;
    }
    return true;
  };
}

function movePlayerUntil(key: string, dx: number, dy: number): () => boolean {
  return () => {
    if (canSeeThreat()) {
      msg.think("Danger threatens!");
      return false;
    }
    if (doMovePlayer(dx, dy)) {
      UI.commandQueue.push(key);
      return true;
    } else {
      return false;
    }
  };
}

export const Commands: { [key: string]: () => boolean } = {
  // Wait
  ".": () => {
    Game.player.energy -= 1.0;
    return true;
  },
  // Movement
  h: movePlayer(-1, 0),
  H: movePlayerUntil("H", -1, 0),
  l: movePlayer(1, 0),
  L: movePlayerUntil("L", 1, 0),
  j: movePlayer(0, 1),
  J: movePlayerUntil("J", 0, 1),
  k: movePlayer(0, -1),
  K: movePlayerUntil("K", 0, -1),
  // (d)evour soul
  d: () => {
    let c = contentsAt(Game.player.x, Game.player.y);
    if (c.monster) {
      Game.player.energy -= 0.5;
      if (weakMonster(c.monster)) {
        let soul = getSoul(c.monster);
        msg.essence("You devour the essence of %the.", D(c));
        gainEssence(soul.essence);
        killMonsterAt(c, "drain");
      } else {
        msg.angry("The wretched creature resists!");
      }
      return true;
    } else {
      msg.think("Nothing is here to drain of essence.");
      return false;
    }
  },
  // (c)laim
  c: () => {
    let c = contentsAt(Game.player.x, Game.player.y);
    return tryClaimSoul(c);
  },
  // Pass through exit
  ">": () => {
    let c = contentsAt(Game.player.x, Game.player.y);
    if (c.exitDanger) {
      let exitCost = c.exitDanger;
      if (Game.player.essence >= exitCost) {
        Game.player.energy -= 1.0;
        msg.essence("You pour essence into the passage and force it open.");
        loseEssence(exitCost);
        newMap({ danger: c.exitDanger });
      } else {
        msg.angry("I need more essence to pass!");
        msg.tutorial(
          "Passages to more dangerous areas require spending more essence to enter."
        );
      }
    } else {
      msg.think("There is no passage here.");
    }
    return false;
  },
  // release soul
  r: () => {
    return tryReleaseSoul();
  },
  // fire spell
  " ": () => {
    let wand = getWand();
    if (wand.cost > Game.player.essence) {
      msg.angry("I must have more essence!");
      return false;
    }
    // Do targeting
    let targets = findTargets();
    if (targets.length) {
      for (let target of targets) {
        // TODO: projectiles
        msg.combat("The %s hits %the!", wand.projectile.projectile, D(target)); // todo
        damageMonsterAt(target, wand.damage, wand.status);
      }
    } else {
      msg.think("I see none here to destroy.");
      return false;
    }
    Game.player.essence -= wand.cost;
    Game.player.energy -= 1.0;
    return true;
  },
  a: () => {
    let abilities = getSoulEffects("ability");
    if (abilities.length > 0) {
      let opts = new Map(
        abilities.map((a, i) => [(i + 1).toString(), describeSoulEffect(a)])
      );
      offerChoice("Use which ability?", opts, {
        onChoose: (key) => {
          let i = parseInt(key);
          if (i > 0) {
            let ability = abilities[i - 1];
            if (ability) {
              invokeAbility(ability.ability, ability.power);
              Game.player.energy -= 1.0;
              return true;
            }
          }
          return true;
        },
      });
      return true;
    } else {
      msg.think("I have regained none of these powers.");
      return false;
    }
  },
  // Quit and reset
  Q: () => {
    offerChoice(
      "Die and restart game?",
      new Map([
        ["y", "Yes"],
        ["n", "No"],
      ]),
      {
        onChoose: (key) => {
          if (key == "y") {
            startNewGame();
          }
          return true;
        },
      }
    );
    return false;
  },
  Z: () => {
    UI.flags.zoom = !UI.flags.zoom;
    return false;
  },
  T: () => {
    UI.flags.ascii = !UI.flags.ascii;
    return false;
  },
  "?": () => {
    offerBasicChoice("Help", [
      [
        "c",
        "Controls",
        () => {
          UI.specialMode = "help-commands";
        },
      ],
      [
        "t",
        "Tips",
        () => {
          UI.specialMode = "help-tips";
        },
      ],
    ]);
    return false;
  },
  // Wizard commands
  W: () => {
    if (document.location.hash.includes("wizard")) {
      wizard();
    }
    return false;
  },
};

type Describer = {
  toString: () => string;
  the: () => string;
};

export function D(c: XYContents): Describer {
  if (c.monster && playerCanSee(c.x, c.y)) {
    let monster = c.monster;
    return {
      toString: () => MonsterArchetypes[monster.archetype].name,
      the: () => "the " + MonsterArchetypes[monster.archetype].name,
    };
  } else {
    return {
      toString: () => "something",
      the: () => "something",
    };
  }
}

export function killMonsterAt(c: XYContents, death: DeathType) {
  if (c.monster) {
    killMonster(c.monster, death);
  }
}

export function damageMonsterAt(
  c: XYContents,
  damage: DamageEffect,
  status: StatusEffect | null
) {
  let m = c.monster;
  if (m) {
    let wasDying = weakMonster(m);
    let damageDone = doRoll(damage.damage);
    m.hp -= damageDone;
    if (m.hp > 1) {
      // todo cooler messages
      msg.combat(
        "%The %s (%s)!",
        D(c),
        m.hp == 1 ? "staggers" : "shudders",
        damageDone
      );
      if (status) {
        switch (status.status) {
          case "slow":
            inflictStatus(m, { type: "slow", timer: status.power });
            msg.combat("%The slows down!", D(c));
        }
      }
    } else {
      if (wasDying) {
        killMonsterAt(c, "force"); // todo
      } else {
        msg.combat("%The collapses (%s)!", D(c), damageDone);
        msg.tutorial(
          "Enter a dying creature's tile to (d)evour or (c)laim their soul. Be quick, though!"
        );
        let trap = getSoulEffect("soul trap");
        if (trap) {
          msg.essence("You bind the soul of %the to the mortal realm.", D(c));
        }
        let deathTimer = Math.floor(
          (12 + m.maxHP / 2) * (trap ? trap.power : 1.0)
        );
        m.statuses.push({ type: "dying", timer: deathTimer });
        m.hp = 0;
      }
    }
  }
}
