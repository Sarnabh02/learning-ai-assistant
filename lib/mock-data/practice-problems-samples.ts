import type { PracticeSet, PracticeProblem } from '@/lib/first-principles/types';

/**
 * Sample practice problems for testing without API keys
 */

export const MOCK_PROBLEMS_PHYSICS: PracticeSet = {
  problems: [
    {
      id: 'prob-1',
      difficulty: 'easy',
      statement: 'A 5 kg block is pushed with a force of 20 N. What is its acceleration?',
      hints: [
        {
          level: 1,
          text: 'Think about the relationship between force, mass, and acceleration.',
        },
        {
          level: 2,
          text: 'Use Newton\'s second law: F = ma. You have F and m, solve for a.',
        },
        {
          level: 3,
          text: 'a = F/m = 20 N / 5 kg. Remember that 1 N = 1 kg⋅m/s².',
        },
      ],
      answer: '4 m/s²',
      principlesExercised: ['axiom-2'],
    },
    {
      id: 'prob-2',
      difficulty: 'easy',
      statement: 'A cart moving at 3 m/s experiences no net force. What will its velocity be after 5 seconds?',
      hints: [
        {
          level: 1,
          text: 'What happens to an object when no net force acts on it?',
        },
        {
          level: 2,
          text: 'Newton\'s first law states that objects maintain constant velocity without external forces.',
        },
        {
          level: 3,
          text: 'The velocity remains 3 m/s because no force causes any acceleration.',
        },
      ],
      answer: '3 m/s',
      principlesExercised: ['axiom-3'],
    },
    {
      id: 'prob-3',
      difficulty: 'medium',
      statement: 'Two ice skaters push off each other. Skater A (60 kg) moves at 2 m/s. Skater B (80 kg) moves in the opposite direction. What is skater B\'s velocity?',
      hints: [
        {
          level: 1,
          text: 'Consider what\'s conserved when two objects interact.',
        },
        {
          level: 2,
          text: 'The total momentum before equals total momentum after. Initially both are at rest (p_total = 0).',
        },
        {
          level: 3,
          text: 'Set up: 0 = (60)(2) + (80)(v_B). Solve for v_B = -120/80 = -1.5 m/s.',
        },
      ],
      answer: 'v_B = -1.5 m/s (1.5 m/s opposite skater A)',
      principlesExercised: ['axiom-1', 'axiom-4'],
    },
    {
      id: 'prob-4',
      difficulty: 'medium',
      statement: 'A 1200 kg car accelerates from 0 to 25 m/s in 10 seconds. What average force is applied?',
      hints: [
        {
          level: 1,
          text: 'Find the acceleration first, then use it to find force.',
        },
        {
          level: 2,
          text: 'Acceleration a = Δv/Δt = (25 - 0)/10 = 2.5 m/s². Then use F = ma.',
        },
        {
          level: 3,
          text: 'F = (1200 kg)(2.5 m/s²) = 3000 N.',
        },
      ],
      answer: '3000 N',
      principlesExercised: ['axiom-2'],
    },
    {
      id: 'prob-5',
      difficulty: 'hard',
      statement: 'A 0.5 kg ball moving at 10 m/s hits a wall and bounces back at 8 m/s. If contact lasts 0.1 s, what average force did the wall exert on the ball?',
      hints: [
        {
          level: 1,
          text: 'The force relates to the change in momentum over time.',
        },
        {
          level: 2,
          text: 'Calculate Δp = m(v_f - v_i). Be careful with signs: if right is positive, v_i = +10, v_f = -8.',
        },
        {
          level: 3,
          text: 'Δp = 0.5(-8 - 10) = -9 kg⋅m/s. F = Δp/Δt = -9/0.1 = -90 N. The wall exerts 90 N to the left.',
        },
      ],
      answer: '90 N opposite the initial direction (F = -90 N)',
      principlesExercised: ['axiom-2', 'axiom-4'],
    },
  ],
};

