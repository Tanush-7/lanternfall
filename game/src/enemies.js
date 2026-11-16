// Shadow enemies, AI behaviors, and projectile systems for LANTERNFALL

import { ENEMY_DEFS, ENEMY_TYPES, ARENA, BEAM } from './config.js';
import { audio } from './audio.js';

export class ShadowProjectile {
  constructor(x, y, vx, vy, damage = 14) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = 7;
    this.life = 4.0;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    // Dark ominous purple projectile with glowing magenta core
    const grad = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.radius * 2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#d500f9');
    grad.addColorStop(0.7, '#4a0072');
    grad.addColorStop(1, 'rgba(74, 0, 114, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class Enemy {
  constructor(type, x, y) {
    this.type = type;
    this.def = ENEMY_DEFS[type];
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;

    this.hp = this.def.hp;
    this.maxHp = this.def.hp;
    this.radius = this.def.radius;
    this.speed = this.def.speed;
    this.damage = this.def.damage;
    this.score = this.def.score;
    this.oilDrops = this.def.oilDrops;

    this.isBurning = false;
    this.burnFlashTimer = 0;
    this.animTimer = Math.random() * 10;

    // AI state specifics
    this.aiState = 'chase';
    this.stateTimer = 0;
    this.cooldownTimer = 0;

    // Specific enemy timers
    if (type === ENEMY_TYPES.DARTER) {
      this.aiState = 'stalk';
      this.stateTimer = 1.2 + Math.random() * 1.5;
      this.targetAngle = 0;
    } else if (type === ENEMY_TYPES.SPITTER) {
      this.cooldownTimer = 1.0 + Math.random() * 2.0;
    } else if (type === ENEMY_TYPES.BOSS_GOLIATH) {
      this.stompTimer = 3.0;
      this.spawnThresholds = [0.75, 0.5, 0.25];
    } else if (type === ENEMY_TYPES.BOSS_VOIDWEAVER) {
      this.teleportTimer = 4.0;
    }
  }

  update(dt, player, particles, enemyManager) {
    this.animTimer += dt * 6;
    if (this.burnFlashTimer > 0) this.burnFlashTimer -= dt;
    this.isBurning = false;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distToPlayer = Math.hypot(dx, dy);

    // AI Behaviors by shadow type
    switch (this.type) {
      case ENEMY_TYPES.CRAWLER:
        this.updateCrawler(dt, dx, dy, distToPlayer);
        break;
      case ENEMY_TYPES.DARTER:
        this.updateDarter(dt, dx, dy, distToPlayer);
        break;
      case ENEMY_TYPES.SHIELDBEARER:
        this.updateShieldBearer(dt, dx, dy, distToPlayer);
        break;
      case ENEMY_TYPES.SPITTER:
        this.updateSpitter(dt, player, dx, dy, distToPlayer, enemyManager);
        break;
      case ENEMY_TYPES.BOSS_GOLIATH:
        this.updateGoliath(dt, player, dx, dy, distToPlayer, particles, enemyManager);
        break;
      case ENEMY_TYPES.BOSS_VOIDWEAVER:
        this.updateVoidweaver(dt, player, dx, dy, distToPlayer, particles, enemyManager);
        break;
    }

    // Move
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Constrain inside arena ring
    const distFromCenter = Math.hypot(this.x - ARENA.centerX, this.y - ARENA.centerY);
    const maxDist = ARENA.radius - this.radius;
    if (distFromCenter > maxDist) {
      const a = Math.atan2(this.y - ARENA.centerY, this.x - ARENA.centerX);
      this.x = ARENA.centerX + Math.cos(a) * maxDist;
      this.y = ARENA.centerY + Math.sin(a) * maxDist;
    }
  }

  updateCrawler(dt, dx, dy, dist) {
    if (dist > 1) {
      this.angle = Math.atan2(dy, dx);
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
    }
  }

  updateDarter(dt, dx, dy, dist) {
    this.stateTimer -= dt;

    if (this.aiState === 'stalk') {
      // Circle player at distance
      const baseAngle = Math.atan2(dy, dx);
      const orbitAngle = baseAngle + Math.PI / 2 + Math.sin(this.animTimer) * 0.4;
      this.angle = baseAngle;

      this.vx = Math.cos(orbitAngle) * this.speed;
      this.vy = Math.sin(orbitAngle) * this.speed;

      if (this.stateTimer <= 0) {
        // Prepare dash
        this.aiState = 'charge';
        this.stateTimer = 0.65;
        this.targetAngle = Math.atan2(dy, dx);
        this.angle = this.targetAngle;
      }
    } else if (this.aiState === 'charge') {
      // High speed straight line lunge
      this.angle = this.targetAngle;
      this.vx = Math.cos(this.targetAngle) * this.def.dashSpeed;
      this.vy = Math.sin(this.targetAngle) * this.def.dashSpeed;

      if (this.stateTimer <= 0) {
        this.aiState = 'recover';
        this.stateTimer = 0.8;
      }
    } else if (this.aiState === 'recover') {
      // Slow drift
      this.vx *= 0.9;
      this.vy *= 0.9;
      if (this.stateTimer <= 0) {
        this.aiState = 'stalk';
        this.stateTimer = 1.4 + Math.random() * 1.2;
      }
    }
  }

  updateShieldBearer(dt, dx, dy, dist) {
    // Face player directly with front shield
    if (dist > 1) {
      this.angle = Math.atan2(dy, dx);
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
    }
  }

  updateSpitter(dt, player, dx, dy, dist, enemyManager) {
    this.angle = Math.atan2(dy, dx);
    this.cooldownTimer -= dt;

    // Maintain preferred distance (around 170px)
    const idealDist = 175;
    if (dist < idealDist - 30) {
      // Back away
      this.vx = -Math.cos(this.angle) * this.speed;
      this.vy = -Math.sin(this.angle) * this.speed;
    } else if (dist > idealDist + 40) {
      // Move closer
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
    } else {
      // Orbit
      const strafe = this.angle + Math.PI / 2;
      this.vx = Math.cos(strafe) * this.speed * 0.7;
      this.vy = Math.sin(strafe) * this.speed * 0.7;
    }

    // Shoot projectile
    if (this.cooldownTimer <= 0) {
      this.cooldownTimer = this.def.shotCooldown;
      const projSpeed = 150;
      const vx = Math.cos(this.angle) * projSpeed;
      const vy = Math.sin(this.angle) * projSpeed;
      enemyManager.spawnProjectile(this.x, this.y, vx, vy, this.damage);
    }
  }

  updateGoliath(dt, player, dx, dy, dist, particles, enemyManager) {
    this.angle = Math.atan2(dy, dx);
    this.stompTimer -= dt;

    // Frenzy speedup below 35% HP
    const currentSpeed = this.hp < this.maxHp * 0.35 ? this.speed * 1.4 : this.speed;
    this.vx = Math.cos(this.angle) * currentSpeed;
    this.vy = Math.sin(this.angle) * currentSpeed;

    // Ground stomp shockwave
    if (this.stompTimer <= 0) {
      this.stompTimer = this.def.stompInterval;
      audio.playBossStomp();
      particles.spawnShockwave(this.x, this.y, 160, 0.65, '#ff2244');
      particles.spawnShockwave(this.x, this.y, 220, 0.9, '#ffaa00');

      // Check shockwave hit on player
      enemyManager.triggerBossShockwave(this.x, this.y, 200, 20);
    }

    // Spawn crawler reinforcements on HP thresholds
    if (this.spawnThresholds.length > 0 && this.hp / this.maxHp <= this.spawnThresholds[0]) {
      this.spawnThresholds.shift();
      enemyManager.spawnReinforcements(3);
    }
  }

  updateVoidweaver(dt, player, dx, dy, dist, particles, enemyManager) {
    this.angle = Math.atan2(dy, dx);
    this.teleportTimer -= dt;

    this.vx = Math.cos(this.angle) * this.speed * 0.5;
    this.vy = Math.sin(this.angle) * this.speed * 0.5;

    if (this.teleportTimer <= 0) {
      this.teleportTimer = this.def.teleportInterval;
      // Teleport
      particles.spawnShadowDeath(this.x, this.y, 12);
      const newAngle = Math.random() * Math.PI * 2;
      const newDist = 80 + Math.random() * 120;
      this.x = ARENA.centerX + Math.cos(newAngle) * newDist;
      this.y = ARENA.centerY + Math.sin(newAngle) * newDist;
      particles.spawnShadowDeath(this.x, this.y, 14);

      // Fire spiral shots
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        enemyManager.spawnProjectile(this.x, this.y, Math.cos(a) * 130, Math.sin(a) * 130, 16);
      }
    }
  }

