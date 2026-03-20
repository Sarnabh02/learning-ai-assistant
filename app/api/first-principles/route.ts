import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT_FIRST_PRINCIPLES_BREAKDOWN } from '@/lib/prompts/first-principles-prompts';
import { sanitizeText } from '@/lib/parsers/text-sanitizer';
import { parsePdfBuffer } from '@/lib/parsers/pdf-parser';
import { parsePptxBuffer } from '@/lib/parsers/pptx-parser';
import { getMockBreakdown, simulateDelay } from '@/lib/mock-data';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 12000;

function parseBreakdownJson(raw: string): { data?: unknown; error?: string } {
  // Strip accidental markdown fences
  const cleaned = raw.replace(/^```json\s*/m, '').replace(/```\s*$/m, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    return { error: 'Claude response was not valid JSON' };
  }
  try {
    const data = JSON.parse(match[0]);
    if (!Array.isArray(data.firstPrinciples)) {
      return { error: 'Response missing firstPrinciples array' };
    }
    if (!Array.isArray(data.workedExamples)) {
      return { error: 'Response missing workedExamples array' };
    }
    return { data };
  } catch (e) {
    return { error: `JSON parse failed: ${e instanceof Error ? e.message : 'Unknown'}` };
  }
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';
  let topic: string | undefined;
  let documentText: string | undefined;
  let fileName: string | undefined;

  if (contentType.includes('multipart/form-data')) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid form data' }), { status: 400 });
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file in request' }), { status: 400 });
    }

    fileName = file.name;

    // If using mock data, just extract filename and skip PDF parsing
    if (process.env.USE_MOCK_DATA === 'true') {
      // Use filename as topic for mock data lookup
      topic = fileName.replace(/\.[^/.]+$/, ''); // Remove file extension
    } else {
      const buffer = await file.arrayBuffer();

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const { text, error: parseError } = await parsePdfBuffer(buffer);
        if (parseError || !text) {
          return new Response(
            JSON.stringify({
              error: 'no_text',
              message:
                parseError ??
                'This PDF has no extractable text. It may be a scanned image — try a PDF with a text layer.',
            }),
            { status: 422 }
          );
        }
        documentText = text;
      } else if (file.name.toLowerCase().endsWith('.pptx')) {
        const { text, error: parseError } = await parsePptxBuffer(buffer);
        if (parseError || !text) {
          return new Response(
            JSON.stringify({
              error: 'no_text',
              message:
                parseError ??
                'No text found in this presentation. It may contain only images or diagrams.',
            }),
            { status: 422 }
          );
        }
        documentText = text;
      } else {
        return new Response(
          JSON.stringify({ error: 'Unsupported file type. Please upload a PDF or PPTX file.' }),
          { status: 400 }
        );
      }
    }
  } else {
    try {
      const body = await request.json();
      topic = body.topic;
      documentText = body.documentText;
      fileName = body.fileName;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }
  }

  if (!topic && !documentText) {
    return new Response(
      JSON.stringify({ error: 'Provide either a topic or a document file' }),
      { status: 400 }
    );
  }

  // Use mock data if enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    const mockBreakdown = getMockBreakdown(topic || documentText || '');
    
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (event: string, data: unknown) => {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        };

        try {
          // Simulate streaming with mock breakdown
          await simulateDelay(500);
          const jsonStr = JSON.stringify(mockBreakdown, null, 2);
          
          // Stream it in chunks to simulate real API
          const chunkSize = 50;
          for (let i = 0; i < jsonStr.length; i += chunkSize) {
            sendEvent('delta', { text: jsonStr.slice(i, i + chunkSize) });
            await simulateDelay(50);
          }
          
          sendEvent('complete', { breakdown: mockBreakdown });
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

  // Build user message
  let userMessage: string;
  if (documentText) {
    const sanitized = sanitizeText(documentText);
    if (!sanitized) {
      return new Response(
        JSON.stringify({ error: 'no_text', message: 'No usable text found in this file.' }),
        { status: 422 }
      );
    }
    const wasTruncated = sanitized.length > MAX_TEXT_LENGTH;
    const capped = sanitized.slice(0, MAX_TEXT_LENGTH);
    userMessage = `Analyze the following document${fileName ? ` ("${fileName}")` : ''} and generate a first principles breakdown of the primary concept it teaches.${wasTruncated ? ' Note: document was truncated to fit context limits.' : ''}

DOCUMENT TEXT:
${capped}`;
  } else {
    userMessage = `Generate a first principles breakdown for the concept: "${topic}"`;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        const anthropicStream = client.messages.stream({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: SYSTEM_PROMPT_FIRST_PRINCIPLES_BREAKDOWN,
          messages: [{ role: 'user', content: userMessage }],
        });

        // Stream text deltas to client for progress indication
        for await (const chunk of anthropicStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            sendEvent('delta', { text: chunk.delta.text });
          }
        }

        // Parse the complete message once streaming finishes
        const finalMessage = await anthropicStream.finalMessage();
        const rawJson =
          finalMessage.content[0]?.type === 'text' ? finalMessage.content[0].text : '';

        const parsed = parseBreakdownJson(rawJson);
        if (parsed.error) {
          sendEvent('error', { code: 'parse_error', message: parsed.error });
        } else {
          sendEvent('complete', { breakdown: parsed.data });
        }
      } catch (err) {
        sendEvent('error', {
          code: 'api_error',
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