export const MOCK_PROBLEMS_CALCULUS: PracticeSet = {
  problems: [
    {
      id: 'prob-1',
      difficulty: 'easy',
      statement: 'Find the derivative of f(x) = 5x² - 3x + 7.',
      hints: [
        {
          level: 1,
          text: 'Differentiate each term separately.',
        },
        {
          level: 2,
          text: 'Use the power rule: d/dx(x^n) = nx^(n-1). Don\'t forget constants have derivative 0.',
        },
        {
          level: 3,
          text: 'f\'(x) = 5(2x) - 3(1) + 0 = 10x - 3.',
        },
      ],
      answer: 'f\'(x) = 10x - 3',
      principlesExercised: ['axiom-2', 'axiom-4'],
    },
    {
      id: 'prob-2',
      difficulty: 'easy',
      statement: 'At what point does f(x) = x² - 4x + 3 have a horizontal tangent line?',
      hints: [
        {
          level: 1,
          text: 'A horizontal tangent means the slope is zero.',
        },
        {
          level: 2,
          text: 'Find where f\'(x) = 0. First compute f\'(x) = 2x - 4.',
        },
        {
          level: 3,
          text: 'Set 2x - 4 = 0, so x = 2. The horizontal tangent is at x = 2.',
        },
      ],
      answer: 'x = 2',
      principlesExercised: ['axiom-1', 'axiom-3'],
    },
    {
      id: 'prob-3',
      difficulty: 'medium',
      statement: 'Use the limit definition to find the derivative of f(x) = 1/x.',
      hints: [
        {
          level: 1,
          text: 'Start with f\'(x) = lim(h→0) [f(x+h) - f(x)] / h.',
        },
        {
          level: 2,
          text: 'Substitute: [1/(x+h) - 1/x] / h. Find a common denominator in the numerator.',
        },
        {
          level: 3,
          text: '[x - (x+h)] / [x(x+h)h] = -h / [x(x+h)h] = -1 / [x(x+h)]. As h→0, this becomes -1/x².',
        },
      ],
      answer: 'f\'(x) = -1/x²',
      principlesExercised: ['axiom-2'],
    },
    {
      id: 'prob-4',
      difficulty: 'medium',
      statement: 'A particle\'s position is s(t) = t³ - 6t² + 9t. When is the particle at rest?',
      hints: [
        {
          level: 1,
          text: 'The particle is at rest when velocity equals zero.',
        },
        {
          level: 2,
          text: 'Velocity v(t) = s\'(t) = 3t² - 12t + 9. Set this equal to zero.',
        },
        {
          level: 3,
          text: 'Factor: 3(t² - 4t + 3) = 3(t-1)(t-3) = 0. So t = 1 and t = 3.',
        },
      ],
      answer: 't = 1 s and t = 3 s',
      principlesExercised: ['axiom-1', 'axiom-2'],
    },
    {
      id: 'prob-5',
      difficulty: 'hard',
      statement: 'Find all local extrema of f(x) = x⁴ - 4x³ and classify them.',
      hints: [
        {
          level: 1,
          text: 'Find critical points by setting f\'(x) = 0, then use the second derivative test.',
        },
        {
          level: 2,
          text: 'f\'(x) = 4x³ - 12x² = 4x²(x - 3) = 0 gives x = 0 and x = 3. Find f\'\'(x) = 12x² - 24x.',
        },
        {
          level: 3,
          text: 'f\'\'(0) = 0 (inconclusive), but f\'(x) doesn\'t change sign at 0 (inflection, not extremum). f\'\'(3) = 36 > 0, so x = 3 is a local minimum.',
        },
      ],
      answer: 'Local minimum at x = 3; no local extremum at x = 0',
      principlesExercised: ['axiom-1', 'axiom-2'],
    },
  ],
};

