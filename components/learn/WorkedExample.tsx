import type { WorkedExample as WorkedExampleType, FirstPrinciple } from '@/lib/first-principles/types';
import ReactMarkdown from 'react-markdown';

interface WorkedExampleProps {
  example: WorkedExampleType;
  index: number;
  allPrinciples: FirstPrinciple[];
}

export function WorkedExample({ example, index, allPrinciples }: WorkedExampleProps) {
  const resolvedPrinciples = example.principlesUsed
    .map(id => allPrinciples.find(p => p.id === id))
    .filter(Boolean) as FirstPrinciple[];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:bg-white/8 transition-all duration-200">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold text-amber-400 bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 rounded-full">
          Example {index + 1}
        </span>
        <h4 className="text-white font-semibold text-sm">{example.title}</h4>
      </div>

      {/* Problem statement */}
      <blockquote className="border-l-2 border-amber-500/40 pl-4 mb-5">
        <p className="text-white/80 text-sm leading-relaxed italic">{example.problem}</p>
      </blockquote>

      {/* Full solution */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          Solution
        </p>
        <div className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed">
          <ReactMarkdown>{example.solution}</ReactMarkdown>
        </div>
      </div>

      {/* Principles used */}
      {resolvedPrinciples.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-xs text-white/30">Uses:</span>
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
    </div>
  );
}
