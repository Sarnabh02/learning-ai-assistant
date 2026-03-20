import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT_GOAL_IDENTIFIER } from '@/lib/prompts/system-prompts';

interface GoalIdentificationResult {
  goal: string;
  problem_type: 'calculation' | 'proof' | 'explanation' | 'design' | 'comparison' | 'other';
  confidence: number;
  reasoning: string;
}

export async function identifyGoal(
  userInput: string,
  problemStatement?: string
): Promise<GoalIdentificationResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const fullPrompt = `
Student Input: "${userInput}"
${problemStatement ? `Problem Statement: "${problemStatement}"` : ''}

Analyze what goal the student is trying to achieve and identify the problem type.
`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: SYSTEM_PROMPT_GOAL_IDENTIFIER,
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
      goal: result.goal,
      problem_type: result.problem_type,
      confidence: result.confidence,
      reasoning: result.reasoning || '',
    };
  } catch (error) {
    console.error('Error in identifyGoal:', error);
    throw error;
  }
}
