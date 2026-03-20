import type { PracticeProblem } from '@/lib/first-principles/types';
import { HintReveal } from './HintReveal';

interface ProblemCardProps {
  problem: PracticeProblem;
  index: number;
  hintsShown: 0 | 1 | 2 | 3;
  onRevealHint: (level: 1 | 2 | 3) => void;
}

const difficultyConfig = {
  easy: {
    label: 'Easy',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    border: 'border-emerald-500/20',
  },
  medium: {
    label: 'Medium',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    border: 'border-amber-500/20',
  },
  hard: {
    label: 'Hard',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    border: 'border-rose-500/20',
  },
};

export function ProblemCard({ problem, index, hintsShown, onRevealHint }: ProblemCardProps) {
  const config = difficultyConfig[problem.difficulty];

  return (
    <div
      className={`rounded-2xl border ${config.border} bg-white/5 p-6 backdrop-blur-sm transition-all duration-200 hover:bg-white/8`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-white/60 text-sm font-mono font-bold">
            {index + 1}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.badge}`}
          >
            {config.label}
          </span>
        </div>
      </div>

      <p className="text-white/90 leading-relaxed text-sm">{problem.statement}</p>

      <HintReveal
        hints={problem.hints}
        shown={hintsShown}
        onReveal={onRevealHint}
        answer={problem.answer}
      />
    </div>
  );
}
