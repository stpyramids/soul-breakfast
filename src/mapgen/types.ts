import { LevelMap } from "../map";
import { MonsterFormation } from "../monster";

// What different terrain generators return to help with placement
export type TerrainResult = {
  type: "rooms" | "cellular" | "open";
  rooms?: Room[];           // For room-based algorithms (digger, uniform, rogue)
  openAreas?: Region[];     // For cellular/cave algorithms
  centerPoint?: [number, number];  // For arena algorithms
  corridors?: Corridor[];   // For algorithms with explicit corridors
};

export interface Room {
  getRight(): number;
  getLeft(): number;
  getBottom(): number;
  getTop(): number;
  getCenter(): [number, number];
  create(callback: (x: number, y: number, v: number) => void): void;
}

export interface Region {
  tiles: Array<[number, number]>;  // List of coordinates in this region
  center: [number, number];
}

export interface Corridor {
  create(callback: (x: number, y: number, v: number) => void): void;
}

// Monster placement strategy function type
export type MonsterPlacerFunc = (
  map: LevelMap,
  terrain: TerrainResult,
  formations: MonsterFormation[],
  formDist: { [key: number]: number },
  startRegionIndex: number  // Index of starting room/region to skip
) => void;

// Exit placement strategy function type
export type ExitPlacerFunc = (
  map: LevelMap,
  terrain: TerrainResult,
  exits: number[],
  startRegionIndex: number  // Index of starting room/region to skip
) => void;

// Terrain generation function type
export type TerrainGeneratorFunc = (map: LevelMap) => TerrainResult;

// Complete map algorithm definition
export type MapAlgorithm = {
  name: string;
  generator: TerrainGeneratorFunc;
  monsterPlacer: MonsterPlacerFunc;
  exitPlacer?: ExitPlacerFunc;  // Optional; uses default if not provided
};

// Algorithm selection configuration
export type AlgorithmWeight = {
  algorithm: string;  // References MapAlgorithms registry key
  weight: number;
};

export type DangerRange = {
  minDanger: number;
  maxDanger: number;
  algorithms: AlgorithmWeight[];
};
