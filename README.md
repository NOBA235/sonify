# Sonify AI

Turns STEM diagrams — graphs, circuits, biology diagrams — into interactive 2D
spatial audio landscapes, so blind and low-vision students can explore them by
ear instead of by sight.

Move a pointer, finger, or the arrow keys across a diagram: vertical position
becomes pitch (200–1000 Hz), horizontal position becomes stereo pan (hard left
to hard right). Cross a labeled point and it pings, then speaks its name and
description aloud. Hit "Play" on a curve and the app sweeps pitch/pan along it
automatically over three seconds, so you can hear the shape of a function or
the path of a circuit hands-free.

Works fully offline with three built-in sample diagrams (a parabola graph, a
series circuit, an animal cell) — no API key required.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. A sample graph loads automatically — click
**Enable audio**, then move your mouse (or tab to the diagram and use arrow
keys) to explore it.

### Enabling real diagram parsing (optional)

Without an API key, uploaded images fall back to a sample diagram so the app
never breaks. To parse real uploaded photos:

```bash
cp .env.example .env.local
# then set GEMINI_API_KEY=... in .env.local
```

`app/api/parse-diagram/route.ts` sends the uploaded image to a multimodal
Gemini 2.5 Flash model with a strict JSON schema prompt and validates the response
before using it; any failure (missing key, network error, malformed JSON,
schema mismatch) silently falls back to a sample diagram rather than
breaking the experience.

## Architecture

```
app/
  page.tsx                  — wires everything together, owns shared state
  api/parse-diagram/route.ts — vision pipeline + validation + fallback
  layout.tsx, globals.css
components/
  DiagramUploader.tsx  — image upload + sample picker
  AudioCanvas.tsx       — pointer/touch/keyboard tracking, collision + speech
  ControlPanel.tsx      — audio enable, high-contrast toggle, live readouts
  CurveSweeper.tsx      — "Listen to the function" auto-play
  Oscilloscope.tsx       — live waveform tap off the audio engine (sighted aid)
lib/
  audio-engine.ts   — SpatialAudioEngine: Web Audio graph + mappings
  mock-data.ts       — fallback sample diagrams
  types.ts
```

### Coordinate system

`xPercent`/`x`: 0 (left) → 100 (right).
`yPercent`/`y`: 0 (bottom) → 100 (top) — standard Cartesian, flipped from
screen/image pixel coordinates (which run top-down) wherever it's rendered.

### Audio engine design

One continuous oscillator → gain → panner chain drives the "you are here"
tone; `AudioParam.setTargetAtTime` gives glitch-free, essentially zero-latency
updates as the cursor moves. Node collisions play a separate short, fixed-
pitch triangle-wave "ping" so it's always distinguishable from the pitch/pan
tone. Curve sweeps schedule `linearRampToValueAtTime` calls directly on the
same AudioParams across a 3-second window — scheduled ahead of time on the
audio thread, so playback doesn't depend on the main thread staying
unblocked.

### Accessibility notes

- Full keyboard support: the diagram is a focusable `role="application"`
  element; arrow keys move in 5% steps, Space/Enter repeats the current
  node's description.
- Speech uses the Web Speech API (`speechSynthesis`); re-entering the same
  node without leaving it first does not re-trigger speech, so continuous
  hovering doesn't loop.
- An `aria-live="assertive"` region mirrors every node announcement as text,
  and an `aria-live="polite"` status bar in the control panel reports app-
  level state changes, for anyone pairing this with their own screen reader
  instead of (or alongside) the built-in speech.
- High-contrast mode switches to a pure black background with yellow text,
  borders, and focus rings.
- `prefers-reduced-motion` is respected globally.

## Notes on the mock data

`lib/mock-data.ts` exports three complete `DiagramData` samples matching the
exact schema the vision API returns, generated programmatically (parabola
curve, rectangular circuit loop, elliptical cell membrane) so the app is
genuinely usable — not just visually populated — before any image is ever
uploaded.
