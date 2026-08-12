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
    : 'bg-lab-surface border-lab-border text-lab-text';
  const mutedText = highContrast ? 'text-hc-text/80' : 'text-lab-muted';
  const primaryBtn = highContrast
    ? 'bg-hc-text text-black border-2 border-hc-border hover:bg-yellow-200'
    : 'bg-pitch text-lab-bg hover:brightness-110';
  const toggleTrack = highContrast
    ? 'bg-hc-surface border-2 border-hc-border'
    : 'bg-lab-surface2 border border-lab-border';
  const toggleThumb = highContrast ? 'bg-hc-text' : 'bg-pan';

  const freq = cursor ? mapYToFrequency(cursor.y) : null;
  const pan = cursor ? mapXToPan(cursor.x) : null;

  return (
    <section aria-labelledby="controls-heading" className={`rounded-lg border-2 p-4 ${surface}`}>
      <h2 id="controls-heading" className="font-display text-sm font-semibold uppercase tracking-wide">
        2. Controls
      </h2>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onEnableAudio}
          className={`rounded-md px-4 py-2 font-display text-sm font-semibold transition ${primaryBtn}`}
        >
          {audioEnabled ? '🔊 Audio enabled' : 'Enable audio'}
        </button>

        <button
          type="button"
          onClick={onToggleContrast}
          aria-pressed={highContrast}
          className={`flex items-center gap-2 rounded-full px-1 py-1 transition ${toggleTrack}`}
        >
          <span
            className={`h-5 w-5 rounded-full transition-transform ${toggleThumb} ${
              highContrast ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
          <span className="pr-2 text-xs font-medium">High contrast {highContrast ? 'on' : 'off'}</span>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs sm:grid-cols-4">
        <Readout label="X" value={cursor ? `${cursor.x.toFixed(0)}%` : '—'} muted={mutedText} />
        <Readout label="Y" value={cursor ? `${cursor.y.toFixed(0)}%` : '—'} muted={mutedText} />
        <Readout label="Pitch" value={freq ? `${freq.toFixed(0)} Hz` : '—'} muted={mutedText} />
        <Readout label="Pan" value={pan !== null ? pan.toFixed(2) : '—'} muted={mutedText} />
      </div>

      <div className={`mt-3 rounded-md border ${highContrast ? 'border-hc-border' : 'border-lab-border'}`}>
        <Oscilloscope analyser={analyser} highContrast={highContrast} active={audioActive} />
      </div>

      <div
        role="status"
        aria-live="polite"
        className={`mt-4 min-h-[2.5rem] rounded-md border p-2 text-sm ${
          highContrast ? 'border-hc-border' : 'border-lab-border'
        } ${mutedText}`}
      >
        {statusMessage}
      </div>

      <details className="mt-4">
        <summary className={`cursor-pointer font-display text-xs font-semibold uppercase tracking-wide ${mutedText}`}>
          Keyboard controls
        </summary>
        <ul className={`mt-2 space-y-1 text-sm ${mutedText}`}>
          <li>Tab to the diagram, then use it to focus the canvas.</li>
          <li>Arrow keys — move the cursor in 5% steps; hear pitch, pan, and node speech.</li>
          <li>Mouse or touch — drag across the diagram for continuous spatial audio.</li>
          <li>Space or Enter on the diagram — replay the current point's node info.</li>
        </ul>
      </details>
    </section>
  );
}

function Readout({ label, value, muted }: { label: string; value: string; muted: string }) {
  return (
    <div>
      <div className={`uppercase tracking-wide ${muted}`}>{label}</div>
      <div className="text-base font-medium">{value}</div>
    </div>
  );
}
