/**
 * Next.js proxy → Python FastAPI /socratic
 * Replaces the previous TypeScript-only implementation.
 * The Python service runs the full 4-node LangGraph:
 *   identify_goal → extract_variables → rank_principles → generate_question
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMockSocraticResponse, simulateDelay } from '@/lib/mock-data';

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
    await simulateDelay(1200);
    const req = body as any;
    const userMessage = req.userMessage || '';
    const mockResponse = getMockSocraticResponse(userMessage, req.breakdown);
    return NextResponse.json(mockResponse);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${PYTHON_API}/socratic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Python backend unreachable';
    return NextResponse.json(
      { error: msg },
      { status: 502 }
    );
  }

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
