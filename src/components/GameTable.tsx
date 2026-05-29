import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { GameState, I18nText } from '../game/types';
import { useTranslateI18n, useTranslation } from '../i18n/LanguageContext';
import { orderHand } from '../utils/handOrder';
import { countReservedCards, getReservedIdSet } from '../utils/reserve';
import { isFreeLeadTurn } from '../game/gameLogic';
import { ComboReserve } from './ComboReserve';
import { PassButton } from './PassButton';
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
  errorMessage: I18nText | null;
  turnTimerSeconds: number;
  spectatorMode?: boolean;
  forcedSeatCounts?: { hand: number; reserve: number }[];
  seatDisconnected?: boolean[];
  canEditAvatar?: boolean;
  onAvatarChange?: (index: number) => void;
  onPass?: () => void;
  passDisabled?: boolean;
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
  turnTimerSeconds,
  spectatorMode = false,
  forcedSeatCounts,
  seatDisconnected = [false, false, false, false],
  canEditAvatar = false,
  onAvatarChange,
  onPass,
  passDisabled = true,
}: GameTableProps) {
  const { t, displayPlayerName } = useTranslation();
  const translateI18n = useTranslateI18n();
  const { players, activePlayerIndex, pile, isOpeningTurn } = state;
  const [clockMs, setClockMs] = useState(() => Date.now());

  useEffect(() => {
    if (state.gamePhase !== 'PLAYING' || state.turnStartedAt == null) return;
    const id = window.setInterval(() => setClockMs(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [state.gamePhase, state.turnStartedAt, state.activePlayerIndex]);

  const turnSecondsRemaining = useMemo(() => {
    if (state.gamePhase !== 'PLAYING' || state.turnStartedAt == null) {
      return null;
    }
    const elapsed = (clockMs - state.turnStartedAt) / 1000;
    return Math.max(0, turnTimerSeconds - elapsed);
  }, [
    clockMs,
    state.gamePhase,
    state.turnStartedAt,
    turnTimerSeconds,
  ]);
  const humanTurn =
    !spectatorMode &&
    state.gamePhase === 'PLAYING' &&
    activePlayerIndex === 0;
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

  const seatCounts = useMemo(() => {
    if (forcedSeatCounts) return forcedSeatCounts;
    return players.map((p, i) => {
      if (i === 0) {
        return { hand: humanHandCount, reserve: humanReserveCount };
      }
      return { hand: p.hand.length, reserve: 0 };
    });
  }, [players, humanHandCount, humanReserveCount, forcedSeatCounts]);

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
    if (!humanTurn) return;
    dragOverDepth.current += 1;
    setIsDragOver(true);
  }, [humanTurn]);

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

      if (!humanTurn) return;

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
    [humanTurn, onPlayCards],
  );

  const showStatus =
    (humanTurn && isFreeLead) ||
    (humanTurn && errorMessage) ||
    state.gamePhase === 'DEALING' ||
    (!humanTurn && state.gamePhase === 'PLAYING');

  const statusOverlay = showStatus ? (
    <div className="pointer-events-none absolute inset-x-0 bottom-[12%] z-30 flex justify-center px-2 sm:bottom-[18%] sm:px-3">
      <div className="pointer-events-auto max-w-md space-y-1 text-center">
        {humanTurn && isFreeLead && (
          <p className="rounded-md border border-amber-500/50 bg-[#1a0f0c]/92 px-3 py-1.5 text-xs font-medium text-amber-100 backdrop-blur-sm">
            {t('table.freeLeadHint')}
          </p>
        )}
        {humanTurn && errorMessage && (
          <p
            className="animate-pulse rounded-md border border-rose-500/50 bg-rose-950/92 px-3 py-1.5 text-xs font-medium text-rose-100 backdrop-blur-sm"
            role="alert"
          >
            {translateI18n(errorMessage)}
          </p>
        )}
        {state.gamePhase === 'DEALING' && (
          <p className="rounded-md bg-[#1a0f0c]/92 px-3 py-1.5 text-xs text-emerald-100 backdrop-blur-sm">
            {t('table.dealing')}
          </p>
        )}
        {!humanTurn && state.gamePhase === 'PLAYING' && (
          <p className="rounded-md bg-[#1a0f0c]/92 px-3 py-1.5 text-xs text-amber-100/90 backdrop-blur-sm">
            {t('table.thinking', {
              name: displayPlayerName(players[activePlayerIndex]?.name ?? ''),
            })}
          </p>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="game-board-column flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-visible px-1 lg:px-2">
      {/* Tier 1 — table felt */}
      <section className="table-felt-tier relative z-10 flex min-h-0 flex-[5] flex-col overflow-visible pt-1 lg:flex-[6] lg:pt-2">
        <TableFelt
          players={players}
          activePlayerIndex={activePlayerIndex}
          pile={pile}
          isOpeningTurn={isOpeningTurn}
          isFreeLead={isFreeLead}
          humanTurn={humanTurn}
          isDragOver={isDragOver}
          seatCounts={seatCounts}
          turnSecondsRemaining={turnSecondsRemaining}
          turnTimeLimitSec={turnTimerSeconds}
          seatDisconnected={seatDisconnected}
          canEditAvatar={canEditAvatar}
          onAvatarChange={onAvatarChange}
          statusOverlay={statusOverlay}
          onFeltDragEnter={handlePileDragEnter}
          onFeltDragLeave={handlePileDragLeave}
          onFeltDragOver={handlePileDragOver}
          onFeltDrop={handlePileDrop}
        />
      </section>

      {!spectatorMode && humanTurn && state.gamePhase === 'PLAYING' && onPass && (
        <div className="safe-area-bottom flex shrink-0 items-stretch justify-center gap-2 px-2 py-1.5 md:hidden">
          <button
            type="button"
            disabled={selectedIds.size === 0}
            onClick={() => onPlayCards(selectedIds)}
            className={[
              'min-h-12 flex-1 rounded-xl border px-3 font-serif text-base font-bold tracking-wide transition-colors',
              selectedIds.size > 0
                ? 'border-amber-400/70 bg-gradient-to-b from-[#d4af37] to-[#8b6914] text-[#1a0f0c] active:scale-[0.98]'
                : 'border-[#3d2418] bg-[#1a0f0c]/80 text-amber-100/45',
            ].join(' ')}
          >
            {selectedIds.size > 0
              ? t('table.playSelected', { count: selectedIds.size })
              : t('table.playSelectedHint')}
          </button>
          <PassButton
            disabled={passDisabled}
            onClick={onPass}
            className="h-12 w-12 shrink-0"
          />
        </div>
      )}

      {spectatorMode && (
        <div className="shrink-0 px-3 py-2 text-center">
          <p className="rounded-md border border-sky-500/40 bg-sky-950/80 px-3 py-2 text-sm font-medium text-sky-100">
            {t('table.spectating')}
          </p>
        </div>
      )}

      {/* Tier 2 — hand tray */}
      {!spectatorMode && (
      <section className="hand-tier relative z-20 flex min-h-0 flex-[3] flex-col overflow-visible py-0.5 lg:flex-[2] lg:py-1">
        <div
          className={[
            'hand-tray-rim h-full min-h-0 w-full overflow-visible',
            isHandDropTarget ? 'ring-2 ring-amber-400/50' : '',
          ].join(' ')}
          onDragEnter={handleHandStripDragEnter}
          onDragLeave={handleHandStripDragLeave}
          onDragOver={handleHandStripDragOver}
          onDrop={handleHandStripDrop}
        >
          <span className="corner-ornament corner-tl" aria-hidden />
          <span className="corner-ornament corner-tr" aria-hidden />
          <span className="corner-ornament corner-bl" aria-hidden />
          <span className="corner-ornament corner-br" aria-hidden />
          <div className="hand-tray-well overflow-visible p-1.5">
            <p className="shrink-0 px-2 pb-1 text-center font-serif text-sm font-bold tracking-wide text-amber-100 lg:pb-1.5 lg:text-lg">
              {t('table.yourHand')}
            </p>
            <div className="hand-tray-cards flex min-h-0 flex-1 flex-col overflow-visible bg-transparent">
              <PlayerSeat
                player={humanDisplay}
                allowHandReorder
                playEnabled={humanTurn}
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
        </div>
      </section>
      )}

      {/* Tier 3 — combo staging dock */}
      {!spectatorMode && (
      <section className="flex min-h-0 flex-[2] flex-col overflow-hidden pb-1 lg:pb-2">
        <ComboReserve
          slots={reservedCombos}
          hand={human.hand}
          onAddToSlot={onAddToReserveSlot}
          onReorderSlot={onReorderReserveSlot}
          onReserveDragEnd={handleReserveDragEnd}
        />
      </section>
      )}
    </div>
  );
}
