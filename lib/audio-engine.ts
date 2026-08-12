import { CurvePoint } from './types';

export const FREQ_MIN = 200;
export const FREQ_MAX = 1000;

/** Y (0 bottom - 100 top) -> pitch frequency in Hz (200 - 1000) */
export function mapYToFrequency(yPercent: number): number {
  const clamped = Math.max(0, Math.min(100, yPercent));
  return FREQ_MIN + (clamped / 100) * (FREQ_MAX - FREQ_MIN);
}

/** X (0 left - 100 right) -> stereo pan (-1 full left - +1 full right) */
export function mapXToPan(xPercent: number): number {
  const clamped = Math.max(0, Math.min(100, xPercent));
  return (clamped / 100) * 2 - 1;
}

type ProgressCallback = (index: number, total: number, x: number, y: number) => void;

/**
 * Owns a single continuous oscillator -> gain -> panner -> (analyser) -> destination
 * chain for real-time cursor sonification, plus one-off "ping" bursts for node
 * collisions and a scheduled AudioParam ramp for curve sweeps.
 */
export class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private panner: StereoPannerNode | null = null;
  private analyser: AnalyserNode | null = null;
  private ready = false;
  private engaged = false;
  private sweepStopFn: (() => void) | null = null;

  /** Lazily creates the AudioContext + persistent node graph. Must be called from a user gesture. */
  init(): AnalyserNode | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.ready) {
      const ctx = this.ctx;
      this.osc = ctx.createOscillator();
      this.osc.type = 'sine';
      this.osc.frequency.value = FREQ_MIN;

      this.gain = ctx.createGain();
      this.gain.gain.value = 0;

      this.panner = ctx.createStereoPanner();
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 1024;

      this.osc.connect(this.gain).connect(this.panner);
      this.panner.connect(ctx.destination);
      this.panner.connect(this.analyser);

      this.osc.start();
      this.ready = true;
    }
    return this.analyser;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  isReady(): boolean {
    return this.ready;
  }

  /** Fade the continuous tone in (call on pointer/keyboard engagement). */
  engage() {
    if (!this.ctx || !this.gain) return;
    this.engaged = true;
    this.gain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.gain.gain.setTargetAtTime(0.16, this.ctx.currentTime, 0.02);
  }

  /** Fade the continuous tone out (call on pointer leave / blur). */
  disengage() {
    if (!this.ctx || !this.gain) return;
    this.engaged = false;
    this.gain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }

  isEngaged() {
    return this.engaged;
  }

  /** Continuously update pitch + pan from a normalized 0-100 position. Zero-latency AudioParam ramp. */
  updatePosition(xPercent: number, yPercent: number) {
    if (!this.ctx || !this.osc || !this.panner) return;
    const t = this.ctx.currentTime;
    this.osc.frequency.setTargetAtTime(mapYToFrequency(yPercent), t, 0.015);
    this.panner.pan.setTargetAtTime(mapXToPan(xPercent), t, 0.015);
  }

  /** Short percussive tone that reports a discrete step (e.g. an arrow-key move). */
  playStep(xPercent: number, yPercent: number) {
    const ctx = this.init();
    if (!this.ctx) return;
    const c = this.ctx;
    const osc = c.createOscillator();
    const gain = c.createGain();
    const panner = c.createStereoPanner();
    osc.type = 'sine';
    osc.frequency.value = mapYToFrequency(yPercent);
    panner.pan.value = mapXToPan(xPercent);
    gain.gain.value = 0;
    osc.connect(gain).connect(panner).connect(c.destination);
    const t = c.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  /** Bright, fixed-pitch ping used exclusively to signal "you found a node". */
  playPing(xPercent: number) {
    const ctx = this.init();
    if (!this.ctx) return;
    const c = this.ctx;
    const osc = c.createOscillator();
    const gain = c.createGain();
    const panner = c.createStereoPanner();
    osc.type = 'triangle';
    osc.frequency.value = 1567;
    panner.pan.value = mapXToPan(xPercent);
    gain.gain.value = 0;
    osc.connect(gain).connect(panner).connect(c.destination);
    const t = c.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.32, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * Sweeps the continuous oscillator's frequency/pan across a curve's points over
   * `durationSeconds`, scheduled directly on the AudioParams (glitch-free, independent
   * of main-thread jank). Returns a cancel function; also drives `onProgress` via rAF
   * for a synced visual cursor.
   */
  playCurve(points: CurvePoint[], durationSeconds: number, onProgress?: ProgressCallback): () => void {
    this.stopCurve();
    const ctx = this.init();
    if (!this.ctx || !this.osc || !this.panner || !this.gain || points.length < 2) {
      return () => {};
    }
    const c = this.ctx;
    const t0 = c.currentTime + 0.06;
    const n = points.length;

    this.gain.gain.cancelScheduledValues(t0);
    this.gain.gain.setValueAtTime(this.gain.gain.value, t0);
    this.gain.gain.linearRampToValueAtTime(0.18, t0 + 0.05);

    this.osc.frequency.cancelScheduledValues(t0);
    this.panner.pan.cancelScheduledValues(t0);
    this.osc.frequency.setValueAtTime(mapYToFrequency(points[0].y), t0);
    this.panner.pan.setValueAtTime(mapXToPan(points[0].x), t0);

    points.forEach((p, i) => {
      const t = t0 + (i / (n - 1)) * durationSeconds;
      this.osc!.frequency.linearRampToValueAtTime(mapYToFrequency(p.y), t);
      this.panner!.pan.linearRampToValueAtTime(mapXToPan(p.x), t);
    });

    this.gain.gain.setTargetAtTime(this.engaged ? 0.16 : 0, t0 + durationSeconds, 0.08);

    const startWall = performance.now() + 60;
    const totalMs = durationSeconds * 1000;
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - startWall;
      const frac = Math.max(0, Math.min(elapsed / totalMs, 1));
      const idx = frac * (n - 1);
      const i0 = Math.floor(idx);
      const i1 = Math.min(i0 + 1, n - 1);
      const localFrac = idx - i0;
      const x = points[i0].x + (points[i1].x - points[i0].x) * localFrac;
      const y = points[i0].y + (points[i1].y - points[i0].y) * localFrac;
      onProgress?.(i0, n, x, y);
      if (frac < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        this.sweepStopFn = null;
      }
    };
    raf = requestAnimationFrame(tick);

    const cancel = () => {
      cancelAnimationFrame(raf);
      this.sweepStopFn = null;
    };
    this.sweepStopFn = cancel;
    return cancel;
  }

  stopCurve() {
    this.sweepStopFn?.();
    this.sweepStopFn = null;
  }

  dispose() {
    this.stopCurve();
    try {
      this.osc?.stop();
    } catch {
      /* already stopped */
    }
    this.osc?.disconnect();
    this.gain?.disconnect();
    this.panner?.disconnect();
    this.analyser?.disconnect();
    this.ready = false;
  }
}
