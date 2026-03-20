'use client';

import { useEffect, useState } from 'react';
import { useLearningStore } from '@/store/learning-store';
import { TutoringChat } from '@/components/tutor/TutoringChat';

export default function TutorPage() {
  const pendingFile = useLearningStore((s) => s.pendingFile);
  const setPendingFile = useLearningStore((s) => s.setPendingFile);
  const [initialQuestion, setInitialQuestion] = useState('');

  // If a file was handed off from the dashboard, use its name as the initial context hint
  useEffect(() => {
    if (pendingFile) {
      setInitialQuestion(`I need help understanding this document: ${pendingFile.name}`);
      setPendingFile(null);
    }
  }, [pendingFile, setPendingFile]);

  return <TutoringChat initialQuestion={initialQuestion} />;
}
