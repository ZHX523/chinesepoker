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
import { useTranslation } from '../i18n/LanguageContext';
import type { Card } from '../game/types';
import { MAX_CARDS_PER_SLOT } from '../utils/reserve';
import { TrayCardRow } from './TrayCardRow';

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
  const { t, language } = useTranslation();
  const info =
    cards.length > 0 && slotComplete ? describeReserveCombo(cards, language) : null;
  const playable = (info?.playable ?? false) && slotComplete;
  const hasRoom = cards.length < MAX_CARDS_PER_SLOT;
  const [cardsScale, setCardsScale] = useState(1);
  const cardsViewportRef = useRef<HTMLDivElement | null>(null);
  const cardsContentRef = useRef<HTMLDivElement | null>(null);

  const finishExternalDrop = useCallback(
    (draggedId: string) => {
      onAddCards([draggedId]);
      clearDragSession();
      return true;
    },
    [onAddCards],
  );

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
        return;
      }

      const ids = getCardDragData(event.dataTransfer);
      if (ids && ids.length > 0) {
        onAddCards(ids);
      }
      clearDragSession();
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
    const showFullCombo = cards.length > 1 && comboRow;
    setCardDragPreview(
      event.dataTransfer,
      event.currentTarget,
      event.clientX,
      event.clientY,
      showFullCombo ? { container: comboRow } : undefined,
    );
  };

  const handleCardDragEnd = () => {
    window.setTimeout(() => onDragEnd?.(), 0);
  };

  const interceptReorderDrop = useCallback(
    (draggedId: string, _targetId: string, _insertBefore: boolean) => {
      if (isHandDrag()) {
        return finishExternalDrop(draggedId);
      }
      if (getReserveSlotIndex() !== slotIndex) {
        if (isReserveDrag()) {
          return finishExternalDrop(draggedId);
        }
        return false;
      }
      return false;
    },
    [finishExternalDrop, slotIndex],
  );

  const interceptEndDrop = useCallback(
    (draggedId: string) => {
      if (isHandDrag()) {
        return finishExternalDrop(draggedId);
      }
      if (getReserveSlotIndex() !== slotIndex) {
        if (isReserveDrag()) {
          return finishExternalDrop(draggedId);
        }
        return false;
      }
      return false;
    },
    [finishExternalDrop, slotIndex],
  );

  const canShowReorderHint = () =>
    !isHandDrag() && getReserveSlotIndex() === slotIndex;

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
      <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
        <span className="truncate font-serif text-[0.7875rem] font-bold uppercase tracking-wider text-emerald-100 sm:text-[0.9rem]">
          {label}
        </span>
        <span className="shrink-0 font-serif text-[0.7875rem] font-bold tabular-nums tracking-wider text-emerald-200/75 sm:text-[0.9rem]">
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
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-visible px-1"
      >
        {cards.length === 0 ? (
          <p
            className="px-2 text-center font-serif text-sm font-bold uppercase tracking-wider text-emerald-100/35 sm:text-base"
            aria-hidden
          >
            {t('reserve.emptyHint')}
          </p>
        ) : (
          <TrayCardRow
            cards={cards}
            cardSize="reserve"
            scale={cardsScale}
            contentRef={cardsContentRef}
            enableReorder
            reorderScope="reserve"
            onCardDragStart={beginReserveDrag}
            onCardDragEnd={handleCardDragEnd}
            onReorder={onReorder}
            onInterceptReorderDrop={interceptReorderDrop}
            onInterceptEndDrop={interceptEndDrop}
            canShowReorderHint={canShowReorderHint}
          />
        )}
      </div>
    </div>
  );
}
