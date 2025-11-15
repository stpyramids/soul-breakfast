import { MapAlgorithm, DangerRange } from "./types";
import { generateDigger } from "./algorithms/digger";
import { generateCellular } from "./algorithms/cellular";
import { placeMonstersByRoom } from "./placement/room-based";
import { placeMonstersByClusters } from "./placement/cluster-based";
import { placeExitsInRooms, placeExitsInOpenAreas } from "./placement/exit-placement";

// Registry of all available map generation algorithms
export const MapAlgorithms: { [name: string]: MapAlgorithm } = {
  digger: {
    name: "digger",
    generator: generateDigger,
    monsterPlacer: placeMonstersByRoom,
    exitPlacer: placeExitsInRooms,
  },
  cellular: {
    name: "cellular",
    generator: generateCellular,
    monsterPlacer: placeMonstersByClusters,
    exitPlacer: placeExitsInOpenAreas,
  },
  // Future algorithms:
  // arena: { ... },
  // uniform: { ... },
};

// Weighted algorithm selection based on danger level ranges
export const DangerRanges: DangerRange[] = [
  {
    minDanger: 1,
    maxDanger: 5,
    algorithms: [
      { algorithm: "digger", weight: 10 },
    ],
  },
  {
    minDanger: 6,
    maxDanger: 15,
    algorithms: [
      { algorithm: "digger", weight: 5 },
      { algorithm: "cellular", weight: 5 },
    ],
  },
  {
    minDanger: 16,
    maxDanger: 30,
    algorithms: [
      { algorithm: "digger", weight: 3 },
      { algorithm: "cellular", weight: 7 },
    ],
  },
];
