# 7 Day Roguelike Challenge (2022)

My in-progress submission to the [challenge](https://itch.io/jam/7drl-challenge-2022).

## Status Log

### Day 1 (Saturday)

- Set up rot.js and typescript. Using esbuild to build.
- The play area will be rendered with rot.js but status and the like will be outside in HTML for now.
- Implemented basic map generation, collision, player movement, FOV, map memory/fog of war.
- Implemented message log.
- You can move onto squares with vermin monsters and devour them.
- You can gain essence from devouring.
- A basic attack is possible and you can kill monsters and spend essence.

To Do:

- Monsters moving
- Actual combat
- Monsters being a threat
- Need to clean up how messages work SOON so articles etc. are right
- Additional levels
