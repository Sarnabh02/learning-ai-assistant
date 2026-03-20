import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT_VARIABLE_EXTRACTOR } from '@/lib/prompts/system-prompts';

interface VariableExtractionResult {
  known: Record<string, string>;
  unknown: string[];
  constraints: string[];
}

export async function extractVariables(
  userInput: string,
  problemStatement?: string
): Promise<VariableExtractionResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const fullPrompt = `
${problemStatement ? `Problem Statement: "${problemStatement}"` : ''}
Student Input: "${userInput}"

Extract all known variables, unknown variables, and constraints from the above.
`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: SYSTEM_PROMPT_VARIABLE_EXTRACTOR,
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      known: result.known || {},
      unknown: result.unknown || [],
      constraints: result.constraints || [],
    };
  } catch (error) {
    console.error('Error in extractVariables:', error);
    throw error;
  }
}
