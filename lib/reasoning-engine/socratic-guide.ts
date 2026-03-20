/**
 * Main Socratic Reasoning Engine
 * Orchestrates the full Socratic dialogue flow
 */

import { identifyGoal } from './goal-extractor';
import { extractVariables } from './variable-mapper';
import { getTopPrinciples } from './principle-ranker';
import { generateSocraticQuestion } from './question-generator';
import { formatPrincipleHint, shouldRevealHint } from './hint-formatter';

export interface SocraticGuideInput {
  sessionId: string;
  documentId: string;
  problemStatement: string;
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  turnNumber: number;
}

export interface SocraticGuideOutput {
  session_id: string;
  turn_number: number;
  system_question: string;
  goal_identified?: string;
  variables_extracted?: Record<string, any>;
  principle_hinted?: { id: string; title: string; question: string };
  principle_revealed?: boolean;
  metadata: {
    intent: string;
    should_reveal_hint: boolean;
  };
}

export async function socraticGuide(input: SocraticGuideInput): Promise<SocraticGuideOutput> {
  try {
    // Step 1: Identify the goal
    const goalResult = await identifyGoal(input.userMessage, input.problemStatement);

    // Step 2: Extract variables
    const varsResult = await extractVariables(input.userMessage, input.problemStatement);

    // Step 3: Get relevant principles
    const topPrinciples = await getTopPrinciples(
      input.documentId,
      goalResult.goal,
      5
    );

    // Step 4: Generate Socratic question
    const questionResult = await generateSocraticQuestion(
      input.userMessage,
      input.problemStatement,
      input.conversationHistory,
      input.turnNumber,
      topPrinciples.map((p) => ({
        id: p.axiom_id,
        title: p.axiom_title,
        description: p.axiom_description,
      }))
    );

    // Step 5: Check if hint should be revealed
    const shouldReveal = shouldRevealHint(input.turnNumber);
    let principleHint: SocraticGuideOutput['principle_hinted'] | undefined;

    if (shouldReveal && topPrinciples.length > 0) {
      const topPrinciple = topPrinciples[0];
      const hintResult = formatPrincipleHint(
        topPrinciple.axiom_title,
        topPrinciple.axiom_description
      );
      principleHint = {
        id: topPrinciple.axiom_id,
        title: topPrinciple.axiom_title,
        question: hintResult.hint_text,
      };
    }

    return {
      session_id: input.sessionId,
      turn_number: input.turnNumber,
      system_question: questionResult.question,
      goal_identified: goalResult.goal,
      variables_extracted: varsResult,
      principle_hinted: principleHint,
      principle_revealed: shouldReveal && !!principleHint,
      metadata: {
        intent: questionResult.intent,
        should_reveal_hint: shouldReveal,
      },
    };
  } catch (error) {
    console.error('Error in socraticGuide:', error);
    throw error;
  }
}
