import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { computeTrayCardScale } from '../constants/cardTray';
import {
  getCardDragData,
  resolveReorderDraggedId,
  setCardDragData,
  setCardDragPreview,
  setReorderDragData,
} from '../constants/drag';
import {
  clearDragSession,
  getReserveSlotIndex,
  isHandDrag,
  isReorderDrag,
  isReserveDrag,
  startReserveDrag,
} from '../constants/dragSession';
import { describeReserveCombo } from '../game/cards';
import type { Card } from '../game/types';
import { MAX_CARDS_PER_SLOT } from '../utils/reserve';
import { HandCardSlot, type ReorderDropHint } from './HandCardSlot';
import { HandEndDropZone } from './HandEndDropZone';

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
  onReorder: (
    draggedId: string,
    targetId: string | null,
    insertBefore: boolean,
  ) => void;
  onDragEnd?: () => void;
}

export function ReserveSlot({
  label,
  slotIndex,
  cardIds,
  cards,
  isDragOver,
  slotComplete = true,
  onDragEnter,
  onDragLeave,
  onAddCards,
  onReorder,
  onDragEnd,
}: ReserveSlotProps) {
  const info =
    cards.length > 0 && slotComplete ? describeReserveCombo(cards) : null;
  const playable = (info?.playable ?? false) && slotComplete;
  const hasRoom = cards.length < MAX_CARDS_PER_SLOT;
  const [cardsScale, setCardsScale] = useState(1);
  const [dropHint, setDropHint] = useState<ReorderDropHint | null>(null);
  const [endZoneActive, setEndZoneActive] = useState(false);
  const cardsViewportRef = useRef<HTMLDivElement | null>(null);
  const cardsContentRef = useRef<HTMLDivElement | null>(null);

  const clearReorderUi = () => {
    setDropHint(null);
    setEndZoneActive(false);
  };

  const handleSlotDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleSlotDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (isReorderDrag()) {
        const draggedId = resolveReorderDraggedId(event.dataTransfer);
        if (draggedId) {
          if (isHandDrag()) {
            onAddCards([draggedId]);
          } else if (getReserveSlotIndex() === slotIndex) {
            onReorder(draggedId, null, false);
          } else {
            onAddCards([draggedId]);
          }
        }
        clearDragSession();
        clearReorderUi();
        return;
      }

      const ids = getCardDragData(event.dataTransfer);
      if (ids && ids.length > 0) {
        onAddCards(ids);
      }
      clearDragSession();
      clearReorderUi();
    },
    [onAddCards, onReorder, slotIndex],
  );

  const beginReserveDrag = (
    cardId: string,
    event: React.DragEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    const playComboIds =
      playable && cardIds && cardIds.length > 1 ? cardIds : null;
    startReserveDrag([cardId], slotIndex, { playComboIds });
    setCardDragData(event.dataTransfer, [cardId]);
    setReorderDragData(event.dataTransfer, cardId);
    const comboRow = cardsContentRef.current;
    const showFullCombo = Boolean(playComboIds && comboRow);
    setCardDragPreview(
      event.dataTransfer,
      event.currentTarget,
      event.clientX,
      event.clientY,
      showFullCombo && comboRow ? { container: comboRow } : undefined,
    );
  };

  const handleCardDragEnd = () => {
    clearReorderUi();
    onDragEnd?.();
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
      setCardsScale(
        computeTrayCardScale(
          availableWidth,
          availableHeight,
          requiredWidth,
          requiredHeight,
        ),
      );
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
        <p className="mb-1 shrink-0 truncate text-center font-serif text-sm font-semibold text-amber-200/90 sm:text-base">
          {info.label}
        </p>
      )}

      <div
        ref={cardsViewportRef}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-1"
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            clearReorderUi();
          }
        }}
      >
        {cards.length === 0 ? (
          <p className="text-center text-[10px] text-emerald-200/35">
            Stage cards here
          </p>
        ) : (
          <div
            ref={cardsContentRef}
            className="flex items-center justify-center"
            style={{
              transform: `scale(${cardsScale})`,
              transformOrigin: 'center center',
            }}
          >
            {cards.map((card, i) => (
              <HandCardSlot
                key={card.id}
                card={card}
                index={i}
                cardSize="reserve"
                selected={false}
                draggable
                dropHint={dropHint}
                onDragStart={(e) => beginReserveDrag(card.id, e)}
                onDragEnd={handleCardDragEnd}
                onReorderHover={(targetId, insertBefore) => {
                  if (isHandDrag()) return;
                  if (getReserveSlotIndex() !== slotIndex) return;
                  setEndZoneActive(false);
                  setDropHint({ cardId: targetId, insertBefore });
                }}
                onReorderLeave={() => setDropHint(null)}
                onReorderDrop={(draggedId, targetId, insertBefore) => {
                  if (isHandDrag()) {
                    clearReorderUi();
                    onAddCards([draggedId]);
                    clearDragSession();
                    return;
                  }
                  if (getReserveSlotIndex() !== slotIndex) {
                    if (isReserveDrag()) {
                      clearReorderUi();
                      onAddCards([draggedId]);
                      clearDragSession();
                    }
                    return;
                  }
                  clearReorderUi();
                  onReorder(draggedId, targetId, insertBefore);
                }}
              />
            ))}
            {cards.length > 0 && (
              <HandEndDropZone
                active={endZoneActive}
                onHover={() => {
                  setDropHint(null);
                  setEndZoneActive(true);
                }}
                onLeave={() => setEndZoneActive(false)}
                onDrop={(draggedId) => {
                  if (getReserveSlotIndex() !== slotIndex) return;
                  clearReorderUi();
                  onReorder(draggedId, null, false);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
