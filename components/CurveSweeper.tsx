'use client';

import { DiagramCurve } from '@/lib/types';

interface CurveSweeperProps {
  curves: DiagramCurve[];
  highContrast: boolean;
  playingCurveId: string | null;
  onPlay: (curve: DiagramCurve) => void;
  onStop: () => void;
}

export default function CurveSweeper({
  curves,
  highContrast,
  playingCurveId,
  onPlay,
  onStop,
}: CurveSweeperProps) {
  const surface = highContrast
    ? 'bg-hc-bg border-hc-border text-hc-text'
    : 'bg-lab-surface border-lab-border text-lab-text';
  const mutedText = highContrast ? 'text-hc-text/80' : 'text-lab-muted';
  const btn = highContrast
    ? 'border-2 border-hc-border text-hc-text hover:bg-hc-text hover:text-black'
    : 'border border-lab-border text-lab-text hover:border-pan hover:text-pan';
  const btnActive = highContrast ? 'bg-hc-text text-black' : 'bg-pan text-lab-bg';

  if (curves.length === 0) {
    return (
      <section aria-labelledby="sweeper-heading" className={`rounded-lg border-2 p-4 ${surface}`}>
        <h2 id="sweeper-heading" className="font-display text-sm font-semibold uppercase tracking-wide">
          3. Listen to the function
        </h2>
        <p className={`mt-2 text-sm ${mutedText}`}>This diagram has no traced curve to sweep.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="sweeper-heading" className={`rounded-lg border-2 p-4 ${surface}`}>
      <h2 id="sweeper-heading" className="font-display text-sm font-semibold uppercase tracking-wide">
        3. Listen to the function
      </h2>
      <p className={`mt-1 text-sm ${mutedText}`}>
        Auto-play sweeps pitch and pan across a curve over 3 seconds — audit its shape hands-free.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {curves.map((curve) => {
          const isPlaying = playingCurveId === curve.id;
          return (
            <button
              key={curve.id}
              type="button"
              onClick={() => (isPlaying ? onStop() : onPlay(curve))}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${isPlaying ? btnActive : btn}`}
              aria-pressed={isPlaying}
            >
              {isPlaying ? `⏹ Stop — ${curve.name}` : `▶ Play — ${curve.name}`}
            </button>
          );
        })}
      </div>
    </section>
  );
}
