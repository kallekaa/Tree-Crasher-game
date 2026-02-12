import { Howl, Howler } from 'howler';

export class AudioManager {
  constructor() {
    this.loaded = false;
    this.enabled = true;

    // We'll generate sounds programmatically using Web Audio API
    // since we don't have audio files
    this.audioCtx = Howler.ctx;

    this.lastCrashTime = 0;
  }

  // Generate a crash sound using noise + filter
  playCrash(intensity = 1) {
    if (!this.enabled) return;

    const now = performance.now();
    if (now - this.lastCrashTime < 100) return; // debounce
    this.lastCrashTime = now;

    const ctx = this.audioCtx;
    const duration = 0.3 + intensity * 0.2;

    // Noise buffer
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Low-pass filter for thud
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400 + intensity * 600;

    // Volume
    const gain = ctx.createGain();
    gain.gain.value = Math.min(intensity * 0.4, 0.8);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();
    source.stop(ctx.currentTime + duration);
  }

  // Engine hum (simple oscillator)
  startEngine() {
    if (!this.enabled) return;

    const ctx = this.audioCtx;

    this.engineOsc = ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 60;

    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0.05;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    this.engineFilter = filter;

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(ctx.destination);

    this.engineOsc.start();
  }

  updateEngine(speedRatio) {
    if (!this.engineOsc || !this.enabled) return;

    // Pitch and volume scale with speed
    this.engineOsc.frequency.value = 60 + speedRatio * 140;
    this.engineGain.gain.value = 0.03 + speedRatio * 0.07;
    this.engineFilter.frequency.value = 200 + speedRatio * 800;
  }

  stopEngine() {
    if (this.engineOsc) {
      this.engineOsc.stop();
      this.engineOsc = null;
    }
  }

  // Score ding
  playScore() {
    if (!this.enabled) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 880;

    const gain = ctx.createGain();
    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopEngine();
      Howler.mute(true);
    } else {
      Howler.mute(false);
    }
  }
}
