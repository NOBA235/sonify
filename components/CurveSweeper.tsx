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
    : 'bg-lab-surface border-lab-border text-lab-text shadow-sm';
  const mutedText = highContrast ? 'text-hc-text/80' : 'text-lab-muted';
  const btn = highContrast
    ? 'border-2 border-hc-border text-hc-text hover:bg-hc-text hover:text-black'
    : 'border border-lab-border bg-lab-surface2 text-lab-text hover:border-pan hover:bg-white';
  const btnActive = highContrast
    ? 'bg-hc-text text-black'
    : 'border border-[#243044] bg-[#243044] text-white shadow-[0_1px_2px_rgba(24,32,51,0.08),0_8px_24px_rgba(24,32,51,0.10)]';

  if (curves.length === 0) {
    return (
      <section aria-labelledby="sweeper-heading" className={`rounded-lg border p-3 sm:p-4 ${surface}`}>
        <h2 id="sweeper-heading" className="font-display text-base font-semibold">
          Curve player
        </h2>
        <p className={`mt-2 text-sm ${mutedText}`}>No traced curve in this diagram.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="sweeper-heading" className={`rounded-lg border p-3 sm:p-4 ${surface}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="sweeper-heading" className="font-display text-base font-semibold">
          Curve player
        </h2>
        <span className={`font-mono text-xs ${mutedText}`}>{curves.length} available</span>
      </div>
      <div className="mt-3 grid gap-2">
        {curves.map((curve) => {
          const isPlaying = playingCurveId === curve.id;
          return (
            <button
              key={curve.id}
              type="button"
              onClick={() => (isPlaying ? onStop() : onPlay(curve))}
              className={`min-h-10 rounded-md px-3 py-2 text-left text-sm font-medium transition ${isPlaying ? btnActive : btn}`}
              aria-pressed={isPlaying}
            >
              {isPlaying ? `Stop ${curve.name}` : `Play ${curve.name}`}
            </button>
          );
        })}
      </div>
    </section>
  );
}
