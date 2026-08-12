'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AudioCanvas from '@/components/AudioCanvas';
import ControlPanel from '@/components/ControlPanel';
import DiagramUploader from '@/components/DiagramUploader';
import CurveSweeper from '@/components/CurveSweeper';
import { SpatialAudioEngine } from '@/lib/audio-engine';
import { DiagramCurve, DiagramResponse } from '@/lib/types';
import { MOCK_DIAGRAMS } from '@/lib/mock-data';

export default function Home() {
  const engineRef = useRef<SpatialAudioEngine | null>(null);
  if (!engineRef.current) engineRef.current = new SpatialAudioEngine();
  const engine = engineRef.current;

  const [highContrast, setHighContrast] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioActive, setAudioActive] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const [diagram, setDiagram] = useState<DiagramResponse | null>(MOCK_DIAGRAMS.parabola.data);
  const [diagramLabel, setDiagramLabel] = useState('Graph: y = x²');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [statusMessage, setStatusMessage] = useState(
    'Sample graph ready. Enable audio and explore the canvas.'
  );
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const [playingCurveId, setPlayingCurveId] = useState<string | null>(null);
  const [sweepCursor, setSweepCursor] = useState<{ x: number; y: number } | null>(null);
  const stopCurveFnRef = useRef<() => void>(() => {});

  useEffect(() => {
    return () => {
      engine.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleEnableAudio() {
    const a = engine.init();
    setAnalyser(a);
    setAudioEnabled(true);
    setStatusMessage('Audio enabled. Move across the diagram to hear position and labels.');
  }

  function handleDiagramLoaded(data: DiagramResponse, newImageUrl: string | null) {
    setDiagram(data);
    setDiagramLabel(data.label ?? (data.source === 'vision-model' ? 'Uploaded diagram' : 'Sample diagram'));
    setImageUrl(newImageUrl);
    setPlayingCurveId(null);
    setSweepCursor(null);
    stopCurveFnRef.current?.();
    setCursor(null);
  }

  function handleCursorChange(pos: { x: number; y: number } | null) {
    setCursor(pos);
    setAudioActive(!!pos && engine.isEngaged());
  }

  function handlePlayCurve(curve: DiagramCurve) {
    stopCurveFnRef.current?.();
    setPlayingCurveId(curve.id);
    setAudioActive(true);
    setStatusMessage(`Playing ${curve.name}.`);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Playing curve: ${curve.name}`));
    }
    const cancel = engine.playCurve(curve.points, 3, (_i, _total, x, y) => {
      setSweepCursor({ x, y });
      setCursor({ x, y });
    });
    stopCurveFnRef.current = cancel;
    window.setTimeout(() => {
      setPlayingCurveId((current) => (current === curve.id ? null : current));
      setSweepCursor(null);
      setAudioActive(false);
    }, 3200);
  }

  function handleStopCurve() {
    stopCurveFnRef.current?.();
    setPlayingCurveId(null);
    setSweepCursor(null);
    setAudioActive(false);
    setStatusMessage('Curve playback stopped.');
  }

  const themeShell = highContrast ? 'hc bg-hc-bg text-hc-text' : 'bg-lab-bg text-lab-text';

  const curves = useMemo(() => diagram?.curves ?? [], [diagram]);
  const nodeCount = diagram?.nodes.length ?? 0;
  const curveCount = curves.length;
  const sourceLabel =
    diagram?.source === 'vision-model'
      ? 'Gemini parsed'
      : diagram?.source === 'sample' || diagram?.source?.startsWith('mock')
        ? 'Sample data'
        : 'Ready';
  const shellBorder = highContrast ? 'border-hc-border' : 'border-lab-border';
  const surface = highContrast ? 'bg-hc-bg text-hc-text' : 'bg-lab-surface text-lab-text';
  const muted = highContrast ? 'text-hc-text/80' : 'text-lab-muted';
  const softSurface = highContrast ? 'bg-hc-surface' : 'bg-lab-surface2';

  return (
    <main className={`min-h-screen overflow-x-hidden ${themeShell}`}>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-x-hidden px-3 py-3 sm:px-5 lg:px-8 lg:py-6">
        <header className={`mb-3 flex min-w-0 flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${shellBorder} ${surface}`}>
          <div className="min-w-0 sm:flex-1">
            <p className={`font-mono text-[11px] font-medium uppercase tracking-[0.18em] ${muted}`}>
              Sonify AI
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold leading-tight sm:text-3xl">
              Diagram audio workspace
            </h1>
          </div>

          <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:w-auto sm:min-w-[360px] sm:grid-cols-3">
            <Metric label="Source" value={sourceLabel} highContrast={highContrast} />
            <Metric label="Labels" value={String(nodeCount)} highContrast={highContrast} />
            <Metric label="Curves" value={String(curveCount)} highContrast={highContrast} />
          </div>
        </header>

        <div className="grid min-w-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className={`min-w-0 rounded-lg border p-3 shadow-sm sm:p-4 ${shellBorder} ${surface}`}>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] ${muted}`}>
                  Active diagram
                </p>
                <h2 className="mt-1 truncate font-display text-lg font-semibold leading-tight sm:text-xl">
                  {diagramLabel}
                </h2>
              </div>
              <div className={`flex w-full min-w-0 items-center justify-between rounded-md px-3 py-2 text-xs sm:w-auto sm:min-w-[180px] ${softSurface}`}>
                <span className={muted}>Canvas</span>
                <span className="truncate pl-3 font-mono font-medium">{diagram ? 'Ready' : 'Empty'}</span>
              </div>
            </div>

            <AudioCanvas
              diagramData={diagram}
              imageUrl={imageUrl}
              highContrast={highContrast}
              engine={engine}
              sweepCursor={sweepCursor}
              isSweeping={playingCurveId !== null}
              onCursorChange={handleCursorChange}
              onAnnounce={setStatusMessage}
            />
          </section>

          <aside className="min-w-0 space-y-3 lg:sticky lg:top-6 lg:self-start">
            <DiagramUploader
              highContrast={highContrast}
              loading={loading}
              onLoadingChange={setLoading}
              onDiagramLoaded={handleDiagramLoaded}
              onStatus={setStatusMessage}
            />

            <ControlPanel
              highContrast={highContrast}
              onToggleContrast={() => setHighContrast((v) => !v)}
              audioEnabled={audioEnabled}
              onEnableAudio={handleEnableAudio}
              analyser={analyser}
              audioActive={audioActive || playingCurveId !== null}
              cursor={cursor}
              statusMessage={statusMessage}
            />

            <CurveSweeper
              curves={curves}
              highContrast={highContrast}
              playingCurveId={playingCurveId}
              onPlay={handlePlayCurve}
              onStop={handleStopCurve}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value, highContrast }: { label: string; value: string; highContrast: boolean }) {
  return (
    <div
      className={`min-w-0 rounded-md border px-2.5 py-2 ${
        highContrast ? 'border-hc-border bg-hc-surface' : 'border-lab-border bg-lab-surface2'
      }`}
    >
      <div className={`truncate text-[10px] font-medium uppercase tracking-wide ${highContrast ? 'text-hc-text/75' : 'text-lab-muted'}`}>
        {label}
      </div>
      <div className="mt-0.5 truncate font-display text-sm font-semibold">{value}</div>
    </div>
  );
}
