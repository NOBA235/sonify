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
    : 'bg-lab-surface border-lab-border text-lab-text shadow-sm';
  const mutedText = highContrast ? 'text-hc-text/80' : 'text-lab-muted';
  const primaryBtn = highContrast
    ? 'bg-hc-text text-black hover:bg-yellow-200 border-2 border-hc-border'
    : 'border border-[#243044] bg-[#243044] text-white shadow-[0_1px_2px_rgba(24,32,51,0.08),0_8px_24px_rgba(24,32,51,0.10)] hover:border-[#111827] hover:bg-[#111827]';
  const secondaryBtn = highContrast
    ? 'border-2 border-hc-border text-hc-text hover:bg-hc-text hover:text-black'
    : 'border border-lab-border bg-lab-surface2 text-lab-text hover:border-pitch hover:bg-white';

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    onLoadingChange(true);
    onStatus(`Analyzing ${file.name}.`);
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
          ? `Parser unavailable. Loaded a sample with ${nodeCount} labels.`
          : `Parsed ${nodeCount} labels and ${curveCount} curve${curveCount === 1 ? '' : 's'}.`
      );
    } catch (err) {
      console.error(err);
      setError('Upload failed. Choose a sample or try another image.');
      onStatus('Upload failed.');
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
    onStatus(`${entry.label} loaded. ${entry.data.nodes.length} labels, ${entry.data.curves.length} curve${entry.data.curves.length === 1 ? '' : 's'}.`);
  }

  return (
    <section
      aria-labelledby="uploader-heading"
      aria-busy={loading}
      className={`rounded-lg border p-3 sm:p-4 ${surface}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="uploader-heading" className="font-display text-base font-semibold">
          Sources
        </h2>
        <span className={`hidden rounded-full px-2 py-1 text-[11px] font-medium sm:inline-flex ${highContrast ? 'bg-hc-surface' : 'bg-lab-surface2'} ${mutedText}`}>
          Gemini parser
        </span>
      </div>

      <div className="mt-3">
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
          className={`flex min-h-11 w-full cursor-pointer items-center justify-center rounded-md px-4 py-2.5 font-display text-sm font-semibold transition ${primaryBtn}`}
        >
          {loading ? 'Analyzing...' : 'Upload diagram'}
        </label>
        {fileName && !loading && (
          <p className={`mt-2 truncate text-xs font-mono ${mutedText}`}>{fileName}</p>
        )}
      </div>

      {error && (
        <p role="alert" className={`mt-2 text-sm ${highContrast ? 'text-hc-text' : 'text-pan'}`}>
          {error}
        </p>
      )}

      <div className="mt-4">
        <p className={`text-xs font-mono font-medium uppercase tracking-wide ${mutedText}`}>Samples</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {Object.values(MOCK_DIAGRAMS).map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => loadSample(entry.key)}
              disabled={loading}
              className={`min-h-10 rounded-md px-3 py-2 text-left text-sm font-medium transition disabled:opacity-50 ${secondaryBtn}`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
