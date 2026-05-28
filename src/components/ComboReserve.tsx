import { useCallback, useRef, useState } from 'react';
import type { Card } from '../game/types';
import { RESERVE_SLOT_COUNT, resolveSlotCards } from '../utils/reserve';
import { ReserveSlot } from './ReserveSlot';

interface ComboReserveProps {
  slots: (string[] | null)[];
  hand: Card[];
  onAddToSlot: (slotIndex: number, cardIds: string[]) => void;
  onReorderSlot: (
    slotIndex: number,
    draggedId: string,
    targetId: string | null,
    insertBefore: boolean,
  ) => void;
  onReserveDragEnd?: () => void;
}

const SLOT_LABELS = ['HOLD COMBO A', 'HOLD COMBO B'] as const;

export function ComboReserve({
  slots,
  hand,
  onAddToSlot,
  onReorderSlot,
  onReserveDragEnd,
}: ComboReserveProps) {
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const dragOverDepth = useRef(0);

  const handleSlotDragEnter = (index: number) => {
    dragOverDepth.current += 1;
    setDragOverSlot(index);
  };

  const handleSlotDragLeave = () => {
    dragOverDepth.current -= 1;
    if (dragOverDepth.current <= 0) {
      dragOverDepth.current = 0;
      setDragOverSlot(null);
    }
  };

  const handleAddToSlot = useCallback(
    (slotIndex: number, cardIds: string[]) => {
      onAddToSlot(slotIndex, cardIds);
    },
    [onAddToSlot],
  );

  const handleReorderSlot = useCallback(
    (
      slotIndex: number,
      draggedId: string,
      targetId: string | null,
      insertBefore: boolean,
    ) => {
      onReorderSlot(slotIndex, draggedId, targetId, insertBefore);
    },
    [onReorderSlot],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-hidden">
        {Array.from({ length: RESERVE_SLOT_COUNT }, (_, index) => {
          const cardIds = slots[index];
          const cards = cardIds ? resolveSlotCards(hand, cardIds) : [];
          const slotComplete = cardIds ? cards.length === cardIds.length : true;

          return (
            <ReserveSlot
              key={index}
              label={SLOT_LABELS[index] ?? `Hold Combo ${index + 1}`}
              slotIndex={index}
              cardIds={cardIds}
              cards={cards}
              slotComplete={slotComplete}
              isDragOver={dragOverSlot === index}
              onDragEnter={() => handleSlotDragEnter(index)}
              onDragLeave={handleSlotDragLeave}
              onAddCards={(ids) => handleAddToSlot(index, ids)}
              onReorder={(draggedId, targetId, insertBefore) =>
                handleReorderSlot(index, draggedId, targetId, insertBefore)
              }
              onDragEnd={onReserveDragEnd}
            />
          );
        })}
      </div>
    </div>
  );
}
