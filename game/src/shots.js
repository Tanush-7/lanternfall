// Deterministic scene staging for automated competition screenshot capture
// Accessible via ?shot=title|play|boss|end

import { SCREENS, ENEMY_TYPES, ARENA, BEAM } from './config.js';

export function stageShot(name, world, hud) {
  world.reset();
  hud.reset();

  if (name === 'play') {
    // Stage an intense mid-game play scene
    world.waves.prepareWave(2);
    world.player.x = ARENA.centerX - 35;
    world.player.y = ARENA.centerY + 15;
    world.player.aimAngle = -0.35; // aiming up-right
    world.player.isFiring = true;
    world.player.oil = 84;
    world.player.heat = 48;
    world.score = 3680;
    world.combo = 3;

    // Spawn targeted enemies being burned
    const e1 = world.enemies.spawnEnemy(ENEMY_TYPES.CRAWLER, world.player.x + 95, world.player.y - 45);
    e1.hp = 8;
    e1.burnFlashTimer = 0.5;

    const e2 = world.enemies.spawnEnemy(ENEMY_TYPES.DARTER, world.player.x + 155, world.player.y - 70);
    e2.hp = 22;
    e2.burnFlashTimer = 0.4;

    const e3 = world.enemies.spawnEnemy(ENEMY_TYPES.CRAWLER, world.player.x - 110, world.player.y + 60);
    const e4 = world.enemies.spawnEnemy(ENEMY_TYPES.CRAWLER, world.player.x + 40, world.player.y + 110);

    // Scattered oil pickups
    world.pickups.spawnDrops(world.player.x - 60, world.player.y - 30, 2);
    world.pickups.spawnDrops(world.player.x + 45, world.player.y - 80, 2);

    // Particles along beam
    const lx = world.player.x + Math.cos(world.player.aimAngle) * 16;
    const ly = world.player.y + Math.sin(world.player.aimAngle) * 16;
    world.particles.spawnBeamSparks(lx, ly, world.player.aimAngle, BEAM.spreadAngle, 12);
    world.particles.spawnBurnSparks(e1.x, e1.y, 8);
    hud.addFloatingText('+180', e1.x, e1.y - 12, '#ffd166', 15);
    hud.addFloatingText('x3', e1.x, e1.y - 28, '#ff9e2c', 13);

    return SCREENS.PLAY;
  }

  if (name === 'boss') {
    // Stage an epic boss battle (Wave 5: The Umbral Goliath)
    world.waves.prepareWave(5);
    world.player.x = ARENA.centerX - 100;
    world.player.y = ARENA.centerY + 50;
    world.player.aimAngle = -0.55;
    world.player.isFiring = true;
    world.player.oil = 72;
    world.player.heat = 65;
    world.score = 8450;
    world.combo = 2;

    // Goliath Boss
    const goliath = world.enemies.spawnEnemy(ENEMY_TYPES.BOSS_GOLIATH, ARENA.centerX + 50, ARENA.centerY - 50);
    goliath.hp = 340;
    goliath.burnFlashTimer = 0.5;
    world.waves.boss = goliath;

    // Escorts
    world.enemies.spawnEnemy(ENEMY_TYPES.SHIELDBEARER, ARENA.centerX + 110, ARENA.centerY + 40);
    world.enemies.spawnEnemy(ENEMY_TYPES.CRAWLER, ARENA.centerX - 40, ARENA.centerY - 90);

    // Shockwaves & particles
    world.particles.spawnShockwave(goliath.x, goliath.y, 140, 0.8, '#ff2244');
    world.particles.spawnBurnSparks(goliath.x, goliath.y, 12);

    const lx = world.player.x + Math.cos(world.player.aimAngle) * 16;
    const ly = world.player.y + Math.sin(world.player.aimAngle) * 16;
    world.particles.spawnBeamSparks(lx, ly, world.player.aimAngle, BEAM.spreadAngle, 14);

    hud.addFloatingText('BURN -92', goliath.x, goliath.y - 38, '#ff9e2c', 16);

    return SCREENS.PLAY;
  }

  if (name === 'end') {
    // Stage the Game Over screen
    world.score = 11420;
    world.kills = 48;
    world.waves.wave = 6;
    hud.saveBestScore(15600);
    return SCREENS.GAMEOVER;
  }

  // Default: Title screen with ambient atmosphere
  for (let i = 0; i < 35; i++) {
    world.particles.spawnEmber(
      ARENA.centerX + (Math.random() - 0.5) * 300,
      ARENA.centerY + (Math.random() - 0.5) * 300,
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 15,
      '#ffd166',
      2.0,
      2.0,
    );
  }
  hud.saveBestScore(15600);
  return SCREENS.TITLE;
}
