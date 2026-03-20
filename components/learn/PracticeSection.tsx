import type { PracticeSet, HintState, Difficulty } from '@/lib/first-principles/types';
import { ProblemCard } from './ProblemCard';

interface PracticeSectionProps {
  practiceSet: PracticeSet;
  hintState: HintState;
  onRevealHint: (problemId: string, level: 1 | 2 | 3) => void;
}

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

const difficultyHeadings: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export function PracticeSection({ practiceSet, hintState, onRevealHint }: PracticeSectionProps) {
  const grouped = DIFFICULTY_ORDER.reduce<Record<Difficulty, typeof practiceSet.problems>>(
    (acc, d) => {
      acc[d] = practiceSet.problems.filter(p => p.difficulty === d);
      return acc;
    },
    { easy: [], medium: [], hard: [] }
  );

  return (
    <section className="mt-8 mb-8">
      <h2 className="text-2xl font-bold text-white mb-2">Practice Problems</h2>
      <p className="text-white/50 text-sm mb-8">
        Test your understanding. Use hints if you get stuck — but try each problem first.
      </p>

      <div className="space-y-8">
        {DIFFICULTY_ORDER.map(diff => {
          const problems = grouped[diff];
          if (problems.length === 0) return null;
          return (
            <div key={diff}>
              <h3 className="text-base font-semibold text-white/60 uppercase tracking-widest mb-3">
                {difficultyHeadings[diff]}
              </h3>
              <div className="space-y-3">
                {problems.map((problem, idx) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    index={practiceSet.problems.indexOf(problem)}
                    hintsShown={(hintState[problem.id] ?? 0) as 0 | 1 | 2 | 3}
                    onRevealHint={(level) => onRevealHint(problem.id, level)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
