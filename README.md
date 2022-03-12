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
- Monsters moving
- Targeting status display
- Actual combat
- Monsters being a threat
- Need to clean up how messages work SOON so articles etc. are right
- Additional levels
- Other soul effects than +max essence

To Do:

- More content
- A cleaner opening
- An actual goal
- More flavor:
  - Combat messages
  - Level themes

Notes:

- I'm thinking about expanding the "danger level" idea in a way that stands in for a HP system. Essentially, _you_ would have a danger level as well. Your danger level increases through combat, when you devour the souls of monsters more dangerous than you. Increased danger level allows you to enter more dangerous maps, and I believe it should also allow you to overpower monsters more easily -- anything with a danger level less than your own would essentially be 'vermin' under this model. As far as damage goes... maybe you lose essence when hit, and if you're hit at 0 essence, you lose a danger level.
- ALTERNATELY, your danger level is the sum of all of your current soul aspects, and being hit at 0 essence has a random chance of breaking off one of your soul aspects. That makes combat potentially very risky if you have great soul aspects. I think I like this version. Is it fun? We'll find out, I guess.
- Also, I think this answers my question about what to do with low-level souls. They can't all have interesting effects. But they can increase your danger level and your max essence. (Even higher level "essence battery" souls would be useful if you had just gotten beaten up.) All souls would have that trait, and you can equip any soul to any slot... but souls that also have an "aspect" will only work if equipped in the right type of slot. I dig that.
- Which also means that the soul aspects I thought of that allow you to devour souls from a distance aren't just convenient, but also a potentially effective source of combat healing
- I think a good version of this would really lean into movement, awareness, and stealth abilities
- Let's try to focus on these rather than dumping a ton of time and energy into a bunch of different levels of "damage bolt"
- I also think this opens things up for randomization of soul aspects, with danger level serving as a way to tier how powerful the random aspects are.
