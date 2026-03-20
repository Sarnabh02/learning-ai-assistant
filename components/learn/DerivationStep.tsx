import type { DerivationStep as DerivationStepType, FirstPrinciple } from '@/lib/first-principles/types';

interface DerivationStepProps {
  step: DerivationStepType;
  allPrinciples: FirstPrinciple[];
  isLast: boolean;
}

export function DerivationStep({ step, allPrinciples, isLast }: DerivationStepProps) {
  const resolvedPrinciples = step.fromPrinciples
    .map(id => allPrinciples.find(p => p.id === id))
    .filter(Boolean) as FirstPrinciple[];

  return (
    <div className="flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold z-10">
          {step.step}
        </div>
        {!isLast && <div className="w-px flex-1 bg-gradient-to-b from-cyan-500/30 to-transparent mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        {/* Built from pills */}
        {resolvedPrinciples.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-white/30">Built from:</span>
            {resolvedPrinciples.map(p => (
              <span
                key={p.id}
                className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300"
              >
                {p.title}
              </span>
            ))}
          </div>
        )}

        <p className="text-white font-semibold text-sm mb-2">{step.claim}</p>
        <p className="text-white/60 text-sm leading-relaxed">{step.reasoning}</p>
      </div>
    </div>
  );
}
