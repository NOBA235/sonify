'use client';

import { useCallback, useRef, useState } from 'react';
import { DiagramData, DiagramNode } from '@/lib/types';
import { SpatialAudioEngine } from '@/lib/audio-engine';

interface AudioCanvasProps {
  diagramData: DiagramData | null;
  imageUrl: string | null;
  highContrast: boolean;
  engine: SpatialAudioEngine;
  sweepCursor: { x: number; y: number } | null;
  isSweeping: boolean;
  onCursorChange: (pos: { x: number; y: number } | null) => void;
  onAnnounce: (message: string) => void;
}

function clamp(v: number) {
  return Math.max(0, Math.min(100, v));
}

function percentFromClient(clientX: number, clientY: number, rect: DOMRect) {
  const x = clamp(((clientX - rect.left) / rect.width) * 100);
  const y = clamp(100 - ((clientY - rect.top) / rect.height) * 100); // flip: CSS top-down -> Cartesian bottom-up
  return { x, y };
}

function findNodeAt(x: number, y: number, nodes: DiagramNode[]): DiagramNode | null {
  for (const node of nodes) {
    const dx = x - node.xPercent;
    const dy = y - node.yPercent;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= node.radiusPercent) return node;
  }
  return null;
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.02;
  window.speechSynthesis.speak(utterance);
}

