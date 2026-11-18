// Particle, embers, shockwaves, and visual effects system for LANTERNFALL

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.sparks = [];
    this.smoke = [];
    this.rings = [];
    this.fissures = [];
    this.ghosts = [];
    this.maxParticles = 1400;
  }

  reset() {
    this.particles = [];
    this.sparks = [];
    this.smoke = [];
    this.rings = [];
    this.fissures = [];
    this.ghosts = [];
  }

  // Golden molten embers that drift, swirl, and glow
  spawnEmber(x, y, vx, vy, color = '#ffd166', size = 2.5, life = 0.85, buoyant = true) {
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
      drag: 0.95,
      buoyant,
      swirlPhase: Math.random() * Math.PI * 2,
      swirlSpeed: 4 + Math.random() * 8,
      flicker: Math.random() * Math.PI * 2,
    });
  }

  // High-velocity sharp directional sparks with streak trails
  spawnSpark(x, y, vx, vy, color = '#fff2a8', size = 2.0, life = 0.35) {
    if (this.sparks.length >= 400) {
      this.sparks.shift();
    }
    this.sparks.push({
      x,
      y,
      vx,
      vy,
      color,
      size,
      maxLife: life,
      life,
      drag: 0.92,
    });
  }

  // Volumetric rolling smoke and dark shadow vapor
  spawnSmoke(x, y, vx, vy, color = '#1a1024', size = 5.0, life = 0.7, growth = 12.0) {
    if (this.smoke.length >= 350) {
      this.smoke.shift();
    }
    this.smoke.push({
      x,
      y,
      vx,
      vy,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2.5,
      color,
      size,
      growth,
      maxLife: life,
      life,
      drag: 0.91,
    });
  }

  // Dash afterimage ghost
  spawnDashGhosts(x, y, angle = 0) {
    if (this.ghosts.length >= 25) {
      this.ghosts.shift();
    }
    this.ghosts.push({
      x,
      y,
      angle,
      life: 0.28,
      maxLife: 0.28,
      radius: 14,
    });

    // Trail embers
    for (let i = 0; i < 3; i++) {
      this.spawnEmber(
        x + (Math.random() - 0.5) * 8,
        y + (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 35,
        '#ffe8a3',
        2.2,
        0.4,
      );
    }
  }

  // Sparks along the lantern light cone
  spawnBeamSparks(originX, originY, angle, spread, count = 3) {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const speed = 140 + Math.random() * 260;
      const vx = Math.cos(a) * speed;
      const vy = Math.sin(a) * speed;
      const dist = 12 + Math.random() * 55;
      const sx = originX + Math.cos(a) * dist;
      const sy = originY + Math.sin(a) * dist;

      this.spawnSpark(sx, sy, vx, vy, '#ffffff', 2.2, 0.28);
      if (Math.random() < 0.6) {
        this.spawnEmber(sx, sy, vx * 0.4, vy * 0.4, '#ffd54f', 2.0, 0.45);
      }
    }
  }

  // Searing sparks and smoke when beam strikes shadows
  spawnBurnSparks(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 160;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.spawnSpark(x, y, vx, vy, '#fff4b8', 2.4, 0.3);
      this.spawnEmber(x, y, vx * 0.6, vy * 0.6 - 20, '#ff9e2c', 2.6, 0.5);

      if (Math.random() < 0.45) {
        this.spawnSmoke(x, y, vx * 0.25, vy * 0.25 - 15, '#26112e', 5.5, 0.6, 14);
      }
    }
  }

  // Spectacular incineration burst upon shadow enemy death
  spawnShadowDeath(x, y, count = 28) {
    // Shock ring
    this.spawnShockwave(x, y, 65, 0.4, '#ff9e2c', 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 210;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      if (i % 3 === 0) {
        // Blazing spark
        this.spawnSpark(x, y, vx * 1.3, vy * 1.3, '#ffffff', 3.0, 0.45);
      } else if (i % 3 === 1) {
        // Fiery ember
        this.spawnEmber(x, y, vx, vy - 35, '#ffae19', 3.5, 0.75);
      } else {
        // Dark dissolving shadow mist
        this.spawnSmoke(x, y, vx * 0.45, vy * 0.45, '#12071a', 7.0 + Math.random() * 6, 0.8, 16);
      }
    }
  }

  // Golden radiance burst on oil pickup collection
  spawnOilCollect(x, y, count = 16) {
    this.spawnShockwave(x, y, 48, 0.35, '#ffd166', 2.5);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 160;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.spawnSpark(x, y, vx, vy, '#ffffff', 2.2, 0.35);
      this.spawnEmber(x, y, vx * 0.6, vy * 0.6 - 25, '#ffe57f', 3.2, 0.65);
    }
  }

  // High-pressure steam & molten cinder venting when lantern jams
  spawnOverheatBurst(x, y) {
    this.spawnShockwave(x, y, 85, 0.5, '#ff2244', 4.0);
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 220;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.spawnSpark(x, y, vx, vy, '#ff5252', 2.8, 0.4);
      this.spawnEmber(x, y, vx * 0.8, vy * 0.8, '#ff3344', 3.0, 0.7);
      this.spawnSmoke(x, y, vx * 0.4, vy * 0.4 - 20, 'rgba(180, 180, 200, 0.75)', 7.0, 0.8, 18);
    }
  }

  // Layered shockwave ring with inner radiance
  spawnShockwave(x, y, maxRadius = 120, duration = 0.55, color = '#ff4d4d', thickness = 4.5) {
    this.rings.push({
      x,
      y,
      radius: 6,
      maxRadius,
      duration,
      age: 0,
      color,
      thickness,
    });
  }

  // Ground fracture fissures (used for Goliath stomp or boss slams)
  spawnFissures(x, y, count = 8, maxDist = 90, color = '#ff3d00') {
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.4;
      const segments = [];
      let curX = x;
      let curY = y;
      const segCount = 4 + Math.floor(Math.random() * 3);
      const stepLen = maxDist / segCount;

      for (let s = 0; s < segCount; s++) {
        const segAngle = angle + (Math.random() - 0.5) * 0.6;
        const nX = curX + Math.cos(segAngle) * stepLen;
        const nY = curY + Math.sin(segAngle) * stepLen;
        segments.push({ x1: curX, y1: curY, x2: nX, y2: nY });
        curX = nX;
        curY = nY;
      }

      this.fissures.push({
        segments,
        color,
        life: 0.9,
        maxLife: 0.9,
      });
    }
  }

  update(dt) {
    // Update embers
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.buoyant) {
        p.vy -= 22 * dt; // gentle heat buoyancy
        p.swirlPhase += p.swirlSpeed * dt;
        p.vx += Math.sin(p.swirlPhase) * 12 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.flicker += dt * 14;
    }

    // Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= s.drag;
      s.vy *= s.drag;
    }

    // Update smoke
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const sm = this.smoke[i];
      sm.life -= dt;
      if (sm.life <= 0) {
        this.smoke.splice(i, 1);
        continue;
      }
      sm.x += sm.vx * dt;
      sm.y += sm.vy * dt;
      sm.vx *= sm.drag;
      sm.vy *= sm.drag;
      sm.size += sm.growth * dt;
      sm.rotation += sm.rotSpeed * dt;
    }

    // Update shockwaves
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.age += dt;
      if (r.age >= r.duration) {
        this.rings.splice(i, 1);
        continue;
      }
      const progress = r.age / r.duration;
      // Ease out expansion
      r.radius = 6 + (r.maxRadius - 6) * Math.sin((progress * Math.PI) / 2);
    }

    // Update ground fissures
    for (let i = this.fissures.length - 1; i >= 0; i--) {
      const f = this.fissures[i];
      f.life -= dt;
      if (f.life <= 0) {
        this.fissures.splice(i, 1);
      }
    }

    // Update dash ghosts
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const g = this.ghosts[i];
      g.life -= dt;
      if (g.life <= 0) {
        this.ghosts.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // 1. Draw Ground Fissures
    for (const f of this.fissures) {
      const progress = f.life / f.maxLife;
      ctx.strokeStyle = f.color;
      ctx.globalAlpha = Math.max(0, progress * 0.9);
      ctx.lineWidth = 2.5 * progress;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 10 * progress;
      ctx.beginPath();
      for (const seg of f.segments) {
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 2. Draw Dash Ghosts (Ethereal golden silhouettes)
    for (const g of this.ghosts) {
      const alpha = Math.max(0, g.life / g.maxLife) * 0.55;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffc857';
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Draw Volumetric Smoke
    for (const sm of this.smoke) {
      const progress = sm.life / sm.maxLife;
      const alpha = Math.max(0, progress * 0.45);
      ctx.save();
      ctx.translate(sm.x, sm.y);
      ctx.rotate(sm.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = sm.color;
      ctx.beginPath();
      ctx.arc(0, 0, sm.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Draw Layered Shockwaves
    for (const r of this.rings) {
      const progress = r.age / r.duration;
      const alpha = Math.max(0, (1 - progress));
      ctx.save();
      ctx.strokeStyle = r.color;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 12 * (1 - progress);
      ctx.globalAlpha = alpha * 0.9;
      ctx.lineWidth = Math.max(1, r.thickness * (1 - progress * 0.6));
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner faint secondary ring for rich volumetric shock feeling
      ctx.globalAlpha = alpha * 0.35;
      ctx.lineWidth = Math.max(0.5, r.thickness * 0.5);
      ctx.beginPath();
      ctx.arc(r.x, r.y, Math.max(2, r.radius * 0.75), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw High-Velocity Sparks (Streaks with additive glow)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.sparks) {
      const progress = s.life / s.maxLife;
      const alpha = Math.max(0, Math.min(1, progress * 1.5));
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = Math.max(1, s.size * progress);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      // Streak backwards along velocity
      ctx.lineTo(s.x - s.vx * 0.035, s.y - s.vy * 0.035);
      ctx.stroke();
    }

    // 6. Draw Glowing Molten Embers
    for (const p of this.particles) {
      const progress = p.life / p.maxLife;
      const flickerVal = 0.8 + 0.2 * Math.sin(p.flicker);
      const alpha = Math.max(0, Math.min(1, progress * flickerVal));
      ctx.globalAlpha = alpha;

      // Outer soft glow halo
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.8, p.size * progress * 1.6), 0, Math.PI * 2);
      ctx.fill();

      // Brilliant hot white core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.4, p.size * progress * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();
  }
}
