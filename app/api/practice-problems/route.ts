import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  SYSTEM_PROMPT_PRACTICE_PROBLEMS,
  buildProblemsUserPrompt,
} from '@/lib/prompts/first-principles-prompts';
import type { ProblemsRequest, ProblemsResponse, PracticeSet } from '@/lib/first-principles/types';
import { getMockProblems, simulateDelay } from '@/lib/mock-data';

export const runtime = 'nodejs';
export const maxDuration = 30;

function parsePracticeProblems(raw: string): PracticeSet | null {
  const cleaned = raw.replace(/^```json\s*/m, '').replace(/```\s*$/m, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const data = JSON.parse(match[0]);
    if (!Array.isArray(data.problems) || data.problems.length === 0) {
      return null;
    }
    // Tolerate partial results (e.g. 4 problems instead of 5)
    return { problems: data.problems };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let body: ProblemsRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.breakdown?.firstPrinciples?.length) {
    return NextResponse.json(
      { error: 'A valid breakdown with firstPrinciples is required' },
      { status: 400 }
    );
  }

  // Use mock data if enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    await simulateDelay(1000);
    const practiceSet = getMockProblems(body.breakdown.domain);
    return NextResponse.json({ practiceSet } satisfies ProblemsResponse);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: SYSTEM_PROMPT_PRACTICE_PROBLEMS,
      messages: [{ role: 'user', content: buildProblemsUserPrompt(body.breakdown) }],
    });

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const practiceSet = parsePracticeProblems(raw);

    if (!practiceSet) {
      return NextResponse.json(
        { error: 'Failed to parse problems from response. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ practiceSet } satisfies ProblemsResponse);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
