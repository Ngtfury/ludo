export type Coordinate = { r: number; c: number };

export const MAIN_PATH: Coordinate[] = [
  { r: 1, c: 8 },  // 0 - Yellow Start
  { r: 2, c: 8 },  // 1
  { r: 3, c: 8 },  // 2
  { r: 4, c: 8 },  // 3
  { r: 5, c: 8 },  // 4
  { r: 6, c: 9 },  // 5
  { r: 6, c: 10 }, // 6
  { r: 6, c: 11 }, // 7
  { r: 6, c: 12 }, // 8 - Star
  { r: 6, c: 13 }, // 9
  { r: 6, c: 14 }, // 10
  { r: 7, c: 14 }, // 11
  { r: 8, c: 14 }, // 12
  { r: 8, c: 13 }, // 13
  { r: 8, c: 12 }, // 14
  { r: 8, c: 11 }, // 15
  { r: 8, c: 10 }, // 16
  { r: 8, c: 9 },  // 17
  { r: 9, c: 8 },  // 18
  { r: 10, c: 8 }, // 19
  { r: 11, c: 8 }, // 20
  { r: 12, c: 8 }, // 21 - Star
  { r: 13, c: 8 }, // 22
  { r: 14, c: 8 }, // 23
  { r: 14, c: 7 }, // 24
  { r: 14, c: 6 }, // 25
  { r: 13, c: 6 }, // 26 - Blue Start
  { r: 12, c: 6 }, // 27
  { r: 11, c: 6 }, // 28
  { r: 10, c: 6 }, // 29
  { r: 9, c: 6 },  // 30
  { r: 8, c: 5 },  // 31
  { r: 8, c: 4 },  // 32
  { r: 8, c: 3 },  // 33
  { r: 8, c: 2 },  // 34 - Star
  { r: 8, c: 1 },  // 35
  { r: 8, c: 0 },  // 36
  { r: 7, c: 0 },  // 37
  { r: 6, c: 0 },  // 38
  { r: 6, c: 1 },  // 39
  { r: 6, c: 2 },  // 40
  { r: 6, c: 3 },  // 41
  { r: 6, c: 4 },  // 42
  { r: 6, c: 5 },  // 43
  { r: 5, c: 6 },  // 44
  { r: 4, c: 6 },  // 45
  { r: 3, c: 6 },  // 46
  { r: 2, c: 6 },  // 47 - Star
  { r: 1, c: 6 },  // 48
  { r: 0, c: 6 },  // 49
  { r: 0, c: 7 },  // 50
  { r: 0, c: 8 },  // 51
];

export const YELLOW_HOME_STRETCH: Coordinate[] = [
  { r: 1, c: 7 },  // 51 relative
  { r: 2, c: 7 },  // 52 relative
  { r: 3, c: 7 },  // 53 relative
  { r: 4, c: 7 },  // 54 relative
  { r: 5, c: 7 },  // 55 relative
  { r: 6.5, c: 7 },// 56 relative (Inside triangle/Home)
];

export const BLUE_HOME_STRETCH: Coordinate[] = [
  { r: 13, c: 7 }, // 51 relative
  { r: 12, c: 7 }, // 52 relative
  { r: 11, c: 7 }, // 53 relative
  { r: 10, c: 7 }, // 54 relative
  { r: 9, c: 7 },  // 55 relative
  { r: 7.5, c: 7 },// 56 relative (Inside triangle/Home)
];

export const YELLOW_BASE: Coordinate[] = [
  { r: 1.5, c: 10.5 },
  { r: 1.5, c: 12.5 },
  { r: 3.5, c: 10.5 },
  { r: 3.5, c: 12.5 },
];

export const BLUE_BASE: Coordinate[] = [
  { r: 10.5, c: 1.5 },
  { r: 10.5, c: 3.5 },
  { r: 12.5, c: 1.5 },
  { r: 12.5, c: 3.5 },
];

export const SAFE_SPOTS = [0, 8, 21, 26, 34, 47]; // Indices in MAIN_PATH that are safe

/**
 * Given a player color and their progress (0 to 56), returns the visual coordinate on the board.
 * Progress meaning:
 * -1 = In Base
 * 0 = Start Position
 * 1-50 = Main Path
 * 51-55 = Home Stretch
 * 56 = Won
 */
export const getTokenCoordinate = (
  color: "yellow" | "blue",
  progress: number,
  tokenId: number
): Coordinate => {
  if (progress === -1) {
    return color === "yellow" ? YELLOW_BASE[tokenId] : BLUE_BASE[tokenId];
  }

  if (progress >= 51) {
    const stretchIndex = Math.min(progress - 51, 5); // 0 to 5
    return color === "yellow" ? YELLOW_HOME_STRETCH[stretchIndex] : BLUE_HOME_STRETCH[stretchIndex];
  }

  const offset = color === "yellow" ? 0 : 26;
  const mainPathIndex = (progress + offset) % 52;
  return MAIN_PATH[mainPathIndex];
};
