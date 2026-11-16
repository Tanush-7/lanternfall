// Procedural WebAudio sound synthesizer for LANTERNFALL (No external audio files)

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this.initialized = false;

    // Ambient drone references
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientFilter = null;
    this.ambientGain = null;

    // Beam crackle loop references
    this.beamGain = null;
    this.beamOsc = null;
    this.beamFilter = null;
    this.isBeamSounding = false;

    // Throttle high-frequency sounds
    this.lastHitSoundTime = 0;
    this.lastSizzleTime = 0;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initAmbientDrone();
      this.initBeamCrackle();
      this.initialized = true;
    } catch {
      // Audio not permitted or unsupported
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  initAmbientDrone() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.08, now);

    this.ambientFilter = this.ctx.createBiquadFilter();
    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.setValueAtTime(140, now);

    // Deep low frequency oscillators creating an unsettling atmospheric rumble
    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc1.type = 'triangle';
    this.ambientOsc1.frequency.setValueAtTime(55, now); // A1 note

    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientOsc2.type = 'sine';
    this.ambientOsc2.frequency.setValueAtTime(58.5, now); // subtle beating dissonance

    this.ambientOsc1.connect(this.ambientFilter);
    this.ambientOsc2.connect(this.ambientFilter);
    this.ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    this.ambientOsc1.start();
    this.ambientOsc2.start();
  }

  initBeamCrackle() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    this.beamGain = this.ctx.createGain();
    this.beamGain.gain.setValueAtTime(0, now);

    this.beamFilter = this.ctx.createBiquadFilter();
    this.beamFilter.type = 'bandpass';
    this.beamFilter.frequency.setValueAtTime(420, now);
    this.beamFilter.Q.setValueAtTime(3.0, now);

    // Noise buffer for burning beam sound
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Harmonic hum oscillator blended with noise
    this.beamOsc = this.ctx.createOscillator();
    this.beamOsc.type = 'sawtooth';
    this.beamOsc.frequency.setValueAtTime(110, now);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.15, now);
    this.beamOsc.connect(oscGain);
    oscGain.connect(this.beamFilter);

    whiteNoise.connect(this.beamFilter);
    this.beamFilter.connect(this.beamGain);
    this.beamGain.connect(this.masterGain);

    whiteNoise.start();
    this.beamOsc.start();
  }

  setBeamActive(active, heatNormalized = 0) {
    if (!this.ctx || !this.beamGain) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    if (active && !this.muted) {
      // Modulate frequency and intensity as heat builds up
      const targetFreq = 380 + heatNormalized * 320;
      this.beamFilter.frequency.setTargetAtTime(targetFreq, now, 0.08);
      this.beamGain.gain.setTargetAtTime(0.18 + heatNormalized * 0.1, now, 0.04);
      this.isBeamSounding = true;
    } else {
      this.beamGain.gain.setTargetAtTime(0.0001, now, 0.06);
      this.isBeamSounding = false;
    }
  }

  playSizzle() {
    if (!this.ctx || this.muted) return;
    const now = performance.now();
    if (now - this.lastSizzleTime < 70) return; // limit frequency
    this.lastSizzleTime = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800, t);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280 + Math.random() * 200, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  playEnemyDeath() {
    if (!this.ctx || this.muted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Deep ethereal dissipation whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.28);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.29);
  }

  playOilPickup() {
    if (!this.ctx || this.muted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Crystalline dual-tone bell chime (E5 -> B5)
    const tones = [659.25, 987.77];
    tones.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.001, t + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.18, t + idx * 0.06 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.42);
    });
  }

  playOverheat() {
    if (!this.ctx || this.muted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Sharp warning clang followed by hissing steam
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(740, t);
    osc.frequency.setValueAtTime(880, t + 0.08);

    oscGain.gain.setValueAtTime(0.25, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.23);

    // Steam noise burst
    const noiseLen = 0.45;
    const bufferSize = this.ctx.sampleRate * noiseLen;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.linearRampToValueAtTime(800, t + noiseLen);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseLen);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + noiseLen + 0.02);
  }

  playPlayerHurt() {
    if (!this.ctx || this.muted) return;
    const now = performance.now();
    if (now - this.lastHitSoundTime < 250) return;
    this.lastHitSoundTime = now;

    this.ensureContext();
    const t = this.ctx.currentTime;

    // Heavy punchy thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.22);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  playDash() {
    if (!this.ctx || this.muted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(150, t + 0.2);

    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  playBossStomp() {
    if (!this.ctx || this.muted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Massive sub-bass boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.6);

    gain.gain.setValueAtTime(0.48, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.66);
  }

  playWaveBanner() {
    if (!this.ctx || this.muted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Ominous church bell toll
    const harmonics = [180, 362, 545, 910];
    harmonics.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const amp = 0.16 / (i + 1);
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 1.65);
    });
  }

  playClick() {
    if (!this.ctx || this.muted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.05);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }
}

export const audio = new AudioManager();
