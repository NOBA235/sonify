'use client';

import { useEffect, useRef } from 'react';

interface OscilloscopeProps {
  analyser: AnalyserNode | null;
  highContrast: boolean;
  active: boolean;
}

/**
 * Draws the live time-domain waveform of whatever the spatial audio engine is
 * currently producing. Purely diagnostic/decorative for sighted collaborators —
 * it visualizes the tool's own sound, it doesn't add new information a blind
 * user needs, so it's marked aria-hidden.
 */
export default function Oscilloscope({ analyser, highContrast, active }: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const lineColor = highContrast ? '#FFEB3B' : '#5EEAD4';
    const dimColor = highContrast ? '#3a3a00' : '#22314D';

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx2d!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const bufferLength = analyser?.fftSize ?? 1024;
    const data = new Uint8Array(bufferLength);

    function draw() {
      if (!canvas) return;
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      ctx2d!.clearRect(0, 0, w, h);

      // baseline
      ctx2d!.strokeStyle = dimColor;
      ctx2d!.lineWidth = 1;
      ctx2d!.beginPath();
      ctx2d!.moveTo(0, h / 2);
      ctx2d!.lineTo(w, h / 2);
      ctx2d!.stroke();

      if (analyser && active) {
        analyser.getByteTimeDomainData(data);
        ctx2d!.strokeStyle = lineColor;
        ctx2d!.lineWidth = 2;
        ctx2d!.beginPath();
        const slice = w / data.length;
        let x = 0;
        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128 - 1;
          const y = h / 2 + v * (h / 2 - 4);
          if (i === 0) ctx2d!.moveTo(x, y);
          else ctx2d!.lineTo(x, y);
          x += slice;
        }
        ctx2d!.stroke();
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, highContrast, active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="scope-canvas"
      style={{ width: '100%', height: '48px' }}
    />
  );
}
