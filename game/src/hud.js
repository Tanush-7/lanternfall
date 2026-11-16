// HUD, UI screens, floating text, screen shake, and vignette renderer for LANTERNFALL

import { CANVAS, COLORS, SCREENS, ENEMY_DEFS } from './config.js';

export class FloatingText {
  constructor(text, x, y, color = '#ffd166', size = 16, life = 0.9) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.vy = -35;
  }

  update(dt) {
    this.life -= dt;
    this.y += this.vy * dt;
    this.vy *= 0.95;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.size}px 'Cinzel', 'Georgia', serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

export class HUD {
  constructor() {
    this.floatingTexts = [];
    this.trauma = 0; // 0 to 1 for screen shake
    this.maxShakeOffset = 14;
    this.shakeX = 0;
    this.shakeY = 0;

    // Local storage best score
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
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
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
    // Screen shake trauma decay
    if (this.trauma > 0) {
      const shakeMagnitude = this.trauma * this.trauma * this.maxShakeOffset;
      this.shakeX = (Math.random() * 2 - 1) * shakeMagnitude;
      this.shakeY = (Math.random() * 2 - 1) * shakeMagnitude;
      this.trauma = Math.max(0, this.trauma - dt * 2.2);
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      if (!this.floatingTexts[i].update(dt)) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  drawVignette(ctx) {
    ctx.save();
    const grad = ctx.createRadialGradient(
      CANVAS.width / 2,
      CANVAS.height / 2,
      CANVAS.height * 0.38,
      CANVAS.width / 2,
      CANVAS.height / 2,
      CANVAS.width * 0.68,
    );
    grad.addColorStop(0, 'rgba(5, 5, 7, 0)');
    grad.addColorStop(0.7, 'rgba(5, 5, 7, 0.45)');
    grad.addColorStop(1, 'rgba(5, 5, 7, 0.95)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    ctx.restore();
  }

  drawPlayHUD(ctx, player, waveManager, score, combo) {
    // 1. Top Bar: Wave, Night, and Score
    ctx.save();

    // Night & Wave pill
    ctx.fillStyle = 'rgba(17, 16, 22, 0.75)';
    ctx.strokeStyle = '#2d2a3b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(24, 18, 210, 46, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e5c07b';
    ctx.font = "bold 15px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'left';
    ctx.fillText(`NIGHT ${waveManager.night} · WAVE ${waveManager.wave}`, 38, 38);

    ctx.fillStyle = '#8e889e';
    ctx.font = "12px 'Cinzel', 'Georgia', serif";
    const remainingCount = waveManager.enemyManager.enemies.length + waveManager.spawnQueue.length;
    ctx.fillText(`SHADOWS: ${remainingCount}`, 38, 54);

    // Score & Best Score
    ctx.fillStyle = 'rgba(17, 16, 22, 0.75)';
    ctx.strokeStyle = '#2d2a3b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(CANVAS.width - 234, 18, 210, 46, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 16px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, CANVAS.width - 38, 38);

    ctx.fillStyle = '#8e889e';
    ctx.font = "12px 'Cinzel', 'Georgia', serif";
    ctx.fillText(`BEST: ${Math.max(score, this.bestScore).toLocaleString()}`, CANVAS.width - 38, 54);

    // Combo multiplier indicator
    if (combo > 1) {
      ctx.fillStyle = '#ffd166';
      ctx.font = "bold 14px 'Cinzel', 'Georgia', serif";
      ctx.textAlign = 'right';
      ctx.fillText(`COMBO x${combo}`, CANVAS.width - 38, 78);
    }

    // 2. Boss Health Bar (if active)
    if (waveManager.boss && waveManager.boss.hp > 0) {
      const boss = waveManager.boss;
      const barW = 380;
      const barH = 14;
      const barX = (CANVAS.width - barW) / 2;
      const barY = 28;
      const pct = Math.max(0, Math.min(1, boss.hp / boss.maxHp));

      ctx.fillStyle = 'rgba(10, 8, 14, 0.85)';
      ctx.fillRect(barX - 4, barY - 18, barW + 8, barH + 26);
      ctx.strokeStyle = '#4a1525';
      ctx.strokeRect(barX - 4, barY - 18, barW + 8, barH + 26);

      ctx.fillStyle = '#ff3d68';
      ctx.font = "bold 13px 'Cinzel', 'Georgia', serif";
      ctx.textAlign = 'center';
      ctx.fillText(boss.def.name.toUpperCase(), CANVAS.width / 2, barY - 4);

      ctx.fillStyle = '#221118';
      ctx.fillRect(barX, barY, barW, barH);

      const bossGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
      bossGrad.addColorStop(0, '#d62828');
      bossGrad.addColorStop(1, '#ff5964');
      ctx.fillStyle = bossGrad;
      ctx.fillRect(barX, barY, barW * pct, barH);
    }

    // 3. Wave Notification Banner
    if (waveManager.banner && waveManager.banner.timer > 0) {
      const bAlpha = Math.min(1, waveManager.banner.timer, 4.0 - waveManager.banner.timer);
      ctx.globalAlpha = Math.max(0, bAlpha);
      ctx.fillStyle = 'rgba(5, 5, 8, 0.78)';
      ctx.fillRect(0, CANVAS.height / 2 - 140, CANVAS.width, 54);

      ctx.strokeStyle = '#c99a3e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(CANVAS.width / 2 - 220, CANVAS.height / 2 - 140);
      ctx.lineTo(CANVAS.width / 2 + 220, CANVAS.height / 2 - 140);
      ctx.moveTo(CANVAS.width / 2 - 220, CANVAS.height / 2 - 86);
      ctx.lineTo(CANVAS.width / 2 + 220, CANVAS.height / 2 - 86);
      ctx.stroke();

      ctx.fillStyle = '#ffcf56';
      ctx.font = "bold 17px 'Cinzel', 'Georgia', serif";
      ctx.textAlign = 'center';
      ctx.fillText(waveManager.banner.text, CANVAS.width / 2, CANVAS.height / 2 - 114);

      ctx.fillStyle = '#b0a9bd';
      ctx.font = "12px 'Cinzel', 'Georgia', serif";
      ctx.fillText(waveManager.banner.subtext, CANVAS.width / 2, CANVAS.height / 2 - 95);
      ctx.globalAlpha = 1.0;
    }

    // 4. Bottom HUD: Oil Flask / Health Bar & Beam Heat Gauge
    this.drawBottomBars(ctx, player);

    // 5. Floating text numbers
    for (const ft of this.floatingTexts) {
      ft.draw(ctx);
    }

    ctx.restore();
  }

  drawBottomBars(ctx, player) {
    const bottomY = CANVAS.height - 42;
    const barW = 200;
    const barH = 14;

    // --- OIL BAR (HEALTH & FUEL) ---
    const oilX = CANVAS.width / 2 - barW - 24;
    const oilPct = Math.max(0, Math.min(1, player.oil / player.maxOil));
    const isLowOil = player.oil < 25;

    ctx.fillStyle = 'rgba(15, 14, 20, 0.85)';
    ctx.strokeStyle = isLowOil && Math.sin(performance.now() * 0.012) > 0 ? '#ff3344' : '#383347';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(oilX - 8, bottomY - 18, barW + 16, barH + 26, 6);
    ctx.fill();
    ctx.stroke();

    // Oil bar label
    ctx.fillStyle = isLowOil ? '#ff5252' : '#e5c07b';
    ctx.font = "bold 11px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'left';
    ctx.fillText('LANTERN OIL (HEALTH)', oilX, bottomY - 5);

    ctx.textAlign = 'right';
    ctx.fillText(`${Math.ceil(player.oil)}%`, oilX + barW, bottomY - 5);

    // Empty track
    ctx.fillStyle = '#1e1c26';
    ctx.fillRect(oilX, bottomY, barW, barH);

    // Oil fill gradient
    const oilGrad = ctx.createLinearGradient(oilX, bottomY, oilX + barW, bottomY);
    if (isLowOil) {
      oilGrad.addColorStop(0, '#c1121f');
      oilGrad.addColorStop(1, '#ff4d6d');
    } else {
      oilGrad.addColorStop(0, '#d48b11');
      oilGrad.addColorStop(1, '#ffc038');
    }
    ctx.fillStyle = oilGrad;
    ctx.fillRect(oilX, bottomY, barW * oilPct, barH);

    // --- BEAM HEAT BAR ---
    const heatX = CANVAS.width / 2 + 24;
    const heatPct = Math.max(0, Math.min(1, player.heat / 100));

    ctx.fillStyle = 'rgba(15, 14, 20, 0.85)';
    ctx.strokeStyle = player.isOverheated ? '#ff2233' : '#383347';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(heatX - 8, bottomY - 18, barW + 16, barH + 26, 6);
    ctx.fill();
    ctx.stroke();

    // Heat bar label
    ctx.fillStyle = player.isOverheated ? '#ff3333' : '#85dcb';
    ctx.font = "bold 11px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'left';
    const heatLabel = player.isOverheated ? 'OVERHEATED (JAMMED!)' : 'BEAM HEAT';
    ctx.fillText(heatLabel, heatX, bottomY - 5);

    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(player.heat)}%`, heatX + barW, bottomY - 5);

    // Empty track
    ctx.fillStyle = '#1e1c26';
    ctx.fillRect(heatX, bottomY, barW, barH);

    // Heat fill gradient
    const heatGrad = ctx.createLinearGradient(heatX, bottomY, heatX + barW, bottomY);
    heatGrad.addColorStop(0, '#3a86ff');
    heatGrad.addColorStop(0.5, '#ffbe0b');
    heatGrad.addColorStop(1, '#ff006e');

    ctx.fillStyle = player.isOverheated ? '#ff2233' : heatGrad;
    ctx.fillRect(heatX, bottomY, barW * heatPct, barH);
  }

  drawTitleScreen(ctx) {
    ctx.save();

    // Dark backdrop overlay
    ctx.fillStyle = 'rgba(5, 5, 8, 0.75)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    // Main Title
    ctx.shadowColor = '#ffb938';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#fff4cf';
    ctx.font = "bold 46px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'center';
    ctx.fillText('LANTERNFALL', CANVAS.width / 2, CANVAS.height / 2 - 100);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#d4af37';
    ctx.font = "15px 'Cinzel', 'Georgia', serif";
    ctx.fillText('KEEP THE FLAME · SURVIVE THE DARK', CANVAS.width / 2, CANVAS.height / 2 - 65);

    // Lore snippet
    ctx.fillStyle = '#9e99ab';
    ctx.font = "italic 13px 'Georgia', serif";
    ctx.fillText('You are the lone lantern-keeper in an encroaching abyss.', CANVAS.width / 2, CANVAS.height / 2 - 25);
    ctx.fillText('Your lantern beam burns shadows, but overheats if held too long.', CANVAS.width / 2, CANVAS.height / 2 - 6);
    ctx.fillText('Lantern oil is your lifeblood: harvest dropped oil to endure.', CANVAS.width / 2, CANVAS.height / 2 + 13);

    // Controls card
    ctx.fillStyle = 'rgba(18, 17, 24, 0.85)';
    ctx.strokeStyle = '#363345';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(CANVAS.width / 2 - 200, CANVAS.height / 2 + 35, 400, 68, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e2dac6';
    ctx.font = "12px 'Cinzel', 'Georgia', serif";
    ctx.fillText('MOUSE: Aim Beam  |  LEFT CLICK / [F]: Burn Shadows', CANVAS.width / 2, CANVAS.height / 2 + 58);
    ctx.fillText('WASD / ARROWS: Move  |  SPACE / RIGHT CLICK: Dash', CANVAS.width / 2, CANVAS.height / 2 + 82);

    // Pulsing Start Prompt
    const pulse = 0.65 + 0.35 * Math.sin(performance.now() * 0.005);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd166';
    ctx.font = "bold 18px 'Cinzel', 'Georgia', serif";
    ctx.fillText('CLICK OR PRESS SPACE TO START', CANVAS.width / 2, CANVAS.height / 2 + 140);
    ctx.globalAlpha = 1.0;

    // Best Score
    if (this.bestScore > 0) {
      ctx.fillStyle = '#8f899c';
      ctx.font = "13px 'Cinzel', 'Georgia', serif";
      ctx.fillText(`BEST RECORD: ${this.bestScore.toLocaleString()} PTS`, CANVAS.width / 2, CANVAS.height / 2 + 172);
    }

    ctx.restore();
  }

  drawGameOverScreen(ctx, score, wavesCleared, kills) {
    ctx.save();

    // Dark reddish overlay
    ctx.fillStyle = 'rgba(6, 4, 8, 0.88)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    ctx.shadowColor = '#ff2a4b';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff4d6d';
    ctx.font = "bold 40px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'center';
    ctx.fillText('THE LIGHT HAS FADED', CANVAS.width / 2, CANVAS.height / 2 - 110);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aba3b8';
    ctx.font = "14px 'Cinzel', 'Georgia', serif";
    ctx.fillText('The darkness claimed your soul in the ancient sanctuary.', CANVAS.width / 2, CANVAS.height / 2 - 76);

    // Score Card Box
    ctx.fillStyle = 'rgba(19, 17, 26, 0.9)';
    ctx.strokeStyle = '#3d374d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(CANVAS.width / 2 - 170, CANVAS.height / 2 - 50, 340, 140, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 22px 'Cinzel', 'Georgia', serif";
    ctx.fillText(`FINAL SCORE: ${score.toLocaleString()}`, CANVAS.width / 2, CANVAS.height / 2 - 16);

    ctx.fillStyle = '#ffd166';
    ctx.font = "14px 'Cinzel', 'Georgia', serif";
    ctx.fillText(`BEST SCORE: ${Math.max(score, this.bestScore).toLocaleString()}`, CANVAS.width / 2, CANVAS.height / 2 + 12);

    ctx.fillStyle = '#a69fb3';
    ctx.font = "13px 'Cinzel', 'Georgia', serif";
    ctx.fillText(`WAVES PURGED: ${wavesCleared}  |  SHADOWS SLAIN: ${kills}`, CANVAS.width / 2, CANVAS.height / 2 + 42);

    if (score >= this.bestScore && score > 0) {
      ctx.fillStyle = '#ffbe0b';
      ctx.font = "bold 13px 'Cinzel', 'Georgia', serif";
      ctx.fillText('★ NEW BEST RECORD ★', CANVAS.width / 2, CANVAS.height / 2 + 70);
    }

    // Restart prompt
    const pulse = 0.65 + 0.35 * Math.sin(performance.now() * 0.005);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#e2dac6';
    ctx.font = "bold 16px 'Cinzel', 'Georgia', serif";
    ctx.fillText('PRESS [ R ] OR CLICK TO REIGNITE', CANVAS.width / 2, CANVAS.height / 2 + 130);
    ctx.globalAlpha = 1.0;

    ctx.restore();
  }

  drawPauseScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 5, 7, 0.72)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 32px 'Cinzel', 'Georgia', serif";
    ctx.textAlign = 'center';
    ctx.fillText('GAME PAUSED', CANVAS.width / 2, CANVAS.height / 2 - 20);

    ctx.fillStyle = '#a39cb0';
    ctx.font = "14px 'Cinzel', 'Georgia', serif";
    ctx.fillText('PRESS [ ESC ] OR [ P ] TO RESUME', CANVAS.width / 2, CANVAS.height / 2 + 20);
    ctx.fillText('PRESS [ R ] TO RESTART RUN', CANVAS.width / 2, CANVAS.height / 2 + 45);
    ctx.restore();
  }
}
