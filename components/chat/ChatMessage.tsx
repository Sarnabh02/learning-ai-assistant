'use client';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  turnNumber?: number;
  principleHinted?: { id: string; title: string; question: string };
  goalIdentified?: string;
}

export function ChatMessage({
  role,
  content,
  turnNumber,
  principleHinted,
  goalIdentified,
}: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        {/* Turn label */}
        {turnNumber !== undefined && (
          <span className="text-xs text-white/30 px-1">
            {isUser ? 'You' : `Tutor · turn ${turnNumber}`}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-violet-600/30 border border-violet-500/30 text-white rounded-tr-sm'
              : 'bg-cyan-900/30 border border-cyan-500/20 text-white/90 rounded-tl-sm'
          }`}
        >
          {content}
        </div>

        {/* Goal identified pill (assistant only) */}
        {!isUser && goalIdentified && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs text-white/30">Goal detected:</span>
            <span className="text-xs bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
              {goalIdentified}
            </span>
          </div>
        )}

        {/* Principle hint pill (assistant only, shown after turn 5) */}
        {!isUser && principleHinted && (
          <div className="mt-1 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            <p className="text-xs text-amber-400/70 font-medium mb-1">
              Principle hint unlocked
            </p>
            <p className="text-xs text-amber-200/80 font-semibold">
              {principleHinted.title}
            </p>
            <p className="text-xs text-amber-200/60 mt-0.5 italic">
              {principleHinted.question}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
