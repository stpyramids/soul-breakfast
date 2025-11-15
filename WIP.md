# Work in Progress - Map Generation Architecture

## Current Branch: `mapgen-updates`

### Summary
Complete refactoring of map generation system into modular, extensible architecture with support for multiple algorithms. Added ROT.Map.Cellular cave generation as a second algorithm alongside the existing Digger.

---

## Changes Overview

### Files Added (8 new files)
- `src/mapgen/types.ts` - Type definitions for map generation system
- `src/mapgen/config.ts` - Algorithm registry and danger-based selection
- `src/mapgen/index.ts` - Main map generation orchestration
- `src/mapgen/algorithms/digger.ts` - ROT.js Digger (room-and-corridor)
- `src/mapgen/algorithms/cellular.ts` - ROT.js Cellular (cave generation)
- `src/mapgen/placement/room-based.ts` - Monster placement for room-based maps
- `src/mapgen/placement/cluster-based.ts` - Monster placement for cellular maps
- `src/mapgen/placement/exit-placement.ts` - Exit placement utilities

### Files Deleted
- `src/mapgen.ts` - Old monolithic map generator

### Files Modified
- `src/ui.ts` - Updated import path from `./mapgen` to `./mapgen/index`

### Statistics
- **10 files changed**: 812 insertions(+), 181 deletions(-)
- **Net addition**: ~631 lines of code

---

## Architecture Changes

### 1. **Modular Design**

**Before:**
```
src/mapgen.ts (180 lines, single file)
```

**After:**
```
src/mapgen/
├── index.ts              # Main entry point (185 lines)
├── types.ts              # Type definitions (69 lines)
├── config.ts             # Registry & configuration (52 lines)
├── algorithms/
│   ├── digger.ts         # Room-and-corridor (36 lines)
│   └── cellular.ts       # Cave generation (216 lines)
└── placement/
    ├── room-based.ts     # Room monster placement (57 lines)
    ├── cluster-based.ts  # Cave monster placement (67 lines)
    └── exit-placement.ts # Exit placement (129 lines)
```

### 2. **Algorithm Registry System**

New configurable system allows easy addition of map generation algorithms:

```typescript
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
};
```

### 3. **Danger-Based Algorithm Selection**

Maps now use different algorithms based on danger level:

```typescript
export const DangerRanges: DangerRange[] = [
  {
    minDanger: 1,
    maxDanger: 5,
    algorithms: [{ algorithm: "digger", weight: 10 }],
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
```

- **Danger 1-5**: 100% Digger (classic dungeons for tutorial)
- **Danger 6-15**: 50/50 mix (variety in mid-game)
- **Danger 16-30**: 70% Cellular (endgame caves)

---

## Cellular Algorithm Implementation

### Terrain Generation (`algorithms/cellular.ts`)

1. **Cellular Automaton**: Uses ROT.Map.Cellular with custom rules
   - Born: [4,5,6,7,8] neighbors → becomes wall
   - Survive: [2,3,4,5] neighbors → stays wall
   - 50% initial fill, 5 smoothing iterations

2. **Border Preservation**: 1-tile rock border around map
   - Cellular generation: (width-2) × (height-2)
   - Tiles offset by +1 when applied to map
   - Prevents FOV artifacts at map edges

3. **Region Detection**: Flood-fill identifies connected cave areas
   - Filters out tiny pockets (< 10 tiles)
   - Sorts by size (largest first)

4. **Selective Connection**: Connects only small isolated regions
   - Connects regions < 30% of largest region size
   - Preserves larger separate caves for variety

5. **Region Subdivision**: Breaks large caves into placement zones
   - Target zone size: ~400 tiles
   - Creates grid-based subdivision
   - Each zone gets independent monster/exit placement

### Monster Placement (`placement/cluster-based.ts`)

- **Strategy**: Tight clusters scattered throughout caves
- **Density**: 10% (vs 50% for rooms)
- **Clusters**: 1-3 per zone
- **Radius**: 0-3 tiles (polar coordinates)
- **Result**: Natural groupings that feel organic

### Exit Placement (`placement/exit-placement.ts`)

- **Strategy**: Place at region periphery
- **Selection**: Weighted by region size
- **Location**: Tiles far from center, near walls
- **Prioritization**: Manhattan distance + wall adjacency bonus

---

## Bug Fixes Applied

### Issue #1: FOV Not Working
**Problem**: Wall/floor values inverted for cellular maps
**Cause**: ROT.Map.Cellular uses 0=floor, 1=wall (opposite of Digger)
**Fix**: Changed condition from `value === 1 ? wall : floor` to `value === 0 ? floor : wall`

