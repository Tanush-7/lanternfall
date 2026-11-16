// Wave spawner, progression, and night cycle manager for LANTERNFALL

import { ENEMY_TYPES, ARENA } from './config.js';
import { audio } from './audio.js';

export class WaveManager {
  constructor(enemyManager) {
    this.enemyManager = enemyManager;
    this.reset();
  }

  reset() {
    this.wave = 1;
    this.night = 1;
    this.state = 'spawning'; // 'spawning' | 'fighting' | 'cleared'
    this.breakTimer = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.5;
    this.enemiesRemaining = 0;
    this.totalEnemies = 0;
    this.banner = { text: 'NIGHT I · WAVE 1: THE CREEPING DARK', subtext: 'Aim lantern beam with mouse. Pulse to avoid overheating.', timer: 4.5 };
    this.bossActive = false;
    this.boss = null;

    this.prepareWave(1);
  }

  getWaveTitle(wave) {
    switch (wave) {
      case 1:
        return { title: 'NIGHT I · WAVE 1: THE CREEPING DARK', sub: 'Burn the skittering crawlers with your lantern beam.' };
      case 2:
        return { title: 'NIGHT I · WAVE 2: SHIFTING GHOSTS', sub: 'Night Darters will circle and dash. Time your beam.' };
      case 3:
        return { title: 'NIGHT I · WAVE 3: THE BULWARK', sub: 'Shield-Bearers deflect frontal light. Maneuver behind them!' };
      case 4:
        return { title: 'NIGHT II · WAVE 4: UMBRAL PHANTOMS', sub: 'Shadow Wisps cast dark orbs. Burn or evade them.' };
      case 5:
        return { title: 'NIGHT II · WAVE 5: THE UMBRAL GOLIATH', sub: 'BOSS ENCOUNTER: Evade ground shockwaves!' };
      case 6:
        return { title: 'NIGHT II · WAVE 6: TWILIGHT SIEGE', sub: 'All shadow breeds unite against the flame.' };
      case 7:
        return { title: 'NIGHT III · WAVE 7: THE BLACK TEMPEST', sub: 'Keep moving and harvest oil before it fades.' };
      case 8:
        return { title: 'NIGHT III · WAVE 8: IRON SHADOWS', sub: 'Heavily armored vanguard swarming in pairs.' };
      case 9:
        return { title: 'NIGHT III · WAVE 9: MIDNIGHT SURGE', sub: 'Hold back the encroaching darkness.' };
      case 10:
        return { title: 'NIGHT IV · WAVE 10: THE VOIDWEAVER', sub: 'BOSS ENCOUNTER: Lord of shadows, weaver of the dark!' };
      default:
        return {
          title: `NIGHT ${Math.floor((wave - 1) / 3) + 1} · WAVE ${wave}: ENDLESS NIGHT`,
          sub: 'The shadows know no end. How long can your light endure?',
        };
    }
  }

  prepareWave(waveNum) {
    this.wave = waveNum;
    this.night = Math.floor((waveNum - 1) / 3) + 1;
    this.spawnQueue = [];
    this.bossActive = false;
    this.boss = null;

    const bannerInfo = this.getWaveTitle(waveNum);
    this.banner = {
      text: bannerInfo.title,
      subtext: bannerInfo.sub,
      timer: 4.0,
    };
    audio.playWaveBanner();

    // Construct wave roster based on wave number
    if (waveNum === 5) {
      // Wave 5 Boss: Umbral Goliath
      this.bossActive = true;
      this.spawnQueue.push(ENEMY_TYPES.BOSS_GOLIATH);
      this.spawnQueue.push(ENEMY_TYPES.CRAWLER, ENEMY_TYPES.CRAWLER, ENEMY_TYPES.CRAWLER);
    } else if (waveNum === 10) {
      // Wave 10 Boss: The Voidweaver
      this.bossActive = true;
      this.spawnQueue.push(ENEMY_TYPES.BOSS_VOIDWEAVER);
      this.spawnQueue.push(ENEMY_TYPES.DARTER, ENEMY_TYPES.DARTER);
    } else {
      // Regular wave composition
      const count = 6 + waveNum * 3;
      for (let i = 0; i < count; i++) {
        let type = ENEMY_TYPES.CRAWLER;

        if (waveNum >= 4) {
          const r = Math.random();
          if (r < 0.40) type = ENEMY_TYPES.CRAWLER;
          else if (r < 0.65) type = ENEMY_TYPES.DARTER;
          else if (r < 0.85) type = ENEMY_TYPES.SHIELDBEARER;
          else type = ENEMY_TYPES.SPITTER;
        } else if (waveNum === 3) {
          const r = Math.random();
          if (r < 0.45) type = ENEMY_TYPES.CRAWLER;
          else if (r < 0.75) type = ENEMY_TYPES.DARTER;
          else type = ENEMY_TYPES.SHIELDBEARER;
        } else if (waveNum === 2) {
          type = Math.random() < 0.55 ? ENEMY_TYPES.CRAWLER : ENEMY_TYPES.DARTER;
        } else {
          type = ENEMY_TYPES.CRAWLER;
        }

        this.spawnQueue.push(type);
      }
    }

    this.totalEnemies = this.spawnQueue.length;
    this.enemiesRemaining = this.totalEnemies;
    this.state = 'spawning';
    this.spawnTimer = 0.6;
    this.spawnInterval = Math.max(0.35, 1.0 - waveNum * 0.05);
  }

  update(dt, onWaveComplete) {
    if (this.banner.timer > 0) {
      this.banner.timer -= dt;
    }

    if (this.state === 'cleared') {
      this.breakTimer -= dt;
      if (this.breakTimer <= 0) {
        this.prepareWave(this.wave + 1);
      }
      return;
    }

    // Spawning enemies from queue
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = this.spawnInterval;
        const type = this.spawnQueue.shift();

        // Spawn along the arena outer perimeter
        const angle = Math.random() * Math.PI * 2;
        const dist = ARENA.radius - 12;
        const x = ARENA.centerX + Math.cos(angle) * dist;
        const y = ARENA.centerY + Math.sin(angle) * dist;

        const spawned = this.enemyManager.spawnEnemy(type, x, y);
        if (type.startsWith('boss') || type === ENEMY_TYPES.BOSS_GOLIATH || type === ENEMY_TYPES.BOSS_VOIDWEAVER) {
          this.boss = spawned;
        }
      }
    } else {
      this.state = 'fighting';
    }

    // Check if wave is cleared
    if (this.state === 'fighting' && this.enemyManager.enemies.length === 0) {
      this.state = 'cleared';
      this.breakTimer = 2.8;
      this.banner = {
        text: `WAVE ${this.wave} PURGED`,
        subtext: 'The shadows retreat into the dark... prepare yourself.',
        timer: 2.8,
      };
      onWaveComplete(this.wave);
    }
  }
}
