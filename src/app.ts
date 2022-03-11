import * as ROT from "rot-js";

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

/// Soul Aspects

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

type WandEffect = TargetingEffect | ProjectileEffect | DamageEffect;

const WandEffects: { [id: string]: WandEffect } = {
  seeker: { type: "targeting", targeting: "seeker" },
  bolt: { type: "projectile", projectile: "bolt" },
  weakMana: { type: "damage", damage: asRoll(1, 4, 0) },
};

type WandSoul = { type: "wand"; essence: number; name: string };
type RingSoul = { type: "ring"; essence: number; name: string };
type CrownSoul = { type: "crown"; essence: number; name: string };
type GenericSoul = { type: "generic"; essence: number; name: string };
type NoSoul = { type: "none"; essence: number; name: string };
type Soul = WandSoul | RingSoul | CrownSoul | GenericSoul | NoSoul;

/// Character graphics

const Glyphs = {
  player: "@",
  wall: "#",
  floor: ".",
  rock: ".",
  insect: "i",
  worm: "w",
  rodent: "r",
};

type GlyphID = keyof typeof Glyphs;

/// Map tiles

type Tile = {
  glyph: GlyphID;
  blocks: boolean;
};

const Tiles: { [name: string]: Tile } = {
  rock: { glyph: "rock", blocks: true },
  wall: { glyph: "wall", blocks: true },
  floor: { glyph: "floor", blocks: false },
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

const Attacks: { [id: string]: Attack } = {
  none: {
    canReachFrom: (c) => false,
    attackFrom: (c) => {},
  },
  bite: {
    canReachFrom: (c) =>
      (Game.player.x === c.x ||
        Game.player.x === c.x - 1 ||
        Game.player.x === c.x + 1) &&
      (Game.player.y === c.y ||
        Game.player.y === c.y - 1 ||
        Game.player.y === c.y + 1),
    attackFrom: (c) => {
      msg.combat("%The snaps at you!", D(c));
      // TODO combat parameters
      if (doRoll(asRoll(1, 100, 0)) > 80) {
        let dmg = doRoll(asRoll(1, 4, 0));
        msg.combat("Your essence wavers!");
        Game.player.essence -= dmg;
        if (Game.player.essence < 0) {
          // TODO this is where you would get problems
          Game.player.essence = 0;
          msg.angry("No!");
        }
      }
    },
  },
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
    type: "none",
    essence: a.danger,
    name: "transient " + a.name + " essence",
  }),
  bulk: (a) => ({
    type: "generic",
    essence: a.danger,
    name: a.name + " essence",
  }),
};

