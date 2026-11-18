// HUD, UI screens, floating text, screen shake, and cinematic presentation for LANTERNFALL

import { CANVAS, COLORS, SCREENS, ENEMY_DEFS } from './config.js';

export class FloatingText {
  constructor(text, x, y, color = '#ffd166', size = 16, life = 0.95) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.vy = -38;
  }

  update(dt) {
    this.life -= dt;
    this.y += this.vy * dt;
    this.vy *= 0.94;
    return this.life > 0;
  }

  draw(ctx) {
    const progress = this.life / this.maxLife;
    const alpha = Math.max(0, Math.min(1, progress * 1.5));
    const scale = progress > 0.8 ? 1.0 + (progress - 0.8) * 1.5 : 1.0;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.size}px 'Cinzel', 'Georgia', serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillText(this.text, 0, 0);

    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = alpha * 0.45;
    ctx.fillText(this.text, 0, 0);

    ctx.restore();
  }
}

export class HUD {
  constructor() {
    this.floatingTexts = [];
    this.trauma = 0;
    this.maxShakeOffset = 16;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeAngle = 0;

    this.flashColor = '#ffffff';
    this.flashAlpha = 0;
    this.flashDuration = 0.2;

    this.bestScore = 0;
    try {
      this.bestScore = Number(localStorage.getItem('lanternfall_best_score')) || 0;
    } catch {
      this.bestScore = 0;
    }
  }

