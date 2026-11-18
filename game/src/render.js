// World, dynamic lighting, arena architecture, drifting fog, and volumetric beam renderer for LANTERNFALL

import { CANVAS, ARENA, BEAM, COLORS, SCREENS } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Offscreen canvas for authentic 2D darkness & dynamic light masking
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = CANVAS.width;
    this.lightCanvas.height = CANVAS.height;
    this.lightCtx = this.lightCanvas.getContext('2d');

    // Pre-calculate arena rune positions and glyph types
    this.runes = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      this.runes.push({
        angle,
        radius: ARENA.innerRuneRadius,
        glyph: i % 8, // 8 distinct archaic sigils
        phase: Math.random() * Math.PI * 2,
        speed: 1.2 + Math.random() * 1.5,
      });
    }

    // Outer perimeter sentinel runes
    this.outerRunes = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI * 2) / 16;
      this.outerRunes.push({
        angle,
        radius: ARENA.radius - 12,
        glyph: (i * 3) % 6,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Pre-initialize drifting fog patches
    this.fogPatches = [];
    for (let i = 0; i < 18; i++) {
      this.fogPatches.push({
        x: ARENA.centerX + (Math.random() - 0.5) * (ARENA.radius * 2.0),
        y: ARENA.centerY + (Math.random() - 0.5) * (ARENA.radius * 2.0),
        radius: 65 + Math.random() * 50,
        speedX: 5 + Math.random() * 6,
        speedY: (Math.random() - 0.5) * 2,
        alpha: 0.14 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
      });
    }

    this.lastTime = performance.now();
  }

  render(world, hud, screenState) {
    const ctx = this.ctx;
    const now = performance.now() * 0.001;
    const dt = Math.min(0.05, (performance.now() - this.lastTime) * 0.001);
    this.lastTime = performance.now();

    // Update drifting fog positions
    for (const fog of this.fogPatches) {
      fog.x += fog.speedX * dt;
      fog.y += fog.speedY * dt;
      if (fog.x > ARENA.centerX + ARENA.radius + 80) {
        fog.x = ARENA.centerX - ARENA.radius - 80;
        fog.y = ARENA.centerY + (Math.random() - 0.5) * (ARENA.radius * 1.6);
      }
    }

    ctx.save();

    // 1. Clear background to abyssal void
    ctx.fillStyle = COLORS.bgVoid;
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    // 2. Apply Camera Screen Shake (trauma from HUD)
    ctx.translate(hud.shakeX, hud.shakeY);
    if (hud.shakeAngle) {
      ctx.translate(ARENA.centerX, ARENA.centerY);
      ctx.rotate(hud.shakeAngle);
      ctx.translate(-ARENA.centerX, -ARENA.centerY);
    }

    // 3. Render Circular Stone Arena & Living Floor
    this.drawArena(ctx, world.player, screenState, now);

    // 4. Render Drifting Volumetric Fog
    this.drawDriftingFog(ctx, world.player, screenState, now);

    // 5. Render Pickups (beneath shadows & player)
    world.pickups.draw(ctx);

    // 6. Render Shadows / Enemies & Projectiles (only during play or shots)
    if (screenState !== SCREENS.TITLE && screenState !== SCREENS.GAMEOVER) {
      world.enemies.draw(ctx);
    }

    // 7. Render Keeper / Player (hidden on title screen for majestic centerpiece)
    if (screenState !== SCREENS.TITLE) {
      world.player.draw(ctx);
    }

    // 8. Render Particles (embers, sparks, smoke, shockwaves, fissures)
    world.particles.draw(ctx);

    // 9. Render Dynamic Darkness & Multi-Light Mask
    this.drawDarknessAndLight(ctx, world, screenState, now);

    // 10. Render Volumetric Golden Light Beam Over World
    if (world.player.isFiring && screenState === SCREENS.PLAY) {
      this.drawVolumetricBeam(ctx, world.player, now);
    }

    // 11. Screen-Space Bloom / Glow Pass
    if (screenState === SCREENS.PLAY) {
      this.drawLightBloom(ctx, world.player, now);
    }

    // 12. Cinematic Vignette
    hud.drawVignette(ctx);

    // 13. Screen Flashes (Damage / Boss Stomp / Wave Cleared)
    hud.drawScreenFlash(ctx);

    ctx.restore();

    // 14. Render Screens & HUD (Untranslated from camera shake)
    if (screenState === SCREENS.PLAY) {
      hud.drawPlayHUD(ctx, world.player, world.waves, world.score, world.combo);
    } else if (screenState === SCREENS.TITLE) {
      hud.drawTitleScreen(ctx);
    } else if (screenState === SCREENS.GAMEOVER) {
      hud.drawGameOverScreen(ctx, world.score, world.waves.wave, world.kills);
    } else if (screenState === SCREENS.PAUSE) {
      hud.drawPauseScreen(ctx);
    }
  }

  drawArena(ctx, player, screenState, time) {
    const cx = ARENA.centerX;
    const cy = ARENA.centerY;
    const r = ARENA.radius;

    ctx.save();

    // Outer Dark Abyss Chasm Ring
    ctx.fillStyle = '#050507';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 24, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Stone Sanctuary Outer Parapet Wall
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#221f2d';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 5;
    ctx.strokeStyle = '#3e3752';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Stone Arena Floor Pavement
    const floorGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, r);
    floorGrad.addColorStop(0, '#1c1926');
    floorGrad.addColorStop(0.5, '#161420');
    floorGrad.addColorStop(0.85, '#100e16');
    floorGrad.addColorStop(1, '#0a090e');
    ctx.fillStyle = floorGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
    ctx.fill();

    // Concentric Ancient Stone Rings & Channels
    ctx.strokeStyle = 'rgba(78, 70, 102, 0.4)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy, ARENA.innerRuneRadius, 0, Math.PI * 2);
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.arc(cx, cy, r - 35, 0, Math.PI * 2);
    ctx.stroke();

    // Radial Stone Slabs
    ctx.strokeStyle = 'rgba(50, 44, 68, 0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI * 2) / 24;
      const x1 = cx + Math.cos(angle) * 80;
      const y1 = cy + Math.sin(angle) * 80;
      const x2 = cx + Math.cos(angle) * (r - 6);
      const y2 = cy + Math.sin(angle) * (r - 6);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 4. Render Flickering Ancient Runes
    this.drawAncientRunes(ctx, player, screenState, time);

    ctx.restore();
  }

  drawAncientRunes(ctx, player, screenState, time) {
    const cx = ARENA.centerX;
    const cy = ARENA.centerY;

    ctx.save();
    for (const rune of this.runes) {
      const rx = cx + Math.cos(rune.angle) * rune.radius;
      const ry = cy + Math.sin(rune.angle) * rune.radius;

      let isIlluminated = false;
      if (screenState === SCREENS.TITLE) {
        isIlluminated = true;
      } else {
        const distToPlayer = Math.hypot(rx - player.x, ry - player.y);
        if (distToPlayer < BEAM.ambientLightRadius) {
          isIlluminated = true;
        } else if (player.isFiring) {
          const toRuneAngle = Math.atan2(ry - player.y, rx - player.x);
          let angleDiff = Math.abs(toRuneAngle - player.aimAngle);
          while (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
          if (angleDiff < BEAM.spreadAngle / 2 && distToPlayer < BEAM.range) {
            isIlluminated = true;
          }
        }
      }

      const idlePulse = 0.5 + 0.35 * Math.sin(time * rune.speed + rune.phase);
      let runeAlpha = idlePulse * 0.45;
      let runeColor = '#726694';

      if (isIlluminated) {
        runeAlpha = 0.90 + 0.10 * Math.sin(time * 5 + rune.phase);
        runeColor = '#ffcf56';
      }
      ctx.shadowBlur = 0;

      ctx.strokeStyle = runeColor;
      ctx.fillStyle = runeColor;
      ctx.globalAlpha = runeAlpha;
      ctx.lineWidth = 1.6;

      this.drawGlyph(ctx, rx, ry, rune.glyph, rune.angle);
    }

    // Outer Sentinel Runes
    for (const rune of this.outerRunes) {
      const rx = cx + Math.cos(rune.angle) * rune.radius;
      const ry = cy + Math.sin(rune.angle) * rune.radius;
      const idlePulse = 0.35 + 0.25 * Math.sin(time * 1.5 + rune.phase);
      ctx.strokeStyle = '#5a4f78';
      ctx.fillStyle = '#5a4f78';
      ctx.globalAlpha = idlePulse;
      ctx.lineWidth = 1.4;
      this.drawGlyph(ctx, rx, ry, rune.glyph, rune.angle);
    }

    ctx.restore();
  }

  drawGlyph(ctx, x, y, type, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot + Math.PI / 2);

    ctx.beginPath();
    switch (type) {
      case 0:
        ctx.moveTo(0, -5);
        ctx.lineTo(4, 4);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.stroke();
        break;
      case 1:
        ctx.moveTo(0, -5);
        ctx.lineTo(4, 0);
        ctx.lineTo(0, 5);
        ctx.lineTo(-4, 0);
        ctx.closePath();
        ctx.stroke();
        break;
      case 2:
        ctx.arc(0, 0, 4, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 6);
        ctx.stroke();
        break;
      case 3:
        for (let a = 0; a < 3; a++) {
          const ang = (a * Math.PI * 2) / 3;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * 5, Math.sin(ang) * 5);
        }
        ctx.stroke();
        break;
      case 4:
        ctx.arc(0, 1, 3.5, 0, Math.PI * 2);
        ctx.moveTo(0, -5);
        ctx.lineTo(2, -2);
        ctx.stroke();
        break;
      case 5:
        ctx.moveTo(-3, -4);
        ctx.lineTo(3, -4);
        ctx.lineTo(-3, 4);
        ctx.lineTo(3, 4);
        ctx.closePath();
        ctx.stroke();
        break;
      case 6:
        ctx.arc(0, 0, 4, 0, Math.PI * 1.5);
        ctx.stroke();
        break;
      default:
        ctx.moveTo(-4, 0);
        ctx.lineTo(4, 0);
        ctx.moveTo(0, -4);
        ctx.lineTo(0, 4);
        ctx.stroke();
        break;
    }
    ctx.restore();
  }

  drawDriftingFog(ctx, player, screenState, time) {
    ctx.save();
    for (const fog of this.fogPatches) {
      let isLighted = false;

      if (screenState === SCREENS.TITLE) {
        const distToCenter = Math.hypot(fog.x - ARENA.centerX, fog.y - (ARENA.centerY - 30));
        isLighted = distToCenter < 160;
      } else {
        const dx = fog.x - player.x;
        const dy = fog.y - player.y;
        const dist = Math.hypot(dx, dy);

        isLighted = dist < BEAM.ambientLightRadius * 1.2;
        if (player.isFiring) {
          const toFogAngle = Math.atan2(dy, dx);
          let diff = Math.abs(toFogAngle - player.aimAngle);
          while (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff < BEAM.spreadAngle / 1.7 && dist < BEAM.range) {
            isLighted = true;
          }
        }
      }

      const grad = ctx.createRadialGradient(fog.x, fog.y, 8, fog.x, fog.y, fog.radius);
      if (isLighted) {
        grad.addColorStop(0, `rgba(255, 215, 120, ${fog.alpha * 1.4})`);
        grad.addColorStop(0.6, `rgba(220, 160, 60, ${fog.alpha * 0.7})`);
        grad.addColorStop(1, 'rgba(220, 160, 60, 0)');
      } else {
        grad.addColorStop(0, `rgba(55, 45, 75, ${fog.alpha})`);
        grad.addColorStop(0.7, `rgba(28, 22, 42, ${fog.alpha * 0.5})`);
        grad.addColorStop(1, 'rgba(15, 12, 24, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fog.x, fog.y, fog.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawDarknessAndLight(ctx, world, screenState, time) {
    const lctx = this.lightCtx;
    const player = world.player;
    const pickups = world.pickups.pickups;
    const enemies = world.enemies.enemies;
    const projectiles = world.enemies.projectiles;

    lctx.clearRect(0, 0, CANVAS.width, CANVAS.height);

    // Deep atmospheric darkness mask
    lctx.fillStyle = 'rgba(5, 4, 8, 0.78)';
    lctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    lctx.save();
    lctx.globalCompositeOperation = 'destination-out';

    if (screenState === SCREENS.TITLE) {
      const tcx = CANVAS.width / 2;
      const tcy = CANVAS.height / 2 - 30;
      const tRad = 195;
      const tGrad = lctx.createRadialGradient(tcx, tcy, 10, tcx, tcy, tRad);
      tGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      tGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.85)');
      tGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.45)');
      tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lctx.fillStyle = tGrad;
      lctx.beginPath();
      lctx.arc(tcx, tcy, tRad, 0, Math.PI * 2);
      lctx.fill();
    } else {
      // 1. Keeper's Ambient Lantern Glow
      const flicker = Math.sin(time * 11) * 2.5;
      const ambRad = BEAM.ambientLightRadius + flicker;
      const ambGrad = lctx.createRadialGradient(player.x, player.y, 8, player.x, player.y, ambRad);
      ambGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      ambGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.88)');
      ambGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.45)');
      ambGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lctx.fillStyle = ambGrad;
      lctx.beginPath();
      lctx.arc(player.x, player.y, ambRad, 0, Math.PI * 2);
      lctx.fill();

      // 2. Active Lantern Beam Light Cone
      if (player.isFiring) {
        const beamOriginX = player.x + Math.cos(player.aimAngle) * 16;
        const beamOriginY = player.y + Math.sin(player.aimAngle) * 16;
        const startAngle = player.aimAngle - BEAM.spreadAngle / 2;
        const endAngle = player.aimAngle + BEAM.spreadAngle / 2;

        const beamGrad = lctx.createRadialGradient(
          beamOriginX,
          beamOriginY,
          10,
          beamOriginX,
          beamOriginY,
          BEAM.range,
        );
        beamGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
        beamGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.98)');
        beamGrad.addColorStop(0.92, 'rgba(0, 0, 0, 0.55)');
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        lctx.fillStyle = beamGrad;
        lctx.beginPath();
        lctx.moveTo(beamOriginX, beamOriginY);
        lctx.arc(beamOriginX, beamOriginY, BEAM.range, startAngle, endAngle);
        lctx.closePath();
        lctx.fill();
      }

      // 3. Glowing Oil Pickups
      for (const p of pickups) {
        const pRadius = p.radius * 5.5;
        const pGrad = lctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, pRadius);
        pGrad.addColorStop(0, 'rgba(0, 0, 0, 0.90)');
        pGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.45)');
        pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lctx.fillStyle = pGrad;
        lctx.beginPath();
        lctx.arc(p.x, p.y, pRadius, 0, Math.PI * 2);
        lctx.fill();
      }

      // 4. Subtle Enemy Presence in Gloom (Silhouettes & Glowing Eyes)
      for (const e of enemies) {
        const eRad = e.radius * 1.4;
        const eGrad = lctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, eRad);
        eGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
        eGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lctx.fillStyle = eGrad;
        lctx.beginPath();
        lctx.arc(e.x, e.y, eRad, 0, Math.PI * 2);
        lctx.fill();
      }

      // 5. Burning Enemies Light Flash
      for (const e of enemies) {
        if (e.burnFlashTimer > 0) {
          const bRad = e.radius * 3.0;
          const bGrad = lctx.createRadialGradient(e.x, e.y, 4, e.x, e.y, bRad);
          bGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
          bGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          lctx.fillStyle = bGrad;
          lctx.beginPath();
          lctx.arc(e.x, e.y, bRad, 0, Math.PI * 2);
          lctx.fill();
        }
      }

      // 5. Boss Aura Light Cutout
      if (world.waves.boss && world.waves.boss.hp > 0) {
        const boss = world.waves.boss;
        const bossRad = boss.radius * 2.4;
        const bGrad = lctx.createRadialGradient(boss.x, boss.y, boss.radius * 0.5, boss.x, boss.y, bossRad);
        bGrad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
        bGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lctx.fillStyle = bGrad;
        lctx.beginPath();
        lctx.arc(boss.x, boss.y, bossRad, 0, Math.PI * 2);
        lctx.fill();
      }

      // 6. Projectiles Light Aura
      for (const proj of projectiles) {
        const prGrad = lctx.createRadialGradient(proj.x, proj.y, 1, proj.x, proj.y, proj.radius * 3.5);
        prGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
        prGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lctx.fillStyle = prGrad;
        lctx.beginPath();
        lctx.arc(proj.x, proj.y, proj.radius * 3.5, 0, Math.PI * 2);
        lctx.fill();
      }
    }

    lctx.restore();

    ctx.drawImage(this.lightCanvas, 0, 0);
  }

  drawVolumetricBeam(ctx, player, time) {
    const beamOriginX = player.x + Math.cos(player.aimAngle) * 16;
    const beamOriginY = player.y + Math.sin(player.aimAngle) * 16;
    const startAngle = player.aimAngle - BEAM.spreadAngle / 2;
    const endAngle = player.aimAngle + BEAM.spreadAngle / 2;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. Broad Volumetric Radiance Cone
    const beamGrad = ctx.createRadialGradient(
      beamOriginX,
      beamOriginY,
      6,
      beamOriginX,
      beamOriginY,
      BEAM.range,
    );
    beamGrad.addColorStop(0, 'rgba(255, 235, 140, 0.65)');
    beamGrad.addColorStop(0.35, 'rgba(255, 185, 56, 0.38)');
    beamGrad.addColorStop(0.75, 'rgba(255, 130, 20, 0.16)');
    beamGrad.addColorStop(1, 'rgba(255, 100, 10, 0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(beamOriginX, beamOriginY);
    ctx.arc(beamOriginX, beamOriginY, BEAM.range, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    // 2. Volumetric God Rays
    const rayCount = 6;
    for (let i = 0; i < rayCount; i++) {
      const rayFrac = (i + 0.5) / rayCount;
      const rayAngle = startAngle + rayFrac * BEAM.spreadAngle;
      const rayWidth = 0.045;

      const rGrad = ctx.createRadialGradient(
        beamOriginX,
        beamOriginY,
        15,
        beamOriginX,
        beamOriginY,
        BEAM.range * 0.95,
      );
      rGrad.addColorStop(0, 'rgba(255, 250, 200, 0.25)');
      rGrad.addColorStop(0.6, 'rgba(255, 195, 80, 0.10)');
      rGrad.addColorStop(1, 'rgba(255, 160, 40, 0)');

      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.moveTo(beamOriginX, beamOriginY);
      ctx.arc(beamOriginX, beamOriginY, BEAM.range * 0.95, rayAngle - rayWidth / 2, rayAngle + rayWidth / 2);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Piercing Laser-Core Filament
    const coreGrad = ctx.createLinearGradient(
      beamOriginX,
      beamOriginY,
      beamOriginX + Math.cos(player.aimAngle) * BEAM.range,
      beamOriginY + Math.sin(player.aimAngle) * BEAM.range,
    );
    coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    coreGrad.addColorStop(0.4, 'rgba(255, 235, 140, 0.75)');
    coreGrad.addColorStop(0.85, 'rgba(255, 165, 45, 0.25)');
    coreGrad.addColorStop(1, 'rgba(255, 120, 20, 0)');

    ctx.strokeStyle = coreGrad;
    ctx.lineWidth = 5.0;
    ctx.beginPath();
    ctx.moveTo(beamOriginX, beamOriginY);
    ctx.lineTo(
      beamOriginX + Math.cos(player.aimAngle) * BEAM.range,
      beamOriginY + Math.sin(player.aimAngle) * BEAM.range,
    );
    ctx.stroke();

    // Hot White Inner Laser String
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(beamOriginX, beamOriginY);
    ctx.lineTo(
      beamOriginX + Math.cos(player.aimAngle) * (BEAM.range * 0.8),
      beamOriginY + Math.sin(player.aimAngle) * (BEAM.range * 0.8),
    );
    ctx.stroke();

    // 4. Beam Contact Point Splash Halo at perimeter
    const endX = beamOriginX + Math.cos(player.aimAngle) * BEAM.range;
    const endY = beamOriginY + Math.sin(player.aimAngle) * BEAM.range;
    const splashGrad = ctx.createRadialGradient(endX, endY, 2, endX, endY, 32);
    splashGrad.addColorStop(0, 'rgba(255, 230, 150, 0.45)');
    splashGrad.addColorStop(0.5, 'rgba(255, 160, 40, 0.2)');
    splashGrad.addColorStop(1, 'rgba(255, 120, 20, 0)');
    ctx.fillStyle = splashGrad;
    ctx.beginPath();
    ctx.arc(endX, endY, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawLightBloom(ctx, player, time) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const lx = player.x + Math.cos(player.aimAngle) * 16;
    const ly = player.y + Math.sin(player.aimAngle) * 16;

    const flameColor = player.isOverheated ? 'rgba(255, 40, 40, 0.65)' : 'rgba(255, 195, 60, 0.55)';
    const bloomGrad = ctx.createRadialGradient(lx, ly, 2, lx, ly, 40);
    bloomGrad.addColorStop(0, flameColor);
    bloomGrad.addColorStop(0.5, player.isOverheated ? 'rgba(255, 20, 20, 0.25)' : 'rgba(255, 140, 20, 0.2)');
    bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = bloomGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
