import { useState } from 'react';
import { TRAY_CARD_OVERLAP } from '../constants/cardTray';
import { resolveReorderDraggedId } from '../constants/drag';
import { isReorderDrag } from '../constants/dragSession';
import type { Card } from '../game/types';
import type { CardSize } from './PlayingCard';
import { PlayingCard } from './PlayingCard';

export interface ReorderDropHint {
  cardId: string;
  insertBefore: boolean;
}

interface HandCardSlotProps {
  card: Card;
  index: number;
  selected: boolean;
  draggable: boolean;
  dropHint: ReorderDropHint | null;
  onCardClick?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: () => void;
  onReorderHover?: (targetId: string, insertBefore: boolean) => void;
  onReorderLeave?: () => void;
  onReorderDrop: (draggedId: string, targetId: string, insertBefore: boolean) => void;
  cardSize?: CardSize;
}

export function HandCardSlot({
  card,
  index,
  selected,
  draggable,
  dropHint,
  onCardClick,
  onDragStart,
  onDragEnd,
  onReorderHover,
  onReorderLeave,
  onReorderDrop,
  cardSize = 'hand',
}: HandCardSlotProps) {
  const [isOver, setIsOver] = useState(false);
  const showBefore = dropHint?.cardId === card.id && dropHint.insertBefore;
  const showAfter = dropHint?.cardId === card.id && !dropHint.insertBefore;

  return (
    <div
      className={`group/card relative overflow-visible hover:z-[100] ${TRAY_CARD_OVERLAP}`}
      style={{ zIndex: selected ? 100 + index : index }}
      onDragEnter={() => setIsOver(true)}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsOver(false);
          onReorderLeave?.();
        }
      }}
      onDragOver={(e) => {
        if (!isReorderDrag()) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const insertBefore = e.clientX < rect.left + rect.width / 2;
        onReorderHover?.(card.id, insertBefore);
      }}
      onDrop={(e) => {
        if (!isReorderDrag()) return;
        const draggedId = resolveReorderDraggedId(e.dataTransfer);
        if (!draggedId || draggedId === card.id) return;
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);
        const rect = e.currentTarget.getBoundingClientRect();
        const insertBefore = e.clientX < rect.left + rect.width / 2;
        onReorderDrop(draggedId, card.id, insertBefore);
      }}
    >
      {showBefore && (
        <div
          className="pointer-events-none absolute -left-1 top-2 bottom-2 z-50 w-1 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(212,175,55,0.8)]"
          aria-hidden
        />
      )}
      {showAfter && (
        <div
          className="pointer-events-none absolute -right-1 top-2 bottom-2 z-50 w-1 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(212,175,55,0.8)]"
          aria-hidden
        />
      )}
      <PlayingCard
        card={card}
        size={cardSize}
        selected={selected}
        draggable={draggable}
        onClick={onCardClick}
        onDragStart={onDragStart}
        onDragEnd={() => {
          setIsOver(false);
          onDragEnd?.();
        }}
      />
      {isOver && (
        <div className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-emerald-600/40" />
      )}
    </div>
  );
}
