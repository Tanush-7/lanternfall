// Simulation state, gameplay mechanics, and world entity coordinator for LANTERNFALL

import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { PickupManager } from './pickups.js';
import { ParticleSystem } from './particles.js';
import { WaveManager } from './waves.js';
import { ENEMY_TYPES, ARENA } from './config.js';

export class World {
  constructor() {
    this.player = new Player();
    this.enemies = new EnemyManager();
    this.pickups = new PickupManager();
    this.particles = new ParticleSystem();
    this.waves = new WaveManager(this.enemies);

    this.score = 0;
    this.kills = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.isGameOver = false;

    // Slow-mo cinematic effects on boss kills
    this.timeScale = 1.0;
    this.slowMoTimer = 0;
  }

  reset() {
    this.player.reset();
    this.enemies.reset();
    this.pickups.reset();
    this.particles.reset();
    this.waves.reset();

    this.score = 0;
    this.kills = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.isGameOver = false;

    this.timeScale = 1.0;
    this.slowMoTimer = 0;
  }

  step(dt, input, hud) {
    if (this.isGameOver) return;

    // Slow-mo decay
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= dt;
      if (this.slowMoTimer <= 0) {
        this.timeScale = 1.0;
      }
    }

    const simDt = dt * this.timeScale;

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= simDt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }

    // 1. Update Keeper
    const prevOil = this.player.oil;
    this.player.update(simDt, input, this.particles);

    // Screen flash and shake on player damage
    if (this.player.oil < prevOil - 3) {
      hud.addTrauma(0.45);
      hud.addScreenFlash('#ff1744', 0.35, 0.2);
    }

    // 2. Check Game Over
    if (this.player.oil <= 0) {
      this.isGameOver = true;
      hud.addTrauma(0.85);
      hud.addScreenFlash('#ff1744', 0.6, 0.5);
      this.particles.spawnShadowDeath(this.player.x, this.player.y, 45);
      return;
    }

    // 3. Update Shadows / Enemies
    this.enemies.update(simDt, this.player, this.particles, (slainEnemy) => {
      // Enemy kill callback
      this.kills += 1;
      this.combo = Math.min(5, this.combo + 1);
      this.comboTimer = 3.2;

      const isBoss = slainEnemy.type === ENEMY_TYPES.BOSS_GOLIATH || slainEnemy.type === ENEMY_TYPES.BOSS_VOIDWEAVER;

      if (isBoss) {
        // Slow-mo and glorious screen impact on boss kill!
        this.timeScale = 0.18;
        this.slowMoTimer = 0.75;
        hud.addTrauma(0.95);
        hud.addScreenFlash('#ffffff', 0.75, 0.45);
        hud.addFloatingText('★ BOSS PURGED ★', slainEnemy.x, slainEnemy.y - 48, '#ffd54f', 24);
      } else {
        hud.addTrauma(0.12);
      }

      const gainedScore = slainEnemy.score * this.combo;
      this.score += gainedScore;

      hud.addFloatingText(`+${gainedScore}`, slainEnemy.x, slainEnemy.y - 12, '#ffd54f', 15);
      if (this.combo > 1) {
        hud.addFloatingText(`x${this.combo}`, slainEnemy.x, slainEnemy.y - 30, '#ff9100', 13);
      }

      // Drop Oil Pickups
      this.pickups.spawnDrops(slainEnemy.x, slainEnemy.y, slainEnemy.oilDrops);
    });

    // 4. Update Oil Pickups
    this.pickups.update(simDt, this.player, this.player.isFiring, (collectedPickup) => {
      this.player.healOil(collectedPickup.value);
      this.score += 50;
      hud.addFloatingText(`+OIL`, collectedPickup.x, collectedPickup.y, '#ffe082', 14);
      this.particles.spawnOilCollect(collectedPickup.x, collectedPickup.y, 14);
    });

    // 5. Update Wave Progression
    this.waves.update(simDt, (clearedWave) => {
      const bonus = clearedWave * 500;
      this.score += bonus;
      hud.addFloatingText(`WAVE BONUS +${bonus}`, this.player.x, this.player.y - 32, '#ffd54f', 18);
      hud.addTrauma(0.3);
      hud.addScreenFlash('#ffcf56', 0.28, 0.3);
    });

    // 6. Update Particles (runs in real dt for smooth visuals)
    this.particles.update(dt);

    // 7. Ambient Sanctuary Floating Cinders
    if (Math.random() < 0.28) {
      this.particles.spawnEmber(
        ARENA.centerX + (Math.random() - 0.5) * (ARENA.radius * 1.8),
        ARENA.centerY + (Math.random() - 0.5) * (ARENA.radius * 1.8),
        (Math.random() - 0.5) * 16,
        -12 - Math.random() * 20,
        '#ffd54f',
        2.2,
        1.2,
      );
    }
  }
}
