import type { SocraticMessage, AnswerAssessment, LearningIntent } from '@/lib/first-principles/types';

/**
 * Mock responses for Socratic dialogue and answer assessment
 * Used when testing without Python backend or API keys
 */

// Sample Socratic responses based on user input
export const MOCK_SOCRATIC_RESPONSES = [
  {
    keywords: ['force', 'acceleration', 'mass'],
    response: {
      goalIdentified: 'understand the relationship between force, mass, and acceleration',
      principleHinted: {
        id: 'axiom-2',
        title: 'Force Causes Acceleration',
        question: 'Before we dive into the formula, can you think about what happens when you push a heavy object versus a light object with the same force? Which one accelerates more?',
      },
      assistantMessage: 'I notice you\'re asking about force and acceleration. Let me help you discover the connection through questioning. Before we dive into the formula, can you think about what happens when you push a heavy object versus a light object with the same force? Which one accelerates more?',
    },
  },
  {
    keywords: ['momentum', 'collision', 'conserve'],
    response: {
      goalIdentified: 'understand momentum conservation in collisions',
      principleHinted: {
        id: 'axiom-1',
        title: 'Conservation of Momentum',
        question: 'What quantities do you think stay the same before and after a collision? Think about what\'s true for the system as a whole, not individual objects.',
      },
      assistantMessage: 'You\'re exploring collision problems! Let\'s think about what stays constant. What quantities do you think stay the same before and after a collision? Think about what\'s true for the system as a whole, not individual objects.',
    },
  },
  {
    keywords: ['derivative', 'rate', 'change'],
    response: {
      goalIdentified: 'understand what a derivative represents',
      principleHinted: {
        id: 'axiom-1',
        title: 'Rate of Change',
        question: 'If you\'re driving and your speedometer shows 60 mph, what does that number tell you about how your position is changing? Is this an average or instantaneous measurement?',
      },
      assistantMessage: 'Great question about derivatives! Let\'s build intuition first. If you\'re driving and your speedometer shows 60 mph, what does that number tell you about how your position is changing? Is this an average or instantaneous measurement?',
    },
  },
  {
    keywords: ['limit', 'approach', 'infinity'],
    response: {
      goalIdentified: 'understand the concept of limits',
      principleHinted: {
        id: 'axiom-2',
        title: 'Limit Definition',
        question: 'When we say "as h approaches 0", what do you think that means? Can h ever actually equal 0, or is it getting arbitrarily close?',
      },
      assistantMessage: 'Limits are fundamental to calculus! Let\'s clarify the concept. When we say "as h approaches 0", what do you think that means? Can h ever actually equal 0, or is it getting arbitrarily close?',
    },
  },
  {
    keywords: ['supply', 'demand', 'equilibrium'],
    response: {
      goalIdentified: 'find market equilibrium',
      principleHinted: {
        id: 'axiom-4',
        title: 'Market Equilibrium',
        question: 'What do you think happens in a market when the quantity suppliers want to sell exactly matches what consumers want to buy? Would anyone have incentive to change the price?',
      },
      assistantMessage: 'You\'re working on finding equilibrium! Let\'s think about what equilibrium means. What do you think happens in a market when the quantity suppliers want to sell exactly matches what consumers want to buy? Would anyone have incentive to change the price?',
    },
  },
];

// Default Socratic response for unmatched queries
export const MOCK_SOCRATIC_DEFAULT = {
  goalIdentified: 'explore the concept being studied',
  assistantMessage: 'That\'s an interesting question! Let me help you think through this systematically. Can you start by telling me what you already know about this topic? What connections can you make to the fundamental principles we\'ve covered?',
};

/**
 * Get a mock Socratic response based on user message
 */
export function getMockSocraticResponse(userMessage: string, breakdown?: any): any {
  const lowerMessage = userMessage.toLowerCase();
  
  // Find matching response based on keywords
  for (const mockResponse of MOCK_SOCRATIC_RESPONSES) {
    if (mockResponse.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return mockResponse.response;
    }
  }
  
  // Return default response
  return MOCK_SOCRATIC_DEFAULT;
}