export const MOCK_PROBLEMS_ECONOMICS: PracticeSet = {
  problems: [
    {
      id: 'prob-1',
      difficulty: 'easy',
      statement: 'If demand is Qd = 80 - 2P, what quantity is demanded when price is $10?',
      hints: [
        {
          level: 1,
          text: 'Substitute P = 10 into the demand equation.',
        },
        {
          level: 2,
          text: 'Qd = 80 - 2(10).',
        },
        {
          level: 3,
          text: 'Qd = 80 - 20 = 60 units.',
        },
      ],
      answer: '60 units',
      principlesExercised: ['axiom-2'],
    },
    {
      id: 'prob-2',
      difficulty: 'medium',
      statement: 'Find equilibrium price and quantity: Demand: Qd = 50 - P, Supply: Qs = 2P - 10.',
      hints: [
        {
          level: 1,
          text: 'Set quantity demanded equal to quantity supplied.',
        },
        {
          level: 2,
          text: '50 - P = 2P - 10. Solve for P.',
        },
        {
          level: 3,
          text: '60 = 3P, so P = 20. Then Q = 50 - 20 = 30 units.',
        },
      ],
      answer: 'P = 20, Q = 30',
      principlesExercised: ['axiom-2', 'axiom-3', 'axiom-4'],
    },
    {
      id: 'prob-3',
      difficulty: 'medium',
      statement: 'At price $25, Qd = 30 and Qs = 45. Is there a shortage or surplus? How large?',
      hints: [
        {
          level: 1,
          text: 'Compare quantity supplied to quantity demanded.',
        },
        {
          level: 2,
          text: 'When Qs > Qd, there\'s a surplus.',
        },
        {
          level: 3,
          text: 'Surplus = 45 - 30 = 15 units.',
        },
      ],
      answer: 'Surplus of 15 units',
      principlesExercised: ['axiom-4'],
    },
    {
      id: 'prob-4',
      difficulty: 'hard',
      statement: 'Demand: Qd = 100 - 3P, Supply: Qs = 20 + 2P. A $5 tax is placed on suppliers. Find the new equilibrium.',
      hints: [
        {
          level: 1,
          text: 'A tax on suppliers shifts the supply curve up by the tax amount.',
        },
        {
          level: 2,
          text: 'New supply: Qs = 20 + 2(P - 5) = 10 + 2P. Set this equal to demand.',
        },
        {
          level: 3,
          text: '100 - 3P = 10 + 2P gives 90 = 5P, so P = 18. Q = 100 - 3(18) = 46.',
        },
      ],
      answer: 'P = 18, Q = 46',
      principlesExercised: ['axiom-2', 'axiom-3', 'axiom-4'],
    },
    {
      id: 'prob-5',
      difficulty: 'hard',
      statement: 'Given elasticity of demand = -2 at current price $50, if price increases by 10%, estimate the percentage change in quantity demanded.',
      hints: [
        {
          level: 1,
          text: 'Elasticity = (% change in Qd) / (% change in P).',
        },
        {
          level: 2,
          text: 'Set up: -2 = (% change in Qd) / 10%.',
        },
        {
          level: 3,
          text: '% change in Qd = -2 × 10% = -20%. Quantity demanded falls by 20%.',
        },
      ],
      answer: 'Quantity demanded decreases by 20%',
      principlesExercised: ['axiom-2'],
    },
  ],
};

// Map domains to practice problem sets
export const MOCK_PROBLEMS_MAP: Record<string, PracticeSet> = {
  'Physics': MOCK_PROBLEMS_PHYSICS,
  'Mathematics': MOCK_PROBLEMS_CALCULUS,
  'Economics': MOCK_PROBLEMS_ECONOMICS,
};

/**
 * Get mock practice problems based on the breakdown domain
 */
export function getMockProblems(domain: string): PracticeSet {
  return MOCK_PROBLEMS_MAP[domain] || MOCK_PROBLEMS_PHYSICS;
}
