'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FirstPrinciplesBreakdown } from '@/lib/first-principles/types';
import {
  generateFlashCards,
  shuffleCards,
  type FlashCard,
  type FlashCardType,
} from '@/lib/first-principles/flashcards';

interface FlashCardDeckProps {
  breakdown: FirstPrinciplesBreakdown;
}

type FilterType = 'all' | FlashCardType;

const TYPE_COLORS: Record<FlashCardType, string> = {
  principle: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  derivation: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  example: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const TYPE_LABELS: Record<FlashCardType, string> = {
  principle: 'Principle',
  derivation: 'Derivation',
  example: 'Example',
};

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'principle', label: 'Principles' },
  { value: 'derivation', label: 'Derivations' },
  { value: 'example', label: 'Examples' },
];

function CardFace({
  card,
  side,
}: {
  card: FlashCard;
  side: 'front' | 'back';
}) {
  const isFront = side === 'front';
  return (
    <div
      className={`absolute inset-0 rounded-2xl border p-7 flex flex-col [backface-visibility:hidden] ${
        isFront
          ? 'bg-violet-900/20 border-violet-500/20'
          : 'bg-indigo-900/20 border-indigo-500/20 [transform:rotateY(180deg)]'
      }`}
    >
      {/* Top row: type badge + label */}
      <div className="flex items-center justify-between mb-5">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border uppercase tracking-widest ${
            TYPE_COLORS[card.type]
          }`}
        >
          {TYPE_LABELS[card.type]}
        </span>
        {!isFront && (
          <span className="text-xs text-white/30 uppercase tracking-widest">Answer</span>
        )}
      </div>

      {/* Card text */}
      <div className="flex-1 flex items-center justify-center">
        <p
          className={`text-center leading-relaxed whitespace-pre-line ${
            isFront ? 'text-white/90 text-lg font-medium' : 'text-white/80 text-base'
          }`}
        >
          {isFront ? card.front : card.back}
        </p>
      </div>

      {/* Category label at bottom */}
      <p className="text-xs text-white/25 text-center mt-4">{card.category}</p>
    </div>
  );
}

export function FlashCardDeck({ breakdown }: FlashCardDeckProps) {
  const allCards = useMemo(() => generateFlashCards(breakdown), [breakdown]);

  const [filter, setFilter] = useState<FilterType>('all');
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledOrder, setShuffledOrder] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Compute visible cards when filter or shuffle changes
  const visibleCards = useMemo(() => {
    const filtered =
      filter === 'all' ? allCards : allCards.filter((c) => c.type === filter);
    return isShuffled ? shuffledOrder.filter((c) => filter === 'all' || c.type === filter) : filtered;
  }, [allCards, filter, isShuffled, shuffledOrder]);

  // Reset to first card on filter change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [filter]);

  // Reset flip when navigating
  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      setIsFlipped(false);
    },
    []
  );

  const goPrev = useCallback(() => {
    goTo((currentIndex - 1 + visibleCards.length) % visibleCards.length);
  }, [currentIndex, visibleCards.length, goTo]);

  const goNext = useCallback(() => {
    goTo((currentIndex + 1) % visibleCards.length);
  }, [currentIndex, visibleCards.length, goTo]);

  const flip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      if (!prev) {
        setShuffledOrder(shuffleCards(allCards));
      }
      return !prev;
    });
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [allCards]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === ' ') {
        e.preventDefault();
        flip();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goPrev, goNext, flip]);

  const current = visibleCards[currentIndex];
  const progress = visibleCards.length > 0 ? ((currentIndex + 1) / visibleCards.length) * 100 : 0;

  // Count per type for filter chips
  const countByType = useMemo(() => {
    const counts: Record<FlashCardType, number> = { principle: 0, derivation: 0, example: 0 };
    allCards.forEach((c) => counts[c.type]++);
    return counts;
  }, [allCards]);

  if (allCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-white/30 text-sm">
        No flashcards available for this breakdown.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filter chips + shuffle */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_OPTIONS.map(({ value, label }) => {
          const count =
            value === 'all' ? allCards.length : countByType[value as FlashCardType];
          if (count === 0 && value !== 'all') return null;
          const active = filter === value;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150 ${
                active
                  ? 'bg-violet-600/30 border-violet-500/50 text-violet-200'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70 hover:border-white/20'
              }`}
            >
              {label}
              <span className="ml-1.5 opacity-60">{count}</span>
            </button>
          );
        })}

        <button
          onClick={toggleShuffle}
          className={`ml-auto text-xs px-3 py-1.5 rounded-full border transition-all duration-150 ${
            isShuffled
              ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300'
              : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
          }`}
        >
          ⇄ Shuffle
        </button>
      </div>

      {/* Progress bar + counter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-white/30">
          <span>Card {currentIndex + 1} of {visibleCards.length}</span>
          <span className="text-white/20">Space to flip · ← → to navigate</span>
        </div>
        <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500/60 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      {current && (
        <div
          className="relative h-72 cursor-pointer [perspective:1200px]"
          onClick={flip}
          role="button"
          aria-label={isFlipped ? 'Show question' : 'Show answer'}
        >
          <div
            className={`relative w-full h-full [transform-style:preserve-3d] transition-transform duration-500 ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            <CardFace card={current} side="front" />
            <CardFace card={current} side="back" />
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-150"
        >
          ← Prev
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); flip(); }}
          className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium text-white bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/30 hover:border-violet-500/50 rounded-xl transition-all duration-150"
        >
          {isFlipped ? 'Show Question' : 'Show Answer'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-150"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
