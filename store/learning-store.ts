'use client';

import { create } from 'zustand';
import type {
  LearningSession,
  FirstPrinciplesBreakdown,
  PracticeSet,
  SocraticMessage,
} from '@/lib/first-principles/types';

interface LearningStore {
  // File handoff: set from Dashboard, consumed by LearnPage on mount
  pendingFile: File | null;
  setPendingFile: (file: File | null) => void;

  // Active learning session
  session: LearningSession | null;
  setSession: (session: LearningSession) => void;
  updateBreakdown: (breakdown: FirstPrinciplesBreakdown) => void;
  updatePracticeSet: (practiceSet: PracticeSet) => void;
  addMessage: (msg: SocraticMessage) => void;
  setCurrentProblem: (id: string | null) => void;
  reset: () => void;
}

const EMPTY_SESSION: LearningSession = {
  sessionId: '',
  topic: '',
  domain: '',
  objectives: [],
  breakdown: null,
  practiceSet: null,
  conversationHistory: [],
  currentProblemId: null,
};

export const useLearningStore = create<LearningStore>((set) => ({
  pendingFile: null,
  session: null,

  setPendingFile: (file) => set({ pendingFile: file }),

  setSession: (session) => set({ session }),

  updateBreakdown: (breakdown) =>
    set((state) => ({
      session: state.session
        ? { ...state.session, breakdown }
        : { ...EMPTY_SESSION, breakdown },
    })),

  updatePracticeSet: (practiceSet) =>
    set((state) => ({
      session: state.session ? { ...state.session, practiceSet } : null,
    })),

  addMessage: (msg) =>
    set((state) => ({
      session: state.session
        ? {
            ...state.session,
            conversationHistory: [...state.session.conversationHistory, msg],
          }
        : null,
    })),

  setCurrentProblem: (id) =>
    set((state) => ({
      session: state.session
        ? { ...state.session, currentProblemId: id }
        : null,
    })),

  reset: () => set({ session: null, pendingFile: null }),
}));