  reset() {
    this.floatingTexts = [];
    this.trauma = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeAngle = 0;
    this.flashAlpha = 0;
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  addScreenFlash(color = '#ffffff', alpha = 0.5, duration = 0.2) {
    this.flashColor = color;
    this.flashAlpha = alpha;
    this.flashDuration = duration;
  }

  addFloatingText(text, x, y, color = '#ffd166', size = 16) {
    this.floatingTexts.push(new FloatingText(text, x, y, color, size));
  }

  saveBestScore(score) {
    if (score > this.bestScore) {
      this.bestScore = score;
      try {
        localStorage.setItem('lanternfall_best_score', String(score));
      } catch {}
      return true;
    }
    return false;
  }

  update(dt) {
    if (this.trauma > 0) {
      const shakeMag = this.trauma * this.trauma * this.maxShakeOffset;
      this.shakeX = (Math.random() * 2 - 1) * shakeMag;
      this.shakeY = (Math.random() * 2 - 1) * shakeMag;
      this.shakeAngle = (Math.random() * 2 - 1) * (this.trauma * this.trauma * 0.035);
      this.trauma = Math.max(0, this.trauma - dt * 2.2);
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeAngle = 0;
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - (dt / this.flashDuration));
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      if (!this.floatingTexts[i].update(dt)) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  drawScreenFlash(ctx) {
    if (this.flashAlpha <= 0) return;
    ctx.save();
    ctx.fillStyle = this.flashColor;
    ctx.globalAlpha = Math.min(1, this.flashAlpha);
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    ctx.restore();
  }

  drawVignette(ctx) {
    ctx.save();
    const grad = ctx.createRadialGradient(
      CANVAS.width / 2,
      CANVAS.height / 2,
      CANVAS.height * 0.38,
      CANVAS.width / 2,
      CANVAS.height / 2,
      CANVAS.width * 0.70,
    );
    grad.addColorStop(0, 'rgba(4, 3, 6, 0)');
    grad.addColorStop(0.65, 'rgba(4, 3, 6, 0.40)');
    grad.addColorStop(1, 'rgba(2, 2, 4, 0.92)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    ctx.restore();
  }

  drawPlayHUD(ctx, player, waveManager, score, combo) {
    ctx.save();

    // 1. Top Left: Night & Wave Status Banner
    ctx.fillStyle = 'rgba(15, 13, 22, 0.88)';
    ctx.strokeStyle = '#433b5c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(24, 18, 230, 48, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd54f';
    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(44, 42, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffd54f';
    ctx.font = "bold 14px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'left';
    ctx.fillText(`NIGHT ${waveManager.night} · WAVE ${waveManager.wave}`, 58, 36);

    ctx.fillStyle = '#aba3bd';
    ctx.font = "11px 'Cinzel', 'Georgia', serif";
    const remainingCount = waveManager.enemyManager.enemies.length + waveManager.spawnQueue.length;
    ctx.fillText(`SHADOWS REMAINING: ${remainingCount}`, 58, 54);

    // 2. Top Right: Score & Best Record
    ctx.fillStyle = 'rgba(15, 13, 22, 0.88)';
    ctx.strokeStyle = '#433b5c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(CANVAS.width - 245, 18, 220, 48, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 16px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, CANVAS.width - 38, 36);

    ctx.fillStyle = '#aba3bd';
    ctx.font = "11px 'Cinzel', 'Georgia', serif";
    ctx.fillText(`BEST RECORD: ${Math.max(score, this.bestScore).toLocaleString()}`, CANVAS.width - 38, 54);

    // 3. Combo Multiplier Indicator
    if (combo > 1) {
      ctx.fillStyle = '#ffb300';
      ctx.shadowColor = '#ff8f00';
      ctx.shadowBlur = 10;
      ctx.font = "bold 15px 'Cinzel', 'Georgia', serif";
      ctx.textAlign = 'right';
      ctx.fillText(`★ COMBO x${combo} ★`, CANVAS.width - 38, 82);
      ctx.shadowBlur = 0;
    }

    // 4. Boss Health Bar (if active)
    if (waveManager.boss && waveManager.boss.hp > 0) {
      const boss = waveManager.boss;
      const barW = 440;
      const barH = 16;
      const barX = (CANVAS.width - barW) / 2;
      const barY = 28;
      const pct = Math.max(0, Math.min(1, boss.hp / boss.maxHp));

      ctx.fillStyle = 'rgba(10, 8, 14, 0.92)';
      ctx.fillRect(barX - 8, barY - 20, barW + 16, barH + 30);
      ctx.strokeStyle = '#7f1d2f';
      ctx.lineWidth = 2.0;
      ctx.strokeRect(barX - 8, barY - 20, barW + 16, barH + 30);

      ctx.fillStyle = '#ff3d68';
      ctx.shadowColor = '#d50000';
      ctx.shadowBlur = 12;
      ctx.font = "bold 13px 'Cinzel', 'Georgia', serif";
      ctx.textAlign = 'center';
      ctx.fillText(`☠  ${boss.def.name.toUpperCase()}  ☠`, CANVAS.width / 2, barY - 5);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#220b12';
      ctx.fillRect(barX, barY, barW, barH);

      const bossGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
      bossGrad.addColorStop(0, '#c62828');
      bossGrad.addColorStop(0.5, '#e53935');
      bossGrad.addColorStop(1, '#ff6e40');
      ctx.fillStyle = bossGrad;
      ctx.fillRect(barX, barY, barW * pct, barH);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1.4;
      for (let s = 1; s <= 3; s++) {
        const sx = barX + (barW * s) / 4;
        ctx.beginPath();
        ctx.moveTo(sx, barY);
        ctx.lineTo(sx, barY + barH);
        ctx.stroke();
      }
    }

    // 5. Wave Notification Banner
    if (waveManager.banner && waveManager.banner.timer > 0) {
      const bAlpha = Math.min(1, waveManager.banner.timer, 4.0 - waveManager.banner.timer);
      ctx.globalAlpha = Math.max(0, bAlpha);
      ctx.fillStyle = 'rgba(8, 7, 14, 0.88)';
      ctx.fillRect(0, CANVAS.height / 2 - 145, CANVAS.width, 58);

      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(CANVAS.width / 2 - 250, CANVAS.height / 2 - 145);
      ctx.lineTo(CANVAS.width / 2 + 250, CANVAS.height / 2 - 145);
      ctx.moveTo(CANVAS.width / 2 - 250, CANVAS.height / 2 - 87);
      ctx.lineTo(CANVAS.width / 2 + 250, CANVAS.height / 2 - 87);
      ctx.stroke();

      ctx.fillStyle = '#ffd54f';
      ctx.shadowColor = '#ffb300';
      ctx.shadowBlur = 12;
      ctx.font = "bold 18px 'Cinzel', 'Georgia', serif";
      ctx.textAlign = 'center';
      ctx.fillText(waveManager.banner.text, CANVAS.width / 2, CANVAS.height / 2 - 116);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#cdc6dc';
      ctx.font = "12px 'Cinzel', 'Georgia', serif";
      ctx.fillText(waveManager.banner.subtext, CANVAS.width / 2, CANVAS.height / 2 - 96);
      ctx.globalAlpha = 1.0;
    }

    // 6. Bottom HUD: Oil Flask Bar & Heat Gauge
    this.drawBottomBars(ctx, player);

    // 7. Floating Combat Text
    for (const ft of this.floatingTexts) {
      ft.draw(ctx);
    }

    ctx.restore();
  }

  drawBottomBars(ctx, player) {
    const bottomY = CANVAS.height - 44;
    const barW = 220;
    const barH = 16;

    // --- OIL FLASK BAR ---
    const oilX = CANVAS.width / 2 - barW - 28;
    const oilPct = Math.max(0, Math.min(1, player.oil / player.maxOil));
    const isLowOil = player.oil < 25;

    ctx.fillStyle = 'rgba(12, 11, 18, 0.92)';
    ctx.strokeStyle = isLowOil && Math.sin(performance.now() * 0.014) > 0 ? '#ff1744' : '#433b5c';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(oilX - 8, bottomY - 20, barW + 16, barH + 28, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isLowOil ? '#ff5252' : '#ffd54f';
    ctx.font = "bold 11px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'left';
    ctx.fillText('LANTERN OIL (HEALTH)', oilX, bottomY - 6);

    ctx.textAlign = 'right';
    ctx.fillText(`${Math.ceil(player.oil)}%`, oilX + barW, bottomY - 6);

    ctx.fillStyle = '#1c1926';
    ctx.fillRect(oilX, bottomY, barW, barH);

    const oilGrad = ctx.createLinearGradient(oilX, bottomY, oilX + barW, bottomY);
    if (isLowOil) {
      oilGrad.addColorStop(0, '#d50000');
      oilGrad.addColorStop(1, '#ff5252');
    } else {
      oilGrad.addColorStop(0, '#f57c00');
      oilGrad.addColorStop(0.6, '#ffb300');
      oilGrad.addColorStop(1, '#ffe082');
    }
    ctx.fillStyle = oilGrad;
    ctx.fillRect(oilX, bottomY, barW * oilPct, barH);

    // --- BEAM HEAT BAR ---
    const heatX = CANVAS.width / 2 + 28;
    const heatPct = Math.max(0, Math.min(1, player.heat / 100));

    ctx.fillStyle = 'rgba(12, 11, 18, 0.92)';
    ctx.strokeStyle = player.isOverheated ? '#ff1744' : '#433b5c';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(heatX - 8, bottomY - 20, barW + 16, barH + 28, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = player.isOverheated ? '#ff3344' : '#80deea';
    ctx.font = "bold 11px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'left';
    const heatLabel = player.isOverheated ? 'OVERHEATED (JAMMED!)' : 'BEAM HEAT';
    ctx.fillText(heatLabel, heatX, bottomY - 6);

    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(player.heat)}%`, heatX + barW, bottomY - 6);

    ctx.fillStyle = '#1c1926';
    ctx.fillRect(heatX, bottomY, barW, barH);

    const heatGrad = ctx.createLinearGradient(heatX, bottomY, heatX + barW, bottomY);
    heatGrad.addColorStop(0, '#00b0ff');
    heatGrad.addColorStop(0.5, '#ffd600');
    heatGrad.addColorStop(1, '#ff1744');

    ctx.fillStyle = player.isOverheated ? '#ff1744' : heatGrad;
    ctx.fillRect(heatX, bottomY, barW * heatPct, barH);
  }

  drawTitleScreen(ctx) {
    ctx.save();

    const cx = CANVAS.width / 2;
    const cy = CANVAS.height / 2 - 30;

    // Eerie Lurking Shadow Eyes in the Outer Darkness
    const shadowEyes = [
      { x: 130, y: 155, color: '#ff1744' },
      { x: 840, y: 185, color: '#00e5ff' },
      { x: 790, y: 460, color: '#d500f9' },
      { x: 150, y: 440, color: '#ff9100' },
    ];
    for (const eye of shadowEyes) {
      ctx.fillStyle = eye.color;
      ctx.shadowColor = eye.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, 2.5, 0, Math.PI * 2);
      ctx.arc(eye.x + 8, eye.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Sacred Sanctuary Pedestal
    ctx.fillStyle = '#1e1b29';
    ctx.strokeStyle = '#4e4566';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(cx - 36, cy + 28, 72, 18, 5);
    ctx.fill();
    ctx.stroke();

    // Sacred Lantern Volumetric Radiant Sunburst Aura
    const auraGrad = ctx.createRadialGradient(cx, cy - 2, 8, cx, cy - 2, 130);
    auraGrad.addColorStop(0, 'rgba(255, 240, 160, 0.70)');
    auraGrad.addColorStop(0.35, 'rgba(255, 190, 60, 0.35)');
    auraGrad.addColorStop(0.75, 'rgba(255, 130, 20, 0.12)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 130, 0, Math.PI * 2);
    ctx.fill();

    // 6 Sunburst Rays Spreading Outward from Lantern
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let r = 0; r < 6; r++) {
      const rayAngle = (r * Math.PI * 2) / 6 + Math.sin(performance.now() * 0.001 + r) * 0.05;
      const rGrad = ctx.createRadialGradient(cx, cy - 2, 10, cx, cy - 2, 110);
      rGrad.addColorStop(0, 'rgba(255, 235, 160, 0.16)');
      rGrad.addColorStop(0.7, 'rgba(255, 180, 50, 0.04)');
      rGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 2);
      ctx.arc(cx, cy - 2, 110, rayAngle - 0.08, rayAngle + 0.08);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Sacred Brass Lantern Centerpiece
    ctx.fillStyle = '#d4af37';
    ctx.strokeStyle = '#5a4315';
    ctx.lineWidth = 2.0;

    // Top Dome & Ring
    ctx.beginPath();
    ctx.rect(cx - 16, cy - 26, 32, 8);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy - 30, 5, Math.PI, 0);
    ctx.stroke();

    // Glass Chamber & Blazing Holy Core
    ctx.fillStyle = '#ffd54f';
    ctx.fillRect(cx - 14, cy - 18, 28, 38);

    const flameGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 20);
    flameGrad.addColorStop(0, '#ffffff');
    flameGrad.addColorStop(0.35, '#ffecb3');
    flameGrad.addColorStop(0.7, '#ffb300');
    flameGrad.addColorStop(1, '#ff6d00');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();

    // Brass Cage Struts
    ctx.strokeStyle = '#503c14';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(cx - 14, cy - 18, 28, 38);
    ctx.beginPath();
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx, cy + 20);
    ctx.moveTo(cx - 14, cy + 1);
    ctx.lineTo(cx + 14, cy + 1);
    ctx.stroke();

    // --- TITLE TYPOGRAPHY ---
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.font = "bold 54px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'center';
    ctx.fillText('LANTERNFALL', cx + 3, cy - 110);

    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = 14;
    const titleGrad = ctx.createLinearGradient(cx - 180, cy - 145, cx + 180, cy - 95);
    titleGrad.addColorStop(0, '#ffffff');
    titleGrad.addColorStop(0.28, '#ffecb3');
    titleGrad.addColorStop(0.68, '#ffd54f');
    titleGrad.addColorStop(1, '#ff8f00');
    ctx.fillStyle = titleGrad;
    ctx.fillText('LANTERNFALL', cx, cy - 112);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffd54f';
    ctx.font = "bold 14px 'Cinzel', 'Georgia', serif";
    ctx.fillText('✦   KEEP THE FLAME · SURVIVE THE DARK   ✦', cx, cy - 78);

    // Controls Card Box
    ctx.fillStyle = 'rgba(15, 13, 22, 0.92)';
    ctx.strokeStyle = '#4a4163';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(cx - 245, cy + 66, 490, 74, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ede5d3';
    ctx.font = "12px 'Cinzel', 'Georgia', serif";
    ctx.fillText('MOUSE: Aim Lantern Beam   |   HOLD LEFT CLICK / [F]: Burn Shadows', cx, cy + 93);
    ctx.fillText('[W, A, S, D] / ARROWS: Move Keeper   |   SPACE / RIGHT CLICK: Dodge Dash', cx, cy + 118);

    // Pulsing Start Prompt Button
    const pulse = 0.7 + 0.3 * Math.sin(performance.now() * 0.005);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd54f';
    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = 8;
    ctx.font = "bold 18px 'Cinzel', 'Georgia', serif";
    ctx.fillText('✦   CLICK OR PRESS SPACE TO START   ✦', cx, cy + 174);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;

    // Best Record
    if (this.bestScore > 0) {
      ctx.fillStyle = '#aba3bd';
      ctx.font = "12px 'Cinzel', 'Georgia', serif";
      ctx.fillText(`ANCIENT RECORD: ${this.bestScore.toLocaleString()} PTS`, cx, cy + 206);
    }

    ctx.restore();
  }

  drawGameOverScreen(ctx, score, wavesCleared, kills) {
    ctx.save();

    // Dark moody abyss overlay
    ctx.fillStyle = 'rgba(5, 4, 8, 0.88)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    const cx = CANVAS.width / 2;
    const cy = CANVAS.height / 2;

    // Header Title
    ctx.shadowColor = '#d50000';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#ff3d68';
    ctx.font = "bold 46px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'center';
    ctx.fillText('THE LIGHT HAS FADED', cx, cy - 120);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#c0b8cd';
    ctx.font = "italic 14px 'Georgia', serif";
    ctx.fillText('The shadows reclaimed the sacred sanctuary into the abyss.', cx, cy - 85);

    // Gothic Runic Score Tablet
    ctx.fillStyle = 'rgba(16, 14, 24, 0.94)';
    ctx.strokeStyle = '#4e4466';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(cx - 210, cy - 62, 420, 165, 10);
    ctx.fill();
    ctx.stroke();

    // Golden Corner Accents
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.0;
    const corners = [
      [cx - 204, cy - 56],
      [cx + 204, cy - 56],
      [cx - 204, cy + 97],
      [cx + 204, cy + 97],
    ];
    for (const [x, y] of corners) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Final Score
    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 26px 'Cinzel', 'Georgia', serif";
    ctx.fillText(`FINAL SCORE: ${score.toLocaleString()}`, cx, cy - 20);

    ctx.fillStyle = '#ffd54f';
    ctx.font = "15px 'Cinzel', 'Georgia', serif";
    ctx.fillText(`BEST RECORD: ${Math.max(score, this.bestScore).toLocaleString()}`, cx, cy + 12);

    ctx.fillStyle = '#aba3bd';
    ctx.font = "13px 'Cinzel', 'Georgia', serif";
    ctx.fillText(`WAVES PURGED: ${wavesCleared}   |   SHADOWS SLAIN: ${kills}`, cx, cy + 46);

    if (score >= this.bestScore && score > 0) {
      ctx.fillStyle = '#ffb300';
      ctx.font = "bold 14px 'Cinzel', 'Georgia', serif";
      ctx.fillText('★ NEW SANCTUARY RECORD ★', cx, cy + 76);
    }

    // Reignite Prompt
    const pulse = 0.7 + 0.3 * Math.sin(performance.now() * 0.005);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd54f';
    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = 12;
    ctx.font = "bold 16px 'Cinzel', 'Georgia', serif";
    ctx.fillText('✦   PRESS [ R ] OR CLICK TO REIGNITE   ✦', cx, cy + 144);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;

    ctx.restore();
  }

  drawPauseScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(4, 3, 7, 0.75)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 34px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'center';
    ctx.fillText('GAME PAUSED', CANVAS.width / 2, CANVAS.height / 2 - 20);

    ctx.fillStyle = '#a8a0b5';
    ctx.font = "14px 'Cinzel', 'Georgia', serif";
    ctx.fillText('PRESS [ ESC ] OR [ P ] TO RESUME', CANVAS.width / 2, CANVAS.height / 2 + 20);
    ctx.fillText('PRESS [ R ] TO RESTART RUN', CANVAS.width / 2, CANVAS.height / 2 + 45);
    ctx.restore();
  }
}
