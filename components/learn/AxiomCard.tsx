import type { FirstPrinciple } from '@/lib/first-principles/types';

interface AxiomCardProps {
  principle: FirstPrinciple;
  index: number;
}

export function AxiomCard({ principle, index }: AxiomCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm hover:bg-white/8 transition-all duration-200">
      <div className="flex items-start gap-4">
        <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-400 text-sm font-bold">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm mb-2">{principle.title}</h4>
          <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2 mb-3">
            <p className="text-violet-200 text-sm leading-relaxed">{principle.statement}</p>
          </div>
          <p className="text-white/50 text-xs leading-relaxed">{principle.whyFundamental}</p>
        </div>
      </div>
    </div>
  );
}
