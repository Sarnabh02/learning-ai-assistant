import type { PracticeHint } from '@/lib/first-principles/types';

interface HintRevealProps {
  hints: [PracticeHint, PracticeHint, PracticeHint];
  shown: 0 | 1 | 2 | 3;
  onReveal: (level: 1 | 2 | 3) => void;
  answer?: string;
}

const hintLabels = ['Principle', 'Approach', 'First Step'];

export function HintReveal({ hints, shown, onReveal, answer }: HintRevealProps) {
  const nextLevel = (shown + 1) as 1 | 2 | 3;

  return (
    <div className="mt-4 space-y-3">
      {/* Revealed hints */}
      {hints
        .filter(h => h.level <= shown)
        .map(h => (
          <div
            key={h.level}
            className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-200 transition-all duration-300"
          >
            <span className="font-semibold text-violet-400">
              Hint {h.level} — {hintLabels[h.level - 1]}:
            </span>{' '}
            {h.text}
          </div>
        ))}

      {/* Reveal next hint button */}
      {shown < 3 && (
        <button
          onClick={() => onReveal(nextLevel)}
          className="text-sm text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-400/50 rounded-lg px-4 py-2 transition-all duration-200 hover:bg-violet-500/10"
        >
          Show Hint {nextLevel} — {hintLabels[nextLevel - 1]}
        </button>
      )}

      {shown === 3 && answer && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          <span className="font-semibold text-cyan-300">Answer:</span> {answer}
        </div>
      )}
      {shown === 3 && !answer && (
        <p className="text-xs text-white/30 italic">All hints revealed. Keep working at it!</p>
      )}
    </div>
  );
}
