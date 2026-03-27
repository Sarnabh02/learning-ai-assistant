'use client';

import { create } from 'zustand';

interface LearningStore {
  // File handoff: set from Dashboard, consumed by LearnPage on mount
  pendingFile: File | null;
  setPendingFile: (file: File | null) => void;
  reset: () => void;
}

export const useLearningStore = create<LearningStore>((set) => ({
  pendingFile: null,

  setPendingFile: (file) => set({ pendingFile: file }),

  reset: () => set({ pendingFile: null }),
}));
