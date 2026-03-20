import type { FirstPrinciplesBreakdown, FirstPrinciple } from './types';

export type FlashCardType = 'principle' | 'derivation' | 'example';

export interface FlashCard {
  id: string;
  type: FlashCardType;
  front: string;
  back: string;
  category: string;
}

function getPrincipleNames(
  ids: string[],
  principles: FirstPrinciple[]
): string {
  const names = ids
    .map((id) => principles.find((p) => p.id === id)?.title)
    .filter(Boolean) as string[];
  if (names.length === 0) return 'known principles';
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}

export function generateFlashCards(breakdown: FirstPrinciplesBreakdown): FlashCard[] {
  const cards: FlashCard[] = [];

  // Principle cards
  breakdown.firstPrinciples.forEach((p) => {
    cards.push({
      id: `fp-${p.id}`,
      type: 'principle',
      category: 'First Principle',
      front: `${p.title}\n\nWhat does this state, and why is it fundamental?`,
      back: `${p.statement}\n\n${p.whyFundamental}`,
    });
  });

  // Derivation cards
  breakdown.derivation.forEach((step) => {
    const principleNames = getPrincipleNames(
      step.fromPrinciples,
      breakdown.firstPrinciples
    );
    cards.push({
      id: `deriv-step-${step.step}`,
      type: 'derivation',
      category: `Step ${step.step}`,
      front: `Using ${principleNames}, what can we conclude? (Step ${step.step})`,
      back: `${step.claim}\n\n${step.reasoning}`,
    });
  });

  // Worked example cards
  breakdown.workedExamples.forEach((ex) => {
    cards.push({
      id: `ex-${ex.id}`,
      type: 'example',
      category: ex.title,
      front: `${ex.title}\n\n${ex.problem}`,
      back: ex.solution,
    });
  });

  return cards;
}

export function shuffleCards(cards: FlashCard[]): FlashCard[] {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
