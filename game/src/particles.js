// Particle and visual effects system for LANTERNFALL

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.maxParticles = 350;
  }

  reset() {
    this.particles = [];
    this.rings = [];
  }

  spawnEmber(x, y, vx, vy, color = '#ffd166', size = 2.5, life = 0.8) {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }
    this.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      size,
      maxLife: life,
      life,
      drag: 0.94,
      flicker: Math.random() * Math.PI * 2,
    });
  }

  spawnSmoke(x, y, vx, vy, color = '#1e1629', size = 5.0, life = 0.6) {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }
    this.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      size,
      growth: 6.0,
      maxLife: life,
      life,
      drag: 0.92,
      flicker: 0,
    });
  }

  spawnBeamSparks(originX, originY, angle, spread, count = 2) {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const speed = 120 + Math.random() * 220;
      const vx = Math.cos(a) * speed;
      const vy = Math.sin(a) * speed;
      const dist = 10 + Math.random() * 40;
      const sx = originX + Math.cos(a) * dist;
      const sy = originY + Math.sin(a) * dist;
      this.spawnEmber(sx, sy, vx, vy, '#fff2a8', 2.0 + Math.random() * 1.5, 0.45);
    }
  }

  spawnBurnSparks(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.spawnEmber(x, y, vx, vy, '#ffbe3b', 2.2, 0.4);
      if (Math.random() < 0.5) {
        this.spawnSmoke(x, y, vx * 0.4, vy * 0.4, '#23122b', 4, 0.5);
      }
    }
  }

  spawnShadowDeath(x, y, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 140;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const isGold = Math.random() < 0.35;
      if (isGold) {
        this.spawnEmber(x, y, vx, vy, '#ffcc00', 3.0, 0.7);
      } else {
        this.spawnSmoke(x, y, vx, vy, '#150a1e', 6.0 + Math.random() * 4, 0.65);
      }
    }
  }

  spawnOilCollect(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.spawnEmber(x, y, vx, vy, '#ffe17d', 3.0, 0.6);
    }
  }

  spawnOverheatBurst(x, y) {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 160;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.spawnEmber(x, y, vx, vy, '#ff4d4d', 2.5, 0.6);
      this.spawnSmoke(x, y, vx * 0.5, vy * 0.5, 'rgba(200, 200, 220, 0.8)', 6.0, 0.7);
    }
  }

  spawnShockwave(x, y, maxRadius = 120, duration = 0.55, color = '#ff4d4d') {
    this.rings.push({
      x,
      y,
      radius: 8,
      maxRadius,
      duration,
      age: 0,
      color,
      thickness: 4.5,
    });
  }

  spawnDashGhosts(x, y) {
    for (let i = 0; i < 4; i++) {
      this.spawnEmber(
        x + (Math.random() - 0.5) * 10,
        y + (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        '#ffe8a3',
        2.0,
        0.35,
      );
    }
  }

  update(dt) {
    // Update individual particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
      if (p.growth) {
        p.size += p.growth * dt;
      }
      p.flicker += dt * 12;
    }

    // Update expanding rings / shockwaves
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.age += dt;
      if (r.age >= r.duration) {
        this.rings.splice(i, 1);
        continue;
      }
      const progress = r.age / r.duration;
      r.radius = 8 + (r.maxRadius - 8) * Math.sin((progress * Math.PI) / 2);
    }
  }

  draw(ctx) {
    // Render shockwaves
    for (const r of this.rings) {
      const progress = r.age / r.duration;
      const alpha = Math.max(0, 1 - progress);
      ctx.save();
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = alpha * 0.85;
      ctx.lineWidth = r.thickness * (1 - progress * 0.5);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Render particles
    ctx.save();
    for (const p of this.particles) {
      const progress = p.life / p.maxLife;
      const alpha = Math.max(0, Math.min(1, progress * (0.8 + 0.2 * Math.sin(p.flicker))));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size * progress), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
