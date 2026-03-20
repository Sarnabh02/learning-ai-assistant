/**
 * Mock data for testing the education assistant without API keys
 * 
 * To use mock data, set USE_MOCK_DATA=true in your .env.local file
 */

export {
  MOCK_BREAKDOWN_PHYSICS,
  MOCK_BREAKDOWN_CALCULUS,
  MOCK_BREAKDOWN_ECONOMICS,
  MOCK_BREAKDOWN_MAP,
  MOCK_BREAKDOWN_DEFAULT,
  getMockBreakdown,
} from './breakdown-samples';

export {
  MOCK_PROBLEMS_PHYSICS,
  MOCK_PROBLEMS_CALCULUS,
  MOCK_PROBLEMS_ECONOMICS,
  MOCK_PROBLEMS_MAP,
  getMockProblems,
} from './practice-problems-samples';

export {
  MOCK_SOCRATIC_RESPONSES,
  MOCK_SOCRATIC_DEFAULT,
  MOCK_ASSESSMENTS,
  MOCK_LEARNING_INTENTS,
  getMockSocraticResponse,
  getMockAssessment,
  getMockLearningIntent,
} from './socratic-samples';

// Helper to check if mock data is enabled
export function isMockDataEnabled(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

// Simulate API delay for more realistic testing
export function simulateDelay(ms: number = 800): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
