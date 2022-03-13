/// Game commands

import { Game } from "./game";
import {
  canSeeThreat,
  contentsAt,
  findTargets,
  newMap,
  XYContents,
} from "./map";
import {
  MonsterArchetypes,
  DeathType,
  DeathMessages,
  getSoul,
  weakMonster,
} from "./monster";
import { msg } from "./msg";
import {
  TargetingEffect,
  ProjectileEffect,
  DamageEffect,
  StatusEffect,
  WandEffects,
  StatBonus,
  EmptySoul,
} from "./souls";
import { offerChoice } from "./ui";
import { doRoll } from "./utils";

export function maxEssence(): number {
  return Game.player.soulSlots.generic.reduce(
    (c, s) => c + s.essence,
    Game.player.maxEssence
  );
}

function gainEssence(amt: number) {
  Game.player.essence += amt;
  if (Game.player.essence > maxEssence()) {
    Game.player.essence = maxEssence();
    msg.essence("Some essence escapes you and dissipates.");
  }
}

function loseEssence(amt: number) {
  Game.player.essence -= amt;
}

export function getWand(): {
  targeting: TargetingEffect;
  projectile: ProjectileEffect;
  damage: DamageEffect;
  status: StatusEffect | null;
  cost: number;
} {
  let targeting = WandEffects.seeker as TargetingEffect;
  let projectile = WandEffects.bolt as ProjectileEffect;
  let damage = WandEffects.weakMana as DamageEffect;
  let status = null as StatusEffect | null;
  let cost = 2;

  for (let soul of Game.player.soulSlots.generic) {
    if (soul.type === "wand") {
      // TODO this logic is bad
      for (let effect of soul.effects) {
        switch (effect.type) {
          case "targeting":
            targeting = effect;
            break;
          case "projectile":
            projectile = effect;
            break;
          case "damage":
            damage = effect;
            break;
          case "status":
            status = effect;
            break;
        }
      }
    }
  }

  return {
    targeting,
    projectile,
    damage,
    status,
    cost,
  };
}

function getStatBonus(stat: StatBonus): number {
  let base = 0;
  for (let soul of Game.player.soulSlots.generic) {
    if (soul.type === "ring") {
      for (let effect of soul.effects) {
        if (effect.type == "stat-bonus" && effect.stat == stat) {
          base += effect.power;
        }
      }
    }
  }
  return base;
}

export function getPlayerVision(): number {
  return 5 + getStatBonus("sight");
}

export function getPlayerSpeed(): number {
  return 1.0 + getStatBonus("speed");
}

export function applySoak(dmg: number): number {
  let soak = 0;
  for (let soul of Game.player.soulSlots.generic) {
    if (soul.type === "ring") {
      for (let effect of soul.effects) {
        if (effect.type == "soak-damage") {
          soak += effect.power;
        }
      }
    }
  }
  return dmg - soak;
}

function tryReleaseSoul(): boolean {
  let slots = Game.player.soulSlots.generic;
  let opts: Map<string, string> = new Map();
  for (let i in slots) {
    if (slots[i].type !== "none") {
      opts.set((parseInt(i) + 1).toString(), slots[i].name);
    }
  }
  if (opts.size === 0) {
    msg.think("I have no souls to release.");
  } else {
    offerChoice("Release which soul?", opts, {
      onChoose: (key) => {
        if (opts.has(key)) {
          let slot = parseInt(key) - 1;
          msg.essence("The %s soul dissipates into aether.", slots[slot].name);
          let gain = slots[slot].essence;
          slots[slot] = EmptySoul;
          gainEssence(gain);
        } else {
          msg.log("Release cancelled.");
        }
      },
    });
  }
  return false;
}

