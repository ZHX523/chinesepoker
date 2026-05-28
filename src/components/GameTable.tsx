import { useCallback, useMemo, useRef, useState } from 'react';
import {
  getCardDragData,
  setCardDragData,
  setCardDragPreview,
  setReorderDragData,
} from '../constants/drag';
import {
  clearDragSession,
  getReservePlayIds,
  getReserveSlotIndex,
  isHandDrag,
  isReserveDrag,
  startHandDrag,
} from '../constants/dragSession';
import type { GameState } from '../game/types';
import { orderHand } from '../utils/handOrder';
import { countReservedCards, getReservedIdSet } from '../utils/reserve';
import { isFreeLeadTurn } from '../game/gameLogic';
import { ComboReserve } from './ComboReserve';
import { PlayerSeat } from './PlayerSeat';
import { TableFelt } from './TableFelt';

interface GameTableProps {
  state: GameState;
  handOrder: string[];
  selectedIds: Set<string>;
  onCardClick: (cardId: string) => void;
  onPlayCards: (cardIds: Set<string>) => void;
  onReorderHand: (
    draggedId: string,
    targetId: string | null,
    insertBefore: boolean,
  ) => void;
  reservedCombos: (string[] | null)[];
  onAddToReserveSlot: (slotIndex: number, cardIds: string[]) => void;
  onReorderReserveSlot: (
    slotIndex: number,
    draggedId: string,
    targetId: string | null,
    insertBefore: boolean,
  ) => void;
  onReturnReserveToHand: (cardIds: string[]) => void;
  errorMessage: string | null;
}

