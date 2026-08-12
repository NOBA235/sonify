'use client';

import { useRef, useState } from 'react';
import { DiagramResponse } from '@/lib/types';
import { MOCK_DIAGRAMS } from '@/lib/mock-data';

interface DiagramUploaderProps {
  highContrast: boolean;
  loading: boolean;
  onLoadingChange: (loading: boolean) => void;
  onDiagramLoaded: (data: DiagramResponse, imageUrl: string | null) => void;
  onStatus: (message: string) => void;
}

export default function DiagramUploader({
  highContrast,
  loading,
  onLoadingChange,
  onDiagramLoaded,
  onStatus,
}: DiagramUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const surface = highContrast
    ? 'bg-hc-bg border-hc-border text-hc-text'
    : 'bg-lab-surface border-lab-border text-lab-text';
  const mutedText = highContrast ? 'text-hc-text/80' : 'text-lab-muted';
  const primaryBtn = highContrast
    ? 'bg-hc-text text-black hover:bg-yellow-200 border-2 border-hc-border'
    : 'bg-pitch text-lab-bg hover:brightness-110';
  const secondaryBtn = highContrast
    ? 'border-2 border-hc-border text-hc-text hover:bg-hc-text hover:text-black'
    : 'border border-lab-border text-lab-text hover:border-pitch hover:text-pitch';

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    onLoadingChange(true);
    onStatus(`Analyzing uploaded diagram: ${file.name}. Please wait.`);
    try {
      const imageUrl = URL.createObjectURL(file);
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/parse-diagram', { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data: DiagramResponse = await res.json();
      onDiagramLoaded(data, imageUrl);
      const nodeCount = data.nodes?.length ?? 0;
      const curveCount = data.curves?.length ?? 0;
      const usedFallback = data.source && data.source !== 'vision-model';
      onStatus(
        usedFallback
          ? `Could not reach the vision model, so a sample diagram with ${nodeCount} nodes was loaded instead. Explore it now.`
          : `Diagram analyzed. Found ${nodeCount} labeled points and ${curveCount} curve${curveCount === 1 ? '' : 's'}. Explore it now.`
      );
    } catch (err) {
      console.error(err);
      setError('Something went wrong analyzing that image. Try a sample diagram below instead.');
      onStatus('Upload failed. Try one of the sample diagrams instead.');
    } finally {
      onLoadingChange(false);
    }
  }

  function loadSample(key: string) {
    const entry = MOCK_DIAGRAMS[key];
    if (!entry) return;
    setFileName(null);
    setError(null);
    onDiagramLoaded({ ...entry.data, source: 'sample', label: entry.label }, null);
    onStatus(`Loaded sample diagram: ${entry.label}. ${entry.data.nodes.length} labeled points, ${entry.data.curves.length} curve${entry.data.curves.length === 1 ? '' : 's'}. Explore it now.`);
  }

  return (
    <section
      aria-labelledby="uploader-heading"
      className={`rounded-lg border-2 p-4 ${surface}`}
    >
      <h2 id="uploader-heading" className="font-display text-sm font-semibold uppercase tracking-wide">
        1. Load a diagram
      </h2>
      <p className={`mt-1 text-sm ${mutedText}`}>
        Upload a photo of a graph, circuit, or biology diagram, or start instantly with a sample.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          id="diagram-file-input"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <label
          htmlFor="diagram-file-input"
          className={`cursor-pointer rounded-md px-4 py-2 font-display text-sm font-semibold transition ${primaryBtn}`}
        >
          {loading ? 'Analyzing…' : 'Upload diagram image'}
        </label>
        {fileName && !loading && (
          <span className={`text-xs font-mono ${mutedText}`}>{fileName}</span>
        )}
      </div>

      {error && (
        <p role="alert" className={`mt-2 text-sm ${highContrast ? 'text-hc-text' : 'text-pan'}`}>
          {error}
        </p>
      )}

      <div className="mt-4">
        <p className={`text-xs font-mono uppercase tracking-wide ${mutedText}`}>Or try a sample</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.values(MOCK_DIAGRAMS).map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => loadSample(entry.key)}
              disabled={loading}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${secondaryBtn}`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
