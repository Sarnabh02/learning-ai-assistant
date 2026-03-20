import type { FirstPrinciplesBreakdown } from '@/lib/first-principles/types';

/**
 * Sample first-principles breakdowns for testing without API keys
 */

export const MOCK_BREAKDOWN_PHYSICS: FirstPrinciplesBreakdown = {
  concept: 'Newton\'s Laws of Motion',
  domain: 'Physics',
  firstPrinciples: [
    {
      id: 'axiom-1',
      title: 'Conservation of Momentum',
      statement: 'In an isolated system, the total momentum remains constant over time.',
      whyFundamental: 'This is derived from the symmetry of space and is a consequence of Newton\'s third law.',
    },
    {
      id: 'axiom-2',
      title: 'Force Causes Acceleration',
      statement: 'A net force applied to an object causes it to accelerate in the direction of the force.',
      whyFundamental: 'This defines the relationship between force, mass, and acceleration (F = ma).',
    },
    {
      id: 'axiom-3',
      title: 'Inertia',
      statement: 'An object at rest stays at rest, and an object in motion stays in motion at constant velocity unless acted upon by a net external force.',
      whyFundamental: 'This is Newton\'s first law and describes the natural tendency of objects to maintain their state of motion.',
    },
    {
      id: 'axiom-4',
      title: 'Action-Reaction Pairs',
      statement: 'For every action force, there is an equal and opposite reaction force.',
      whyFundamental: 'This is Newton\'s third law and ensures momentum conservation in interactions.',
    },
  ],
  derivation: [
    {
      step: 1,
      fromPrinciples: ['axiom-3'],
      claim: 'Without external forces, velocity remains constant',
      reasoning: 'Inertia implies that in the absence of forces, no acceleration occurs (a = 0), so velocity doesn\'t change.',
    },
    {
      step: 2,
      fromPrinciples: ['axiom-2'],
      claim: 'Acceleration is proportional to force and inversely proportional to mass',
      reasoning: 'From F = ma, we see that a = F/m. Larger forces create larger accelerations, while larger masses resist acceleration.',
    },
    {
      step: 3,
      fromPrinciples: ['axiom-2', 'axiom-3'],
      claim: 'Force is required to change motion',
      reasoning: 'Combining inertia (which maintains constant motion) with F = ma shows that only a net force can alter velocity.',
    },
    {
      step: 4,
      fromPrinciples: ['axiom-4', 'axiom-1'],
      claim: 'Forces come in pairs and momentum is conserved',
      reasoning: 'Action-reaction pairs ensure that forces always cancel in isolated systems, preserving total momentum.',
    },
  ],
  workedExamples: [
    {
      id: 'example-1',
      title: 'Car Collision',
      problem: 'Two cars collide head-on. Car A (1000 kg) traveling at 20 m/s hits car B (1500 kg) traveling at -15 m/s. What is the velocity of the combined wreckage?',
      solution: `Step 1: Identify the system and check if it's isolated.
The two cars form an isolated system (ignoring friction), so momentum is conserved.

Step 2: Calculate initial momentum.
p_initial = m_A × v_A + m_B × v_B
p_initial = (1000 kg)(20 m/s) + (1500 kg)(-15 m/s)
p_initial = 20,000 - 22,500 = -2,500 kg⋅m/s

Step 3: Apply conservation of momentum.
After collision, the cars stick together: m_total = 2500 kg
p_final = p_initial = -2,500 kg⋅m/s

Step 4: Solve for final velocity.
v_final = p_final / m_total = -2,500 / 2500 = -1 m/s

The wreckage moves at 1 m/s in the direction car B was traveling.`,
      principlesUsed: ['axiom-1', 'axiom-4'],
    },
    {
      id: 'example-2',
      title: 'Rocket Propulsion',
      problem: 'A 1000 kg rocket ejects 10 kg of gas per second at 2000 m/s relative to the rocket. What is the rocket\'s acceleration?',
      solution: `Step 1: Recognize this as an action-reaction problem.
The rocket pushes gas backward (action), and gas pushes rocket forward (reaction).

Step 2: Calculate the force from expelled gas.
The momentum change of gas per second gives the force:
F = (dm/dt) × v_exhaust = (10 kg/s)(2000 m/s) = 20,000 N

Step 3: Apply Newton's second law (F = ma).
The reaction force accelerates the rocket:
a = F / m = 20,000 N / 1000 kg = 20 m/s²

The rocket accelerates at 20 m/s² upward (ignoring gravity for simplicity).`,
      principlesUsed: ['axiom-2', 'axiom-4'],
    },
  ],
};