  /**
   * Evaluates if this enemy takes damage from the lantern beam
   * @param {Object} player
   * @param {number} dt
   * @param {ParticleSystem} particles
   * @returns {boolean} true if damaged
   */
  applyBeamBurn(player, dt, particles) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const dist = Math.hypot(dx, dy);

    // Out of beam range
    if (dist > BEAM.range + this.radius) return false;

    // Angle from player to enemy
    const angleToEnemy = Math.atan2(dy, dx);
    let angleDiff = angleToEnemy - player.aimAngle;
    // Normalize to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const halfSpread = BEAM.spreadAngle / 2 + (this.radius / dist);
    if (Math.abs(angleDiff) > halfSpread) return false;

    // Enemy is inside beam! Check special shields
    if (this.type === ENEMY_TYPES.SHIELDBEARER) {
      // Check if beam is hitting the front shield
      // The shield faces in direction this.angle
      // Vector from enemy to player is (-dx, -dy)
      const toPlayerAngle = Math.atan2(-dy, -dx);
      let shieldDiff = this.angle - toPlayerAngle;
      while (shieldDiff > Math.PI) shieldDiff -= Math.PI * 2;
      while (shieldDiff < -Math.PI) shieldDiff += Math.PI * 2;

      // If hitting the front arc of shieldbearer: DEFLECTED!
      if (Math.abs(shieldDiff) < this.def.shieldAngle / 2) {
        // Beam deflected by front shield
        if (Math.random() < 0.4) {
          particles.spawnBurnSparks(this.x, this.y, 2);
        }
        return false;
      }
    }

