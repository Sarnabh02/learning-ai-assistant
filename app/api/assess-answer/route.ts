/**
 * Next.js proxy → Python FastAPI /assess-answer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMockAssessment, simulateDelay } from '@/lib/mock-data';

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

  // Use mock data if enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    await simulateDelay(1500);
    const req = body as any;
    const assessment = getMockAssessment(req.userAnswer || '', req.correctAnswer);
    return NextResponse.json(assessment);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${PYTHON_API}/assess-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Python backend unreachable';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