export const MOCK_BREAKDOWN_CALCULUS: FirstPrinciplesBreakdown = {
  concept: 'The Derivative',
  domain: 'Mathematics',
  firstPrinciples: [
    {
      id: 'axiom-1',
      title: 'Rate of Change',
      statement: 'The derivative measures how fast a function changes at a specific point.',
      whyFundamental: 'This is the core definition of what differentiation represents - instantaneous rate of change.',
    },
    {
      id: 'axiom-2',
      title: 'Limit Definition',
      statement: 'The derivative is defined as the limit of the difference quotient: f\'(x) = lim(h→0) [f(x+h) - f(x)] / h',
      whyFundamental: 'This formal definition allows us to compute derivatives from first principles.',
    },
    {
      id: 'axiom-3',
      title: 'Slope of Tangent Line',
      statement: 'At any point on a curve, the derivative equals the slope of the line tangent to the curve at that point.',
      whyFundamental: 'This connects the algebraic concept of derivatives to geometric intuition.',
    },
    {
      id: 'axiom-4',
      title: 'Linearity of Differentiation',
      statement: 'The derivative operator is linear: (af + bg)\' = af\' + bg\' for constants a, b.',
      whyFundamental: 'This property makes derivatives computational tractable for complex functions.',
    },
  ],
  derivation: [
    {
      step: 1,
      fromPrinciples: ['axiom-2'],
      claim: 'The derivative of x² is 2x',
      reasoning: 'Using the limit definition: lim(h→0) [(x+h)² - x²]/h = lim(h→0) [2xh + h²]/h = lim(h→0) (2x + h) = 2x',
    },
    {
      step: 2,
      fromPrinciples: ['axiom-4'],
      claim: 'We can differentiate polynomials term by term',
      reasoning: 'Linearity means (x³ + 2x² - 5)\' = (x³)\' + 2(x²)\' + (-5)\' = 3x² + 4x + 0',
    },
    {
      step: 3,
      fromPrinciples: ['axiom-1', 'axiom-3'],
      claim: 'When f\'(x) > 0, the function is increasing',
      reasoning: 'A positive slope means the tangent line points upward, indicating the function value increases as x increases.',
    },
    {
      step: 4,
      fromPrinciples: ['axiom-1'],
      claim: 'Critical points occur where f\'(x) = 0',
      reasoning: 'Zero rate of change means the function momentarily stops increasing/decreasing - these are potential maxima/minima.',
    },
  ],
  workedExamples: [
    {
      id: 'example-1',
      title: 'Derivative of x³ from First Principles',
      problem: 'Use the limit definition to find the derivative of f(x) = x³.',
      solution: `Step 1: Write the limit definition.
f'(x) = lim(h→0) [f(x+h) - f(x)] / h

Step 2: Substitute f(x) = x³.
f'(x) = lim(h→0) [(x+h)³ - x³] / h

Step 3: Expand (x+h)³ using binomial theorem.
(x+h)³ = x³ + 3x²h + 3xh² + h³

Step 4: Simplify the numerator.
[(x³ + 3x²h + 3xh² + h³) - x³] / h = [3x²h + 3xh² + h³] / h = 3x² + 3xh + h²

Step 5: Take the limit as h → 0.
lim(h→0) (3x² + 3xh + h²) = 3x²

Therefore, d/dx(x³) = 3x².`,
      principlesUsed: ['axiom-2'],
    },
    {
      id: 'example-2',
      title: 'Finding Maximum of a Parabola',
      problem: 'Find the maximum value of f(x) = -2x² + 8x + 5.',
      solution: `Step 1: Find critical points by setting f'(x) = 0.
f'(x) = -4x + 8
-4x + 8 = 0
x = 2

Step 2: Verify it's a maximum (not minimum).
f''(x) = -4 < 0, so concave down → maximum

Step 3: Calculate the maximum value.
f(2) = -2(2)² + 8(2) + 5 = -8 + 16 + 5 = 13

The maximum value is 13, occurring at x = 2.`,
      principlesUsed: ['axiom-1', 'axiom-2'],
    },
  ],
};

