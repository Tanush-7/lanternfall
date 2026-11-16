// World, lighting, arena, and beam renderer for LANTERNFALL

import { CANVAS, ARENA, BEAM, COLORS, SCREENS } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Offscreen canvas for authentic 2D darkness & light masking
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = CANVAS.width;
    this.lightCanvas.height = CANVAS.height;
    this.lightCtx = this.lightCanvas.getContext('2d');

    // Pre-calculate arena rune angles
    this.runeAngles = [];
    for (let i = 0; i < 24; i++) {
      this.runeAngles.push((i * Math.PI * 2) / 24);
    }
  }

  render(world, hud, screenState) {
    const ctx = this.ctx;
    ctx.save();

    // 1. Clear background
    ctx.fillStyle = COLORS.bgVoid;
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    // 2. Apply Camera Screen Shake (from HUD trauma)
    ctx.translate(hud.shakeX, hud.shakeY);

    // 3. Render Circular Stone Arena
    this.drawArena(ctx);

    // 4. Render Pickups (beneath shadows & player)
    world.pickups.draw(ctx);

    // 5. Render Shadows / Enemies & Projectiles
    world.enemies.draw(ctx);

    // 6. Render Keeper / Player
    world.player.draw(ctx);

    // 7. Render Particles (embers, smoke, shockwaves)
    world.particles.draw(ctx);

    // 8. Render Dynamic Darkness & Lantern Beam Light Mask
    this.drawDarknessAndLight(ctx, world.player, world.pickups.pickups);

    // 9. Render Volumetric Golden Light Beam Over World
    if (world.player.isFiring) {
      this.drawVolumetricBeam(ctx, world.player);
    }

    // 10. Cinematic Vignette
    hud.drawVignette(ctx);

    // 11. Render Screens & HUD (Untranslated from screen shake)
    ctx.restore();

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

  drawArena(ctx) {
    const cx = ARENA.centerX;
    const cy = ARENA.centerY;
    const r = ARENA.radius;

    ctx.save();

    // Outer Dark Chasm Shadow
    ctx.fillStyle = 'rgba(3, 3, 5, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 24, 0, Math.PI * 2);
    ctx.fill();

    // Stone Arena Outer Rim
    ctx.fillStyle = '#22202c';
    ctx.strokeStyle = '#39354a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Arena Stone Floor Pavement
    const floorGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, r);
    floorGrad.addColorStop(0, '#16151f');
    floorGrad.addColorStop(0.7, '#111017');
    floorGrad.addColorStop(1, '#0c0b11');
    ctx.fillStyle = floorGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
    ctx.fill();

    // Concentric Ancient Stone Rings
    ctx.strokeStyle = 'rgba(56, 52, 74, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, ARENA.innerRuneRadius, 0, Math.PI * 2);
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.stroke();

    // Radial Stone Slabs
    ctx.strokeStyle = 'rgba(46, 42, 61, 0.35)';
    ctx.lineWidth = 1.5;
    for (const angle of this.runeAngles) {
      const x1 = cx + Math.cos(angle) * 70;
      const y1 = cy + Math.sin(angle) * 70;
      const x2 = cx + Math.cos(angle) * (r - 8);
      const y2 = cy + Math.sin(angle) * (r - 8);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Outer Edge Stone Markers / Runes
    ctx.fillStyle = '#3c374f';
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI * 2) / 12;
      const mx = cx + Math.cos(a) * (r - 4);
      const my = cy + Math.sin(a) * (r - 4);
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawDarknessAndLight(ctx, player, pickups) {
    const lctx = this.lightCtx;
    lctx.clearRect(0, 0, CANVAS.width, CANVAS.height);

    // Fill with dense, suffocating darkness
    lctx.fillStyle = 'rgba(5, 5, 8, 0.88)';
    lctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    // Carve out light where lanterns and pickups illuminate
    lctx.save();
    lctx.globalCompositeOperation = 'destination-out';

    // 1. Keeper's Ambient Lantern Glow (Soft circle around player)
    const ambRad = BEAM.ambientLightRadius;
    const ambGrad = lctx.createRadialGradient(player.x, player.y, 8, player.x, player.y, ambRad);
    ambGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    ambGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.85)');
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
      beamGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.95)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      lctx.fillStyle = beamGrad;
      lctx.beginPath();
      lctx.moveTo(beamOriginX, beamOriginY);
      lctx.arc(beamOriginX, beamOriginY, BEAM.range, startAngle, endAngle);
      lctx.closePath();
      lctx.fill();
    }

    // 3. Faint illumination around glowing oil pickups
    for (const p of pickups) {
      const pGrad = lctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.radius * 4.5);
      pGrad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
      pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lctx.fillStyle = pGrad;
      lctx.beginPath();
      lctx.arc(p.x, p.y, p.radius * 4.5, 0, Math.PI * 2);
      lctx.fill();
    }

    lctx.restore();

    // Composite darkness mask onto main canvas
    ctx.drawImage(this.lightCanvas, 0, 0);
  }

  drawVolumetricBeam(ctx, player) {
    const beamOriginX = player.x + Math.cos(player.aimAngle) * 16;
    const beamOriginY = player.y + Math.sin(player.aimAngle) * 16;
    const startAngle = player.aimAngle - BEAM.spreadAngle / 2;
    const endAngle = player.aimAngle + BEAM.spreadAngle / 2;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Outer warm gold beam radiance
    const beamGrad = ctx.createRadialGradient(
      beamOriginX,
      beamOriginY,
      6,
      beamOriginX,
      beamOriginY,
      BEAM.range,
    );
    beamGrad.addColorStop(0, 'rgba(255, 225, 120, 0.55)');
    beamGrad.addColorStop(0.4, 'rgba(255, 185, 56, 0.3)');
    beamGrad.addColorStop(0.85, 'rgba(255, 140, 20, 0.12)');
    beamGrad.addColorStop(1, 'rgba(255, 140, 20, 0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(beamOriginX, beamOriginY);
    ctx.arc(beamOriginX, beamOriginY, BEAM.range, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    // Intense central laser-core filament
    const coreGrad = ctx.createLinearGradient(
      beamOriginX,
      beamOriginY,
      beamOriginX + Math.cos(player.aimAngle) * BEAM.range,
      beamOriginY + Math.sin(player.aimAngle) * BEAM.range,
    );
    coreGrad.addColorStop(0, 'rgba(255, 255, 240, 0.85)');
    coreGrad.addColorStop(0.5, 'rgba(255, 220, 100, 0.45)');
    coreGrad.addColorStop(1, 'rgba(255, 180, 50, 0)');

    ctx.strokeStyle = coreGrad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(beamOriginX, beamOriginY);
    ctx.lineTo(
      beamOriginX + Math.cos(player.aimAngle) * BEAM.range,
      beamOriginY + Math.sin(player.aimAngle) * BEAM.range,
    );
    ctx.stroke();

    ctx.restore();
  }
}
