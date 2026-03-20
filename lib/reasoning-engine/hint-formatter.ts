/**
 * Hint Formatting Logic
 * Ensures hints are presented as questions, not statements
 */

interface HintRevealResult {
  hint_text: string;
  principle_reference: string;
  as_question: boolean;
}

export function formatPrincipleHint(
  principleTitle: string,
  principleDescription: string
): HintRevealResult {
  // Rephrase axiom as a question hint
  const questionFormats = [
    `Have you considered ${principleTitle}?`,
    `How might ${principleTitle} apply here?`,
    `What if you thought about this through the lens of ${principleTitle}?`,
    `Does ${principleTitle} seem relevant to your approach?`,
    `Can you see a connection to ${principleTitle}?`,
  ];

  const randomFormat =
    questionFormats[Math.floor(Math.random() * questionFormats.length)];

  return {
    hint_text: randomFormat,
    principle_reference: principleTitle,
    as_question: true,
  };
}

export function shouldRevealHint(turnNumber: number): boolean {
  // Reveal hint after 5+ turns
  return turnNumber >= 5;
}
