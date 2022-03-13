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
};

export type GlyphID = keyof typeof Glyphs;
