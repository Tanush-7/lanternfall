// Shadow enemies, AI behaviors, and animated designs for LANTERNFALL

import { ENEMY_DEFS, ENEMY_TYPES, ARENA, BEAM } from './config.js';
import { audio } from './audio.js';

export class ShadowProjectile {
  constructor(x, y, vx, vy, damage = 14) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = 8;
    this.life = 4.0;
    this.animTimer = Math.random() * 10;
  }

  update(dt) {
    this.life -= dt;
    this.animTimer += dt * 10;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    // Swirling dark energy comet with blazing magenta/violet core
    const angle = Math.atan2(this.vy, this.vx);
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Trailing dark energy comet tail
    const tailGrad = ctx.createLinearGradient(-this.radius * 3.5, 0, this.radius, 0);
    tailGrad.addColorStop(0, 'rgba(74, 0, 114, 0)');
    tailGrad.addColorStop(0.5, 'rgba(156, 39, 176, 0.45)');
    tailGrad.addColorStop(1, 'rgba(234, 128, 252, 0.85)');
    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(this.radius, 0);
    ctx.lineTo(-this.radius * 3.5, -this.radius * 1.2);
    ctx.lineTo(-this.radius * 3.5, this.radius * 1.2);
    ctx.closePath();
    ctx.fill();

    // Central glowing void sphere
    const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, this.radius * 2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#f50057');
    grad.addColorStop(0.7, '#6a1b9a');
    grad.addColorStop(1, 'rgba(106, 27, 154, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting dark sparks
    for (let i = 0; i < 3; i++) {
      const a = this.animTimer + (i * Math.PI * 2) / 3;
      const ox = Math.cos(a) * (this.radius * 1.4);
      const oy = Math.sin(a) * (this.radius * 1.4);
      ctx.fillStyle = '#ea80fc';
      ctx.beginPath();
      ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

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
    this.shieldFlashTimer = 0;

    // AI state specifics
    this.aiState = 'chase';
    this.stateTimer = 0;
    this.cooldownTimer = 0;

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
    if (this.shieldFlashTimer > 0) this.shieldFlashTimer -= dt;
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
      const baseAngle = Math.atan2(dy, dx);
      const orbitAngle = baseAngle + Math.PI / 2 + Math.sin(this.animTimer) * 0.4;
      this.angle = baseAngle;

      this.vx = Math.cos(orbitAngle) * this.speed;
      this.vy = Math.sin(orbitAngle) * this.speed;

      if (this.stateTimer <= 0) {
        this.aiState = 'charge';
        this.stateTimer = 0.65;
        this.targetAngle = Math.atan2(dy, dx);
        this.angle = this.targetAngle;
      }
    } else if (this.aiState === 'charge') {
      this.angle = this.targetAngle;
      this.vx = Math.cos(this.targetAngle) * this.def.dashSpeed;
      this.vy = Math.sin(this.targetAngle) * this.def.dashSpeed;

      if (this.stateTimer <= 0) {
        this.aiState = 'recover';
        this.stateTimer = 0.8;
      }
    } else if (this.aiState === 'recover') {
      this.vx *= 0.9;
      this.vy *= 0.9;
      if (this.stateTimer <= 0) {
        this.aiState = 'stalk';
        this.stateTimer = 1.4 + Math.random() * 1.2;
      }
    }
  }

  updateShieldBearer(dt, dx, dy, dist) {
    if (dist > 1) {
      this.angle = Math.atan2(dy, dx);
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
    }
  }

  updateSpitter(dt, player, dx, dy, dist, enemyManager) {
    this.angle = Math.atan2(dy, dx);
    this.cooldownTimer -= dt;

    const idealDist = 175;
    if (dist < idealDist - 30) {
      this.vx = -Math.cos(this.angle) * this.speed;
      this.vy = -Math.sin(this.angle) * this.speed;
    } else if (dist > idealDist + 40) {
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
    } else {
      const strafe = this.angle + Math.PI / 2;
      this.vx = Math.cos(strafe) * this.speed * 0.7;
      this.vy = Math.sin(strafe) * this.speed * 0.7;
    }

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

    const currentSpeed = this.hp < this.maxHp * 0.35 ? this.speed * 1.4 : this.speed;
    this.vx = Math.cos(this.angle) * currentSpeed;
    this.vy = Math.sin(this.angle) * currentSpeed;

    if (this.stompTimer <= 0) {
      this.stompTimer = this.def.stompInterval;
      audio.playBossStomp();
      particles.spawnShockwave(this.x, this.y, 160, 0.65, '#ff2244', 5.0);
      particles.spawnShockwave(this.x, this.y, 220, 0.9, '#ffaa00', 3.5);
      particles.spawnFissures(this.x, this.y, 9, 130, '#ff3d00');

      enemyManager.triggerBossShockwave(this.x, this.y, 200, 20);
    }

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
      particles.spawnShadowDeath(this.x, this.y, 16);
      const newAngle = Math.random() * Math.PI * 2;
      const newDist = 80 + Math.random() * 120;
      this.x = ARENA.centerX + Math.cos(newAngle) * newDist;
      this.y = ARENA.centerY + Math.sin(newAngle) * newDist;
      particles.spawnShadowDeath(this.x, this.y, 18);
      particles.spawnShockwave(this.x, this.y, 120, 0.6, '#d500f9', 3.5);

      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        enemyManager.spawnProjectile(this.x, this.y, Math.cos(a) * 130, Math.sin(a) * 130, 16);
      }
    }
  }

  applyBeamBurn(player, dt, particles) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const dist = Math.hypot(dx, dy);

    if (dist > BEAM.range + this.radius) return false;

    const angleToEnemy = Math.atan2(dy, dx);
    let angleDiff = angleToEnemy - player.aimAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const halfSpread = BEAM.spreadAngle / 2 + (this.radius / dist);
    if (Math.abs(angleDiff) > halfSpread) return false;

    if (this.type === ENEMY_TYPES.SHIELDBEARER) {
      const toPlayerAngle = Math.atan2(-dy, -dx);
      let shieldDiff = this.angle - toPlayerAngle;
      while (shieldDiff > Math.PI) shieldDiff -= Math.PI * 2;
      while (shieldDiff < -Math.PI) shieldDiff += Math.PI * 2;

      // Deflected by front shield!
      if (Math.abs(shieldDiff) < this.def.shieldAngle / 2) {
        this.shieldFlashTimer = 0.12;
        if (Math.random() < 0.6) {
          const sparkAngle = this.angle + Math.PI + (Math.random() - 0.5) * 1.2;
          const spd = 120 + Math.random() * 180;
          particles.spawnSpark(this.x + Math.cos(this.angle) * 14, this.y + Math.sin(this.angle) * 14, Math.cos(sparkAngle) * spd, Math.sin(sparkAngle) * spd, '#ffd166', 2.5, 0.3);
        }
        return false;
      }
    }

    // Takes burn damage
    const burnDamage = BEAM.dps * dt;
    this.hp -= burnDamage;
    this.isBurning = true;
    this.burnFlashTimer = 0.12;

    // Push back slightly (stagger)
    const pushSpeed = BEAM.knockback;
    this.vx += (dx / dist) * pushSpeed * dt * 3;
    this.vy += (dy / dist) * pushSpeed * dt * 3;

    particles.spawnBurnSparks(this.x, this.y, 2);
    audio.playSizzle();

    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Dynamic ground shadow
    ctx.fillStyle = 'rgba(2, 2, 5, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius * 0.45, this.radius * 1.15, this.radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Burning / hit glow effect
    if (this.burnFlashTimer > 0) {
      ctx.shadowColor = '#ff9800';
      ctx.shadowBlur = 18;
    }

    ctx.rotate(this.angle);

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
    // 6 Articulated Skittering Legs with joints
    const legPhase = this.animTimer * 2.8;
    ctx.strokeStyle = this.burnFlashTimer > 0 ? '#ff7700' : '#271731';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';

    for (let side = -1; side <= 1; side += 2) {
      for (let leg = 0; leg < 3; leg++) {
        const offset = leg * 1.1 + (side > 0 ? 0 : Math.PI);
        const wiggle = Math.sin(legPhase + offset) * 6;
        const lift = Math.cos(legPhase + offset) * 3;

        const rootX = (leg - 1) * 4;
        const rootY = side * 5;
        const jointX = rootX + wiggle * 0.4;
        const jointY = side * (12 + lift);
        const tipX = rootX + wiggle;
        const tipY = side * 19;

        ctx.beginPath();
        ctx.moveTo(rootX, rootY);
        ctx.lineTo(jointX, jointY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
      }
    }

    // Segmented Chitin Carapace
    ctx.fillStyle = this.burnFlashTimer > 0 ? '#ff6d00' : '#170c20';
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius, this.radius * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    // Carapace plate highlights
    ctx.strokeStyle = this.burnFlashTimer > 0 ? '#ffa040' : '#3d254e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.7, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();

    // Arachnid Eye Cluster (6 glowing ruby eyes)
    ctx.fillStyle = this.def.eyeColor;
    ctx.shadowColor = this.def.eyeColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.radius * 0.55, -3, 1.8, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.55, 3, 1.8, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.35, -5.5, 1.4, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.35, 5.5, 1.4, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.7, -1, 1.2, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.7, 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawDarter(ctx) {
    const isCharging = this.aiState === 'charge';

    // Sleek razor raptor / mantis shadow needle
    ctx.fillStyle = this.burnFlashTimer > 0 ? '#ff9100' : '#0c1022';
    ctx.beginPath();
    ctx.moveTo(this.radius * 1.5, 0); // razor beak
    // Flared razor wings
    const wingSpread = isCharging ? this.radius * 1.4 : this.radius * 0.85;
    ctx.lineTo(-this.radius * 0.7, -wingSpread);
    ctx.lineTo(-this.radius * 0.35, 0);
    ctx.lineTo(-this.radius * 0.7, wingSpread);
    ctx.closePath();
    ctx.fill();

    // Glowing electric cyan edge trim
    ctx.strokeStyle = isCharging ? '#00e5ff' : '#223868';
    ctx.lineWidth = isCharging ? 2.5 : 1.8;
    ctx.stroke();

    // Charging energy lines along wings
    if (isCharging) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(this.radius * 1.5, 0);
      ctx.lineTo(-this.radius * 0.7, -wingSpread);
      ctx.moveTo(this.radius * 1.5, 0);
      ctx.lineTo(-this.radius * 0.7, wingSpread);
      ctx.stroke();
    }

    // Piercing ocular lens flare
    ctx.fillStyle = isCharging ? '#ffffff' : this.def.eyeColor;
    ctx.shadowColor = this.def.eyeColor;
    ctx.shadowBlur = isCharging ? 16 : 8;
    ctx.beginPath();
    ctx.arc(this.radius * 0.6, 0, isCharging ? 3.5 : 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawShieldBearer(ctx) {
    // Bulky obsidian juggernaut body
    ctx.fillStyle = this.burnFlashTimer > 0 ? '#ff8500' : '#14121c';
    ctx.beginPath();
    ctx.arc(-3, 0, this.radius * 0.78, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Pauldrons
    ctx.fillStyle = '#262335';
    ctx.beginPath();
    ctx.ellipse(-4, -this.radius * 0.65, 6, 9, 0.4, 0, Math.PI * 2);
    ctx.ellipse(-4, this.radius * 0.65, 6, 9, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Exposed Beating Molten Heart Core (Tactical weakpoint telegraph)
    const pulse = 1.0 + 0.25 * Math.sin(this.animTimer * 3.5);
    const coreGrad = ctx.createRadialGradient(-7, 0, 1, -7, 0, 6 * pulse);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.35, '#ff9100');
    coreGrad.addColorStop(0.8, '#d50000');
    coreGrad.addColorStop(1, 'rgba(213, 0, 0, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(-7, 0, 6 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Massive Frontal Obsidian Runic Tower Shield
    const shieldAngle = this.def.shieldAngle;
    const sRadius = this.radius * 1.1;

    ctx.save();
    ctx.fillStyle = '#22202d';
    ctx.beginPath();
    ctx.arc(5, 0, sRadius, -shieldAngle / 2, shieldAngle / 2);
    ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();

    // Shield border & etched runes
    const isDeflecting = this.shieldFlashTimer > 0;
    ctx.strokeStyle = isDeflecting ? '#ffd54f' : '#4f4b66';
    ctx.lineWidth = isDeflecting ? 4.5 : 3.0;
    if (isDeflecting) {
      ctx.shadowColor = '#ffb300';
      ctx.shadowBlur = 14;
    }
    ctx.beginPath();
    ctx.arc(5, 0, sRadius, -shieldAngle / 2, shieldAngle / 2);
    ctx.stroke();

    // Runic crest on shield front
    ctx.strokeStyle = isDeflecting ? '#ffffff' : '#8855bb';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(11, -8);
    ctx.lineTo(16, 0);
    ctx.lineTo(11, 8);
    ctx.moveTo(8, 0);
    ctx.lineTo(17, 0);
    ctx.stroke();
    ctx.restore();
  }

  drawSpitter(ctx) {
    const pulse = Math.sin(this.animTimer * 1.8);

    // Undulating Ethereal Wraith Shroud & Tendrils
    ctx.fillStyle = this.burnFlashTimer > 0 ? '#ff7b00' : '#190d28';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + pulse * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Flowing spectral ghost tendrils trailing behind
    ctx.strokeStyle = '#3e1759';
    ctx.lineWidth = 2.2;
    for (let t = -1; t <= 1; t++) {
      const tWave = Math.sin(this.animTimer * 2 + t) * 5;
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.7, t * 6);
      ctx.quadraticCurveTo(-this.radius * 1.4, t * 8 + tWave, -this.radius * 2.2, t * 10 + tWave * 1.5);
      ctx.stroke();
    }

    // Crown of Orbiting Necrotic Soul Orbs
    for (let i = 0; i < 3; i++) {
      const a = this.animTimer * 1.6 + (i * Math.PI * 2) / 3;
      const ox = Math.cos(a) * (this.radius + 8);
      const oy = Math.sin(a) * (this.radius * 0.6 + 4);

      const orbGrad = ctx.createRadialGradient(ox, oy, 1, ox, oy, 4.5);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.4, '#d500f9');
      orbGrad.addColorStop(1, 'rgba(213, 0, 249, 0)');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing mystic eye with trailing flare
    ctx.fillStyle = this.def.eyeColor;
    ctx.shadowColor = this.def.eyeColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(4, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawGoliath(ctx) {
    const isEnraged = this.hp < this.maxHp * 0.35;

    // Colossal Towering Behemoth Body
    ctx.fillStyle = this.burnFlashTimer > 0 ? '#ff5500' : '#110c17';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ancient craggy armor plates
    ctx.strokeStyle = '#3a2d48';
    ctx.lineWidth = 5.5;
    ctx.stroke();

    // Glowing Molten Magma Veins running through stone carapace
    const magmaPulse = 0.7 + 0.3 * Math.sin(this.animTimer * 3);
    ctx.strokeStyle = isEnraged ? '#ff1744' : '#ff5722';
    ctx.shadowColor = '#ff3d00';
    ctx.shadowBlur = isEnraged ? 18 : 10;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.7, -this.radius * 0.3);
    ctx.lineTo(-this.radius * 0.2, 0);
    ctx.lineTo(-this.radius * 0.7, this.radius * 0.3);
    ctx.moveTo(0, -this.radius * 0.6);
    ctx.lineTo(this.radius * 0.2, 0);
    ctx.lineTo(0, this.radius * 0.6);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Chest Furnace Core
    const furnaceGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
    furnaceGrad.addColorStop(0, '#ffffff');
    furnaceGrad.addColorStop(0.3, isEnraged ? '#ff1744' : '#ff9100');
    furnaceGrad.addColorStop(0.8, '#d50000');
    furnaceGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = furnaceGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 14 * magmaPulse, 0, Math.PI * 2);
    ctx.fill();

    // Colossal Curved Obsidian Horns
    ctx.fillStyle = '#1e1628';
    ctx.strokeStyle = '#ff3d00';
    ctx.lineWidth = 1.5;

    // Left Horn
    ctx.beginPath();
    ctx.moveTo(this.radius * 0.7, -this.radius * 0.5);
    ctx.quadraticCurveTo(this.radius * 1.2, -this.radius * 1.1, this.radius * 1.7, -this.radius * 1.0);
    ctx.quadraticCurveTo(this.radius * 1.1, -this.radius * 0.4, this.radius * 0.4, -this.radius * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Horn
    ctx.beginPath();
    ctx.moveTo(this.radius * 0.7, this.radius * 0.5);
    ctx.quadraticCurveTo(this.radius * 1.2, this.radius * 1.1, this.radius * 1.7, this.radius * 1.0);
    ctx.quadraticCurveTo(this.radius * 1.1, this.radius * 0.4, this.radius * 0.4, this.radius * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4 Blazing Demonic Eyes
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(this.radius * 0.55, -9, 4.5, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.55, 9, 4.5, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.35, -16, 3.2, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.35, 16, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawVoidweaver(ctx) {
    // Arch-Sorcerer of the Void
    ctx.fillStyle = this.burnFlashTimer > 0 ? '#ff7700' : '#080a18';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Dual Counter-Rotating Mystic Arcane Glyph Circles
    ctx.save();
    ctx.strokeStyle = '#d500f9';
    ctx.shadowColor = '#d500f9';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([8, 6]);

    // Outer Circle (clockwise)
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 12, this.animTimer * 0.8, this.animTimer * 0.8 + Math.PI * 2);
    ctx.stroke();

    // Inner Circle (counter-clockwise)
    ctx.strokeStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.setLineDash([5, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 6, -this.animTimer * 1.2, -this.animTimer * 1.2 + Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Gravitational Void Vortex at Center
    const vortexGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 16);
    vortexGrad.addColorStop(0, '#ffffff');
    vortexGrad.addColorStop(0.3, '#7c4dff');
    vortexGrad.addColorStop(0.7, '#311b92');
    vortexGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = vortexGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHealthBar(ctx) {
    const isBoss = this.type.startsWith('boss') || this.type === ENEMY_TYPES.BOSS_GOLIATH || this.type === ENEMY_TYPES.BOSS_VOIDWEAVER;
    const barW = isBoss ? 56 : Math.max(28, this.radius * 1.8);
    const barH = isBoss ? 6 : 4;
    const barX = this.x - barW / 2;
    const barY = this.y - this.radius - 12;
    const pct = Math.max(0, Math.min(1, this.hp / this.maxHp));

    ctx.save();
    ctx.fillStyle = 'rgba(10, 8, 14, 0.85)';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    grad.addColorStop(0, '#c62828');
    grad.addColorStop(1, '#ff5252');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barW * pct, barH);

    ctx.strokeStyle = '#423c4f';
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
        particles.spawnShadowDeath(enemy.x, enemy.y, enemy.type.startsWith('boss') ? 45 : 22);
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
            // Incinerated by light
            particles.spawnBurnSparks(proj.x, proj.y, 4);
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
        particles.spawnBurnSparks(proj.x, proj.y, 6);
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
