const Colors = {
  void: [0, 0, 0],
  target: [17, 51, 153],
  dying: [68, 17, 17],
  weak: [34, 17, 17],
  critterBG: [17, 17, 17],
  vermin: [170, 170, 170],
  danger0: [124, 83, 53],
  danger5: [157, 137, 59],
  danger10: [67, 157, 59],
  danger15: [59, 157, 142],
  danger20: [157, 59, 67],
  danger25: [146, 59, 157],
  terrain: [190, 190, 190],
  floor: [127, 127, 127],
  player: [255, 255, 255],
};

export type ColorID = keyof typeof Colors;

export function rgb(color: ColorID): string {
  let c = Colors[color];
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function hex(color: ColorID): string {
  let c = Colors[color];
  return "#" + c[0].toString(16) + c[1].toString(16) + c[2].toString(16);
}

export function rgba(color: ColorID, alpha: number): string {
  let c = Colors[color];
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
}

const Glyphs = {
  none: " ",
  player: "@",
  exit: ">",
  wall: "#",
  floor: ".",
  unknown: "?",
  rock: " ",
  insect: "i",
  butterfly: "i",
  grub: "w",
  maggots: "w",
  rodent: "r",
  spider: "s",
  ghost: "g",
  eyeball: "e",
  "do-gooder": "h",
  fairy: "f",
};

export type GlyphID = keyof typeof Glyphs;

export type Token = [GlyphID, ColorID];

export function Token(glyph: GlyphID, color: ColorID): Token {
  return [glyph, color];
}

export function glyphChar(glyph: GlyphID): string {
  return Glyphs[glyph];
}

export function tokenChar(token: Token): string {
  return glyphChar(token[0]);
}

export function tokenRGB(token: Token): string {
  return rgb(token[1]);
}

export function tokenRGBA(token: Token, alpha: number): string {
  return rgba(token[1], alpha);
}