// Sample answer assessments
export const MOCK_ASSESSMENTS = {
  correct: {
    isCorrect: true,
    score: 95,
    strengths: [
      'Correctly applied the relevant formula',
      'Showed clear step-by-step reasoning',
      'Arrived at the correct numerical answer with proper units',
    ],
    gaps: [
      'Could have been more explicit about which first principle justifies each step',
    ],
    socraticFollowUp: 'Excellent work! You\'ve demonstrated a solid grasp of the concept. Now, can you think of a real-world scenario where this principle might not apply? What conditions would need to change?',
  },
  partiallyCorrect: {
    isCorrect: false,
    score: 65,
    strengths: [
      'Identified the relevant principle to use',
      'Set up the problem correctly at the start',
      'Showed attempt at systematic reasoning',
    ],
    gaps: [
      'Made an algebraic error in the middle steps',
      'Forgot to account for the direction/sign of quantities',
      'Final numerical answer is incorrect',
    ],
    socraticFollowUp: 'You\'re on the right track! Let me help you find where things went off course. In step 3, when you wrote "[their step]", what assumption are you making about the direction? Let\'s think about the sign convention...',
  },
  incorrect: {
    isCorrect: false,
    score: 35,
    strengths: [
      'Attempted to engage with the problem',
      'Showed some understanding of related concepts',
    ],
    gaps: [
      'Used an inappropriate formula for this situation',
      'Misidentified which first principle applies',
      'Didn\'t account for all given information',
      'Final answer is significantly off',
    ],
    socraticFollowUp: 'I can see you\'re working hard on this! Let\'s step back and think about the fundamentals. What are we being asked to find here? And which of our first principles relates quantities like [variable A] and [variable B]? Let\'s rebuild your understanding from there.',
  },
  minimal: {
    isCorrect: false,
    score: 15,
    strengths: [
      'Made an attempt at the problem',
    ],
    gaps: [
      'Answer lacks clear reasoning or steps',
      'Didn\'t reference any first principles',
      'May have guessed without showing work',
      'Demonstrates need for more foundational review',
    ],
    socraticFollowUp: 'Let\'s slow down and build this up together. Before we even calculate anything, can you tell me what you know about [fundamental concept]? What are the key quantities involved, and how do they relate?',
  },
};

/**
 * Get a mock answer assessment based on user answer quality
 * In production, this would use AI to analyze the actual answer
 */
export function getMockAssessment(userAnswer: string, correctAnswer?: string): AnswerAssessment {
  const answerLength = userAnswer.trim().length;
  const hasNumbers = /\d/.test(userAnswer);
  const hasFormula = /[=+\-*/]/.test(userAnswer);
  const hasUnits = /(kg|m\/s|N|m\/s²|J|Pa|°C|K)/.test(userAnswer);
  
  // Simple heuristic for mock assessment
  if (answerLength > 100 && hasNumbers && hasFormula && hasUnits) {
    return MOCK_ASSESSMENTS.correct;
  } else if (answerLength > 50 && hasNumbers) {
    return MOCK_ASSESSMENTS.partiallyCorrect;
  } else if (answerLength > 20) {
    return MOCK_ASSESSMENTS.incorrect;
  } else {
    return MOCK_ASSESSMENTS.minimal;
  }
}

// Mock learning intent extraction
export const MOCK_LEARNING_INTENTS: Record<string, LearningIntent> = {
  'physics': {
    domain: 'Physics',
    difficulty: 'intermediate',
    learningObjectives: [
      'Understand Newton\'s laws of motion',
      'Apply force and acceleration concepts',
      'Solve collision problems using momentum conservation',
    ],
    focusConcepts: ['force', 'acceleration', 'momentum', 'inertia'],
  },
  'calculus': {
    domain: 'Mathematics',
    difficulty: 'intermediate',
    learningObjectives: [
      'Master the concept of derivatives',
      'Apply the limit definition',
      'Find critical points and extrema',
    ],
    focusConcepts: ['derivative', 'limit', 'rate of change', 'tangent line'],
  },
  'economics': {
    domain: 'Economics',
    difficulty: 'beginner',
    learningObjectives: [
      'Understand supply and demand',
      'Find market equilibrium',
      'Analyze surplus and shortage',
    ],
    focusConcepts: ['supply', 'demand', 'equilibrium', 'price'],
  },
};

export function getMockLearningIntent(topic: string): LearningIntent {
  const lowerTopic = topic.toLowerCase();
  
  for (const [key, intent] of Object.entries(MOCK_LEARNING_INTENTS)) {
    if (lowerTopic.includes(key)) {
      return intent;
    }
  }
  
  // Default intent
  return MOCK_LEARNING_INTENTS.physics;
}
