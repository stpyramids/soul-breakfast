import { MonsterArchetype, ArchetypeID } from "../monster";
import { R } from "../utils";

type MonsterProto = {
  base: MonsterArchetype;
  variants: Array<Partial<MonsterArchetype>>;
};

function expandProto(proto: MonsterProto): {
  [id: ArchetypeID]: MonsterArchetype;
} {
  let archs = { [proto.base.name]: proto.base };
  for (let variant of proto.variants) {
    // todo can we enforce having a name
    archs[variant.name!] = { ...proto.base, ...variant };
  }
  return archs;
}

export const MonsterArchetypes: { [id: ArchetypeID]: MonsterArchetype } = {
  ...expandProto({
    base: {
      name: "maggot heap",
      description:
        "A writhing mass of sickly pale grubs, clinging to a few scraps of moldering flesh for sustenance... and now they sustain me.",
      essence: 1,
      glyph: "worm",
      color: "vermin",
      hp: R(1, 1, 0),
      speed: 0.2,
      ai: "passive",
      attack: "none",
      soul: "vermin",
    },
    variants: [
      {
        name: "gnat swarm",
        description:
          "Harmless pests, birthed from some forgotten corpse. They would have irritated me in life. Now they are my bread.",
        glyph: "insect",
        ai: "wander",
      },
      {
        name: "luminous grub",
        description:
          "A fat worm with a glowing aura. It must have learned to feed on ambient essence, which is now mine for the taking.",
        essence: 3,
        glyph: "worm",
        color: "vermin",
      },
      {
        name: "soul butterfly",
        description:
          "This strange insect leaves trails of essence behind its wings. A beautiful aberration, but also delicious.",
        essence: 5,
        glyph: "insect",
        color: "vermin",
        speed: 0.4,
        ai: "wander",
      },
      {
        name: "torpid ghost",
        description:
          "A pathetic lost soul that has been ensnared here and reduced to a nearly sessile state.",
        essence: 10,
        glyph: "ghost",
        color: "vermin",
        speed: 0.1,
        ai: "wander",
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "dusty rat",
      description:
        "A skinny, worn creature, barely alive, but with just enough of a soul remaining to remove intact.",
      essence: 2,
      glyph: "rodent",
      color: "danger0",
      hp: R(1, 4, 1),
      speed: 0.5,
      ai: "nipper",
      attack: "bite",
      soul: "maxEssence",
    },
    variants: [
      {
        name: "hungry rat",
        description:
          "A brown-hided rat that gnaws old bones for food. It seems to think my skull is its next meal.",
        essence: 6,
        color: "danger5",
        hp: R(2, 4, 1),
        ai: "charge",
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "crypt spider",
      description:
        "A cobwebbed arachnid that feeds on gnats and maggots, and in turn is fed upon by me.",
      essence: 3,
      glyph: "spider",
      color: "danger0",
      hp: R(1, 2, 2),
      speed: 0.8,
      ai: "nipper",
      attack: "bite",
      soul: "extraDamage",
    },
    variants: [
      {
        name: "wolf spider",
        description:
          "This furry gray arachnid is the size of my skull and intent on defending its hunting grounds. But they are my hunting grounds, now.",
        essence: 7,
        color: "danger5",
        hp: R(1, 4, 2),
        ai: "charge",
      },
      {
        name: "ambush spider",
        description: "An obnoxious creature that springs out to attack!",
        essence: 15,
        color: "danger15",
        // TODO they should have a double-move
        ai: "charge",
        speed: 0.9,
        soul: "speed",
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "little ghost",
      description:
        "A weak spirit, barely clinging to the mortal world. I wandered for decades in a state like this.",
      essence: 4,
      glyph: "ghost",
      color: "danger0",
      hp: R(2, 4, 0),
      speed: 0.25,
      ai: "charge",
      attack: "touch",
      soul: "slow",
    },
    variants: [
      {
        name: "weeping ghost",
        description:
          "This decrepit spirit moans and mewls in a manner that would turn my stomach, if I still had one. Its suffering shall soon be over.",
        essence: 9,
        color: "danger5",
        hp: R(2, 8, 2),
        speed: 0.5,
      },
      {
        name: "howling ghost",
        description:
          "A vigorous spirit, for once! Its yawping does grate, but I have a cure for that.",
        essence: 12,
        color: "danger10",
        hp: R(2, 5, 2),
        speed: 0.9,
        soul: "speed",
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "bleary eye",
      description:
        "The gummy, sluglike body of this repulsive creature clings fast to surfaces and moves exceedingly slowly, but its gaze pierces the veil and disrupts my essence.",
      essence: 5,
      glyph: "eyeball",
      color: "danger5",
      hp: R(2, 4, 0),
      speed: 0.25,
      ai: "stationary",
      attack: "gaze",
      soul: "sight",
    },
    variants: [
      {
        name: "peering eye",
        description: "This disgusting creature will pay for its insolent gaze!",
        essence: 10,
        color: "danger10",
        hp: R(3, 4, 0),
        speed: 0.5,
      },
      {
        name: "gimlet eye",
        description:
          "These remind me of the steely, courageous gaze of someone I once knew. Just like then, I'm going to tear its soul to shreds.",
        essence: 15,
        color: "danger15",
        // TODO esp
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "soul sucker",
      description:
        "A giant, bloated mosquito, glowing with essence. Another result of the luminous grubs? When I am restored, I should build a laboratory to study this phenomenon.",
      essence: 15,
      glyph: "insect",
      color: "danger15",
      hp: R(2, 2, 2),
      speed: 1.0,
      ai: "nipper",
      attack: "bite",
      soul: "maxEssence", // TODO essence drain
    },
    variants: [],
  }),
  ...expandProto({
    base: {
      name: "do-gooder",
      description:
        "Ha! If my captors are reduced to such a feeble state, armed with weapons little better than a child's toy, my restoration will be swift indeed.",
      essence: 7,
      glyph: "do-gooder",
      color: "danger5",
      hp: R(2, 6, 4),
      speed: 0.6,
      ai: "charge",
      attack: "slice",
      soul: "soak",
    },
    variants: [
      {
        name: "acolyte",
        description:
          "This child has read a book or two and learned enough to be dangerous, but I am a much harsher tutor than any they have ever known.",
        essence: 8,
        color: "danger5",
        hp: R(2, 4, 2),
        attack: "abjure",
        speed: 0.5,
        soul: "extraDamage",
      },
      {
        name: "warrior",
        description:
          "A muscular oaf, but able enough to swing a sword. This merits caution.",
        essence: 14,
        color: "danger10",
        hp: R(3, 6, 4),
        soul: "soak",
      },
      {
        name: "priest",
        description:
          "Ah, a god-speaker. No doubt sent here to soothe the restless dead. I have a better solution.",
        essence: 15,
        color: "danger20",
        hp: R(3, 6, 4),
        speed: 0.5,
        attack: "abjure",
      },
    ],
  }),
  ...expandProto({
    base: {
      name: "knocker",
      description:
        "A despicable little gremlin that prowls the underworld for its japes. Ripping its soul from its body would be a well-deserved punchline.",
      essence: 7,
      glyph: "fairy",
      color: "danger5",
      hp: R(2, 5, 1),
      speed: 1.0,
      ai: "nipper",
      attack: "bite",
      soul: "umbra",
    },
    variants: [],
  }),
  ...expandProto({
    base: {
      name: "MegaLich 3000",
      description: "As I once was, and shall be again.",
      essence: 9999,
      glyph: "player",
      color: "danger20",
      hp: R(100, 10, 100),
      speed: 10.0,
      ai: "charge",
      attack: "slice",
      soul: "megalich",
    },
    variants: [],
  }),
};
