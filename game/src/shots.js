// Deterministic scene staging for automated competition screenshot capture
// Accessible via ?shot=title|play|boss|end

import { SCREENS, ENEMY_TYPES, ARENA, BEAM } from './config.js';

export function stageShot(name, world, hud) {
  world.reset();
  hud.reset();

  if (name === 'play') {
    // Stage an intense, radiant mid-game combat scene filling the frame
    world.waves.prepareWave(3);
    world.player.x = ARENA.centerX - 70;
    world.player.y = ARENA.centerY + 25;
    world.player.aimAngle = -0.40; // aiming up-right
    world.player.isFiring = true;
    world.player.oil = 86;
    world.player.heat = 58;
    world.score = 5420;
    world.combo = 4;

    // 1. Crawler being incinerated directly in the lantern beam
    const e1 = world.enemies.spawnEnemy(ENEMY_TYPES.CRAWLER, world.player.x + 105, world.player.y - 45);
    e1.hp = 6;
    e1.burnFlashTimer = 0.5;

    // 2. Night Darter charging with flared razor wings and cyan energy
    const e2 = world.enemies.spawnEnemy(ENEMY_TYPES.DARTER, world.player.x + 185, world.player.y - 75);
    e2.hp = 18;
    e2.aiState = 'charge';
    e2.targetAngle = Math.PI - 0.40;
    e2.angle = e2.targetAngle;
    e2.burnFlashTimer = 0.4;

    // 3. Shield-Bearer with runic shield deflecting light
    const e3 = world.enemies.spawnEnemy(ENEMY_TYPES.SHIELDBEARER, world.player.x + 145, world.player.y + 48);
    e3.angle = Math.PI - 0.25;
    e3.shieldFlashTimer = 0.5;

    // 4. Flanking Crawler from the lower shadows
    const e4 = world.enemies.spawnEnemy(ENEMY_TYPES.CRAWLER, world.player.x - 45, world.player.y + 95);
    e4.angle = -Math.PI * 0.45;

    // 5. Shadow Wisp hovering at upper perimeter casting dark orb
    const e5 = world.enemies.spawnEnemy(ENEMY_TYPES.SPITTER, world.player.x + 40, world.player.y - 125);
    e5.angle = Math.PI * 0.6;
    world.enemies.spawnProjectile(world.player.x + 75, world.player.y - 75, -95, 80, 14);

    // Scattered glowing oil pickups
    world.pickups.spawnDrops(world.player.x - 70, world.player.y - 35, 2);
    world.pickups.spawnDrops(world.player.x + 45, world.player.y - 95, 2);

    // Dynamic dash ghost afterimage behind Keeper
    world.particles.spawnDashGhosts(world.player.x - 30, world.player.y + 12, world.player.aimAngle);

    // Rich volumetric particles along radiant beam
    const lx = world.player.x + Math.cos(world.player.aimAngle) * 16;
    const ly = world.player.y + Math.sin(world.player.aimAngle) * 16;
    world.particles.spawnBeamSparks(lx, ly, world.player.aimAngle, BEAM.spreadAngle, 16);
    world.particles.spawnBurnSparks(e1.x, e1.y, 12);

    // Deflection sparks off shield
    for (let s = 0; s < 6; s++) {
      const spd = 120 + Math.random() * 140;
      const sang = e3.angle + Math.PI + (Math.random() - 0.5) * 1.2;
      world.particles.spawnSpark(e3.x, e3.y, Math.cos(sang) * spd, Math.sin(sang) * spd, '#ffd54f', 2.5, 0.35);
    }

    // Floating combat typography
    hud.addFloatingText('+240', e1.x - 15, e1.y - 16, '#ffd54f', 16);
    hud.addFloatingText('★ COMBO x4 ★', e1.x + 35, e1.y - 42, '#ff9100', 14);
    hud.addFloatingText('DEFLECTED', e3.x, e3.y - 28, '#80deea', 13);
    hud.saveBestScore(16500);

    return SCREENS.PLAY;
  }

  if (name === 'boss') {
    // Stage an epic boss battle at peak chaos (Wave 5: The Umbral Goliath)
    world.waves.prepareWave(5);
    world.player.x = ARENA.centerX - 110;
    world.player.y = ARENA.centerY + 55;
    world.player.aimAngle = -0.48;
    world.player.isFiring = true;
    world.player.oil = 74;
    world.player.heat = 68;
    world.score = 11850;
    world.combo = 3;

    // Goliath Boss in combat stance with molten magma veins
    const goliath = world.enemies.spawnEnemy(ENEMY_TYPES.BOSS_GOLIATH, ARENA.centerX + 50, ARENA.centerY - 45);
    goliath.hp = 280; // enraged frenzy
    goliath.burnFlashTimer = 0.5;
    world.waves.boss = goliath;

    // Escorts surrounding the battle
    world.enemies.spawnEnemy(ENEMY_TYPES.SHIELDBEARER, ARENA.centerX + 120, ARENA.centerY + 32);
    const darter = world.enemies.spawnEnemy(ENEMY_TYPES.DARTER, ARENA.centerX - 60, ARENA.centerY - 95);
    darter.aiState = 'charge';
    darter.angle = 1.1;

    const spitter = world.enemies.spawnEnemy(ENEMY_TYPES.SPITTER, ARENA.centerX + 115, ARENA.centerY - 105);
    world.enemies.spawnProjectile(ARENA.centerX + 85, ARENA.centerY - 75, -110, 75, 14);

    // Boss Stomp Shockwaves & Ground Fracture Fissures
    world.particles.spawnShockwave(goliath.x, goliath.y, 150, 0.7, '#ff1744', 5.0);
    world.particles.spawnShockwave(goliath.x, goliath.y, 195, 0.9, '#ff9100', 3.5);
    world.particles.spawnFissures(goliath.x, goliath.y, 5, 115, '#ff3d00');
    world.particles.spawnBurnSparks(goliath.x, goliath.y, 10);

    // Keeper Beam & Dash Ghost
    world.particles.spawnDashGhosts(world.player.x - 30, world.player.y + 14, world.player.aimAngle);
    const lx = world.player.x + Math.cos(world.player.aimAngle) * 16;
    const ly = world.player.y + Math.sin(world.player.aimAngle) * 16;
    world.particles.spawnBeamSparks(lx, ly, world.player.aimAngle, BEAM.spreadAngle, 12);

    // Floating combat text & camera impact
    hud.addFloatingText('CRITICAL BURN -165', goliath.x + 35, goliath.y - 50, '#ff9100', 18);
    hud.addFloatingText('STOMP SHOCKWAVE!', goliath.x - 35, goliath.y - 15, '#ff1744', 15);
    hud.addFloatingText('★ COMBO x3 ★', world.player.x, world.player.y - 38, '#ffd54f', 14);
    hud.addTrauma(0.35);
    hud.saveBestScore(18450);

    return SCREENS.PLAY;
  }

  if (name === 'end') {
    // Stage the Game Over screen at its most evocative
    world.score = 18450;
    world.kills = 64;
    world.waves.wave = 7;
    hud.saveBestScore(18450);

    // Fading golden cinders drifting in the dark cold sanctuary
    for (let i = 0; i < 40; i++) {
      world.particles.spawnEmber(
        ARENA.centerX + (Math.random() - 0.5) * 340,
        ARENA.centerY + (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 20,
        -15 - Math.random() * 25,
        '#ff9100',
        2.4,
        1.8,
      );
    }

    return SCREENS.GAMEOVER;
  }

  // Default: Title screen with dramatic cinematic presentation
  for (let i = 0; i < 32; i++) {
    world.particles.spawnEmber(
      ARENA.centerX + (Math.random() - 0.5) * 360,
      ARENA.centerY + (Math.random() - 0.5) * 320,
      (Math.random() - 0.5) * 20,
      -18 - Math.random() * 28,
      '#ffd54f',
      2.5,
      2.2,
    );
  }
  hud.saveBestScore(18450);
  return SCREENS.TITLE;
}
