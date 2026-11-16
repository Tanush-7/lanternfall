// Player character (Lantern-Keeper) for LANTERNFALL

import { PLAYER, BEAM, ARENA, CANVAS } from './config.js';
import { audio } from './audio.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = ARENA.centerX;
    this.y = ARENA.centerY;
    this.vx = 0;
    this.vy = 0;
    this.aimAngle = 0;

    this.oil = PLAYER.startOil;
    this.maxOil = PLAYER.maxOil;
    this.heat = 0; // 0 to 100
    this.isOverheated = false;
    this.overheatTimer = 0;
    this.isFiring = false;

    this.radius = PLAYER.radius;
    this.invulnTimer = 0;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.dashDir = { dx: 0, dy: 0 };

    this.walkCycle = 0;
  }

  update(dt, input, particles) {
    // Cooldown timers
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;

    // Passive oil drain (sustaining the lantern)
    this.oil = Math.max(0, this.oil - PLAYER.oilPassiveDrain * dt);

    // Aiming angle towards mouse
    this.aimAngle = Math.atan2(input.mouse.y - this.y, input.mouse.x - this.x);

    // Dashing
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.x += this.dashDir.dx * PLAYER.dashSpeed * dt;
      this.y += this.dashDir.dy * PLAYER.dashSpeed * dt;
      particles.spawnDashGhosts(this.x, this.y);
    } else {
      // Normal movement
      const move = input.getMovementVector();
      if (input.isDashRequested() && this.dashCooldownTimer <= 0 && this.oil > PLAYER.dashOilCost) {
        // Trigger dash
        const dashDx = move.dx !== 0 || move.dy !== 0 ? move.dx : Math.cos(this.aimAngle);
        const dashDy = move.dx !== 0 || move.dy !== 0 ? move.dy : Math.sin(this.aimAngle);
        this.dashDir = { dx: dashDx, dy: dashDy };
        this.dashTimer = PLAYER.dashDuration;
        this.dashCooldownTimer = PLAYER.dashCooldown;
        this.invulnTimer = Math.max(this.invulnTimer, PLAYER.dashDuration);
        this.oil = Math.max(1, this.oil - PLAYER.dashOilCost);
        audio.playDash();
      } else {
        const targetVx = move.dx * PLAYER.speed;
        const targetVy = move.dy * PLAYER.speed;
        this.vx += (targetVx - this.vx) * Math.min(1, dt * 14);
        this.vy += (targetVy - this.vy) * Math.min(1, dt * 14);

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (move.dx !== 0 || move.dy !== 0) {
          this.walkCycle += dt * 10;
        }
      }
    }

    // Keep keeper bounded inside circular arena
    const distFromCenter = Math.hypot(this.x - ARENA.centerX, this.y - ARENA.centerY);
    const maxDist = ARENA.radius - this.radius - 2;
    if (distFromCenter > maxDist) {
      const angle = Math.atan2(this.y - ARENA.centerY, this.x - ARENA.centerX);
      this.x = ARENA.centerX + Math.cos(angle) * maxDist;
      this.y = ARENA.centerY + Math.sin(angle) * maxDist;
    }

    // Lantern Beam & Overheat Management
    if (this.isOverheated) {
      this.isFiring = false;
      this.overheatTimer -= dt;
      this.heat = Math.max(0, (this.overheatTimer / BEAM.overheatDuration) * 100);
      if (this.overheatTimer <= 0) {
        this.isOverheated = false;
        this.heat = 0;
      }
      // Venting smoke while overheated
      if (Math.random() < 0.4) {
        const lx = this.x + Math.cos(this.aimAngle) * 16;
        const ly = this.y + Math.sin(this.aimAngle) * 16;
        particles.spawnSmoke(lx, ly, (Math.random() - 0.5) * 20, -30, '#888899', 4, 0.4);
      }
    } else {
      if (input.isFiring()) {
        this.isFiring = true;
        this.heat += BEAM.heatPerSecond * dt;
        if (this.heat >= 100) {
          this.heat = 100;
          this.isOverheated = true;
          this.overheatTimer = BEAM.overheatDuration;
          this.isFiring = false;
          audio.playOverheat();
          const lx = this.x + Math.cos(this.aimAngle) * 16;
          const ly = this.y + Math.sin(this.aimAngle) * 16;
          particles.spawnOverheatBurst(lx, ly);
        }
      } else {
        this.isFiring = false;
        this.heat = Math.max(0, this.heat - BEAM.coolPerSecond * dt);
      }
    }

    // Update audio loop state
    audio.setBeamActive(this.isFiring, this.heat / 100);

    // Spawn sparks along beam when firing
    if (this.isFiring) {
      const lx = this.x + Math.cos(this.aimAngle) * 16;
      const ly = this.y + Math.sin(this.aimAngle) * 16;
      particles.spawnBeamSparks(lx, ly, this.aimAngle, BEAM.spreadAngle, 2);
    }
  }

  takeDamage(amount) {
    if (this.invulnTimer > 0) return false;
    this.oil = Math.max(0, this.oil - amount);
    this.invulnTimer = PLAYER.invulnDuration;
    audio.playPlayerHurt();
    return true;
  }

  healOil(amount) {
    this.oil = Math.min(this.maxOil, this.oil + amount);
  }

  draw(ctx) {
    // Flash if in invulnerability frames
    if (this.invulnTimer > 0 && Math.sin(this.invulnTimer * 28) < 0) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    // Keeper's shadow on stone ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rotate towards aim angle
    ctx.rotate(this.aimAngle);

    // Cloak / Robe Body
    const bob = Math.sin(this.walkCycle) * 1.5;
    ctx.fillStyle = '#1c1b26';
    ctx.beginPath();
    ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Mantle / Cowl lining
    ctx.strokeStyle = '#413c54';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Keeper Hood & Mask
    ctx.fillStyle = '#0f0e15';
    ctx.beginPath();
    ctx.arc(2, bob, this.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Keeper's glowing amber gaze inside hood
    ctx.fillStyle = '#ffbe3b';
    ctx.beginPath();
    ctx.arc(5, bob - 2, 1.8, 0, Math.PI * 2);
    ctx.arc(5, bob + 2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Arm holding out the Lantern
    const lanternDist = 16;
    ctx.strokeStyle = '#2b2938';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(lanternDist - 2, 6);
    ctx.stroke();

    // The Brass Lantern
    ctx.translate(lanternDist, 6);

    // Lantern top cap
    ctx.fillStyle = '#8c6d31';
    ctx.beginPath();
    ctx.rect(-3, -6, 6, 2.5);
    ctx.fill();

    // Lantern glass chamber
    const flameColor = this.isOverheated ? '#ff3333' : '#ffd166';
    ctx.fillStyle = flameColor;
    ctx.beginPath();
    ctx.rect(-2.5, -3.5, 5, 7);
    ctx.fill();

    // Lantern glass glow
    ctx.fillStyle = this.isOverheated ? 'rgba(255, 60, 60, 0.6)' : 'rgba(255, 209, 102, 0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Lantern brass struts
    ctx.strokeStyle = '#4a3b1a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-3, -4, 6, 8);

    ctx.restore();
  }
}