### Issue #2: No Monsters or Exits
**Problem**: Starting region not excluded from placement
**Root Cause**: All regions connected → 1 big region → skip index 0 → nothing placed
**Fixes**:
1. Added `startRegionIndex` parameter to all placement functions
2. Updated `placePlayer()` to return region index
3. Modified placement functions to skip starting region
4. Added region subdivision to create multiple zones from large caves

### Issue #3: Phantom Tiles in Fog of War
**Problem**: Cellular maps showed tiles beyond playable area
**Cause**: Cellular automaton overwrote entire map including rock border
**Fix**: Generate cellular terrain in smaller area (width-2, height-2) with +1 offset

### Issue #4: Too Few Monsters/Exits in Cellular Maps
**Problem**: Large cave = 1 region, skip starting region = 0 regions with spawns
**Solution**: Subdivide large regions (>500 tiles) into grid zones (~400 tiles each)
**Result**: 4304-tile cave → ~11 zones → ~10 zones with monsters/exits

---

## Recent Committed Changes (Not in WIP)

### Wall Color Interpolation (Commit: 1a7aa8b)
Added danger-based wall coloring to provide visual depth cues.

**Files Modified:**
- `src/token.ts` - Added `interpolateColor()` function
- `src/ui/render/pixi.ts` - Updated `visibleTile()` to interpolate wall colors

**Implementation:**
```typescript
if (c.tile.blocks) {
  const levelDangerColor = dangerColor(currentDanger);
  const t = Math.min(currentDanger / 25, 1.0);
  identityC = interpolateColor("terrain", levelDangerColor, t);
}
```

**Effect:**
- Danger 0: Walls are 100% gray (terrain color)
- Danger 12-13: Walls are ~50% gray, 50% green
- Danger 25+: Walls are 100% purple (danger25 color)
- Applied to both visible and memorized tiles

---

## Testing Status

✅ **Build**: Successful (574.7kb)
✅ **Digger Algorithm**: Backward compatible, working as before
⚠️ **Cellular Algorithm**: Implemented with debug logging active

### Debug Logging (Active)
Console logs currently enabled for monitoring:
- `[Cellular] Found X regions, sizes: [...]`
- `[Cellular] Connecting Y small regions to main cave`
- `[Cellular] After subdivision: Z zones`
- `[Cluster] Placing monsters: X regions, skipping index N`
- `[Cluster] Region N: ... tiles, capacity ..., ... clusters`

**TODO**: Remove debug console.log statements before final merge

---

## Next Steps

### Immediate
- [ ] Remove debug logging from cellular.ts and cluster-based.ts
- [ ] Test cellular maps at various danger levels
- [ ] Verify monster density feels appropriate

### Future Enhancements
- [ ] Add more ROT.js algorithms (Arena, Uniform, Rogue)
- [ ] Implement custom placement strategies per algorithm
- [ ] Fine-tune danger ranges based on gameplay testing
- [ ] Consider adding algorithm-specific configuration options

---

## How to Add New Algorithms

1. **Create Generator**: `src/mapgen/algorithms/my-algorithm.ts`
   ```typescript
   export function generateMyAlgorithm(map: LevelMap): TerrainResult {
     // Generate terrain, return TerrainResult with appropriate type
   }
   ```

2. **Create Placement Strategy** (optional): `src/mapgen/placement/my-placement.ts`
   ```typescript
   export function placeMonstersByMyStrategy(...) {
     // Custom monster placement logic
   }
   ```

3. **Register in Config**: `src/mapgen/config.ts`
   ```typescript
   MapAlgorithms.myAlgorithm = {
     name: "myAlgorithm",
     generator: generateMyAlgorithm,
     monsterPlacer: placeMonstersByMyStrategy,
     exitPlacer: customExitPlacer, // optional
   };
   ```

4. **Add to Danger Ranges**: Update `DangerRanges` array with weights

---

## Performance Impact

- **Bundle Size**: 574.7kb (minimal increase from modularization)
- **Generation Time**: No noticeable change (cellular similar to digger)
- **Memory**: Negligible increase from region subdivision

---

## Code Quality

- **Type Safety**: Full TypeScript coverage with discriminated unions
- **Modularity**: Clear separation of concerns
- **Extensibility**: Easy to add new algorithms
- **Backward Compatibility**: Existing saves and gameplay unaffected
- **Documentation**: Inline comments explain complex algorithms
