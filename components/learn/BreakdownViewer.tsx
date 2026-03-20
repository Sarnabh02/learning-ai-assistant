import type { FirstPrinciplesBreakdown } from '@/lib/first-principles/types';
import { AxiomCard } from './AxiomCard';
import { DerivationStep } from './DerivationStep';
import { WorkedExample } from './WorkedExample';
import { LoadingPulse } from './LoadingPulse';

interface BreakdownViewerProps {
  breakdown: FirstPrinciplesBreakdown | null;
  isStreaming: boolean;
  onGenerateProblems: () => void;
  isGeneratingProblems: boolean;
}

export function BreakdownViewer({
  breakdown,
  isStreaming,
  onGenerateProblems,
  isGeneratingProblems,
}: BreakdownViewerProps) {
  if (isStreaming) {
    return <LoadingPulse message="Building your first principles breakdown..." />;
  }

  if (!breakdown) return null;

  return (
    <div className="space-y-8 mb-8">
      {/* Header */}
      <div className="mb-6">
        <span className="text-xs font-semibold text-violet-400 bg-violet-500/15 border border-violet-500/25 px-3 py-1 rounded-full uppercase tracking-widest">
          {breakdown.domain}
        </span>
        <h1 className="text-3xl font-bold text-white mt-3 mb-1">{breakdown.concept}</h1>
        <p className="text-white/40 text-sm">Built from first principles</p>
      </div>

      {/* First Principles */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-1">First Principles</h2>
        <p className="text-white/40 text-sm mb-5">
          The bedrock truths — these need no derivation. Everything else follows from here.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {breakdown.firstPrinciples.map((p, i) => (
            <AxiomCard key={p.id} principle={p} index={i} />
          ))}
        </div>
      </section>

      {/* Logical Derivation */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-1">Logical Derivation</h2>
        <p className="text-white/40 text-sm mb-6">
          Each step follows necessarily from the principles above it.
        </p>
        <div>
          {breakdown.derivation.map((step, i) => (
            <DerivationStep
              key={step.step}
              step={step}
              allPrinciples={breakdown.firstPrinciples}
              isLast={i === breakdown.derivation.length - 1}
            />
          ))}
        </div>
      </section>

      {/* Worked Examples */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-1">Worked Examples</h2>
        <p className="text-white/40 text-sm mb-5">
          Full solutions showing the principles in action.
        </p>
        <div className="space-y-4">
          {breakdown.workedExamples.map((example, i) => (
            <WorkedExample
              key={example.id}
              example={example}
              index={i}
              allPrinciples={breakdown.firstPrinciples}
            />
          ))}
        </div>
      </section>

      {/* Generate problems CTA */}
      <div className="pt-6 pb-4 mt-6 border-t border-white/10">
        <p className="text-white/50 text-sm mb-4">
          Ready to test your understanding?
        </p>
        <button
          onClick={onGenerateProblems}
          disabled={isGeneratingProblems}
          className="px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingProblems ? 'Generating problems...' : 'Generate Practice Problems'}
        </button>
      </div>
    </div>
  );
}
