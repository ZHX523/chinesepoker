import { useLayoutEffect, useRef, useState } from 'react';
import {
  HAND_MAX_SCALE,
  computeTrayCardScale,
  handTargetFill,
} from '../constants/cardTray';
import { clearDragSession, getReserveSlotIndex, isReserveDrag } from '../constants/dragSession';
import type { Player } from '../game/types';
import { TrayCardRow } from './TrayCardRow';

interface PlayerSeatProps {
  player: Player;
  allowHandReorder?: boolean;
  selectedIds?: Set<string>;
  reservedCombos?: (string[] | null)[];
  onCardClick?: (cardId: string) => void;
  onCardDragStart?: (cardId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onCardDragEnd?: () => void;
  onReorder?: (
    draggedId: string,
    targetId: string | null,
    insertBefore: boolean,
  ) => void;
  onReturnReserveToHand?: (cardIds: string[]) => void;
}

export function PlayerSeat({
  player,
  allowHandReorder = false,
  selectedIds,
  reservedCombos = [],
  onCardClick,
  onCardDragStart,
  onCardDragEnd,
  onReorder,
  onReturnReserveToHand,
}: PlayerSeatProps) {
  const canPlayInteract = Boolean(onCardClick || onCardDragStart);
  const canDrag = allowHandReorder || canPlayInteract;

  const [handScale, setHandScale] = useState(1);
  const handViewportRef = useRef<HTMLDivElement | null>(null);
  const handContentRef = useRef<HTMLDivElement | null>(null);
  const peakHandCountRef = useRef(0);

  const visibleCount = player.hand.length;
  const handSignature = player.hand.map((c) => c.id).join('|');

  const returnReserveDragToHand = (draggedId: string): boolean => {
    if (!isReserveDrag() || !onReturnReserveToHand) return false;
    const slotIdx = getReserveSlotIndex();
    const slotIds =
      slotIdx !== null && reservedCombos[slotIdx]?.length
        ? reservedCombos[slotIdx]!
        : [draggedId];
    onReturnReserveToHand(slotIds);
    clearDragSession();
    return true;
  };

  useLayoutEffect(() => {
    peakHandCountRef.current = Math.max(peakHandCountRef.current, visibleCount);

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

      const fill = handTargetFill(visibleCount, peakHandCountRef.current);
      setHandScale(
        computeTrayCardScale(
          availableWidth,
          availableHeight,
          requiredWidth,
          requiredHeight,
          fill,
          HAND_MAX_SCALE,
        ),
      );
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(viewport);
    observer.observe(content);
    return () => observer.disconnect();
  }, [visibleCount, handSignature, allowHandReorder]);

  return (
    <div
      ref={handViewportRef}
      className="hand-container hand-cards-viewport flex h-full min-h-0 w-full items-center justify-center overflow-visible px-1 py-2"
      onDragOver={(e) => {
        if (!isReserveDrag()) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
    >
      <TrayCardRow
        cards={player.hand}
        cardSize="hand"
        scale={handScale}
        contentRef={handContentRef}
        enableReorder={allowHandReorder}
        reorderScope="hand"
        selectedIds={selectedIds}
        draggable={canDrag}
        onCardClick={onCardClick}
        onCardDragStart={(cardId, e) => onCardDragStart?.(cardId, e)}
        onCardDragEnd={onCardDragEnd}
        onReorder={(draggedId, targetId, insertBefore) =>
          onReorder?.(draggedId, targetId, insertBefore)
        }
        onInterceptReorderDrop={(draggedId) => returnReserveDragToHand(draggedId)}
        onInterceptEndDrop={(draggedId) => returnReserveDragToHand(draggedId)}
        canShowReorderHint={() => !isReserveDrag()}
      />
    </div>
  );
}
