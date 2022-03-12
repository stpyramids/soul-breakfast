import * as ROT from "rot-js";

/// Utility

function keysOf<T>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

/// Random value generation

// represents an NdS+M dice roll with modifier
type Roll = {
  n: number;
  sides: number;
  mod: number;
};

// "Vermin" creatures always spawn with 1 HP, this is a shorthand
const verminHP: Roll = { n: 1, sides: 1, mod: 0 };

function asRoll(n: number, sides: number, mod: number): Roll {
  return { n, sides, mod };
}

function doRoll(roll: Roll): number {
  let n = 0;
  for (let i = 0; i < roll.n; i += 1) {
    n += ROT.RNG.getUniformInt(1, roll.sides);
  }
  let v = n + roll.mod;
  return v;
}

function describeRoll(roll: Roll): string {
  return roll.n + "d" + roll.sides + "+" + roll.mod;
}

/// Soul Aspects

type Status = "slow";

type Targeting = "seeker";
type TargetingEffect = { type: "targeting"; targeting: Targeting };
const isTargeting = (t: WandEffect): t is TargetingEffect =>
  t.type === "targeting";

type Projectile = "bolt";
type ProjectileEffect = { type: "projectile"; projectile: Projectile };
const isProjectile = (t: WandEffect): t is ProjectileEffect =>
  t.type === "projectile";

type DamageEffect = { type: "damage"; damage: Roll };
const isDamage = (t: WandEffect): t is DamageEffect => t.type === "damage";

type StatusEffect = { type: "status"; status: Status; power: number };
const isStatus = (t: WandEffect): t is DamageEffect => t.type === "status";

type WandEffect =
  | TargetingEffect
  | ProjectileEffect
  | DamageEffect
  | StatusEffect;

const WandEffects: { [id: string]: WandEffect } = {
  seeker: { type: "targeting", targeting: "seeker" },
  bolt: { type: "projectile", projectile: "bolt" },
  weakMana: { type: "damage", damage: asRoll(1, 4, 0) },
};

// TODO:
// Eventually I want separate slots for wand, ring, and crown souls.
// This is probably too complicated to implement in the short term.
// Instead, there's just a fixed set of generic slots.
type WandSoul = {
  type: "wand";
  glyph: GlyphID;
  essence: number;
  name: string;
  effects: Array<WandEffect>;
};
type RingSoul = { type: "ring"; glyph: GlyphID; essence: number; name: string };
type CrownSoul = {
  type: "crown";
  glyph: GlyphID;
  essence: number;
  name: string;
};
type GenericSoul = {
  type: "generic";
  glyph: GlyphID;
  essence: number;
  name: string;
};
type NoSoul = { type: "none"; glyph: GlyphID; essence: number; name: string };
type Soul = WandSoul | RingSoul | CrownSoul | GenericSoul | NoSoul;

const EmptySoul: NoSoul = {
  type: "none",
  glyph: "none",
  essence: 0,
  name: "-",
};

/// Character graphics

const Glyphs = {
  none: " ",
  player: "@",
  exit: ">",
  wall: "#",
  floor: ".",
  rock: ".",
  insect: "i",
  worm: "w",
  rodent: "r",
  spider: "s",
  ghost: "g",
};

type GlyphID = keyof typeof Glyphs;

const Colors = {
  void: "#000",
  target: "#139",
  dying: "#411",
  weak: "#211",
  critter: "#111",
};

/// Map tiles

type Tile = {
  glyph: GlyphID;
  blocks: boolean;
};

const Tiles: { [name: string]: Tile } = {
  rock: { glyph: "rock", blocks: true },
  wall: { glyph: "wall", blocks: true },
  floor: { glyph: "floor", blocks: false },
  exit: { glyph: "exit", blocks: false },
};

/// Monster data

const AI: { [id: string]: (c: XYContents) => number } = {
  passive: (c) => {
    return 1.0;
  },
  wander: (c) => {
    let nx = c.x + ROT.RNG.getUniformInt(-1, 1);
    let ny = c.y + ROT.RNG.getUniformInt(-1, 1);
    let spot = contentsAt(nx, ny);
    if (!spot.blocked) {
      Game.map.monsters[c.x + c.y * Game.map.w] = null;
      Game.map.monsters[nx + ny * Game.map.w] = c.monster;
    }
    return 1.0;
  },
  nipper: (c) => {
    let m = c.monster!;
    let arch = MonsterArchetypes[m.archetype];
    let attack = Attacks[arch.attack];

    if (attack.canReachFrom(c)) {
      attack.attackFrom(c);
      return 1.0;
    } else {
      return AI.wander(c);
    }
  },
};

