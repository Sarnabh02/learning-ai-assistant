'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  FirstPrinciplesBreakdown,
  PracticeProblem,
  SocraticMessage,
  AnswerAssessment,
} from '@/lib/first-principles/types';
import { ChatMessage } from './ChatMessage';

interface SocraticChatProps {
  breakdown: FirstPrinciplesBreakdown;
  problem: PracticeProblem;
  hintsRevealed: number;
  onClose: () => void;
}

export function SocraticChat({
  breakdown,
  problem,
  hintsRevealed,
  onClose,
}: SocraticChatProps) {
  const [messages, setMessages] = useState<SocraticMessage[]>([]);
  const [input, setInput] = useState('');
  const [turnNumber, setTurnNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [assessment, setAssessment] = useState<AnswerAssessment | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = useRef(crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assessment]);

  // Send initial greeting from tutor on mount
  useEffect(() => {
    const greeting: SocraticMessage = {
      role: 'assistant',
      content:
        "Let's work through this problem together. Don't give me the answer yet — " +
        "start by telling me: what is this problem asking you to find?",
      turnNumber: 0,
    };
    setMessages([greeting]);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setError(null);

    const userMsg: SocraticMessage = {
      role: 'user',
      content: text,
      turnNumber,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/socratic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.current,
          problemStatement: problem.statement,
          userMessage: text,
          conversationHistory: history,
          turnNumber,
          breakdown,
        }),
      });

      if (!res.ok) {
        throw new Error(`Socratic API error (${res.status})`);
      }

      const data = await res.json();

      const assistantMsg: SocraticMessage = {
        role: 'assistant',
        content: data.system_question,
        turnNumber,
        goalIdentified: data.goal_identified || undefined,
        principleHinted: data.principle_hinted || undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setTurnNumber((t) => t + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, isLoading, messages, turnNumber, problem, breakdown]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAssess = useCallback(async () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) {
      setError('Write an answer first, then click Check My Answer.');
      return;
    }

    setIsAssessing(true);
    setError(null);

    try {
      const res = await fetch('/api/assess-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemStatement: problem.statement,
          userAnswer: lastUserMsg.content,
          breakdown,
          hintsRevealed,
        }),
      });

      if (!res.ok) throw new Error(`Assessment error (${res.status})`);

      const data = await res.json();
      setAssessment(data.assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assessment failed');
    } finally {
      setIsAssessing(false);
    }
  }, [messages, problem, breakdown, hintsRevealed]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10 px-6 py-4 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <h2 className="text-white font-semibold text-sm">Socratic Tutor</h2>
            <p className="text-white/40 text-xs mt-0.5 line-clamp-1 max-w-xs">
              {problem.statement.slice(0, 80)}…
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30 bg-white/5 border border-white/10 px-2 py-1 rounded-full">
            Turn {turnNumber}
          </span>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 text-lg leading-none transition-colors"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Problem statement banner */}
      <div className="flex-shrink-0 bg-violet-900/20 border-b border-violet-500/20 px-6 py-3">
        <p className="text-xs text-violet-300/60 font-medium mb-1">Problem</p>
        <p className="text-sm text-white/80 leading-relaxed">{problem.statement}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            turnNumber={msg.turnNumber > 0 ? msg.turnNumber : undefined}
            goalIdentified={msg.goalIdentified}
            principleHinted={msg.principleHinted}
          />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-cyan-900/30 border border-cyan-500/20 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Assessment card */}
        {assessment && (
          <div className={`mt-4 rounded-2xl border p-4 ${
            assessment.isCorrect
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-rose-500/10 border-rose-500/30'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-2xl font-black ${assessment.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                {assessment.score}/100
              </span>
              <span className={`text-sm font-semibold ${assessment.isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                {assessment.isCorrect ? 'Correct reasoning' : 'Keep working on it'}
              </span>
            </div>

            {assessment.strengths.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-emerald-400/70 font-medium mb-1">Strengths</p>
                <ul className="space-y-0.5">
                  {assessment.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-white/70 flex gap-2">
                      <span className="text-emerald-400 flex-shrink-0">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {assessment.gaps.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-rose-400/70 font-medium mb-1">Gaps to address</p>
                <ul className="space-y-0.5">
                  {assessment.gaps.map((g, i) => (
                    <li key={i} className="text-xs text-white/70 flex gap-2">
                      <span className="text-rose-400 flex-shrink-0">→</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/10">
              <p className="text-xs text-cyan-300/70 font-medium mb-1">Continue thinking…</p>
              <p className="text-xs text-white/70 italic">{assessment.socraticFollowUp}</p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 mx-6 mb-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2 flex items-center justify-between">
          <span className="text-rose-400 text-xs">{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400/60 hover:text-rose-400 ml-3">✕</button>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-white/10 bg-white/5 px-6 py-4">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your thinking… (Enter to send, Shift+Enter for new line)"
            rows={2}
            disabled={isLoading}
            className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 resize-none disabled:opacity-50 transition-colors"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-cyan-600/80 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-sm font-semibold transition-all"
            >
              Send
            </button>
            <button
              onClick={handleAssess}
              disabled={isAssessing || messages.filter((m) => m.role === 'user').length === 0}
              className="px-3 py-2 bg-violet-600/60 hover:bg-violet-600/80 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-xs font-medium transition-all whitespace-nowrap"
            >
              {isAssessing ? '…' : 'Check'}
            </button>
          </div>
        </div>
        <p className="text-xs text-white/20 mt-2">
          The tutor will guide you — not give answers. Click <strong className="text-white/40">Check</strong> to assess your last response.
        </p>
      </div>
    </div>
  );
}
