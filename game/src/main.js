// Main entry point and game loop for LANTERNFALL

import { SCREENS, CANVAS } from './config.js';
import { InputManager } from './input.js';
import { World } from './world.js';
import { Renderer } from './render.js';
import { HUD } from './hud.js';
import { audio } from './audio.js';
import { stageShot } from './shots.js';

function init() {
  const canvas = document.getElementById('game');
  const statusEl = document.getElementById('status');
  if (!canvas) return;

  // Enforce internal canvas dimensions
  canvas.width = CANVAS.width;
  canvas.height = CANVAS.height;

  const input = new InputManager(canvas);
  const world = new World();
  const renderer = new Renderer(canvas);
  const hud = new HUD();

  let screenState = SCREENS.TITLE;
  let lastTime = performance.now();

  function announce(text) {
    if (statusEl) statusEl.textContent = text;
  }

  // Check URL query parameters for automated screenshot staging
  const params = new URLSearchParams(window.location.search);
  const shotParam = params.get('shot');
  if (shotParam) {
    screenState = stageShot(shotParam, world, hud);
    renderer.render(world, hud, screenState);
    announce(`LANTERNFALL screenshot staged: ${shotParam}`);
    return;
  }

  announce('LANTERNFALL: Click or press Space to start');

  function startGame() {
    audio.ensureContext();
    audio.playClick();
    world.reset();
    hud.reset();
    screenState = SCREENS.PLAY;
    announce('Game started. Night 1, Wave 1. Aim with mouse, hold left click to burn shadows.');
  }

  function restartGame() {
    audio.ensureContext();
    audio.playClick();
    world.reset();
    hud.reset();
    screenState = SCREENS.PLAY;
    announce('Lantern reignited. Starting fresh run.');
  }

  function loop(now) {
    const rawDt = (now - lastTime) / 1000;
    lastTime = now;
    // Clamp delta time to avoid spiral of death on tab unfocus
    const dt = Math.min(rawDt, 0.05);

    // Mute toggle on 'M'
    if (input.wasKeyPressed('KeyM')) {
      audio.toggleMute();
    }

    if (screenState === SCREENS.TITLE) {
      // Ambient particle motion on title screen
      world.particles.update(dt);
      if (Math.random() < 0.25) {
        world.particles.spawnEmber(
          CANVAS.width / 2 + (Math.random() - 0.5) * 260,
          CANVAS.height / 2 + (Math.random() - 0.5) * 180,
          (Math.random() - 0.5) * 12,
          -15 - Math.random() * 20,
          '#ffd166',
          2.0,
          1.5,
        );
      }

      if (input.wasClicked() || input.wasKeyPressed('Space') || input.wasKeyPressed('Enter')) {
        startGame();
      }
    } else if (screenState === SCREENS.PLAY) {
      // Pause toggle
      if (input.wasKeyPressed('Escape') || input.wasKeyPressed('KeyP')) {
        screenState = SCREENS.PAUSE;
        announce('Game paused.');
      } else {
        world.step(dt, input, hud);
        hud.update(dt);

        if (world.isGameOver) {
          screenState = SCREENS.GAMEOVER;
          hud.saveBestScore(world.score);
          audio.setBeamActive(false, 0);
          announce(`Game over. Final score: ${world.score}. Press R to reignite.`);
        }
      }
    } else if (screenState === SCREENS.GAMEOVER) {
      world.particles.update(dt);
      hud.update(dt);

      // Instant one-key restart
      if (input.wasKeyPressed('KeyR') || input.wasClicked()) {
        restartGame();
      }
    } else if (screenState === SCREENS.PAUSE) {
      if (input.wasKeyPressed('Escape') || input.wasKeyPressed('KeyP')) {
        screenState = SCREENS.PLAY;
        announce('Game resumed.');
      } else if (input.wasKeyPressed('KeyR')) {
        restartGame();
      }
    }

    // Flush single-frame input triggers
    input.flush();

    // Render current frame
    renderer.render(world, hud, screenState);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame((time) => {
    lastTime = time;
    requestAnimationFrame(loop);
  });
}

window.addEventListener('DOMContentLoaded', init);
