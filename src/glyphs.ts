export const Glyphs = {
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
  eyeball: "e",
  "do-gooder": "h",
};

export type GlyphID = keyof typeof Glyphs;