    // Takes burn damage!
    const burnDamage = BEAM.dps * dt;
    this.hp -= burnDamage;
    this.isBurning = true;
    this.burnFlashTimer = 0.08;

    // Push back slightly (stagger)
    const pushSpeed = BEAM.knockback;
    this.vx += (dx / dist) * pushSpeed * dt * 3;
    this.vy += (dy / dist) * pushSpeed * dt * 3;

    // Visuals & audio
    particles.spawnBurnSparks(this.x, this.y, 1);
    audio.playSizzle();

    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Burning / hit glow effect
    if (this.burnFlashTimer > 0) {
      ctx.shadowColor = '#ffc857';
      ctx.shadowBlur = 15;
    }

    ctx.rotate(this.angle);

    // Render by type
    switch (this.type) {
      case ENEMY_TYPES.CRAWLER:
        this.drawCrawler(ctx);
        break;
      case ENEMY_TYPES.DARTER:
        this.drawDarter(ctx);
        break;
      case ENEMY_TYPES.SHIELDBEARER:
        this.drawShieldBearer(ctx);
        break;
      case ENEMY_TYPES.SPITTER:
        this.drawSpitter(ctx);
        break;
      case ENEMY_TYPES.BOSS_GOLIATH:
        this.drawGoliath(ctx);
        break;
      case ENEMY_TYPES.BOSS_VOIDWEAVER:
        this.drawVoidweaver(ctx);
        break;
    }

    ctx.restore();

