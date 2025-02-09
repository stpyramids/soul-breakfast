import { Game, setPlayerXY } from "./game";
import { contentsAt, doMagicMap, monstersByDistance, seenXYs } from "./map";
import { newMap } from "./mapgen";
import { getDamageDescription, monsterHasStatus } from "./monster";
import { msg } from "./msg";
import {
  ActivatedAbility,
  DamageEffect,
  EmptySoul,
  isEmptySoul,
  ProjectileEffect,
  Soul,
  SoulEffect,
  StatBonus,
  StatusEffect,
  TargetingEffect,
  WandEffects,
} from "./souls";
import { GlyphID } from "./token";
import { doRoll, keysOf, R, randInt, sample } from "./utils";

export const newPlayer = {
  x: 10,
  y: 10,
  essence: 0,
  maxEssence: 10,
  speed: 1.0,
  energy: 1.0,
  effects: [] as PlayerEffect[],
  cooldownAbilities: [] as ActivatedAbility[],
  glyph: "player" as GlyphID,
  knownMonsters: {} as { [id: string]: boolean },
  seenTutorials: {} as { [id: string]: boolean },
  soulSlots: {
    generic: [EmptySoul, EmptySoul, EmptySoul] as Array<Soul>,
  },
};

export type Player = typeof newPlayer;

export type PlayerEffectType = "umbra";
export type PlayerEffect = {
  type: PlayerEffectType;
  timer: number;
};

export function maxEssence(): number {
  return Game.player.maxEssence + getStatBonus("max essence");
}

export function gainEssence(amt: number) {
  Game.player.essence += amt;
  if (Game.player.essence > maxEssence()) {
    Game.player.essence = maxEssence();
    msg.essence("Some essence escapes you and dissipates.");
  }
  if (Game.player.essence == maxEssence()) {
    endAbilityCooldowns();
  }
}

export function loseEssence(amt: number) {
  Game.player.essence -= amt;
  if (Game.player.essence < 0) {
    Game.player.essence = 0; // TODO should this cause an effect?
  }
}

export function getPlayerEffect(
  type: PlayerEffectType
): PlayerEffect | undefined {
  return Game.player.effects.find((e) => e.type == type);
}

export function addPlayerEffect(type: PlayerEffectType, duration: number) {
  let s = getPlayerEffect(type);
  if (s) {
    s.timer = duration;
  } else {
    Game.player.effects.push({
      type,
      timer: duration,
    });
  }
}

export function tickPlayerStatus() {
  for (let effect of Game.player.effects) {
    effect.timer--;

    if (effect.timer == 0) {
      // TODO: log a message
    }
  }
  Game.player.effects = Game.player.effects.filter((e) => e.timer > 0);
}

export function endAbilityCooldowns() {
  if (Game.player.cooldownAbilities.length > 0) {
    Game.player.cooldownAbilities = [];
    msg.essence("Your abilities have returned.");
  }
}

export function invokeAbility(ability: ActivatedAbility, power: number) {
  if (Game.player.cooldownAbilities.indexOf(ability) !== -1) {
    msg.angry("I must feed, first!");
    msg.tutorial("Restore your essence to max to regain invoked abilities.");
    return;
  }
  switch (ability) {
    case "shadow cloak":
      addPlayerEffect("umbra", power + randInt(1, 2));
      msg.essence("You draw in your essence and conceal yourself.");
      loseEssence(power * 2);
      break;
    case "clairvoyance":
      doMagicMap(power);
      msg.essence("You peer briefly beyond the mortal veil.");
      loseEssence(power);
      break;
    case "blink":
      if (doBlink()) {
        msg.essence(
          "You tunnel through your essence aura and emerge elsewhere!"
        );
      } else {
        msg.angry("There is nowhere to flee!");
      }
      loseEssence(Math.floor(maxEssence() / 2));
      break;
    case "soul warp":
      if (doSoulWarp()) {
        msg.essence(
          "You tunnel through your essence aura and emerge close to prey!"
        );
        loseEssence(Math.floor(maxEssence() / 2));
      } else {
        msg.angry("No dying souls are nearby!");
      }
  }
  Game.player.cooldownAbilities.push(ability);
}