type Attack = {
  canReachFrom: (c: XYContents) => boolean;
  attackFrom: (c: XYContents) => void;
};

function doDamage(dmg: number) {
  msg.combat("Your essence wavers!");
  Game.player.essence -= dmg;
  if (Game.player.essence < 0) {
    let extra = Math.abs(Game.player.essence);
    Game.player.essence = 0;
    for (let slotGroup of keysOf(Game.player.soulSlots)) {
      let slots = Game.player.soulSlots[slotGroup];
      for (let i = 0; i < slots.length; i++) {
        if (slots[i].type !== "none") {
          let roll = asRoll(1, slots[i].essence, 1);
          if (doRoll(roll) < extra) {
            msg.angry("No!");
            msg.essence("The %s soul breaks free!", slots[i].name);
            slots[i] = EmptySoul;
            break;
          }
        }
      }
    }
    msg.tutorial(
      "Watch out! Taking damage at zero essence can free souls you have claimed."
    );
  }
}

function meleeAttack(verb: string, damage: Roll): Attack {
  return {
    canReachFrom: (c) =>
      (Game.player.x === c.x ||
        Game.player.x === c.x - 1 ||
        Game.player.x === c.x + 1) &&
      (Game.player.y === c.y ||
        Game.player.y === c.y - 1 ||
        Game.player.y === c.y + 1),
    attackFrom: (c) => {
      msg.combat("%The %s you!", D(c), verb);
      let m = c.monster;
      let danger = m ? MonsterArchetypes[m.archetype].danger : 1;
      // TODO combat parameters
      if (doRoll(asRoll(1, 100, 0)) > 100 - danger * 2) {
        // damage dice scale up with danger
        let dmgRoll = { ...damage, n: (danger - 1) * damage.n };
        let dmg = doRoll(dmgRoll);
        doDamage(dmg);
      }
    },
  };
}

const Attacks: { [id: string]: Attack } = {
  none: {
    canReachFrom: (c) => false,
    attackFrom: (c) => {},
  },
  bite: meleeAttack("snaps at", asRoll(1, 4, 0)),
  touch: meleeAttack("reaches into", asRoll(1, 4, 2)),
};

type MonsterArchetype = {
  name: string;
  danger: number;
  glyph: GlyphID;
  appearing: Roll;
  hp: Roll;
  speed: number;
  ai: keyof typeof AI;
  attack: keyof typeof Attacks;
  soul: keyof typeof SoulFactories;
};

type SoulFactory = (arch: MonsterArchetype) => Soul;

const SoulFactories: { [id: string]: SoulFactory } = {
  vermin: (a) => ({
    glyph: a.glyph,
    type: "none",
    essence: a.danger,
    name: a.name,
  }),
  bulk: (a) => ({
    glyph: a.glyph,
    type: "generic",
    essence: a.danger,
    name: a.name,
  }),
  extraDamage: (a) => ({
    glyph: a.glyph,
    type: "wand",
    essence: a.danger,
    name: a.name,
    effects: [{ type: "damage", damage: asRoll(a.danger - 1, 4, 1) }],
  }),
  slow: (a) => ({
    glyph: a.glyph,
    type: "wand",
    essence: a.danger,
    name: a.name,
    effects: [{ type: "status", status: "slow", power: a.danger }],
  }),
};

function describeWandEffect(e: WandEffect): string {
  switch (e.type) {
    case "damage":
      return "damage " + describeRoll(e.damage);
    case "status":
      return e.status + " " + e.power;
    case "projectile":
      return e.projectile;
    case "targeting":
      return e.targeting;
  }
}

function describeSoulEffect(s: Soul): string {
  switch (s.type) {
    case "none":
      if (s.essence === 0) {
        return " ";
      } else {
        return "+" + s.essence + " essence";
      }
    case "generic":
      return "+" + s.essence + " max essence";
    case "wand":
      return describeWandEffect(s.effects[0]);
    default:
      return "???";
  }
}

