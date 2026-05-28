import { useState } from 'react';
import type { Card } from '../game/types';
import { HandCardSlot, type ReorderDropHint } from './HandCardSlot';
import { HandEndDropZone } from './HandEndDropZone';
import type { CardSize } from './PlayingCard';

export interface TrayCardRowProps {
  cards: Card[];
  cardSize: CardSize;
  scale: number;
  contentRef: React.RefObject<HTMLDivElement | null>;
  enableReorder: boolean;
  reorderScope?: 'hand' | 'reserve';
  selectedIds?: Set<string>;
  draggable?: boolean;
  onCardClick?: (cardId: string) => void;
  onCardDragStart: (cardId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onCardDragEnd?: () => void;
  onReorder: (
    draggedId: string,
    targetId: string | null,
    insertBefore: boolean,
  ) => void;
  /** Return true if the drop was handled (e.g. card moving in from hand). */
  onInterceptReorderDrop?: (
    draggedId: string,
    targetId: string,
    insertBefore: boolean,
  ) => boolean;
  onInterceptEndDrop?: (draggedId: string) => boolean;
  canShowReorderHint?: () => boolean;
}

export function TrayCardRow({
  cards,
  cardSize,
  scale,
  contentRef,
  enableReorder,
  reorderScope = 'hand',
  selectedIds,
  draggable = true,
  onCardClick,
  onCardDragStart,
  onCardDragEnd,
  onReorder,
  onInterceptReorderDrop,
  onInterceptEndDrop,
  canShowReorderHint = () => true,
}: TrayCardRowProps) {
  const [dropHint, setDropHint] = useState<ReorderDropHint | null>(null);
  const [endZoneActive, setEndZoneActive] = useState(false);

  const clearReorderUi = () => {
    setDropHint(null);
    setEndZoneActive(false);
  };

  const showHints = () => enableReorder && canShowReorderHint();

  const handleCardDragEnd = () => {
    clearReorderUi();
    window.setTimeout(() => onCardDragEnd?.(), 0);
  };

  const cardSlots = cards.map((card, i) => (
    <HandCardSlot
      key={card.id}
      card={card}
      index={i}
      cardSize={cardSize}
      selected={Boolean(selectedIds?.has(card.id))}
      draggable={draggable}
      enableReorder={enableReorder}
      reorderScope={reorderScope}
      dropHint={showHints() ? dropHint : null}
      onCardClick={onCardClick ? () => onCardClick(card.id) : undefined}
      onDragStart={(e) => onCardDragStart(card.id, e)}
      onDragEnd={handleCardDragEnd}
      onReorderHover={
        enableReorder
          ? (targetId, insertBefore) => {
              if (!canShowReorderHint()) return;
              setEndZoneActive(false);
              setDropHint({ cardId: targetId, insertBefore });
            }
          : undefined
      }
      onReorderLeave={enableReorder ? () => setDropHint(null) : undefined}
      onReorderDrop={(draggedId, targetId, insertBefore) => {
        if (onInterceptReorderDrop?.(draggedId, targetId, insertBefore)) {
          clearReorderUi();
          return;
        }
        clearReorderUi();
        onReorder(draggedId, targetId, insertBefore);
      }}
    />
  ));

  const endDropZone =
    enableReorder ? (
      <HandEndDropZone
        active={endZoneActive}
        onHover={() => {
          if (!canShowReorderHint()) return;
          setDropHint(null);
          setEndZoneActive(true);
        }}
        onLeave={() => setEndZoneActive(false)}
        onDrop={(draggedId) => {
          if (onInterceptEndDrop?.(draggedId)) {
            clearReorderUi();
            return;
          }
          clearReorderUi();
          onReorder(draggedId, null, false);
        }}
      />
    ) : null;

  const scaledRow = (
    <div
      ref={contentRef}
      className={[
        'hand-cards-row inline-flex items-center justify-center overflow-visible',
        reorderScope === 'hand' ? 'px-5 sm:px-6' : 'flex',
      ].join(' ')}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      {cardSlots}
      {reorderScope !== 'hand' ? endDropZone : null}
    </div>
  );

  if (reorderScope === 'hand') {
    return (
      <div className="hand-cards-row-host relative flex w-full min-w-0 items-center justify-center overflow-visible">
        {scaledRow}
        {enableReorder ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-0.5">
            <div className="pointer-events-auto">{endDropZone}</div>
          </div>
        ) : null}
      </div>
    );
  }

  return scaledRow;
}