export const MOCK_BREAKDOWN_ECONOMICS: FirstPrinciplesBreakdown = {
  concept: 'Supply and Demand',
  domain: 'Economics',
  firstPrinciples: [
    {
      id: 'axiom-1',
      title: 'Scarcity',
      statement: 'Resources are limited while human wants are unlimited.',
      whyFundamental: 'This creates the fundamental economic problem that drives all market behavior.',
    },
    {
      id: 'axiom-2',
      title: 'Law of Demand',
      statement: 'As price increases, quantity demanded decreases (holding other factors constant).',
      whyFundamental: 'This inverse relationship reflects rational consumer behavior - people buy less when things cost more.',
    },
    {
      id: 'axiom-3',
      title: 'Law of Supply',
      statement: 'As price increases, quantity supplied increases (holding other factors constant).',
      whyFundamental: 'Higher prices incentivize producers to make more, as profit margins improve.',
    },
    {
      id: 'axiom-4',
      title: 'Market Equilibrium',
      statement: 'The market clears when quantity demanded equals quantity supplied.',
      whyFundamental: 'This is the stable point where there\'s no pressure for price to change.',
    },
  ],
  derivation: [
    {
      step: 1,
      fromPrinciples: ['axiom-2', 'axiom-3'],
      claim: 'Supply and demand curves intersect at one point',
      reasoning: 'Demand slopes down, supply slopes up, so they must cross exactly once in normal markets.',
    },
    {
      step: 2,
      fromPrinciples: ['axiom-4'],
      claim: 'Prices above equilibrium create surplus',
      reasoning: 'At high prices, suppliers want to sell more than consumers want to buy, creating excess supply.',
    },
    {
      step: 3,
      fromPrinciples: ['axiom-4'],
      claim: 'Prices below equilibrium create shortage',
      reasoning: 'At low prices, consumers want to buy more than suppliers want to sell, creating excess demand.',
    },
    {
      step: 4,
      fromPrinciples: ['axiom-1', 'axiom-4'],
      claim: 'Market forces push price toward equilibrium',
      reasoning: 'Surpluses cause prices to fall, shortages cause prices to rise, until equilibrium is reached.',
    },
  ],
  workedExamples: [
    {
      id: 'example-1',
      title: 'Finding Market Equilibrium',
      problem: 'Demand: Qd = 100 - 2P, Supply: Qs = 20 + 3P. Find equilibrium price and quantity.',
      solution: `Step 1: Set quantity demanded equal to quantity supplied.
Qd = Qs
100 - 2P = 20 + 3P

Step 2: Solve for equilibrium price.
100 - 20 = 3P + 2P
80 = 5P
P* = 16

Step 3: Find equilibrium quantity by substituting into either equation.
Q* = 100 - 2(16) = 100 - 32 = 68
Or: Q* = 20 + 3(16) = 20 + 48 = 68 ✓

Equilibrium: Price = $16, Quantity = 68 units.`,
      principlesUsed: ['axiom-2', 'axiom-3', 'axiom-4'],
    },
  ],
};

// Map topic keywords to mock breakdowns
export const MOCK_BREAKDOWN_MAP: Record<string, FirstPrinciplesBreakdown> = {
  'newton': MOCK_BREAKDOWN_PHYSICS,
  'motion': MOCK_BREAKDOWN_PHYSICS,
  'physics': MOCK_BREAKDOWN_PHYSICS,
  'force': MOCK_BREAKDOWN_PHYSICS,
  'derivative': MOCK_BREAKDOWN_CALCULUS,
  'calculus': MOCK_BREAKDOWN_CALCULUS,
  'differentiation': MOCK_BREAKDOWN_CALCULUS,
  'supply': MOCK_BREAKDOWN_ECONOMICS,
  'demand': MOCK_BREAKDOWN_ECONOMICS,
  'economics': MOCK_BREAKDOWN_ECONOMICS,
  'market': MOCK_BREAKDOWN_ECONOMICS,
};

// Default breakdown if no match found
export const MOCK_BREAKDOWN_DEFAULT = MOCK_BREAKDOWN_PHYSICS;

/**
 * Get a mock breakdown based on topic
 */
export function getMockBreakdown(topic: string): FirstPrinciplesBreakdown {
  const lowerTopic = topic.toLowerCase();
  
  // Find first matching keyword
  for (const [keyword, breakdown] of Object.entries(MOCK_BREAKDOWN_MAP)) {
    if (lowerTopic.includes(keyword)) {
      return breakdown;
    }
  }
  
  // Return default if no match
  return MOCK_BREAKDOWN_DEFAULT;
}