function doMovePlayer(dx: number, dy: number): boolean {
  const p = Game.player;
  const nx = p.x + dx;
  const ny = p.y + dy;
  const c = contentsAt(nx, ny);
  let blocked = c.blocked;
  // The player can phase through weak or dying monsters.
  if (blocked && c.monster && weakMonster(c.monster)) {
    blocked = false;
  }
  if (!blocked) {
    p.x = nx;
    p.y = ny;
    p.energy -= 1.0;
    if (c.monster) {
      if (!Game.player.knownMonsters.get(c.monster.archetype)) {
        msg.essence("You feel the essence of %the awaiting your grasp.", D(c));
        Game.player.knownMonsters.set(c.monster.archetype, true);
        let archetype = MonsterArchetypes[c.monster.archetype];
        if (archetype.soul === "vermin") {
          msg.angry("Petty vermin!");
          msg.tutorial("Use 'd' to devour essence from weak creatures.");
        } else {
          msg.tutorial("Use 'c' to claim a weakened creature's soul.");
        }
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

function movePlayer(dx: number, dy: number) {
  return () => {
    if (!doMovePlayer(dx, dy)) {
      const p = Game.player;
      const nx = p.x + dx;
      const ny = p.y + dy;
      const c = contentsAt(nx, ny);
      if (c.monster) {
        msg.think("The essence of %the resists my passage.", D(c));
        msg.tutorial("Fire spells using SPACE to weaken creatures.");
      } else {
        msg.think("There is no passing this way.");
      }
    }
  };
}

function movePlayerUntil(key: string, dx: number, dy: number) {
  return () => {
    if (canSeeThreat()) {
      msg.think("Danger threatens!");
      return;
    }
    if (doMovePlayer(dx, dy)) {
      Game.commandQueue.push(key);
    }
  };
}

export const Commands: { [key: string]: Function } = {
  // Wait
  ".": () => {
    Game.player.energy -= 1.0;
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
    } else {
      msg.think("Nothing is here to drain of essence.");
    }
  },
  // (c)laim
  c: () => {
    let c = contentsAt(Game.player.x, Game.player.y);
    if (c.monster) {
      let soul = getSoul(c.monster);
      if (soul.type === "none") {
        msg.angry("This vermin has no soul worthy of claiming.");
        msg.tutorial("Vermin can be (d)evoured for essence.");
      } else {
        Game.player.energy -= 1.0;
        if (weakMonster(c.monster)) {
          let slots = Game.player.soulSlots.generic;
          let claimed = false;
          for (let i = 0; i < slots.length; i++) {
            if (slots[i].type === "none") {
              slots[i] = soul;
              msg.essence("You claim the soul of %the.", D(c));
              msg.tutorial(
                "Claiming souls increases your maximum essence and may grant new powers."
              );
              claimed = true;
              break;
            } else if (slots[i].name === soul.name) {
              msg.essence("You already have claimed this soul.");
              claimed = true;
              break;
            }
          }
          if (!claimed) {
            msg.essence("You must release a soul before claiming another.");
            msg.tutorial("Use 'r' to release a soul.");
          } else {
            killMonsterAt(c, "drain");
          }
        } else {
          msg.angry("The wretched creature resists!");
        }
      }
    } else {
      msg.think("No soul is here to claim.");
    }
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
  },
  // release soul
  r: () => {
    tryReleaseSoul();
  },
  // fire spell
  " ": () => {
    let wand = getWand();
    if (wand.cost > Game.player.essence) {
      msg.angry("I must have more essence!");
      return;
    }
    // Do targeting
    let targets = findTargets();
    if (targets.length) {
      for (let target of targets) {
        // TODO: projectiles
        msg.combat("The bolt hits %the!", D(target)); // todo
        damageMonsterAt(target, wand.damage, wand.status);
      }
    } else {
      msg.think("I see none here to destroy.");
      return;
    }
    Game.player.essence -= wand.cost;
    Game.player.energy -= 1.0;
  },
  W: () => {
    if (document.location.hash == "#wizard") {
      offerChoice(
        "WIZARD MODE",
        new Map([
          ["w", "Teleport to danger level 50"],
          ["d", "Dump game state to console"],
        ]),
        {
          onChoose: (key) => {
            switch (key) {
              case "w":
                newMap({ danger: 50 });
                break;
              case "d":
                console.log(Game);
                break;
            }
          },
        }
      );
    }
  },
};

type Describer = {
  toString: () => string;
  the: () => string;
};

export function D(c: XYContents): Describer {
  if (c.monster) {
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
    c.monster.hp = 0;
    msg.combat(DeathMessages[death], D(c));
    Game.map.monsters[c.x + c.y * Game.map.w] = null;
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
    m.hp -= doRoll(damage.damage);
    if (m.hp > 1) {
      // todo cooler messages
      msg.combat("You see %the %s!", D(c), m.hp == 1 ? "stagger" : "shudder");
      if (status) {
        switch (status.status) {
          case "slow":
            msg.combat("%The slows down!", D(c));
            m.energy = -status.power; // todo, but this isn't bad
        }
      }
    } else {
      if (wasDying) {
        killMonsterAt(c, "force"); // todo
      } else {
        msg.combat("You see %the collapse!", D(c));
        msg.tutorial(
          "Enter a dying creature's tile to (d)evour or (c)laim their soul."
        );
        m.dying = true;
      }
    }
  }
}
