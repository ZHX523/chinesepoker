import { useLayoutEffect, useRef, useState } from 'react';
import { computeTrayCardScale } from '../constants/cardTray';
import type { Player } from '../game/types';
import { HandCardSlot, type ReorderDropHint } from './HandCardSlot';
import { HandEndDropZone } from './HandEndDropZone';

interface PlayerSeatProps {
  player: Player;
  allowHandReorder?: boolean;
  selectedIds?: Set<string>;
  onCardClick?: (cardId: string) => void;
  onCardDragStart?: (cardId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onCardDragEnd?: () => void;
  onReorder?: (
    draggedId: string,
    targetId: string | null,
    insertBefore: boolean,
  ) => void;
}

export function PlayerSeat({
  player,
  allowHandReorder = false,
  selectedIds,
  onCardClick,
  onCardDragStart,
  onCardDragEnd,
  onReorder,
}: PlayerSeatProps) {
  const canPlayInteract = Boolean(onCardClick || onCardDragStart);
  const canDrag = allowHandReorder || canPlayInteract;

  const [dropHint, setDropHint] = useState<ReorderDropHint | null>(null);
  const [endZoneActive, setEndZoneActive] = useState(false);
  const [handScale, setHandScale] = useState(1);
  const handViewportRef = useRef<HTMLDivElement | null>(null);
  const handContentRef = useRef<HTMLDivElement | null>(null);

  const clearReorderUi = () => {
    setDropHint(null);
    setEndZoneActive(false);
  };

  useLayoutEffect(() => {
    const viewport = handViewportRef.current;
    const content = handContentRef.current;
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
        setHandScale(1);
        return;
      }
      setHandScale(
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
  }, [player.hand.length, allowHandReorder]);

  return (
    <div
      ref={handViewportRef}
      className="hand-cards-viewport flex h-full min-h-0 w-full items-center justify-center overflow-visible px-1 py-2"
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          clearReorderUi();
        }
      }}
    >
      <div
        ref={handContentRef}
        className="hand-cards-row flex items-center justify-center overflow-visible"
        style={{
          transform: `scale(${handScale})`,
          transformOrigin: 'center center',
        }}
      >
        {player.hand.map((card, i) => (
          <HandCardSlot
            key={card.id}
            card={card}
            index={i}
            selected={Boolean(selectedIds?.has(card.id))}
            draggable={canDrag}
            dropHint={allowHandReorder ? dropHint : null}
            onCardClick={
              onCardClick ? () => onCardClick(card.id) : undefined
            }
            onDragStart={
              onCardDragStart
                ? (e) => onCardDragStart(card.id, e)
                : undefined
            }
            onDragEnd={() => {
              clearReorderUi();
              onCardDragEnd?.();
            }}
            onReorderHover={
              allowHandReorder
                ? (targetId, insertBefore) => {
                    setEndZoneActive(false);
                    setDropHint({ cardId: targetId, insertBefore });
                  }
                : undefined
            }
            onReorderLeave={
              allowHandReorder ? () => setDropHint(null) : undefined
            }
            onReorderDrop={(draggedId, targetId, insertBefore) => {
              clearReorderUi();
              onReorder?.(draggedId, targetId, insertBefore);
            }}
          />
        ))}
        {allowHandReorder && onReorder && (
          <HandEndDropZone
            active={endZoneActive}
            onHover={() => {
              setDropHint(null);
              setEndZoneActive(true);
            }}
            onLeave={() => setEndZoneActive(false)}
            onDrop={(draggedId) => {
              clearReorderUi();
              onReorder(draggedId, null, false);
            }}
          />
        )}
      </div>
    </div>
  );
}
