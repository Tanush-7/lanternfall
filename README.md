# LANTERNFALL

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Tanush-7/lanternfall/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Tanush-7/lanternfall/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

An atmospheric arena-survival browser game: hold back the dark with your lantern beam.
Plain static files, zero dependencies, procedural WebAudio sound, plays offline in desktop Chrome.

---

## The Concept

You are the lone lantern-keeper in an ancient circular stone sanctuary surrounded by an encroaching dark abyss.
Shadow creatures swarm in waves, hungering to snuff out the last spark of light.

### Core Mechanics & Twists
- **The Lantern Beam**: Your beam is your *only* weapon. Aim with the mouse to incinerate shadows caught in the radiant cone of light.
- **Heat Management**: Sustained light causes the lantern to overheat. Manage your cooling and pulse your beam: if heat reaches 100%, the shutter jams for a critical penalty period.
- **Oil is Health**: Your lantern oil is also your lifeblood. Taking hits drains oil, and the lantern consumes a gentle trickle to remain lit. Burning shadows drops glowing oil droplets—you must fight and venture into the dark to harvest oil and stay alive.
- **Shadow Bestiary**:
  - **Shadow Crawlers** (Wave 1): Skittering swarmers that test your aim and crowd control.
  - **Night Darters** (Wave 2): Agile shades that stalk from afar and suddenly lunge straight at you.
  - **Umbral Shield-Bearers** (Wave 3): Armored brutes with frontal obsidian shields immune to the beam. Flank or dash behind them to burn their exposed fiery cores!
  - **Shadow Wisps / Spitters** (Wave 4): Phantoms hovering at the perimeter casting dark orbs.
  - **Boss Battles** (Every 5th Wave): *The Umbral Goliath* (Wave 5) stomps the earth with shockwaves, summons minions, and frenzies; *The Voidweaver* (Wave 10) teleports and casts spiral shadow barrages.

---

## Controls

| Action | Control |
|---|---|
| **Move Keeper** | `W`, `A`, `S`, `D` or Arrow Keys |
| **Aim Lantern** | Mouse Cursor |
| **Ignite Beam** | Hold Left Mouse Button or `F` / `J` |
| **Dodge Dash** | `Spacebar` or Right Mouse Button |
| **Restart** | `R` (on Game Over screen) |
| **Pause** | `Escape` or `P` |
| **Mute Sound** | `M` |

---

## Architecture

The codebase is split into modular, focused ES modules:

- [`game/index.html`](file:///C:/Users/tanut/lanternfall/game/index.html): Clean canvas viewport and accessibility markup.
- [`game/src/config.js`](file:///C:/Users/tanut/lanternfall/game/src/config.js): Gameplay parameters, balance constants, and color definitions.
- [`game/src/audio.js`](file:///C:/Users/tanut/lanternfall/game/src/audio.js): Procedural WebAudio sound synthesizers (ambient drone, beam crackle, sizzle, chimes, roars).
- [`game/src/input.js`](file:///C:/Users/tanut/lanternfall/game/src/input.js): Keyboard, mouse cursor, and vector math.
- [`game/src/player.js`](file:///C:/Users/tanut/lanternfall/game/src/player.js): Keeper movement, lantern aiming, heat dissipation, and oil consumption.
- [`game/src/enemies.js`](file:///C:/Users/tanut/lanternfall/game/src/enemies.js): Shadow enemy classes, state machines, boss encounters, and beam collision physics.
- [`game/src/pickups.js`](file:///C:/Users/tanut/lanternfall/game/src/pickups.js): Oil droplet physics, magnetic pull, and collection logic.
- [`game/src/particles.js`](file:///C:/Users/tanut/lanternfall/game/src/particles.js): Volumetric embers, dark smoke, shockwaves, and dash trails.
- [`game/src/waves.js`](file:///C:/Users/tanut/lanternfall/game/src/waves.js): Wave composition, night cycle, spawner queues, and boss staging.
- [`game/src/hud.js`](file:///C:/Users/tanut/lanternfall/game/src/hud.js): Oil flask bar, heat gauge, combo counter, screen shake, vignette, and title/gameover screens.
- [`game/src/render.js`](file:///C:/Users/tanut/lanternfall/game/src/render.js): 2D dynamic lighting mask, arena stone pavement, and volumetric beam light rays.
- [`game/src/world.js`](file:///C:/Users/tanut/lanternfall/game/src/world.js): Central game state simulation and entity coordination.
- [`game/src/shots.js`](file:///C:/Users/tanut/lanternfall/game/src/shots.js): Deterministic scene staging for automated screenshot capture (`?shot=title|play|boss|end`).
- [`game/src/main.js`](file:///C:/Users/tanut/lanternfall/game/src/main.js): Animation loop, requestAnimationFrame, and screen transitions.

---

## Run it Locally

Start the local server:

```sh
node serve.ts
```

Then open `http://localhost:8080` in desktop Google Chrome.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