const MonsterArchetypes = {
  maggot: <MonsterArchetype>{
    name: "maggot heap",
    danger: 1,
    glyph: "worm",
    appearing: asRoll(1, 4, 3),
    hp: verminHP,
    speed: 0.2,
    ai: "passive",
    attack: "none",
    soul: "vermin",
  },
  gnatSwarm: <MonsterArchetype>{
    name: "gnat swarm",
    danger: 1,
    glyph: "insect",
    appearing: asRoll(2, 4, 0),
    hp: verminHP,
    speed: 0.25,
    ai: "wander",
    attack: "none",
    soul: "vermin",
  },
  giantRat: <MonsterArchetype>{
    name: "dusty rat",
    danger: 2,
    glyph: "rodent",
    appearing: asRoll(1, 2, 1),
    hp: asRoll(1, 4, 1),
    speed: 0.5,
    ai: "nipper",
    attack: "bite",
    soul: "bulk",
  },
  cryptSpider: <MonsterArchetype>{
    name: "crypt spider",
    danger: 3,
    glyph: "spider",
    appearing: asRoll(1, 2, 0),
    hp: asRoll(1, 2, 1),
    speed: 1.0,
    ai: "nipper",
    attack: "bite",
    soul: "extraDamage",
  },
  littleGhost: <MonsterArchetype>{
    name: "little ghost",
    danger: 4,
    glyph: "ghost",
    appearing: asRoll(1, 1, 0),
    hp: asRoll(2, 4, 0),
    speed: 0.25,
    ai: "nipper",
    attack: "touch",
    soul: "slow",
  },
};

type ArchetypeID = keyof typeof MonsterArchetypes;

type Monster = {
  archetype: ArchetypeID;
  hp: number;
  energy: number;
  dying: boolean;
};

function spawnMonster(archetype: ArchetypeID): Monster {
  return {
    archetype,
    hp: doRoll(MonsterArchetypes[archetype].hp),
    energy: 1.0,
    dying: false,
  };
}

function weakMonster(m: Monster): boolean {
  return m.hp <= 1 || m.dying;
}

function getSoul(m: Monster): Soul {
  let arch = MonsterArchetypes[m.archetype];
  return SoulFactories[arch.soul](arch);
}

type RememberedCell = readonly [Tile | null, ArchetypeID | null];

const DeathMessages: { [type: string]: string } = {
  drain: "%The crumbles into dust.",
  force: "%The is blown to pieces.",
};

type DeathType = keyof typeof DeathMessages;

/// Game commands

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

