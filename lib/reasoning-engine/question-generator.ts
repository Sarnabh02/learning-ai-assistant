import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT_SOCRATIC } from '@/lib/prompts/system-prompts';

interface QuestionGenerationResult {
  question: string;
  turn_number: number;
  intent: 'goal_clarification' | 'variable_identification' | 'principle_connection' | 'next_step' | 'principle_hint';
  suggested_principle_id?: string;
}

export async function generateSocraticQuestion(
  userInput: string,
  problemStatement: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  turnNumber: number,
  relevantPrinciples?: Array<{ id: string; title: string; description: string }>
): Promise<QuestionGenerationResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build context
  let context = `Problem: "${problemStatement}"
Current Turn: ${turnNumber}

Conversation so far:
${conversationHistory.map((msg) => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`).join('\n')}

Student's Latest Message: "${userInput}"
`;

  if (relevantPrinciples && relevantPrinciples.length > 0) {
    context += `\nRelevant Principles Available:
${relevantPrinciples.map((p) => `- ${p.title}: ${p.description}`).join('\n')}`;
  }

  // Determine intent based on turn number
  let intent: QuestionGenerationResult['intent'] = 'goal_clarification';
  if (turnNumber <= 2) {
    intent = 'goal_clarification';
  } else if (turnNumber <= 3) {
    intent = 'variable_identification';
  } else if (turnNumber <= 4) {
    intent = 'principle_connection';
  } else if (turnNumber < 5) {
    intent = 'next_step';
  } else {
    intent = 'principle_hint';
  }

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      system: SYSTEM_PROMPT_SOCRATIC,
      messages: [
        {
          role: 'user',
          content: context,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const question = content.text.trim();

    return {
      question,
      turn_number: turnNumber,
      intent,
    };
  } catch (error) {
    console.error('Error in generateSocraticQuestion:', error);
    throw error;
  }
}
