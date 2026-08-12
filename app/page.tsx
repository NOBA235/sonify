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
  const [diagramLabel, setDiagramLabel] = useState('Sample: Graph — y = x²');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [statusMessage, setStatusMessage] = useState(
    'Welcome to SonifySTEM AI. A sample parabola graph is loaded — enable audio, then move your pointer or use arrow keys over the diagram to explore it.'
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
    setStatusMessage('Audio enabled. Move your pointer or use arrow keys over the diagram.');
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
    setStatusMessage(`Playing curve: ${curve.name}.`);
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

  return (
    <main className={`min-h-screen ${themeShell}`}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <header className="mb-8">
          <p
            className={`font-mono text-xs uppercase tracking-[0.2em] ${
              highContrast ? 'text-hc-text' : 'text-pan'
            }`}
          >
            Spatial audio for STEM
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">SonifySTEM AI</h1>
          <p className={`mt-2 max-w-2xl text-sm sm:text-base ${highContrast ? 'text-hc-text/90' : 'text-lab-muted'}`}>
            Diagrams turned into sound. Pitch tracks height, stereo pan tracks left-to-right
            position, and labeled points speak their name when you find them.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <div>
              <p
                className={`mb-2 font-mono text-xs uppercase tracking-wide ${
                  highContrast ? 'text-hc-text/80' : 'text-lab-muted'
                }`}
              >
                {diagramLabel}
              </p>
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
            </div>

            <CurveSweeper
              curves={curves}
              highContrast={highContrast}
              playingCurveId={playingCurveId}
              onPlay={handlePlayCurve}
              onStop={handleStopCurve}
            />
          </div>

          <div className="space-y-4">
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
          </div>
        </div>

        <footer
          className={`mt-10 border-t pt-4 text-xs ${
            highContrast ? 'border-hc-border text-hc-text/70' : 'border-lab-border text-lab-muted'
          }`}
        >
          Built for blind and low-vision STEM learners. Works fully offline with sample diagrams —
          connect a GEMINI_API_KEY server-side to parse real uploaded images.
        </footer>
      </div>
    </main>
  );
}