function getWand(): {
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

function findTargets(): Array<XYContents> {
  let targets: Array<XYContents> = [];
  switch (getWand().targeting.targeting) {
    case "seeker":
      let closestDistance = 9999;
      let seekerTarget: XYContents | null = null;
      Game.map.fov.compute(
        Game.player.x,
        Game.player.y,
        Game.viewport.width / 2,
        (x, y, r, v) => {
          let c = contentsAt(x, y);
          if (c.monster) {
            let dist = Math.sqrt(
              Math.pow(Math.abs(Game.player.x - x), 2) +
                Math.pow(Math.abs(Game.player.y - y), 2)
            );
            if (dist < closestDistance) {
              closestDistance = dist;
              seekerTarget = c;
            }
          }
        }
      );
      if (seekerTarget) {
        targets.push(seekerTarget);
      }
  }
  return targets;
}

const Commands: { [key: string]: Function } = {
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
          for (let i = 0; i < slots.length; i++) {
            if (slots[i].type === "none") {
              slots[i] = soul;
              msg.essence("You claim the soul of %the.", D(c));
              msg.tutorial(
                "Claiming souls increases your maximum essence and may grant new powers."
              );
              break;
            } else if (slots[i].name === soul.name) {
              msg.essence("You already have claimed this soul.");
              break;
            }
          }
          // todo: discard existing souls to progress
          gainEssence(soul.essence);
          killMonsterAt(c, "drain");
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
};

/// Game state

const Game = {
  viewport: {
    width: 30,
    height: 30,
  },
  player: {
    x: 10,
    y: 10,
    essence: 0,
    maxEssence: 10,
    speed: 1.0,
    energy: 1.0,
    glyph: "player" as GlyphID,
    knownMonsters: {} as { [P in keyof typeof MonsterArchetypes]: boolean },
    seenTutorials: {} as { [msg: string]: boolean },
    soulSlots: {
      generic: [EmptySoul, EmptySoul, EmptySoul] as Array<Soul>,
    },
  },
  map: {
    danger: 2,
    w: 80,
    h: 80,
    tiles: [] as Array<Tile>,
    monsters: [] as Array<Monster | null>,
    memory: [] as Array<RememberedCell>,
    exits: [] as Array<[number, number, number]>,
    fov: new ROT.FOV.PreciseShadowcasting((x, y) => {
      let c = contentsAt(x, y);
      // Nothing but tiles block FOV (for now)
      return !(!c.tile || c.tile.blocks);
    }),
  },
  commandQueue: [] as Array<keyof typeof Commands>,
  uiCallback: () => {},
  logCallback: (msg: string, msgType: string | undefined) => {},
};

// Initialize a new map

type NewMapOptions = {
  w?: number;
  h?: number;
  danger?: number;
};

function newMap(opts?: NewMapOptions) {
  // Erase the existing map
  Game.map.tiles = [];
  Game.map.monsters = [];
  Game.map.memory = [];
  Game.map.exits = [];

  // Update map properties
  if (opts) {
    Game.map = {
      ...Game.map,
      ...opts,
    };
  }

  // Fill in an empty map
  Game.map.tiles.fill(Tiles.rock, 0, Game.map.h * Game.map.w);
  Game.map.monsters.fill(null, 0, Game.map.w * Game.map.h);
  Game.map.memory.fill([null, null], 0, Game.map.w * Game.map.h);

  // Dig a new map
  let map = new ROT.Map.Digger(Game.map.w, Game.map.h);
  map.create();

  // Create rooms
  let rooms = map.getRooms();
  for (let room of rooms) {
    room.create((x, y, v) => {
      Game.map.tiles[x + y * Game.map.w] = v === 1 ? Tiles.wall : Tiles.floor;
    });
  }

  // Place the PC in the center of a random room
  rooms = ROT.RNG.shuffle(rooms);
  const startRoom = rooms.shift()!;
  const [px, py] = startRoom.getCenter();
  Game.player.x = px;
  Game.player.y = py;

  // Place monsters and exits in other rooms
  const eligibleMonsters = keysOf(MonsterArchetypes).filter(
    (id) => MonsterArchetypes[id].danger <= Game.map.danger
  );
  // todo this sucks
  let exits = ROT.RNG.shuffle([
    Math.floor(Game.map.danger / 2),
    Game.map.danger,
    Game.map.danger,
    Game.map.danger + 1,
    Game.map.danger + 1,
    Game.map.danger + 1,
    Game.map.danger + 1,
    Game.map.danger + 1,
    Game.map.danger + 1,
    Game.map.danger + 2,
    Game.map.danger + 2,
    Game.map.danger + 2,
    Game.map.danger + 3,
    Game.map.danger * 2 + 1,
  ]);
  for (let room of rooms) {
    // todo This is a bad way to place exits but it should work
    if (exits.length > 0 && ROT.RNG.getUniformInt(1, exits.length / 4) === 1) {
      let exit = exits.shift()!;
      let ex = ROT.RNG.getUniformInt(room.getLeft(), room.getRight());
      let ey = ROT.RNG.getUniformInt(room.getTop(), room.getBottom());
      Game.map.exits.push([ex, ey, exit]);
      Game.map.tiles[ex + ey * Game.map.w] = Tiles.exit;
    }
    const mArch = ROT.RNG.getItem(eligibleMonsters)!;
    let appearing = doRoll(MonsterArchetypes[mArch].appearing);
    while (appearing > 0) {
      let mx = ROT.RNG.getUniformInt(room.getLeft(), room.getRight());
      let my = ROT.RNG.getUniformInt(room.getTop(), room.getBottom());
      let c = contentsAt(mx, my);
      if (!c.blocked) {
        Game.map.monsters[mx + my * Game.map.w] = spawnMonster(mArch);
      }
      appearing -= 1;
    }
  }

  // Create corridors
  for (let corridor of map.getCorridors()) {
    corridor.create((x, y, v) => {
      Game.map.tiles[x + y * Game.map.w] = Tiles.floor;
    });
  }
}

// Reading map contents

type XYContents = {
  x: number;
  y: number;
  tile: Tile | null;
  monster: Monster | null;
  player: boolean;
  blocked: boolean;
  memory: RememberedCell;
  exitDanger: number | null;
};

function tileAt(x: number, y: number): Tile | null {
  return Game.map.tiles[x + y * Game.map.w];
}

function monsterAt(x: number, y: number): Monster | null {
  return Game.map.monsters[x + y * Game.map.w];
}

function playerAt(x: number, y: number): boolean {
  return Game.player.x === x && Game.player.y === y;
}

function contentsAt(x: number, y: number): XYContents {
  let tile = tileAt(x, y);
  let monster = monsterAt(x, y);
  let player = playerAt(x, y);
  let archetype = monster?.archetype || null;
  let blocked = player;
  if (!tile || tile.blocks) {
    blocked = true;
  }
  if (monster) {
    blocked = true;
  }
  let exitDanger = null;
  if (tile?.glyph === "exit") {
    let exit = Game.map.exits.find(([ex, ey, _]) => ex === x && ey === y);
    exitDanger = exit?.[2] || null;
  }
  return {
    x,
    y,
    tile,
    monster,
    player,
    blocked,
    memory: [tile, archetype],
    exitDanger,
  };
}

function getVictim(): XYContents {
  return contentsAt(Game.player.x, Game.player.y);
}

type Describer = {
  toString: () => string;
  the: () => string;
};

function D(c: XYContents): Describer {
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

function killMonsterAt(c: XYContents, death: DeathType) {
  if (c.monster) {
    c.monster.hp = 0;
    msg.combat(DeathMessages[death], D(c));
    Game.map.monsters[c.x + c.y * Game.map.w] = null;
  }
}

function damageMonsterAt(
  c: XYContents,
  damage: DamageEffect,
  status: StatusEffect | null
) {
  let m = c.monster;
  if (m) {
    let arch = MonsterArchetypes[m.archetype];
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

// Updating game state

function tick() {
  if (Game.commandQueue.length == 0) {
    return;
  }

  while (Game.player.energy >= 1.0) {
    let nextCommand = Game.commandQueue.shift();
    if (nextCommand) {
      Commands[nextCommand]();
      Game.uiCallback();
    } else {
      break;
    }
  }

  for (let i = 0; i < Game.map.w * Game.map.h; i++) {
    if (Game.map.monsters[i]) {
      // This is all pretty stupid
      const c = contentsAt(i % Game.map.w, Math.floor(i / Game.map.w));
      const m = c.monster!;
      if (!m.dying) {
        const arch = MonsterArchetypes[m.archetype];
        const ai = AI[arch.ai];
        m.energy += arch.speed;
        while (m.energy >= 1.0) {
          m.energy -= ai(c);
        }
      }
    }
  }

  if (Game.player.energy < 1.0) {
    Game.player.energy += Game.player.speed;
  }

  Game.uiCallback();

  if (Game.commandQueue.length > 0) {
    tick();
  }
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
      msg.essence("You feel the essence of %the awaiting your grasp.", D(c));
      if (!Game.player.knownMonsters[c.monster.archetype]) {
        Game.player.knownMonsters[c.monster.archetype] = true;
        let archetype = MonsterArchetypes[c.monster.archetype];
        if (archetype.danger === 1) {
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
    // TODO need to check for threats
    if (doMovePlayer(dx, dy)) {
      Game.commandQueue.push(key);
    }
  };
}

function maxEssence() {
  return Game.player.soulSlots.generic.reduce(
    (c, s) => c + s.essence,
    Game.player.maxEssence
  );
}

/// Game transcript
function mkSay(type: string): Function {
  return (fmt: string, ...args: any[]) => {
    Game.logCallback(ROT.Util.format(fmt, ...args), type);
  };
}

const msg: { [type: string]: Function } = {
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
};

/// Input handling

function handleInput() {
  document.addEventListener("keydown", (e) => {
    let command = Commands[e.key];
    if (command) {
      Game.commandQueue.push(e.key);
      setTimeout(tick, 0);
    }
  });
}

/// Graphics

function drawMap(display: ROT.Display) {
  display.clear();

  let sx = Game.player.x - Game.viewport.width / 2;
  let sy = Game.player.y - Game.viewport.height / 2;

  if (sx < 0) {
    sx = 0;
  }
  if (sy < 0) {
    sy = 0;
  }
  // Draw remembered tiles
  for (let ix = 0; ix < Game.viewport.width; ix += 1) {
    for (let iy = 0; iy < Game.viewport.height; iy += 1) {
      let mem = Game.map.memory[sx + ix + (sy + iy) * Game.map.w];
      if (mem) {
        let [mtile, mmons] = mem;
        if (mmons) {
          display.draw(
            ix,
            iy,
            Glyphs[MonsterArchetypes[mmons].glyph],
            "#666",
            "#000"
          );
        } else if (mtile) {
          display.draw(ix, iy, Glyphs[mtile.glyph], "#666", "#000");
        }
      }
    }
  }
  // Draw seen tiles
  let targets = findTargets();
  Game.map.fov.compute(
    Game.player.x,
    Game.player.y,
    Game.viewport.width / 2,
    (x, y, r, v) => {
      if (x < sx) {
        return;
      }
      if (y < sy) {
        return;
      }
      let c = contentsAt(x, y);
      let isTarget = !!targets.find((c) => c.x === x && c.y === y);
      let bg = isTarget ? Colors.target : Colors.void;
      Game.map.memory[x + y * Game.map.w] = c.memory;
      if (c.player) {
        display.draw(x - sx, y - sy, Glyphs[Game.player.glyph], "#ccc", bg);
      } else if (c.monster) {
        display.draw(
          x - sx,
          y - sy,
          Glyphs[MonsterArchetypes[c.monster.archetype].glyph],
          "#eee",
          c.monster.dying
            ? Colors.dying
            : isTarget
            ? Colors.target
            : weakMonster(c.monster)
            ? Colors.weak
            : Colors.critter
        );
      } else if (c.tile) {
        display.draw(x - sx, y - sy, Glyphs[c.tile.glyph], "#999", bg);
      } else {
        display.draw(x - sx, y - sy, Glyphs.rock, "#000", bg);
      }
    }
  );
}

// Initializes the game state and begins rendering to a ROT.js canvas.
function runGame() {
  // This part of the ROT.js API is not exposed as a type definition.
  (ROT.Util.format as any).map.the = "the";
  // Set up the ROT.js playfield
  let playarea = document.getElementById("playarea")!;
  let messages = document.getElementById("messages")!;
  let display = new ROT.Display(Game.viewport);
  let dispC = display.getContainer()!;
  playarea.appendChild(dispC);
  let logEl = document.createElement("ul");
  logEl.className = "messageLog";
  messages.appendChild(logEl);
  let logMessages: Array<[string, string]> = [];
  Game.uiCallback = () => {
    // Draw the map
    drawMap(display);
    // Update message log
    if (logMessages.length > 0) {
      let logLine = document.createElement("li");
      for (let [msg, msgType] of logMessages) {
        let msgEl = document.createElement("span");
        msgEl.className = "msg-" + msgType;
        msgEl.innerHTML = msg + " ";
        logLine.appendChild(msgEl);
      }
      logEl.prepend(logLine);
      logMessages.length = 0;
    }
    // Update stat view
    document.getElementById("essence")!.innerText =
      Game.player.essence.toString();
    document.getElementById("maxEssence")!.innerText = maxEssence().toString();
    document.getElementById("mapDanger")!.innerText =
      Game.map.danger.toString();

    // Update soul view
    let soulEl = document.getElementById("souls")!;
    let souls: Array<Soul> = [];
    let m = getVictim().monster;
    if (m) {
      souls.push(getSoul(m));
    } else {
      souls.push(EmptySoul);
    }
    for (let soul of Game.player.soulSlots.generic) {
      souls.push(soul);
    }
    soulEl.innerHTML = "";
    for (let soul of souls) {
      let el = document.createElement("div");
      el.className = "soul-glyph";
      el.innerHTML = Glyphs[soul.glyph]; // TODO
      soulEl.appendChild(el);
      el = document.createElement("div");
      el.className = "soul-name";
      el.innerHTML = soul.name; // TODO
      soulEl.appendChild(el);
      el = document.createElement("div");
      el.className = "soul-effect";
      el.innerHTML = describeSoulEffect(soul);
      soulEl.appendChild(el);
    }
  };
  Game.logCallback = (msg: string, msgType: string | undefined) => {
    if (!msgType) {
      msgType = "info";
    }
    logMessages.push([msg, msgType]);
  };
  handleInput();

  newMap();
  msg.help(
    "Use 'h'/'j'/'k'/'l' to move. You can enter the squares of weak and dying creatures. Go forth and feast!"
  );
  Game.uiCallback();
}

window.onload = runGame;
