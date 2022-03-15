# SOUL 👻 BREAK 💀 FAST

_Revenge, like cereal, is best served cold_

My submission to the [2022 Seven Day Roguelike game jam](https://itch.io/jam/7drl-challenge-2022). The version submitted is the `7drl-2022` tag; this version is under continuing development.

I publish the latest dev release [here](https://mboeh.github.io/7drl-2022/).

## How to play:

The game includes tutorial messages, but the overall structure is:

- Find weak "vermin" enemies; devour their souls for essence (press 'd' while occupying their square).
- Use the essence to shoot auto-targeting bolts (with Space) at stronger enemies.
- Claim the souls of (non-vermin) enemies to increase your max essence and possibly additional powers.
- Spend essence to go through passages (>) to more dangerous areas with harder enemies.
- Try not to hit 0 essence: this can cause you to lose souls or even get kicked back into an earlier level.
- Release weaker souls (with 'r') and claim stronger ones.
- Achieve a max essence of 50 or higher and enter a passage to a danger level of 50 or higher. And win!

## Controls

Some of these are documented in game. Online

- h/j/k/l: Move in the cardinal directions. Hold Shift to move in a direction until you see an enemy or hit a wall.
- . (period): Wait a turn.
- Space: Fire a spell at the targeted (blue background) enemy. Costs 2 essence.
- d: Devour the soul of the creature you are currently standing on, gaining essence.
- c: Claim the soul of the creature you are currently standing on. You cannot claim a soul you are already holding. You need an empty slot.
- r: Release one of your claimed souls (press 1, 2, or 3 to pick a slot).
- \>: Enter a passage. You need (and will spend) as much essence as the danger level of the new level.

## Tips

- Conserve your essence.
- Not all enemies are worth fighting.
- Some souls are a double-edged sword.
- Positioning is key.
- Not all effects stack.

## UI changes

- Use some kind of JS framework or templating library
- Make the "ground" section clear
- Add a "target" section
- Add a spell summary

## Balance Thoughts

- Spell should cost 1 essence at first
- Spell upgrades should cause (gradual) cost increases
- Early enemies should be slightly more difficult

## To Do

- Clean up the codebase
- Make better use of color
- More content
  - More powers: stealth, ESP, area of effect spells, etc.
- A better goal
- Better balance
- More flavor:
  - Combat messages
  - Level themes
- Detailed online help

## Mechanics Notes

The original game concept had soul slots associated with "wand", "ring", and "crown". The original plan, which would have given you nine slots right off the bat (and only being able to put one type of soul in a given slot) doesn't seem like it would be very fun. However, I do like the idea of typed slots and I do think that there should be more than just 3 slots in the long term. So here's my general idea: the wand, ring, and crown relics are upgrades you unlock as the game progresses. Each of them serves as a soul slot, and there are particular high-level soul effects that only function if you put them in the correct slot:

- Wand (knife?) effects enhance your attack
- Ring (spoon?) effects enhance your defense
- Crown (fork?) effects grant passive and active abilities

Winning the game would require unlocking all three bonus slots and filling them with a specific soul from a top-tier monster. These are marked by special soul effects, and only one monster type has the appropriate soul for each relic.

Unlocking a relic slot would become possible after a certain danger level. Passages to a challenge level with a higher effective danger and some special map generation logic appear. These passages are free but you must claim the relic to exit. Blowback works the same in these levels, and you can retry them as much as you want.

I'm not sure whether you could lose relic slots or not. If so, you'd be able to regain them.

So the gameplay looks more or less like this:

- Gain essence
- Fight enemies
- Claim souls
- Go to harder levels
- Repeat until you see a portal to a relic challenge
- Win the relic challenge and unlock the new slot
- Repeat until you have all three relics
- Find the monsters with the 'sovereign' soul effects and claim them into the appropriate slot
- Enter some kind of final area, perhaps? Or do you just win outright? I like the idea that having all three sovereign souls makes you comically powerful and you get a victory lap of sorts
