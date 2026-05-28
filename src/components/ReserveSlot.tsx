import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { describeReserveCombo } from '../game/cards';
import {
  getCardDragData,
  setCardDragData,
  setCardDragPreview,
} from '../constants/drag';
import { clearDragSession, startReserveDrag } from '../constants/dragSession';
import type { Card } from '../game/types';
import { MAX_CARDS_PER_SLOT } from '../utils/reserve';
import { PlayingCard } from './PlayingCard';

interface ReserveSlotProps {
  label: string;
  slotIndex: number;
  cardIds: string[] | null;
  cards: Card[];
  isDragOver: boolean;
  slotComplete?: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onAddCards: (cardIds: string[]) => void;
  onDragEnd?: () => void;
}

export function ReserveSlot({
  label,
  slotIndex: _slotIndex,
  cardIds,
  cards,
  isDragOver,
  slotComplete = true,
  onDragEnter,
  onDragLeave,
  onAddCards,
  onDragEnd,
}: ReserveSlotProps) {
  const info =
    cards.length > 0 && slotComplete ? describeReserveCombo(cards) : null;
  const playable = (info?.playable ?? false) && slotComplete;
  const hasRoom = cards.length < MAX_CARDS_PER_SLOT;
  const [cardsScale, setCardsScale] = useState(1);
  const cardsViewportRef = useRef<HTMLDivElement | null>(null);
  const cardsContentRef = useRef<HTMLDivElement | null>(null);

  const handleSlotDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleSlotDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const ids = getCardDragData(event.dataTransfer);
      if (ids && ids.length > 0) {
        onAddCards(ids);
      }
      clearDragSession();
    },
    [onAddCards],
  );

  const beginReserveDrag = (
    ids: string[],
    event: React.DragEvent<HTMLElement>,
  ) => {
    event.stopPropagation();
    startReserveDrag(ids);
    setCardDragData(event.dataTransfer, ids);
    setCardDragPreview(
      event.dataTransfer,
      event.currentTarget,
      event.clientX,
      event.clientY,
    );
  };

  const handleCardDragEnd = () => {
    onDragEnd?.();
  };

  const dragIdsForCard = (cardId: string): string[] => {
    if (playable && cardIds?.length) return cardIds;
    return [cardId];
  };

  useLayoutEffect(() => {
    const viewport = cardsViewportRef.current;
    const content = cardsContentRef.current;
    if (!viewport || !content) return;

    const recompute = () => {
      const availableWidth = viewport.clientWidth;
      const availableHeight = viewport.clientHeight;
      const requiredWidth = content.scrollWidth;
      const requiredHeight = content.scrollHeight;
      if (
        availableWidth <= 0 ||
        availableHeight <= 0 ||
        requiredWidth <= 0 ||
        requiredHeight <= 0
      ) {
        setCardsScale(1);
        return;
      }
      const widthRatio = availableWidth / requiredWidth;
      const heightRatio = availableHeight / requiredHeight;
      setCardsScale(Math.min(1, widthRatio, heightRatio));
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(viewport);
    observer.observe(content);
    return () => observer.disconnect();
  }, [cards.length, playable]);

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={handleSlotDragOver}
      onDrop={handleSlotDrop}
      className={[
        'combo-slot-dock flex h-full min-h-0 flex-col overflow-hidden p-1.5 transition-all duration-150',
        isDragOver && hasRoom
          ? 'border-emerald-400/70 bg-emerald-900/25 ring-1 ring-emerald-400/40'
          : '',
        playable ? 'border-emerald-500/40' : '',
      ].join(' ')}
    >
      <div className="mb-1 flex shrink-0 items-center justify-between gap-1">
        <span className="truncate font-serif text-[10px] font-bold uppercase tracking-wider text-emerald-100/90 sm:text-xs">
          {label}
        </span>
        <span className="shrink-0 font-mono text-[9px] text-emerald-200/60">
          {cards.length}/{MAX_CARDS_PER_SLOT}
        </span>
      </div>
      {info?.label && (
        <p className="mb-1 shrink-0 truncate text-center text-[9px] font-medium text-amber-200/80">
          {info.label}
          {playable ? ' · drag to pile' : ''}
        </p>
      )}

      <div
        ref={cardsViewportRef}
        className="flex min-h-0 flex-1 items-end justify-center overflow-hidden px-0.5 pb-0.5"
      >
        {cards.length === 0 ? (
          <p className="text-center text-[10px] text-emerald-200/35">
            Stage cards here
          </p>
        ) : (
          <div
            ref={cardsContentRef}
            className="flex items-end justify-center"
            style={{
              transform: `scale(${cardsScale})`,
              transformOrigin: 'center bottom',
            }}
          >
            {cards.map((card, i) => (
              <div
                key={card.id}
                className="-ml-5 first:ml-0 sm:-ml-6"
                style={{ zIndex: i }}
              >
                <PlayingCard
                  card={card}
                  size="reserve"
                  draggable
                  onDragStart={(e) =>
                    beginReserveDrag(dragIdsForCard(card.id), e)
                  }
                  onDragEnd={handleCardDragEnd}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
