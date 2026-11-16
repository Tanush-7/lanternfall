// Simulation state, gameplay mechanics, and world entity coordinator for LANTERNFALL

import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { PickupManager } from './pickups.js';
import { ParticleSystem } from './particles.js';
import { WaveManager } from './waves.js';

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
  }

  step(dt, input, hud) {
    if (this.isGameOver) return;

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }

    // 1. Update Keeper
    this.player.update(dt, input, this.particles);

    // 2. Check Game Over
    if (this.player.oil <= 0) {
      this.isGameOver = true;
      hud.addTrauma(0.8);
      this.particles.spawnShadowDeath(this.player.x, this.player.y, 40);
      return;
    }

    // 3. Update Shadows / Enemies
    this.enemies.update(dt, this.player, this.particles, (slainEnemy) => {
      // Enemy kill callback
      this.kills += 1;
      this.combo = Math.min(5, this.combo + 1);
      this.comboTimer = 3.2;

      const gainedScore = slainEnemy.score * this.combo;
      this.score += gainedScore;

      hud.addFloatingText(`+${gainedScore}`, slainEnemy.x, slainEnemy.y - 10, '#ffd166', 15);
      if (this.combo > 1) {
        hud.addFloatingText(`x${this.combo}`, slainEnemy.x, slainEnemy.y - 28, '#ff9e2c', 13);
      }

      // Drop Oil Pickups
      this.pickups.spawnDrops(slainEnemy.x, slainEnemy.y, slainEnemy.oilDrops);
    });

    // 4. Update Oil Pickups
    this.pickups.update(dt, this.player, this.player.isFiring, (collectedPickup) => {
      this.player.healOil(collectedPickup.value);
      this.score += 50;
      hud.addFloatingText(`+OIL`, collectedPickup.x, collectedPickup.y, '#ffe17d', 14);
      this.particles.spawnOilCollect(collectedPickup.x, collectedPickup.y, 8);
    });

    // 5. Update Wave Progression
    this.waves.update(dt, (clearedWave) => {
      // Wave complete bonus
      const bonus = clearedWave * 500;
      this.score += bonus;
      hud.addFloatingText(`WAVE BONUS +${bonus}`, this.player.x, this.player.y - 30, '#ffcf56', 18);
      hud.addTrauma(0.25);
    });

    // 6. Update Particles
    this.particles.update(dt);
  }
}