    // Health bar above head (for damaged enemies or bosses)
    if (this.hp < this.maxHp || this.type === ENEMY_TYPES.BOSS_GOLIATH || this.type === ENEMY_TYPES.BOSS_VOIDWEAVER) {
      this.drawHealthBar(ctx);
    }
  }

  drawCrawler(ctx) {
    // Skittering legs
    const legWiggle = Math.sin(this.animTimer * 2.5) * 4;
    ctx.strokeStyle = '#221428';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(0, i * 6);
      ctx.lineTo(legWiggle, i * 14);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-4, i * 6);
      ctx.lineTo(-6 - legWiggle, i * 13);
      ctx.stroke();
    }

    // Shadow body
    ctx.fillStyle = this.burnFlashTimer > 0 ? '#ff8400' : '#1a0d21';
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius, this.radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing spider eyes
    ctx.fillStyle = this.def.eyeColor;
    ctx.beginPath();
    ctx.arc(this.radius * 0.5, -2, 1.6, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.5, 2, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawDarter(ctx) {
    // Sleek aerodynamic shadow dart
    ctx.fillStyle = this.burnFlashTimer > 0 ? '#ffaa00' : '#0e1224';
    ctx.beginPath();
    ctx.moveTo(this.radius * 1.3, 0);
    ctx.lineTo(-this.radius, -this.radius * 0.8);
    ctx.lineTo(-this.radius * 0.5, 0);
    ctx.lineTo(-this.radius, this.radius * 0.8);
    ctx.closePath();
    ctx.fill();

    // Edge outline
    ctx.strokeStyle = '#263463';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Single intense cyan piercing eye
    ctx.fillStyle = this.aiState === 'charge' ? '#ffffff' : this.def.eyeColor;
    ctx.shadowColor = this.def.eyeColor;
    ctx.shadowBlur = this.aiState === 'charge' ? 12 : 6;
    ctx.beginPath();
    ctx.arc(this.radius * 0.4, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawShieldBearer(ctx) {
    // Bulky body
    ctx.fillStyle = this.burnFlashTimer > 0 ? '#ff9900' : '#14121a';
    ctx.beginPath();
    ctx.arc(-2, 0, this.radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Glowing vulnerable core behind shield
    ctx.fillStyle = '#ff7b00';
    ctx.shadowColor = '#ff7b00';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(-6, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Massive Frontal Obsidian Shield Carapace
    ctx.fillStyle = '#2d2b38';
    ctx.beginPath();
    ctx.arc(4, 0, this.radius, -this.def.shieldAngle / 2, this.def.shieldAngle / 2);
    ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#524e66';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(4, 0, this.radius, -this.def.shieldAngle / 2, this.def.shieldAngle / 2);
    ctx.stroke();
  }

  drawSpitter(ctx) {
    // Ethereal wisp body with floating dark tendrils
    const pulse = Math.sin(this.animTimer) * 2;
    ctx.fillStyle = this.burnFlashTimer > 0 ? '#ff9900' : '#1c0f2b';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + pulse * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#5c2282';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Orbiting wisps
    for (let i = 0; i < 3; i++) {
      const a = this.animTimer * 1.5 + (i * Math.PI * 2) / 3;
      const ox = Math.cos(a) * (this.radius + 6);
      const oy = Math.sin(a) * (this.radius + 6);
      ctx.fillStyle = '#cf53ff';
      ctx.beginPath();
      ctx.arc(ox, oy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Menacing eye
    ctx.fillStyle = this.def.eyeColor;
    ctx.beginPath();
    ctx.arc(3, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGoliath(ctx) {
    // Huge towering behemoth
    ctx.fillStyle = this.burnFlashTimer > 0 ? '#ff6600' : '#0e0b12';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ancient craggy armor plates
    ctx.strokeStyle = '#382e42';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Horns / Spikes
    ctx.fillStyle = '#1e1826';
    ctx.beginPath();
    ctx.moveTo(this.radius * 0.8, -this.radius * 0.6);
    ctx.lineTo(this.radius * 1.4, -this.radius * 0.9);
    ctx.lineTo(this.radius * 0.5, -this.radius * 0.3);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.radius * 0.8, this.radius * 0.6);
    ctx.lineTo(this.radius * 1.4, this.radius * 0.9);
    ctx.lineTo(this.radius * 0.5, this.radius * 0.3);
    ctx.fill();

    // Glowing blazing eyes
    ctx.fillStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(this.radius * 0.5, -8, 4.5, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.5, 8, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawVoidweaver(ctx) {
    // Teleporting shadow sorcerer
    ctx.fillStyle = this.burnFlashTimer > 0 ? '#ff8800' : '#080a17';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#382f6e';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Mystic shadow ring
    ctx.strokeStyle = '#b700ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 10, this.animTimer, this.animTimer + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing core
    ctx.fillStyle = '#e040fb';
    ctx.shadowColor = '#e040fb';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(4, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawHealthBar(ctx) {
    const barW = Math.max(28, this.radius * 1.8);
    const barH = 4;
    const barX = this.x - barW / 2;
    const barY = this.y - this.radius - 10;
    const pct = Math.max(0, Math.min(1, this.hp / this.maxHp));

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = pct > 0.35 ? '#d62828' : '#ff4d4d';
    ctx.fillRect(barX, barY, barW * pct, barH);

    ctx.strokeStyle = '#332f3d';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.restore();
  }
}

export class EnemyManager {
  constructor() {
    this.enemies = [];
    this.projectiles = [];
    this.bossShockwaves = [];
  }

  reset() {
    this.enemies = [];
    this.projectiles = [];
    this.bossShockwaves = [];
  }

  spawnEnemy(type, x, y) {
    const enemy = new Enemy(type, x, y);
    this.enemies.push(enemy);
    return enemy;
  }

  spawnProjectile(x, y, vx, vy, damage) {
    this.projectiles.push(new ShadowProjectile(x, y, vx, vy, damage));
  }

  triggerBossShockwave(x, y, radius, damage) {
    this.bossShockwaves.push({ x, y, radius, damage, triggered: false });
  }

  spawnReinforcements(count = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const x = ARENA.centerX + Math.cos(angle) * (ARENA.radius - 15);
      const y = ARENA.centerY + Math.sin(angle) * (ARENA.radius - 15);
      this.spawnEnemy(ENEMY_TYPES.CRAWLER, x, y);
    }
  }

  update(dt, player, particles, onEnemyKill) {
    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, player, particles, this);

      // Apply beam burn if beam is firing
      if (player.isFiring) {
        enemy.applyBeamBurn(player, dt, particles);
      }

      // Check death
      if (enemy.hp <= 0) {
        onEnemyKill(enemy);
        particles.spawnShadowDeath(enemy.x, enemy.y, enemy.type.startsWith('boss') ? 35 : 16);
        audio.playEnemyDeath();
        this.enemies.splice(i, 1);
        continue;
      }

      // Check contact damage with player
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (dist < player.radius + enemy.radius) {
        player.takeDamage(enemy.damage);
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const alive = proj.update(dt);

      // Check if projectile was burned by lantern beam
      if (player.isFiring) {
        const pdx = proj.x - player.x;
        const pdy = proj.y - player.y;
        const pdist = Math.hypot(pdx, pdy);
        if (pdist <= BEAM.range) {
          const pAngle = Math.atan2(pdy, pdx);
          let pDiff = pAngle - player.aimAngle;
          while (pDiff > Math.PI) pDiff -= Math.PI * 2;
          while (pDiff < -Math.PI) pDiff += Math.PI * 2;
          if (Math.abs(pDiff) < BEAM.spreadAngle / 2) {
            // Burned out!
            particles.spawnBurnSparks(proj.x, proj.y, 3);
            this.projectiles.splice(i, 1);
            continue;
          }
        }
      }

      if (!alive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Hit player?
      const pdist = Math.hypot(player.x - proj.x, player.y - proj.y);
      if (pdist < player.radius + proj.radius) {
        player.takeDamage(proj.damage);
        particles.spawnBurnSparks(proj.x, proj.y, 4);
        this.projectiles.splice(i, 1);
      }
    }

    // Process shockwaves
    for (let i = this.bossShockwaves.length - 1; i >= 0; i--) {
      const sw = this.bossShockwaves[i];
      const dist = Math.hypot(player.x - sw.x, player.y - sw.y);
      if (dist < sw.radius) {
        player.takeDamage(sw.damage);
      }
      this.bossShockwaves.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const proj of this.projectiles) {
      proj.draw(ctx);
    }
    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }
  }
}
