// Input types
export type InputMode = 'text' | 'pdf' | 'pptx';

export interface LearnInput {
  mode: InputMode;
  topic?: string;       // when mode === 'text'
  file?: File;          // raw File object for pdf/pptx; parsed server-side
  fileName?: string;    // original filename for display
  model?: string;       // Selected AI model (e.g., 'claude-3-5-sonnet-20241022', 'gpt-4o')
}

// Breakdown structure
export interface FirstPrinciple {
  id: string;           // e.g. 'axiom-1'
  title: string;
  statement: string;    // The axiom as a precise statement
  whyFundamental: string; // 1-sentence explanation of why this is bedrock
}

export interface DerivationStep {
  step: number;
  fromPrinciples: string[]; // ids of FirstPrinciples used
  claim: string;            // What we can now conclude
  reasoning: string;        // Why this follows from those principles
}

export interface WorkedExample {
  id: string;
  title: string;
  problem: string;
  solution: string;         // Full worked solution (explanatory, not Socratic)
  principlesUsed: string[]; // ids of FirstPrinciples
}

export interface FirstPrinciplesBreakdown {
  concept: string;
  domain: string;           // e.g. 'Physics', 'Economics', 'Mathematics'
  firstPrinciples: FirstPrinciple[];
  derivation: DerivationStep[];
  workedExamples: WorkedExample[];
}

// Practice problems
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PracticeHint {
  level: 1 | 2 | 3;
  text: string; // Progressive: level 1 is vague, level 3 is near-solution
}

export interface PracticeProblem {
  id: string;
  difficulty: Difficulty;
  statement: string;
  hints: [PracticeHint, PracticeHint, PracticeHint]; // Always exactly 3
  principlesExercised: string[]; // ids of FirstPrinciples
  answer?: string; // Revealed after all hints
}

export interface PracticeSet {
  problems: PracticeProblem[];
}

// UI phase state
export type LearnPhase =
  | 'idle'
  | 'extracting'          // parsing PDF/PPTX server-side
  | 'streaming'           // receiving breakdown from Claude
  | 'orchestrating'       // multi-agent orchestration in progress
  | 'breakdown_ready'     // breakdown complete, ready to read
  | 'generating_problems'
  | 'problems_ready';

export interface HintState {
  [problemId: string]: 0 | 1 | 2 | 3; // 0 = no hints shown
}

// ---------- Agentic workflow types ----------

export interface LearningIntent {
  domain: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives: string[];
  focusConcepts: string[];
}

export interface SocraticMessage {
  role: 'user' | 'assistant';
  content: string;
  turnNumber: number;
  goalIdentified?: string;
  principleHinted?: { id: string; title: string; question: string };
}

export interface AnswerAssessment {
  isCorrect: boolean;
  score: number;       // 0-100
  strengths: string[];
  gaps: string[];
  socraticFollowUp: string;
}

export interface LearningSession {
  sessionId: string;
  topic: string;
  domain: string;
  objectives: string[];
  breakdown: FirstPrinciplesBreakdown | null;
  practiceSet: PracticeSet | null;
  conversationHistory: SocraticMessage[];
  currentProblemId: string | null;
}

// ---------- API types ----------

export interface BreakdownRequest {
  topic?: string;
  documentText?: string;
  fileName?: string;
}

export interface ProblemsRequest {
  breakdown: FirstPrinciplesBreakdown;
}

export interface ProblemsResponse {
  practiceSet: PracticeSet;
}
