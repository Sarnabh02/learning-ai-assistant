'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  LearnPhase,
  LearnInput,
  FirstPrinciplesBreakdown,
  PracticeSet,
  PracticeProblem,
  HintState,
  LearningIntent,
} from '@/lib/first-principles/types';
import { useLearningStore } from '@/store/learning-store';
import { TopicInput } from './TopicInput';
import { BreakdownViewer } from './BreakdownViewer';
import { PracticeSection } from './PracticeSection';
import { FlashCardDeck } from './FlashCardDeck';
import { LoadingPulse } from './LoadingPulse';
import { SocraticChat } from '@/components/chat/SocraticChat';

// ---------- Orchestration progress indicator ----------

const STAGES = [
  { key: 'intake', label: 'Analyzing intent', icon: '🔍' },
  { key: 'breakdown', label: 'Building first principles', icon: '🧩' },
  { key: 'problems', label: 'Generating practice problems', icon: '📝' },
] as const;

type StageKey = (typeof STAGES)[number]['key'];

function OrchestrationProgress({
  currentStage,
  completedStages,
  intent,
}: {
  currentStage: StageKey | null;
  completedStages: Set<StageKey>;
  intent: LearningIntent | null;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-4">
          Agent pipeline
        </p>
        <div className="space-y-3">
          {STAGES.map((stage) => {
            const done = completedStages.has(stage.key);
            const active = currentStage === stage.key;
            return (
              <div key={stage.key} className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all ${
                    done
                      ? 'bg-emerald-500/20 border border-emerald-500/40'
                      : active
                      ? 'bg-violet-500/20 border border-violet-500/40 animate-pulse'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  {done ? '✓' : stage.icon}
                </div>
                <span
                  className={`text-sm transition-colors ${
                    done ? 'text-emerald-400' : active ? 'text-white' : 'text-white/30'
                  }`}
                >
                  {stage.label}
                </span>
                {active && (
                  <div className="ml-auto flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {intent && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-900/10 p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-cyan-400/70 uppercase tracking-widest">
              Learning intent
            </span>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">
              {intent.domain}
            </span>
            <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">
              {intent.difficulty}
            </span>
          </div>
          <p className="text-xs text-white/40 mb-2">Objectives for this session:</p>
          <ul className="space-y-1.5">
            {intent.learningObjectives.map((obj, i) => (
              <li key={i} className="text-sm text-white/70 flex gap-2">
                <span className="text-cyan-400 flex-shrink-0">→</span>
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------- Main component ----------

export function LearnPage() {
  const store = useLearningStore();

  const [phase, setPhase] = useState<LearnPhase>('idle');
  const [breakdown, setBreakdown] = useState<FirstPrinciplesBreakdown | null>(null);
  const [practiceSet, setPracticeSet] = useState<PracticeSet | null>(null);
  const [hintState, setHintState] = useState<HintState>({});
  const [intent, setIntent] = useState<LearningIntent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentStage, setCurrentStage] = useState<StageKey | null>(null);
  const [completedStages, setCompletedStages] = useState<Set<StageKey>>(new Set());
  const [socraticProblem, setSocraticProblem] = useState<PracticeProblem | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [contentTab, setContentTab] = useState<'breakdown' | 'flashcards' | 'practice'>('breakdown');

  const abortRef = useRef<AbortController | null>(null);
  const breakdownRef = useRef<FirstPrinciplesBreakdown | null>(null);

  // On mount: consume any file handed off from Dashboard via Zustand store
  useEffect(() => {
    if (store.pendingFile) {
      const file = store.pendingFile;
      store.setPendingFile(null);
      const ext = file.name.toLowerCase();
      handleSubmit({
        mode: ext.endsWith('.pptx') ? 'pptx' : 'pdf',
        file,
        fileName: file.name,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleRevealHint = useCallback((problemId: string, level: 1 | 2 | 3) => {
    setHintState((prev) => ({ ...prev, [problemId]: level }));
  }, []);

  const handleSubmit = useCallback(async (input: LearnInput) => {
    setError(null);
    setBreakdown(null);
    setPracticeSet(null);
    setHintState({});
    setIntent(null);
    setCurrentStage(null);
    setCompletedStages(new Set());
    setSocraticProblem(null);
    setContentTab('breakdown');
    breakdownRef.current = null;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('orchestrating');

    let body: BodyInit;
    const headers: Record<string, string> = {};

    if (input.mode === 'text') {
      body = JSON.stringify({ topic: input.topic, model: input.model });
      headers['Content-Type'] = 'application/json';
    } else {
      const fd = new FormData();
      fd.append('file', input.file!);
      if (input.model) {
        fd.append('model', input.model);
      }
      body = fd;
    }

    try {
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Request failed' }));
        setError(err.message ?? `Request failed (${response.status})`);
        setPhase('idle');
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;

          const lines = eventStr.split('\n');
          const eventType =
            lines.find((l) => l.startsWith('event: '))?.slice(7).trim() ?? 'message';
          const dataLine = lines.find((l) => l.startsWith('data: '))?.slice(6) ?? '';

          try {
            const data = JSON.parse(dataLine);

            switch (eventType) {
              case 'stage':
                setCurrentStage(data.stage as StageKey);
                break;

              case 'intake':
                setIntent(data as LearningIntent);
                setCompletedStages((prev) => new Set([...prev, 'intake']));
                break;

              case 'breakdown': {
                const bd = data.breakdown as FirstPrinciplesBreakdown;
                setBreakdown(bd);
                breakdownRef.current = bd;
                setCompletedStages((prev) => new Set([...prev, 'breakdown']));
                setPhase('breakdown_ready');
                break;
              }

              case 'problems':
                setPracticeSet(data.practiceSet as PracticeSet);
                setCompletedStages((prev) => new Set([...prev, 'problems']));
                setPhase('problems_ready');
                setContentTab((prev) => (prev === 'breakdown' ? 'practice' : prev));
                break;

              case 'error':
                setError(data.message ?? 'Generation failed. Please try again.');
                setPhase(breakdownRef.current ? 'breakdown_ready' : 'idle');
                break;
            }
          } catch {
            // Malformed event — skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Connection error. Please try again.');
        setPhase('idle');
      }
    }
  }, []);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setPhase('idle');
    setBreakdown(null);
    setPracticeSet(null);
    setHintState({});
    setIntent(null);
    setCurrentStage(null);
    setCompletedStages(new Set());
    setSocraticProblem(null);
    setContentTab('breakdown');
    setError(null);
    breakdownRef.current = null;
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!breakdown || !practiceSet || !intent) return;
    const payload = {
      topic: breakdown.concept,
      domain: breakdown.domain,
      difficulty: intent.difficulty,
      learningObjectives: intent.learningObjectives,
      focusConcepts: intent.focusConcepts,
      firstPrinciples: breakdown.firstPrinciples,
      derivation: breakdown.derivation,
      workedExamples: breakdown.workedExamples,
      practiceProblems: practiceSet.problems.map((p) => ({
        difficulty: p.difficulty,
        statement: p.statement,
      })),
    };
    setIsPdfLoading(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError('Failed to generate PDF. Please try again.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${breakdown.concept.toLowerCase().replace(/\s+/g, '-')}-summary.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsPdfLoading(false);
    }
  }, [breakdown, practiceSet, intent]);

  const isLoading = phase === 'orchestrating' || phase === 'extracting' || phase === 'streaming';

  return (
    <>
      {socraticProblem && breakdown && (
        <SocraticChat
          breakdown={breakdown}
          problem={socraticProblem}
          hintsRevealed={hintState[socraticProblem.id] ?? 0}
          onClose={() => setSocraticProblem(null)}
        />
      )}

      <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-8 pb-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">First Principles</h1>
              <p className="text-white/40 text-sm mt-1">
                Understand anything from the ground up
              </p>
            </div>
            {phase !== 'idle' && (
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="text-sm text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-40"
              >
                Start over
              </button>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 flex items-start gap-3">
              <span className="text-rose-400 text-sm flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-rose-400/60 hover:text-rose-400 text-sm flex-shrink-0"
              >
                ✕
              </button>
            </div>
          )}

          {phase === 'idle' && (
            <TopicInput onSubmit={handleSubmit} isLoading={false} error={null} />
          )}

          {phase === 'orchestrating' && (
            <OrchestrationProgress
              currentStage={currentStage}
              completedStages={completedStages}
              intent={intent}
            />
          )}

          {phase === 'extracting' && (
            <LoadingPulse message="Extracting text from your file..." />
          )}
          {phase === 'streaming' && (
            <LoadingPulse message="Building your first principles breakdown..." />
          )}

          {/* Intent banner above breakdown */}
          {(phase === 'breakdown_ready' || phase === 'problems_ready') && intent && (
            <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-900/10 p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs text-cyan-400/70 uppercase tracking-widest">Session</span>
                <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">
                  {intent.domain}
                </span>
                <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">
                  {intent.difficulty}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {intent.learningObjectives.map((obj, i) => (
                  <span
                    key={i}
                    className="text-xs text-white/60 bg-white/5 border border-white/10 px-2 py-1 rounded-lg"
                  >
                    → {obj}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(phase === 'breakdown_ready' || phase === 'problems_ready') && breakdown && (
            <>
              {/* Tab navigation */}
              <div className="flex items-center gap-1 mb-6 p-1 bg-white/5 border border-white/10 rounded-xl">
                {(
                  [
                    { key: 'breakdown', label: 'Breakdown' },
                    { key: 'flashcards', label: 'Flashcards' },
                    { key: 'practice', label: 'Practice', disabled: !practiceSet },
                  ] as const
                ).map(({ key, label, disabled }) => (
                  <button
                    key={key}
                    onClick={() => !disabled && setContentTab(key)}
                    disabled={disabled}
                    className={`flex-1 text-sm py-2 rounded-lg transition-all duration-200 font-medium ${
                      contentTab === key
                        ? 'bg-violet-600/40 border border-violet-500/40 text-white'
                        : disabled
                        ? 'text-white/20 cursor-not-allowed'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    {label}
                    {key === 'practice' && !practiceSet && (
                      <span className="ml-1.5 text-xs text-white/20">generating…</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Breakdown tab */}
              {contentTab === 'breakdown' && (
                <BreakdownViewer
                  breakdown={breakdown}
                  isStreaming={false}
                  onGenerateProblems={() => {}}
                  isGeneratingProblems={false}
                />
              )}

              {/* Flashcards tab */}
              {contentTab === 'flashcards' && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-1">Flashcards</h2>
                    <p className="text-white/40 text-sm">
                      Review every principle, derivation, and worked example — one card at a time.
                    </p>
                  </div>
                  <FlashCardDeck breakdown={breakdown} />
                </div>
              )}

              {/* Practice tab */}
              {contentTab === 'practice' && practiceSet && (
                <>
                  <PracticeSection
                    practiceSet={practiceSet}
                    hintState={hintState}
                    onRevealHint={handleRevealHint}
                  />

                  {/* Socratic tutor CTA */}
                  <div className="mt-8 rounded-2xl border border-violet-500/20 bg-violet-900/10 p-6">
                    <h3 className="text-white font-semibold mb-1">
                      Practice with your Socratic tutor
                    </h3>
                    <p className="text-white/50 text-sm mb-4">
                      The AI tutor guides you to the answer through questioning — it never gives it away.
                      Choose a problem to start.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {practiceSet.problems.map((prob) => (
                        <button
                          key={prob.id}
                          onClick={() => setSocraticProblem(prob)}
                          className="text-left px-4 py-3 bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/40 rounded-xl transition-all duration-200 group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                prob.difficulty === 'easy'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : prob.difficulty === 'medium'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {prob.difficulty}
                            </span>
                          </div>
                          <p className="text-sm text-white/70 group-hover:text-white/90 line-clamp-2 transition-colors">
                            {prob.statement}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Download Summary PDF */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleDownloadPdf}
                      disabled={isPdfLoading}
                      className="flex items-center gap-2 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isPdfLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
                          Generating…
                        </>
                      ) : (
                        <>
                          <span>↓</span>
                          Download Summary PDF
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
