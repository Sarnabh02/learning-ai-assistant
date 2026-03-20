'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '@/components/chat/ChatMessage';
import type { SocraticMessage } from '@/lib/first-principles/types';

interface TutoringChatProps {
  initialQuestion?: string;
}

export function TutoringChat({ initialQuestion = '' }: TutoringChatProps) {
  const [homeworkQuestion, setHomeworkQuestion] = useState(initialQuestion);
  const [draftQuestion, setDraftQuestion] = useState(initialQuestion);
  const [messages, setMessages] = useState<SocraticMessage[]>([]);
  const [input, setInput] = useState('');
  const [turnNumber, setTurnNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [approach, setApproach] = useState<string>('goal_clarification');

  const sessionId = useRef(crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = useCallback(async (question: string) => {
    if (!question.trim()) return;

    setHomeworkQuestion(question.trim());
    setSessionStarted(true);
    setMessages([]);
    setTurnNumber(1);
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.current,
          homeworkQuestion: question.trim(),
          conversationHistory: [],
          turnNumber: 1,
        }),
      });

      if (!res.ok) throw new Error(`Tutor API error (${res.status})`);

      const data = await res.json();
      setApproach(data.approach || 'goal_clarification');

      const tutorGreeting: SocraticMessage = {
        role: 'assistant',
        content: data.response,
        turnNumber: 1,
      };
      setMessages([tutorGreeting]);
      setTurnNumber(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error');
      setSessionStarted(false);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
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
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const history = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.current,
          homeworkQuestion,
          conversationHistory: history,
          turnNumber,
        }),
      });

      if (!res.ok) throw new Error(`Tutor API error (${res.status})`);

      const data = await res.json();
      setApproach(data.approach || approach);

      const assistantMsg: SocraticMessage = {
        role: 'assistant',
        content: data.response,
        turnNumber,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setTurnNumber((t) => t + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, isLoading, messages, turnNumber, homeworkQuestion, approach]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (sessionStarted) {
        sendMessage();
      } else {
        startSession(draftQuestion);
      }
    }
  };

  const resetSession = () => {
    sessionId.current = crypto.randomUUID();
    setSessionStarted(false);
    setMessages([]);
    setTurnNumber(1);
    setDraftQuestion('');
    setHomeworkQuestion('');
    setInput('');
    setError(null);
    setApproach('goal_clarification');
  };

  const approachLabel: Record<string, { label: string; color: string }> = {
    goal_clarification: { label: 'Understanding the problem', color: 'text-blue-400' },
    concept_probing: { label: 'Finding relevant concepts', color: 'text-violet-400' },
    guided_derivation: { label: 'Guided step-by-step', color: 'text-cyan-400' },
    near_solution: { label: 'Almost there!', color: 'text-emerald-400' },
  };
  const stage = approachLabel[approach] ?? approachLabel.goal_clarification;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-violet-500 opacity-15 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-cyan-500 opacity-15 blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 flex-shrink-0 backdrop-blur-md bg-white/10 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <div>
            <h1 className="text-white font-bold text-sm">Tutoring Chat</h1>
            <p className="text-white/40 text-xs">
              I guide — you discover. No answers given directly.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sessionStarted && (
            <>
              <span className={`text-xs ${stage.color} bg-white/5 border border-white/10 px-3 py-1 rounded-full`}>
                {stage.label}
              </span>
              <span className="text-xs text-white/30 bg-white/5 border border-white/10 px-2 py-1 rounded-full">
                Turn {turnNumber - 1}
              </span>
            </>
          )}
          {sessionStarted && (
            <button
              onClick={resetSession}
              className="text-xs text-white/40 hover:text-white/80 bg-white/5 border border-white/10 hover:border-white/30 px-3 py-1 rounded-full transition-all"
            >
              New Problem
            </button>
          )}
        </div>
      </header>

      {!sessionStarted ? (
        /* ── Problem input screen ── */
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl space-y-6">
            <div className="text-center space-y-3">
              <div className="text-6xl mb-2">🧑‍🏫</div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 text-transparent bg-clip-text">
                What are you working on?
              </h2>
              <p className="text-purple-200 text-sm max-w-md mx-auto">
                Paste your homework question below. I&apos;ll guide you to the answer
                using questions — not by solving it for you.
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
              <textarea
                value={draftQuestion}
                onChange={(e) => setDraftQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. A ball is thrown upward at 20 m/s. How high does it go? I don't know where to start…"
                rows={5}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 resize-none transition-colors"
              />
              <button
                onClick={() => startSession(draftQuestion)}
                disabled={!draftQuestion.trim() || isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-[1.02] shadow-xl"
              >
                {isLoading ? 'Starting session…' : 'Start Tutoring Session →'}
              </button>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: '🤔', label: 'Ask your question', desc: 'Any homework problem' },
                { icon: '💬', label: 'Get guided', desc: 'Socratic questions only' },
                { icon: '💡', label: 'Discover the answer', desc: 'Through your own reasoning' },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="text-white text-xs font-semibold">{item.label}</p>
                  <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── Active chat screen ── */
        <>
          {/* Problem banner */}
          <div className="relative z-10 flex-shrink-0 bg-amber-900/20 border-b border-amber-500/20 px-6 py-3">
            <p className="text-xs text-amber-300/60 font-medium mb-1">Your Question</p>
            <p className="text-sm text-white/80 leading-relaxed line-clamp-2">{homeworkQuestion}</p>
          </div>

          {/* Messages */}
          <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4 space-y-1">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                turnNumber={msg.turnNumber > 0 ? msg.turnNumber : undefined}
              />
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-amber-900/30 border border-amber-500/20 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Error banner */}
          {error && (
            <div className="relative z-10 flex-shrink-0 mx-6 mb-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2 flex items-center justify-between">
              <span className="text-rose-400 text-xs">{error}</span>
              <button onClick={() => setError(null)} className="text-rose-400/60 hover:text-rose-400 ml-3">✕</button>
            </div>
          )}

          {/* Input area */}
          <div className="relative z-10 flex-shrink-0 border-t border-white/10 bg-white/5 px-6 py-4">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your thinking… (Enter to send)"
                rows={2}
                disabled={isLoading}
                className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 resize-none disabled:opacity-50 transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-5 py-2 bg-amber-600/80 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-sm font-semibold transition-all self-end"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-white/20 mt-2">
              The tutor will never give you the answer directly — work through it step by step.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
