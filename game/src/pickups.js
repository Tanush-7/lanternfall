// Oil pickups system for LANTERNFALL

import { PICKUPS, COLORS } from './config.js';

export class OilPickup {
  constructor(x, y, vx = 0, vy = 0, value = PICKUPS.oilHealAmount) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.value = value;
    this.radius = PICKUPS.radius;
    this.life = PICKUPS.lifetime;
    this.maxLife = PICKUPS.lifetime;
    this.bobAngle = Math.random() * Math.PI * 2;
  }

  update(dt, player, isBeamActive) {
    this.life -= dt;
    if (this.life <= 0) return false;

    this.bobAngle += dt * 4;

    // Movement & drag
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.92;
    this.vy *= 0.92;

    // Magnetism towards player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // When beam is NOT active (cooling/pulsing), keeper has wider collection reach
    const magnetRange = isBeamActive ? PICKUPS.magnetRadius : PICKUPS.boostedMagnetRadius;

    if (dist < magnetRange && dist > 1) {
      const pullFactor = Math.pow(1 - dist / magnetRange, 0.7);
      const speed = PICKUPS.magnetSpeed * (1 + pullFactor * 1.5);
      this.vx += (dx / dist) * speed * dt * 4;
      this.vy += (dy / dist) * speed * dt * 4;
    }

    return true;
  }

  draw(ctx) {
    const progress = this.life / this.maxLife;
    // Flash warning when nearly expired (< 3 seconds)
    if (this.life < 3.0 && Math.sin(this.life * 14) < 0) {
      return;
    }

    const bobY = Math.sin(this.bobAngle) * 3;
    const drawY = this.y + bobY;

    ctx.save();
    // Warm outer glow
    const glowGrad = ctx.createRadialGradient(this.x, drawY, 1, this.x, drawY, this.radius * 3.2);
    glowGrad.addColorStop(0, 'rgba(255, 209, 102, 0.8)');
    glowGrad.addColorStop(0.5, 'rgba(255, 158, 44, 0.35)');
    glowGrad.addColorStop(1, 'rgba(255, 158, 44, 0)');

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(this.x, drawY, this.radius * 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Golden oil droplet shape
    ctx.fillStyle = COLORS.goldEmber;
    ctx.beginPath();
    ctx.moveTo(this.x, drawY - this.radius * 1.4);
    ctx.bezierCurveTo(
      this.x + this.radius * 1.2,
      drawY - this.radius * 0.4,
      this.x + this.radius,
      drawY + this.radius,
      this.x,
      drawY + this.radius,
    );
    ctx.bezierCurveTo(
      this.x - this.radius,
      drawY + this.radius,
      this.x - this.radius * 1.2,
      drawY - this.radius * 0.4,
      this.x,
      drawY - this.radius * 1.4,
    );
    ctx.fill();

    // Hot specular highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.3, drawY - this.radius * 0.3, this.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class PickupManager {
  constructor() {
    this.pickups = [];
  }

  reset() {
    this.pickups = [];
  }

  spawnDrops(x, y, count = 1, value = PICKUPS.oilHealAmount) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.pickups.push(new OilPickup(x, y, vx, vy, value));
    }
  }

  update(dt, player, isBeamActive, onCollect) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      const alive = p.update(dt, player, isBeamActive);
      if (!alive) {
        this.pickups.splice(i, 1);
        continue;
      }

      // Check collision with player
      const dist = Math.hypot(player.x - p.x, player.y - p.y);
      if (dist < player.radius + p.radius + 6) {
        onCollect(p);
        this.pickups.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.pickups) {
      p.draw(ctx);
    }
  }
}