function doBlink(): boolean {
  let options = seenXYs()
    .map(([x, y]) => contentsAt(x, y))
    .filter((c) => !c.blocked);
  let spot = sample(options);
  if (spot) {
    setPlayerXY(spot.x, spot.y);
    return true;
  } else {
    return false;
  }
}

function doSoulWarp(): boolean {
  let closestCorpse = monstersByDistance().find(([_, m]) =>
    monsterHasStatus(m.monster!, "dying")
  );
  if (closestCorpse) {
    setPlayerXY(closestCorpse[1].x, closestCorpse[1].y);
    return true;
  } else {
    return false;
  }
}

export function getSoulEffect<
  E extends SoulEffect["type"],
  T extends SoulEffect & { type: E }
>(type: E): T | null {
  for (let soul of Game.player.soulSlots.generic) {
    for (let effect of soul.effects) {
      if (effect.type === type) {
        return effect as T;
      }
    }
  }
  return null;
}
export function getSoulEffects<
  E extends SoulEffect["type"],
  T extends SoulEffect & { type: E }
>(type: E): T[] {
  let effects: T[] = [];
  for (let soul of Game.player.soulSlots.generic) {
    for (let effect of soul.effects) {
      if (effect.type === type) {
        effects.push(effect as T);
      }
    }
  }
  return effects;
}

export function getWand(): {
  targeting: TargetingEffect;
  projectile: ProjectileEffect;
  damage: DamageEffect;
  status: StatusEffect | null;
  cost: number;
} {
  let targeting = WandEffects.seek_closest as TargetingEffect;
  let projectile = WandEffects.bolt as ProjectileEffect;
  let damage = WandEffects.weakMana as DamageEffect;
  let status = null as StatusEffect | null;
  let cost = 1;

  for (let soul of Game.player.soulSlots.generic) {
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
    for (let effect of soul.effects) {
      if (effect.type == "stat bonus" && effect.stat == stat) {
        base += effect.power;
      }
    }
  }
  return base;
}

export function getPlayerVision(): number {
  if (getPlayerEffect("umbra")) {
    return 1;
  } else {
    return 5 + getStatBonus("sight");
  }
}

export function getPlayerSpeed(): number {
  return 1.0 + getStatBonus("speed");
}

export function applySoak(dmg: number): number {
  let soak = 0;
  for (let soul of Game.player.soulSlots.generic) {
    for (let effect of soul.effects) {
      if (effect.type == "soak damage") {
        soak += effect.power;
      }
    }
  }
  return dmg - soak;
}

export function doDamage(dmg: number) {
  dmg = applySoak(dmg);
  if (dmg <= 0) {
    msg.combat("You absorb the attack!");
    return;
  }
  msg.combat("%s (%s)%s", getDamageDescription(dmg), dmg, dmg > 8 ? "!" : ".");
  let wasZero = Game.player.essence === 0;
  Game.player.essence -= dmg;
  if (Game.player.essence < 0) {
    let extra = Math.abs(Game.player.essence);
    Game.player.essence = 0;
    let soulChecked = false;
    if (wasZero) {
      for (let slotGroup of keysOf(Game.player.soulSlots)) {
        let slots = Game.player.soulSlots[slotGroup];
        for (let i = 0; i < slots.length; i++) {
          if (!isEmptySoul(slots[i])) {
            soulChecked = true;
            let roll = R(1, slots[i].essence, 1);
            if (doRoll(roll) < extra) {
              msg.angry("No!");
              msg.essence("The %s soul breaks free!", slots[i].name);
              slots[i] = EmptySoul;
              break;
            }
          }
        }
      }
      if (!soulChecked) {
        let blowback = doRoll(R(1, extra, -3));
        if (blowback > 0) {
          msg.angry("I cannot hold together! I must flee!");
          let newDanger = Game.map.danger - randInt(1, blowback);
          if (newDanger < 1) {
            newDanger = 1;
          }
          newMap({
            danger: newDanger,
          });
        }
      }
    } else {
      msg.tutorial(
        "Watch out! Taking damage at zero essence can free souls you have claimed or blow you out of the level."
      );
    }
  }
}
