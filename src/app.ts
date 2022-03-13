import * as ROT from "rot-js";
import { Commands, getPlayerSpeed, D } from "./commands";
import { Game } from "./game";
import { Glyphs, GlyphID } from "./glyphs";
import {
  XYContents,
  contentsAt,
  moveMonster,
  playerCanSee,
  newMap,
  Tile,
  findTargets,
  recomputeFOV,
  seenXYs,
  getVictim,
} from "./map";
import {
  weakMonster,
  getSoul,
  MonsterArchetypes,
  DeathType,
  DeathMessages,
  AI,
  describeSoulEffect,
} from "./monster";
import {
  EmptySoul,
  Soul,
  WandEffect,
  RingEffect,
  TargetingEffect,
  ProjectileEffect,
  DamageEffect,
  StatusEffect,
  WandEffects,
  StatBonus,
} from "./souls";
import { runGame } from "./ui";
import { Roll, asRoll, doRoll, describeRoll, keysOf } from "./utils";

window.onload = runGame;
