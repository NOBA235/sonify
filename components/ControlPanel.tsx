'use client';

import Oscilloscope from './Oscilloscope';
import { mapXToPan, mapYToFrequency } from '@/lib/audio-engine';

interface ControlPanelProps {
  highContrast: boolean;
  onToggleContrast: () => void;
  audioEnabled: boolean;
  onEnableAudio: () => void;
  analyser: AnalyserNode | null;
  audioActive: boolean;
  cursor: { x: number; y: number } | null;
  statusMessage: string;
}

export default function ControlPanel({
  highContrast,
  onToggleContrast,
  audioEnabled,
  onEnableAudio,
  analyser,
  audioActive,
  cursor,
  statusMessage,
}: ControlPanelProps) {
  const surface = highContrast
    ? 'bg-hc-bg border-hc-border text-hc-text'
    : 'bg-lab-surface border-lab-border text-lab-text shadow-sm';
  const mutedText = highContrast ? 'text-hc-text/80' : 'text-lab-muted';
  const primaryBtn = highContrast
    ? 'bg-hc-text text-black border-2 border-hc-border hover:bg-yellow-200'
    : 'border border-[#243044] bg-[#243044] text-white shadow-[0_1px_2px_rgba(24,32,51,0.08),0_8px_24px_rgba(24,32,51,0.10)] hover:border-[#111827] hover:bg-[#111827]';
  const toggleTrack = highContrast
    ? 'bg-hc-surface border-2 border-hc-border'
    : 'bg-lab-surface2 border border-lab-border';
  const toggleThumb = highContrast ? 'bg-hc-text' : 'bg-pan';

  const freq = cursor ? mapYToFrequency(cursor.y) : null;
  const pan = cursor ? mapXToPan(cursor.x) : null;

  return (
    <section aria-labelledby="controls-heading" className={`rounded-lg border p-3 sm:p-4 ${surface}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="controls-heading" className="font-display text-base font-semibold">
          Audio console
        </h2>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            audioActive ? (highContrast ? 'bg-hc-text' : 'bg-pitch') : highContrast ? 'bg-hc-text/30' : 'bg-lab-border'
          }`}
          aria-hidden="true"
        />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] lg:grid-cols-1 xl:grid-cols-[1fr_auto]">
        <button
          type="button"
          onClick={onEnableAudio}
          className={`min-h-11 rounded-md px-4 py-2.5 font-display text-sm font-semibold transition ${primaryBtn}`}
        >
          {audioEnabled ? 'Audio enabled' : 'Enable audio'}
        </button>

        <button
          type="button"
          onClick={onToggleContrast}
          aria-pressed={highContrast}
          className={`flex min-h-11 items-center justify-between gap-2 rounded-md px-2 py-1 transition ${toggleTrack}`}
        >
          <span className={`h-5 w-5 rounded-full ${toggleThumb}`} />
          <span className="pr-1 text-xs font-medium">Contrast {highContrast ? 'on' : 'off'}</span>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Readout label="X" value={cursor ? `${cursor.x.toFixed(0)}%` : '-'} muted={mutedText} highContrast={highContrast} />
        <Readout label="Y" value={cursor ? `${cursor.y.toFixed(0)}%` : '-'} muted={mutedText} highContrast={highContrast} />
        <Readout label="Pitch" value={freq ? `${freq.toFixed(0)} Hz` : '-'} muted={mutedText} highContrast={highContrast} />
        <Readout label="Pan" value={pan !== null ? pan.toFixed(2) : '-'} muted={mutedText} highContrast={highContrast} />
      </div>

      <div className={`mt-3 overflow-hidden rounded-md border ${highContrast ? 'border-hc-border' : 'border-lab-border bg-lab-surface2'}`}>
        <Oscilloscope analyser={analyser} highContrast={highContrast} active={audioActive} />
      </div>

      <div
        role="status"
        aria-live="polite"
        className={`mt-3 min-h-[3rem] rounded-md border p-3 text-sm leading-snug ${
          highContrast ? 'border-hc-border' : 'border-lab-border'
        } ${mutedText}`}
      >
        {statusMessage}
      </div>
    </section>
  );
}

function Readout({
  label,
  value,
  muted,
  highContrast,
}: {
  label: string;
  value: string;
  muted: string;
  highContrast: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-md px-2.5 py-2 ${highContrast ? 'bg-hc-surface' : 'bg-lab-surface2'}`}>
      <div className={`uppercase tracking-wide ${muted}`}>{label}</div>
      <div className={`truncate text-base font-medium ${highContrast ? 'text-hc-text' : 'text-lab-text'}`}>{value}</div>
    </div>
  );
}
