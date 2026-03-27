/**
 * Next.js proxy → Python FastAPI /orchestrate
 * Accepts the same multipart/form-data (file upload) or JSON (topic) payloads
 * and streams the SSE response back to the browser.
 */

import { NextRequest } from 'next/server';
import { getMockBreakdown, getMockProblems, getMockLearningIntent, simulateDelay } from '@/lib/mock-data';

export const runtime = 'nodejs';
export const maxDuration = 90;

const PYTHON_API = process.env.PYTHON_API_URL ?? 'http://localhost:8000';

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';

  // Use mock data if enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    let topic: string = '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      topic = file?.name || 'physics';
    } else {
      const json = await request.json();
      topic = json.topic || 'physics';
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (event: string, data: unknown) => {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        };

        try {
          // Stage 1: Extract intent
          sendEvent('stage', { stage: 'intake', status: 'started' });
          await simulateDelay(800);
          const intent = getMockLearningIntent(topic);
          sendEvent('intent', intent);
          sendEvent('stage', { stage: 'intake', status: 'completed' });

          // Stage 2: Generate breakdown
          await simulateDelay(300);
          sendEvent('stage', { stage: 'breakdown', status: 'started' });
          await simulateDelay(1500);
          const breakdown = getMockBreakdown(topic);
          sendEvent('breakdown', breakdown);
          sendEvent('stage', { stage: 'breakdown', status: 'completed' });

          // Stage 3: Generate problems
          await simulateDelay(300);
          sendEvent('stage', { stage: 'problems', status: 'started' });
          await simulateDelay(1200);
          const problems = getMockProblems(breakdown.domain);
          sendEvent('problems', problems);
          sendEvent('stage', { stage: 'problems', status: 'completed' });

          // Complete
          sendEvent('complete', { success: true });
        } catch (err) {
          sendEvent('error', {
            code: 'mock_error',
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  let upstreamBody: BodyInit;
  const upstreamHeaders: Record<string, string> = {};

  if (contentType.includes('multipart/form-data')) {
    // Pipe the raw body stream directly — preserves the original boundary.
    // Re-parsing with formData() and re-sending can lose binary data in some Node versions.
    upstreamBody = request.body as ReadableStream;
    upstreamHeaders['Content-Type'] = contentType;
  } else {
    // JSON payload (topic as text input)
    const json = await request.json();
    upstreamBody = JSON.stringify(json);
    upstreamHeaders['Content-Type'] = 'application/json';
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${PYTHON_API}/orchestrate`, {
      method: 'POST',
      body: upstreamBody,
      headers: upstreamHeaders,
      duplex: 'half',
    } as RequestInit);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Python backend unreachable';
    return new Response(
      `event: error\ndata: ${JSON.stringify({ code: 'backend_unavailable', message: msg })}\n\n`,
      {
        status: 502,
        headers: { 'Content-Type': 'text/event-stream' },
      }
    );
  }

  if (!upstream.ok && upstream.status !== 200) {
    const detail = await upstream.text().catch(() => 'Unknown error');
    return new Response(
      `event: error\ndata: ${JSON.stringify({ code: 'upstream_error', message: detail })}\n\n`,
      {
        status: upstream.status,
        headers: { 'Content-Type': 'text/event-stream' },
      }
    );
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
