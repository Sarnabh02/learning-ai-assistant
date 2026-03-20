/**
 * Next.js proxy → Python FastAPI /generate-pdf
 * Returns raw PDF bytes so the browser treats it as a file download.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const PYTHON_API = process.env.PYTHON_API_URL ?? 'http://localhost:8000';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(`${PYTHON_API}/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Python backend unreachable';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => 'Unknown error');
    return NextResponse.json({ error: detail }, { status: upstream.status });
  }

  const pdfBytes = await upstream.arrayBuffer();
  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="learning-summary.pdf"',
    },
  });
}
