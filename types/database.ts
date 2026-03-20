// Database types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_path: string;
  raw_text: string;
  domain: string;
  created_at: string;
  updated_at: string;
}

export interface Axiom {
  id: string;
  document_id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface AxiomVector {
  id: string;
  axiom_id: string;
  embedding: number[];
  created_at: string;
}

export interface HomeworkProblem {
  id: string;
  document_id: string;
  problem_text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  related_axioms: string[];
  is_extracted: boolean;
  created_at: string;
}

export interface DialogueSession {
  id: string;
  user_id: string;
  problem_id: string;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface SocraticExchange {
  id: string;
  session_id: string;
  turn_number: number;
  user_message: string;
  system_question: string;
  goal_identified?: string;
  variables_extracted: string[];
  principle_hinted?: string;
  principle_revealed: boolean;
  created_at: string;
}

export interface ScratchPad {
  id: string;
  session_id: string;
  content: string;
  last_saved: string;
}

export interface SessionLog {
  id: string;
  user_id: string;
  session_id?: string;
  action: string;
  metadata?: Record<string, any>;
  created_at: string;
}