const MonsterArchetypes: { [id: string]: MonsterArchetype } = {
  maggot: {
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
  gnatSwarm: {
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
  giantRat: {
    name: "giant rat",
    danger: 2,
    glyph: "rodent",
    appearing: asRoll(1, 2, 1),
    hp: asRoll(1, 4, 1),
    speed: 0.5,
    ai: "nipper",
    attack: "bite",
    soul: "bulk",
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

type RememberedCell = readonly [Tile | null, ArchetypeID | null];

const DeathMessages: { [type: string]: string } = {
  drain: "%The crumbles into dust.",
  force: "%The is blown to pieces.",
};

type DeathType = keyof typeof DeathMessages;

/// Game commands

function gainEssence(amt: number) {
  Game.player.essence += amt;
  if (Game.player.essence > Game.player.maxEssence) {
    Game.player.essence = Game.player.maxEssence;
    msg.essence("Some essence escapes you and dissipates.");
  }
}

const Commands: { [key: string]: Function } = {
  h: movePlayer(-1, 0),
  l: movePlayer(1, 0),
  j: movePlayer(0, 1),
  k: movePlayer(0, -1),
  // (d)evour soul
  d: () => {
    let c = contentsAt(Game.player.x, Game.player.y);
    if (c.monster) {
      let arch = MonsterArchetypes[c.monster.archetype];
      Game.player.energy -= 0.5;
      if (weakMonster(c.monster)) {
        let soul = SoulFactories[arch.soul](arch);
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
      let arch = MonsterArchetypes[c.monster.archetype];
      let soul = SoulFactories[arch.soul](arch);

      if (soul.type === "none") {
        msg.angry("This vermin has no soul worthy of claiming.");
      } else {
        Game.player.energy -= 1.0;
        if (weakMonster(c.monster)) {
          msg.essence("You claim the soul of %the.", D(c));
          // todo
          Game.player.maxEssence += soul.essence;
          //gainEssence(soul.essence);
          killMonsterAt(c, "drain");
        } else {
          msg.angry("The wretched creature resists!");
        }
      }
    } else {
      msg.think("No soul is here to claim.");
    }
  },
  // fire spell
  " ": () => {
    let targeting = WandEffects.seeker as TargetingEffect;
    let projectile = WandEffects.bolt as ProjectileEffect;
    let damage = WandEffects.weakMana as DamageEffect;
    let cost = 3;
    if (cost > Game.player.essence) {
      msg.angry("I must have more essence!");
      return;
    }
    // Do targeting
    let target: XYContents | null = null;
    switch (targeting.targeting) {
      case "seeker":
        let closestDistance = 9999;
        Game.map.fov.compute(
          Game.player.x,
          Game.player.y,
          Game.viewport.width / 2,
          (x, y, r, v) => {
            let c = contentsAt(x, y);
            if (c.monster) {
              let dist =
                Math.abs(Game.player.x - x) * Math.abs(Game.player.y - y);
              if (dist < closestDistance) {
                closestDistance = dist;
                target = c;
              }
            }
          }
        );
    }
    if (target) {
      // TODO: projectiles
      msg.combat("The bolt hits %the!", D(target)); // todo
      damageMonsterAt(target, damage.damage);
    } else {
      msg.think("I see none here to destroy.");
      return;
    }
    Game.player.essence -= cost;
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
    knownMonsters: {} as { [id: ArchetypeID]: boolean },
  },
  map: {
    danger: 5,
    w: 80,
    h: 80,
    tiles: [] as Array<Tile>,
    monsters: [] as Array<Monster | null>,
    memory: [] as Array<RememberedCell>,
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

  // Place monsters in other rooms
  const eligibleMonsters = Object.keys(MonsterArchetypes).filter(
    (id) => MonsterArchetypes[id].danger <= Game.map.danger
  );
  for (let room of rooms) {
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
  return {
    x,
    y,
    tile,
    monster,
    player,
    blocked,
    memory: [tile, archetype],
  };
}

function target(): XYContents {
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

function damageMonsterAt(c: XYContents, damage: Roll) {
  if (c.monster) {
    let arch = MonsterArchetypes[c.monster.archetype];
    let wasDying = weakMonster(c.monster);
    c.monster.hp -= doRoll(damage);
    if (c.monster.hp > 1) {
      // todo
      msg.combat("You see %the shudder!", D(c));
    } else if (c.monster.hp == 1) {
      msg.combat("You see %the stagger!", D(c));
    } else {
      if (wasDying) {
        killMonsterAt(c, "force"); // todo
      } else {
        msg.combat("You see %the collapse!", D(c));
        c.monster.dying = true;
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
}

function movePlayer(dx: number, dy: number) {
  return () => {
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
          }
        }
      }
    } else {
      if (c.monster) {
        msg.think("The essence of %the resists my passage.", D(c));
      } else {
        msg.think("There is no passing this way.");
      }
    }
  };
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
};

/// Input handling

function handleInput() {
  document.addEventListener("keypress", (e) => {
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
      Game.map.memory[x + y * Game.map.w] = c.memory;
      if (c.player) {
        display.draw(x - sx, y - sy, Glyphs[Game.player.glyph], "#ccc", "#111");
      } else if (c.monster) {
        display.draw(
          x - sx,
          y - sy,
          Glyphs[MonsterArchetypes[c.monster.archetype].glyph],
          "#eee",
          c.monster.dying ? "#411" : weakMonster(c.monster) ? "#211" : "#111"
        );
      } else if (c.tile) {
        display.draw(x - sx, y - sy, Glyphs[c.tile.glyph], "#999", "#111");
      } else {
        display.draw(x - sx, y - sy, Glyphs.rock, "#000", "#000");
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
    document.getElementById("maxEssence")!.innerText =
      Game.player.maxEssence.toString();

    let m = target().monster;
    if (m) {
      let arch = MonsterArchetypes[m.archetype];
      document.getElementById("target-glyph")!.innerText = Glyphs[arch.glyph];
      document.getElementById("target-name")!.innerText =
        arch.name + "(" + arch.danger.toString() + ")";
      document.getElementById("target-danger")!.innerText = "";
    } else {
      document.getElementById("target-glyph")!.innerText = " ";
      document.getElementById("target-name")!.innerText = "";
      document.getElementById("target-danger")!.innerText = "";
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
  Game.uiCallback();
}

window.onload = runGame;