export default function AudioCanvas({
  diagramData,
  imageUrl,
  highContrast,
  engine,
  sweepCursor,
  isSweeping,
  onCursorChange,
  onAnnounce,
}: AudioCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeNodeIdRef = useRef<string | null>(null);
  const pointerActiveRef = useRef(false);
  const [interactiveCursor, setInteractiveCursor] = useState<{ x: number; y: number } | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const checkNodeCollision = useCallback(
    (x: number, y: number, opts: { forceSpeak?: boolean } = {}) => {
      const nodes = diagramData?.nodes ?? [];
      const node = findNodeAt(x, y, nodes);
      if (node) {
        engine.playPing(x);
        if (opts.forceSpeak || activeNodeIdRef.current !== node.id) {
          activeNodeIdRef.current = node.id;
          const text = `${node.label}. ${node.description}`;
          speak(text);
          setAnnouncement(text);
          onAnnounce(`${node.label}: ${node.description}`);
        }
      } else {
        activeNodeIdRef.current = null;
      }
    },
    [diagramData, engine, onAnnounce]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const { x, y } = percentFromClient(clientX, clientY, rect);
      setInteractiveCursor({ x, y });
      onCursorChange({ x, y });
      engine.updatePosition(x, y);
      checkNodeCollision(x, y);
    },
    [checkNodeCollision, engine, onCursorChange]
  );

  function beginInteraction() {
    if (isSweeping) return;
    engine.init();
    engine.engage();
    pointerActiveRef.current = true;
  }

  function endInteraction() {
    engine.disengage();
    pointerActiveRef.current = false;
    activeNodeIdRef.current = null;
    setInteractiveCursor(null);
    onCursorChange(null);
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }

  function onPointerEnter(e: React.PointerEvent<HTMLDivElement>) {
    if (isSweeping) return;
    if (e.pointerType === 'mouse') beginInteraction();
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isSweeping) return;
    beginInteraction();
    handleMove(e.clientX, e.clientY);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (isSweeping || !pointerActiveRef.current) return;
    handleMove(e.clientX, e.clientY);
  }

  function onPointerLeave() {
    if (isSweeping) return;
    endInteraction();
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (isSweeping) return;
    if (e.pointerType === 'touch') endInteraction();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (isSweeping) return;
    const step = 5;
    let { x, y } = interactiveCursor ?? { x: 50, y: 50 };
    let handled = true;

    switch (e.key) {
      case 'ArrowUp':
        y = clamp(y + step);
        break;
      case 'ArrowDown':
        y = clamp(y - step);
        break;
      case 'ArrowLeft':
        x = clamp(x - step);
        break;
      case 'ArrowRight':
        x = clamp(x + step);
        break;
      case ' ':
      case 'Enter': {
        const nodes = diagramData?.nodes ?? [];
        const node = findNodeAt(x, y, nodes);
        if (node) {
          const text = `${node.label}. ${node.description}`;
          speak(text);
          setAnnouncement(text);
          onAnnounce(`Repeating — ${node.label}: ${node.description}`);
        } else {
          onAnnounce('No labeled node at the current position.');
        }
        handled = false;
        break;
      }
      default:
        handled = false;
    }

    if (!handled) return;
    e.preventDefault();

    engine.init();
    engine.playStep(x, y);
    setInteractiveCursor({ x, y });
    onCursorChange({ x, y });
    checkNodeCollision(x, y);
  }

  const displayCursor = isSweeping ? sweepCursor : interactiveCursor;

  const borderClass = highContrast ? 'border-hc-border' : 'border-lab-border';
  const bgClass = highContrast ? 'bg-hc-bg' : 'bg-lab-surface';
  const cursorRing = highContrast ? 'bg-hc-text' : 'bg-pitch';
  const sweepRing = highContrast ? 'bg-hc-text' : 'bg-pan';
  const nodeBorder = highContrast ? 'border-hc-border' : 'border-pitch/70';
  const curveStroke = highContrast ? '#FFEB3B' : '#FB7185';

  return (
    <div>
      <div
        ref={containerRef}
        role="application"
        tabIndex={0}
        aria-label={
          diagramData
            ? 'Interactive sonified diagram. Move your pointer or use arrow keys to explore.'
            : 'No diagram loaded yet.'
        }
        aria-describedby="canvas-instructions"
        className={`relative w-full overflow-hidden rounded-lg border-2 ${borderClass} ${bgClass} cursor-crosshair`}
        style={{ aspectRatio: '4 / 3', touchAction: 'none' }}
        onPointerEnter={onPointerEnter}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Uploaded diagram"
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            draggable={false}
          />
        )}

        {!imageUrl && (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
          >
            <defs>
              <pattern id="grid" width="8%" height="8%" patternUnits="userSpaceOnUse">
                <path
                  d="M 0 0 L 0 40 M 0 0 L 40 0"
                  fill="none"
                  stroke={highContrast ? '#FFEB3B' : '#22314D'}
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        )}

        {diagramData?.curves.map((curve) => (
          <svg
            key={curve.id}
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <polyline
              points={curve.points.map((p) => `${p.x},${100 - p.y}`).join(' ')}
              fill="none"
              stroke={curveStroke}
              strokeWidth={0.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          </svg>
        ))}

        {diagramData?.nodes.map((node) => (
          <div
            key={node.id}
            aria-hidden="true"
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${nodeBorder}`}
            style={{
              left: `${node.xPercent}%`,
              top: `${100 - node.yPercent}%`,
              width: `${node.radiusPercent * 2}%`,
              height: `${node.radiusPercent * 2}%`,
            }}
          >
            <span
              className={`absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium ${
                highContrast ? 'bg-hc-bg text-hc-text' : 'bg-lab-bg/90 text-lab-muted'
              }`}
            >
              {node.label}
            </span>
          </div>
        ))}

        {displayCursor && (
          <div
            aria-hidden="true"
            className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-offset-2 ring-offset-transparent ${
              isSweeping ? sweepRing : cursorRing
            }`}
            style={{ left: `${displayCursor.x}%`, top: `${100 - displayCursor.y}%` }}
          />
        )}

        {!diagramData && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <p className={highContrast ? 'text-hc-text' : 'text-lab-muted'}>
              Load a diagram above to start exploring it by sound.
            </p>
          </div>
        )}

        <p id="canvas-instructions" className="sr-only">
          This is a sonified diagram. Moving your pointer or finger across it maps vertical
          position to musical pitch, from low at the bottom to high at the top, and horizontal
          position to stereo pan, from left to right. Arrow keys move in five percent steps.
          Entering a labeled node plays a tone and reads its name and description aloud. Press
          space or enter to repeat the current node.
        </p>
        <div aria-live="assertive" className="sr-only">
          {announcement}
        </div>
      </div>

      {diagramData && (
        <details className="mt-3">
          <summary
            className={`cursor-pointer font-display text-xs font-semibold uppercase tracking-wide ${
              highContrast ? 'text-hc-text' : 'text-lab-muted'
            }`}
          >
            Text summary of this diagram
          </summary>
          <ul className={`mt-2 space-y-1 text-sm ${highContrast ? 'text-hc-text' : 'text-lab-text'}`}>
            {diagramData.nodes.map((n) => (
              <li key={n.id}>
                <span className="font-medium">{n.label}:</span> {n.description}
              </li>
            ))}
            {diagramData.curves.map((c) => (
              <li key={c.id}>
                <span className="font-medium">Curve:</span> {c.name} ({c.points.length} points)
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
