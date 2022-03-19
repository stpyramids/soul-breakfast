export const Colors = {
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

export function rgb(color: keyof typeof Colors): string {
  let c = Colors[color];
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function rgba(color: keyof typeof Colors, alpha: number): string {
  let c = Colors[color];
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
}
