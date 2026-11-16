// Configuration and tuning constants for LANTERNFALL

export const CANVAS = {
  width: 960,
  height: 600,
};

export const ARENA = {
  centerX: CANVAS.width / 2, // 480
  centerY: CANVAS.height / 2, // 300
  radius: 255,
  innerRuneRadius: 160,
  outerWallThickness: 16,
};

export const PLAYER = {
  speed: 175,
  radius: 14,
  maxOil: 100,
  startOil: 100,
  oilPassiveDrain: 0.75, // oil lost per second to sustain lantern
  dashSpeed: 380,
  dashDuration: 0.22,
  dashCooldown: 1.1,
  dashOilCost: 3,
  invulnDuration: 0.8,
};

export const BEAM = {
  range: 250,
  spreadAngle: Math.PI / 4.2, // ~43 degrees cone
  heatPerSecond: 36.0, // reaches 100% in ~2.8s
  coolPerSecond: 75.0, // cools from 100% to 0% in ~1.3s
  overheatDuration: 1.8, // lockout duration when jammed
  dps: 92, // damage per second to burning shadows
  knockback: 45, // gentle pushback in light cone
  ambientLightRadius: 85, // soft base illumination around keeper
};

export const ENEMY_TYPES = {
  CRAWLER: 'crawler',
  DARTER: 'darter',
  SHIELDBEARER: 'shieldbearer',
  SPITTER: 'spitter',
  BOSS_GOLIATH: 'goliath',
  BOSS_VOIDWEAVER: 'voidweaver',
};

export const ENEMY_DEFS = {
  crawler: {
    name: 'Shadow Crawler',
    hp: 24,
    speed: 105,
    radius: 11,
    damage: 12,
    score: 60,
    oilDrops: 1,
    color: '#341d3d',
    eyeColor: '#ff3d68',
  },
  darter: {
    name: 'Night Darter',
    hp: 36,
    speed: 70,
    dashSpeed: 260,
    radius: 12,
    damage: 16,
    score: 110,
    oilDrops: 2,
    color: '#1e2445',
    eyeColor: '#00e5ff',
  },
  shieldbearer: {
    name: 'Umbral Shield-Bearer',
    hp: 115,
    speed: 68,
    radius: 20,
    damage: 24,
    score: 220,
    oilDrops: 3,
    color: '#1a1824',
    eyeColor: '#ff9800',
    shieldAngle: Math.PI * 0.65, // ~117 degree frontal shield
  },
  spitter: {
    name: 'Shadow Wisp',
    hp: 42,
    speed: 52,
    radius: 13,
    damage: 14,
    score: 150,
    oilDrops: 2,
    color: '#2a1a38',
    eyeColor: '#cf53ff',
    shotCooldown: 2.8,
  },
  goliath: {
    name: 'The Umbral Goliath',
    hp: 540,
    speed: 54,
    radius: 36,
    damage: 32,
    score: 1200,
    oilDrops: 8,
    color: '#140f1a',
    eyeColor: '#ff1744',
    stompInterval: 5.5,
  },
  voidweaver: {
    name: 'The Voidweaver',
    hp: 840,
    speed: 62,
    radius: 32,
    damage: 28,
    score: 2500,
    oilDrops: 12,
    color: '#0e1124',
    eyeColor: '#d500f9',
    teleportInterval: 4.8,
  },
};

export const PICKUPS = {
  oilHealAmount: 10,
  lifetime: 13.0,
  magnetRadius: 75,
  boostedMagnetRadius: 150,
  magnetSpeed: 290,
  radius: 6,
};

export const COLORS = {
  bgVoid: '#050507',
  arenaFloor: '#111016',
  arenaBorder: '#2a2738',
  arenaRunes: '#242032',
  goldCore: '#fffdf0',
  goldBeam: '#ffb938',
  goldGlow: 'rgba(255, 185, 56, 0.22)',
  goldEmber: '#ffd166',
  heatCool: '#4cc9f0',
  heatWarn: '#f77f00',
  heatDanger: '#d62828',
  oilFlask: '#ffb703',
  oilEmpty: '#221e28',
  textLight: '#f4ede2',
  textDim: '#8b8599',
  shadowBlack: '#0a080d',
};

export const SCREENS = {
  TITLE: 'title',
  PLAY: 'play',
  GAMEOVER: 'gameover',
  PAUSE: 'pause',
};
