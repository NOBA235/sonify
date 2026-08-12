import { NextRequest, NextResponse } from 'next/server';
import { pickRandomMock } from '@/lib/mock-data';
import { DiagramData, DiagramResponse } from '@/lib/types';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are the vision pipeline for SonifySTEM AI, an accessibility tool that converts STEM diagrams into spatial audio for blind and low-vision students.

Analyze the uploaded diagram image (a graph, circuit, or biology diagram) and respond with STRICT JSON ONLY — no prose, no markdown code fences, no text outside the JSON object — matching exactly this schema:

{
  "nodes": [
    { "id": string, "label": string, "description": string, "xPercent": number, "yPercent": number, "radiusPercent": number }
  ],
  "curves": [
    { "id": string, "name": string, "points": [{ "x": number, "y": number }] }
  ]
}

Coordinate system: xPercent/x runs 0 (left) to 100 (right). yPercent/y runs 0 (bottom) to 100 (top) — standard Cartesian orientation, NOT raw image/pixel coordinates, so flip vertically from pixel position.

Rules:
- Identify every labeled component, landmark, or key point (axis intercepts, vertices, circuit components, organelles, etc.) as a node with a short label and a one-to-two sentence spoken-friendly description suitable for text-to-speech.
- radiusPercent should be roughly 4-12, matching the visual size of the labeled element.
- If the diagram contains a continuous curve, wire path, or function plot, trace it as an ordered list of 15-30 points under "curves". If there is no curve, return an empty array for "curves".
- Return only the JSON object. Nothing else.`;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let base64Image: string | null = null;
    let mediaType = 'image/png';

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('image') as File | null;
      if (file && typeof file !== 'string') {
        mediaType = file.type || 'image/png';
        const bytes = Buffer.from(await file.arrayBuffer());
        base64Image = bytes.toString('base64');
      }
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      if (body?.image) {
        const match = /^data:(image\/\w+);base64,/.exec(body.image);
        if (match) mediaType = match[1];
        base64Image = body.image.replace(/^data:image\/\w+;base64,/, '');
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!base64Image) {
      return NextResponse.json(fallback('mock-no-image'));
    }
    if (!apiKey) {
      return NextResponse.json(fallback('mock-no-api-key'));
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
              { type: 'text', text: 'Analyze this STEM diagram and return the JSON described in the system prompt.' },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error', response.status, errText);
      return NextResponse.json(fallback('mock-api-error'));
    }

    const data = await response.json();
    const textBlock = (data?.content ?? []).find((b: any) => b.type === 'text');
    const raw: string = textBlock?.text ?? '';
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsed: DiagramData;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse model JSON output', e, raw.slice(0, 500));
      return NextResponse.json(fallback('mock-parse-error'));
    }

    if (!isValidDiagramData(parsed)) {
      console.error('Model JSON failed schema validation', parsed);
      return NextResponse.json(fallback('mock-invalid-schema'));
    }

    const result: DiagramResponse = { ...parsed, source: 'vision-model' };
    return NextResponse.json(result);
  } catch (err) {
    console.error('parse-diagram route error', err);
    return NextResponse.json(fallback('mock-exception'));
  }
}

function fallback(source: DiagramResponse['source']): DiagramResponse {
  return { ...pickRandomMock(), source };
}

function isValidDiagramData(d: any): d is DiagramData {
  if (!d || !Array.isArray(d.nodes) || !Array.isArray(d.curves)) return false;
  const nodesOk = d.nodes.every(
    (n: any) =>
      n &&
      typeof n.id === 'string' &&
      typeof n.label === 'string' &&
      typeof n.description === 'string' &&
      typeof n.xPercent === 'number' &&
      typeof n.yPercent === 'number' &&
      typeof n.radiusPercent === 'number'
  );
  const curvesOk = d.curves.every(
    (c: any) =>
      c &&
      typeof c.id === 'string' &&
      typeof c.name === 'string' &&
      Array.isArray(c.points) &&
      c.points.every((p: any) => typeof p.x === 'number' && typeof p.y === 'number')
  );
  return nodesOk && curvesOk;
}
