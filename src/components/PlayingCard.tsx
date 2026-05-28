import { useRef } from 'react';
import {
  TRAY_CARD_CENTER,
  TRAY_CARD_CORNER,
  TRAY_CARD_SIZE_CLASS,
} from '../constants/cardTray';
import type { Card, Suit } from '../game/types';

const SUIT_SYMBOL: Record<Suit, string> = {
  diamonds: '♦',
  clubs: '♣',
  hearts: '♥',
  spades: '♠',
};

const SUIT_COLOR: Record<Suit, string> = {
  diamonds: 'text-rose-700',
  clubs: 'text-slate-900',
  hearts: 'text-rose-700',
  spades: 'text-slate-900',
};

export type CardSize = 'sm' | 'md' | 'lg' | 'hand' | 'reserve';

const SIZE_CLASSES: Record<CardSize, string> = {
  sm: 'h-14 w-10 text-xs',
  md: 'h-24 w-[4.25rem] text-base sm:h-28 sm:w-[4.75rem] sm:text-lg',
  lg: 'h-28 w-[4.75rem] text-lg sm:h-32 sm:w-[5.25rem] sm:text-xl',
  hand: TRAY_CARD_SIZE_CLASS,
  reserve: TRAY_CARD_SIZE_CLASS,
};

interface PlayingCardProps {
  card: Card;
  selected?: boolean;
  faceDown?: boolean;
  small?: boolean;
  size?: CardSize;
  draggable?: boolean;
  onClick?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLButtonElement>) => void;
}

export function PlayingCard({
  card,
  selected = false,
  faceDown = false,
  small = false,
  size,
  draggable = false,
  onClick,
  onDragStart,
  onDragEnd,
}: PlayingCardProps) {
  const didDragRef = useRef(false);
  const resolvedSize: CardSize = size ?? (small ? 'sm' : 'md');
  const sizeClass = SIZE_CLASSES[resolvedSize];
  const cornerScale =
    resolvedSize === 'lg'
      ? 'text-base sm:text-lg'
      : resolvedSize === 'hand' || resolvedSize === 'reserve'
        ? TRAY_CARD_CORNER
        : 'text-sm';
  const centerScale =
    resolvedSize === 'lg'
      ? 'text-3xl sm:text-4xl'
      : resolvedSize === 'sm'
        ? 'text-lg'
        : resolvedSize === 'hand' || resolvedSize === 'reserve'
          ? TRAY_CARD_CENTER
          : 'text-2xl sm:text-3xl';

  if (faceDown) {
    return (
      <div
        className={`${sizeClass} shrink-0 rounded-md border-2 border-[#3d2418] bg-gradient-to-br from-[#0c4a34] to-[#062f22] shadow-md`}
        aria-hidden
      />
    );
  }

  const handleClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    onClick?.();
  };

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    didDragRef.current = true;
    onDragStart?.(event);
  };

  const handleDragEnd = (event: React.DragEvent<HTMLButtonElement>) => {
    onDragEnd?.(event);
    window.setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

  const liftClass = selected
    ? 'relative z-[100] -translate-y-4 border-amber-500 ring-2 ring-amber-400/70'
    : onClick
      ? 'relative hover:z-[100] hover:-translate-y-4 hover:shadow-xl'
      : '';

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      onDragEnd={draggable ? handleDragEnd : undefined}
      onClick={onClick ? handleClick : undefined}
      tabIndex={onClick ? 0 : -1}
      className={[
        sizeClass,
        'card-traditional relative shrink-0 rounded-md border border-[#c9a227]/30 font-semibold text-slate-900',
        'outline-none transition-transform duration-200 ease-out [webkit-tap-highlight-color:transparent] select-none',
        liftClass,
        draggable ? 'cursor-grab active:cursor-grabbing' : '',
        onClick ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400/60' : 'cursor-default',
      ].join(' ')}
      aria-pressed={onClick ? selected : undefined}
      aria-label={`${card.rank} of ${card.suit}`}
    >
      <span
        className={`absolute left-1 top-0.5 font-mono leading-none ${SUIT_COLOR[card.suit]}`}
      >
        {card.rank}
        <span className={`block ${cornerScale}`}>{SUIT_SYMBOL[card.suit]}</span>
      </span>
      <span
        className={`absolute bottom-1 right-1 rotate-180 font-mono leading-none ${SUIT_COLOR[card.suit]}`}
      >
        {card.rank}
        <span className={`block ${cornerScale}`}>{SUIT_SYMBOL[card.suit]}</span>
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center opacity-90 ${centerScale} ${SUIT_COLOR[card.suit]}`}
      >
        {SUIT_SYMBOL[card.suit]}
      </span>
      <span
        className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 font-serif text-[0.45em] text-[#c9a227]/35"
        aria-hidden
      >
        福
      </span>
    </button>
  );
}