export function GameTable({
  state,
  handOrder,
  selectedIds,
  onCardClick,
  onPlayCards,
  onReorderHand,
  reservedCombos,
  onAddToReserveSlot,
  onReorderReserveSlot,
  onReturnReserveToHand,
  errorMessage,
}: GameTableProps) {
  const { players, activePlayerIndex, pile, isOpeningTurn } = state;
  const humanTurn =
    state.gamePhase === 'PLAYING' && activePlayerIndex === 0;
  const isFreeLead = isFreeLeadTurn(state);
  const human = players[0]!;
  const humanHandKey = human.hand.map((c) => c.id).join('|');
  const reservedIdSet = useMemo(
    () => getReservedIdSet(reservedCombos),
    [reservedCombos],
  );
  const humanDisplay = useMemo(() => {
    const inHand = human.hand.filter((c) => !reservedIdSet.has(c.id));
    const order = handOrder.filter((id) => !reservedIdSet.has(id));
    return { ...human, hand: orderHand(inHand, order) };
  }, [human, handOrder, humanHandKey, reservedIdSet]);

  const humanReserveCount = useMemo(
    () => countReservedCards(reservedCombos),
    [reservedCombos],
  );
  const humanHandCount = human.hand.length - humanReserveCount;

  const seatCounts = useMemo(
    () =>
      players.map((p, i) => {
        if (i === 0) {
          return { hand: humanHandCount, reserve: humanReserveCount };
        }
        return { hand: p.hand.length, reserve: 0 };
      }),
    [players, humanHandCount, humanReserveCount],
  );

  const [isDragOver, setIsDragOver] = useState(false);
  const [isHandDropTarget, setIsHandDropTarget] = useState(false);
  const dragOverDepth = useRef(0);
  const handDropDepth = useRef(0);

  const handleCardDragStart = useCallback(
    (cardId: string, event: React.DragEvent<HTMLButtonElement>) => {
      const fromSelection = selectedIds.has(cardId)
        ? [...selectedIds].filter((id) => !reservedIdSet.has(id))
        : [cardId];
      const ids = fromSelection.length > 0 ? fromSelection : [cardId];

      startHandDrag(ids, cardId);
      setCardDragData(event.dataTransfer, ids);
      setReorderDragData(event.dataTransfer, cardId);
      setCardDragPreview(
        event.dataTransfer,
        event.currentTarget,
        event.clientX,
        event.clientY,
      );
    },
    [selectedIds, reservedIdSet],
  );

  const handleHandStripDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      handDropDepth.current = 0;
      setIsHandDropTarget(false);

      if (!isReserveDrag()) return;

      const slotIdx = getReserveSlotIndex();
      let ids = getCardDragData(event.dataTransfer);
      if (slotIdx !== null && reservedCombos[slotIdx]?.length) {
        ids = reservedCombos[slotIdx]!;
      }
      if (ids && ids.length > 0) {
        onReturnReserveToHand(ids);
      }
      clearDragSession();
    },
    [onReturnReserveToHand, reservedCombos],
  );

  const handleHandStripDragEnter = useCallback(() => {
    if (!isReserveDrag()) return;
    handDropDepth.current += 1;
    setIsHandDropTarget(true);
  }, []);

  const handleHandStripDragLeave = useCallback(() => {
    handDropDepth.current -= 1;
    if (handDropDepth.current <= 0) {
      handDropDepth.current = 0;
      setIsHandDropTarget(false);
    }
  }, []);

  const handleHandStripDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!isReserveDrag()) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    },
    [],
  );

  const handleCardDragEnd = useCallback(() => {
    window.setTimeout(() => clearDragSession(), 0);
  }, []);

  const handleReserveDragEnd = useCallback(() => {
    clearDragSession();
  }, []);

  const handleReorder = useCallback(
    (draggedId: string, targetId: string | null, insertBefore: boolean) => {
      onReorderHand(draggedId, targetId, insertBefore);
      clearDragSession();
    },
    [onReorderHand],
  );

  const handlePileDragEnter = useCallback(() => {
    dragOverDepth.current += 1;
    setIsDragOver(true);
  }, []);

  const handlePileDragLeave = useCallback(() => {
    dragOverDepth.current -= 1;
    if (dragOverDepth.current <= 0) {
      dragOverDepth.current = 0;
      setIsDragOver(false);
    }
  }, []);

  const handlePileDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!humanTurn) return;
      if (!isHandDrag() && !isReserveDrag()) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    },
    [humanTurn],
  );

  const handlePileDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragOverDepth.current = 0;
      setIsDragOver(false);

      let ids = getCardDragData(event.dataTransfer);
      if (isReserveDrag()) {
        const combo = getReservePlayIds();
        if (combo?.length) ids = combo;
      }
      if (ids && ids.length > 0) {
        onPlayCards(new Set(ids));
      }
      clearDragSession();
    },
    [onPlayCards],
  );

  const showStatus =
    (humanTurn && isFreeLead) ||
    (humanTurn && errorMessage) ||
    state.gamePhase === 'DEALING' ||
    (!humanTurn && state.gamePhase === 'PLAYING');

  const statusOverlay = showStatus ? (
    <div className="pointer-events-none absolute inset-x-0 bottom-[18%] z-30 flex justify-center px-3">
      <div className="pointer-events-auto max-w-md space-y-1 text-center">
        {humanTurn && isFreeLead && (
          <p className="rounded-md border border-amber-500/50 bg-[#1a0f0c]/92 px-3 py-1.5 text-xs font-medium text-amber-100 backdrop-blur-sm">
            Free lead — play any valid combo from hand or hold slots.
          </p>
        )}
        {humanTurn && errorMessage && (
          <p
            className="animate-pulse rounded-md border border-rose-500/50 bg-rose-950/92 px-3 py-1.5 text-xs font-medium text-rose-100 backdrop-blur-sm"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
        {state.gamePhase === 'DEALING' && (
          <p className="rounded-md bg-[#1a0f0c]/92 px-3 py-1.5 text-xs text-emerald-100 backdrop-blur-sm">
            Dealing cards…
          </p>
        )}
        {!humanTurn && state.gamePhase === 'PLAYING' && (
          <p className="rounded-md bg-[#1a0f0c]/92 px-3 py-1.5 text-xs text-amber-100/90 backdrop-blur-sm">
            {players[activePlayerIndex]?.name} is thinking…
          </p>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-visible">
      {/* Tier 1 — table felt ~60% */}
      <section className="table-felt-tier relative z-10 flex min-h-0 flex-[6] flex-col overflow-visible px-2 pt-2">
        <TableFelt
          players={players}
          activePlayerIndex={activePlayerIndex}
          pile={pile}
          isOpeningTurn={isOpeningTurn}
          isFreeLead={isFreeLead}
          humanTurn={humanTurn}
          isDragOver={isDragOver}
          seatCounts={seatCounts}
          statusOverlay={statusOverlay}
          onPileDragEnter={handlePileDragEnter}
          onPileDragLeave={handlePileDragLeave}
          onPileDragOver={handlePileDragOver}
          onPileDrop={handlePileDrop}
        />
      </section>

      {/* Tier 2 — hand tray ~20% */}
      <section className="hand-tier relative z-20 flex min-h-0 flex-[2] flex-col overflow-visible px-2 py-1">
        <div
          className={[
            'tray-mahogany flex h-full min-h-0 flex-col overflow-visible p-1.5',
            isHandDropTarget ? 'ring-2 ring-amber-400/50' : '',
          ].join(' ')}
          onDragEnter={handleHandStripDragEnter}
          onDragLeave={handleHandStripDragLeave}
          onDragOver={handleHandStripDragOver}
          onDrop={handleHandStripDrop}
        >
          <p className="shrink-0 px-2 pb-1.5 text-center font-serif text-base font-bold tracking-wide text-amber-100 sm:text-lg">
            Your Hand
          </p>
          <div className="hand-tray-cards flex min-h-0 flex-1 flex-col overflow-visible bg-transparent">
            <PlayerSeat
              player={humanDisplay}
              allowHandReorder
              selectedIds={selectedIds}
              reservedCombos={reservedCombos}
              onCardClick={onCardClick}
              onCardDragStart={handleCardDragStart}
              onCardDragEnd={handleCardDragEnd}
              onReorder={handleReorder}
              onReturnReserveToHand={onReturnReserveToHand}
            />
          </div>
        </div>
      </section>

      {/* Tier 3 — combo staging dock ~20% */}
      <section className="flex min-h-0 flex-[2] flex-col overflow-hidden px-2 pb-2">
        <ComboReserve
          slots={reservedCombos}
          hand={human.hand}
          onAddToSlot={onAddToReserveSlot}
          onReorderSlot={onReorderReserveSlot}
          onReserveDragEnd={handleReserveDragEnd}
        />
      </section>
    </div>
  );
}
