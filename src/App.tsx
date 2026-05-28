import { useCallback, useEffect, useState } from 'react';
import { moveCardInOrder, syncHandOrder } from './utils/handOrder';
import {
  addCardsToSlot,
  createEmptyReserveSlots,
  pruneReserveSlots,
  removeCardsFromReserve,
} from './utils/reserve';
import { RightGameRail } from './components/RightGameRail';
import { GameTable } from './components/GameTable';
import { isFreeLeadTurn } from './game/gameLogic';
import { GameOverModal } from './components/GameOverModal';
import {
  botTakeTurn,
  clearError,
  dealNewGame,
  humanPass,
  humanPlayCardIds,
} from './game/gameLogic';
import type { ChatMessage, GameState } from './game/types';

const BOT_DELAY_MS = 900;

export default function App() {
  const [state, setState] = useState<GameState>(() => dealNewGame());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [handOrder, setHandOrder] = useState<string[]>([]);
  const [reservedCombos, setReservedCombos] = useState<(string[] | null)[]>(
    createEmptyReserveSlots,
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const humanHandKey =
    state.players[0]?.hand.map((c) => c.id).join('|') ?? '';

  useEffect(() => {
    const hand = state.players[0]?.hand ?? [];
    setHandOrder((prev) => syncHandOrder(prev, hand));
  }, [humanHandKey]);

  useEffect(() => {
    const handIds = new Set(
      state.players[0]?.hand.map((c) => c.id) ?? [],
    );
    setReservedCombos((slots) => pruneReserveSlots(slots, handIds));
  }, [humanHandKey]);

  const restart = useCallback(() => {
    setSelectedIds(new Set());
    setHandOrder([]);
    setReservedCombos(createEmptyReserveSlots());
    setChatMessages([]);
    setState(dealNewGame());
  }, []);

  const reorderHand = useCallback(
    (
      draggedId: string,
      targetId: string | null,
      insertBefore: boolean,
    ) => {
      setHandOrder((order) =>
        moveCardInOrder(order, draggedId, targetId, insertBefore),
      );
    },
    [],
  );

  const toggleCard = useCallback((cardId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
    setState((s) => clearError(s));
  }, []);

  const playCards = useCallback((ids: Set<string>) => {
    setState((s) => {
      const next = humanPlayCardIds(s, ids);
      if (!next.errorMessage) {
        setSelectedIds(new Set());
        const played = [...ids];
        setReservedCombos((slots) =>
          slots.map((slot) => {
            if (!slot) return null;
            const remaining = slot.filter((id) => !played.includes(id));
            return remaining.length > 0 ? remaining : null;
          }),
        );
      }
      return next;
    });
  }, []);

  const addToSlot = useCallback((slotIndex: number, cardIds: string[]) => {
    setState((gameState) => {
      const handIds = new Set(
        gameState.players[0]?.hand.map((c) => c.id) ?? [],
      );
      const valid = [...new Set(cardIds)].filter((id) => handIds.has(id));
      if (valid.length > 0) {
        setReservedCombos((slots) => addCardsToSlot(slots, slotIndex, valid));
      }
      return clearError(gameState);
    });
    setSelectedIds(new Set());
  }, []);

  const reorderReserveSlot = useCallback(
    (
      slotIndex: number,
      draggedId: string,
      targetId: string | null,
      insertBefore: boolean,
    ) => {
      setReservedCombos((slots) =>
        slots.map((slot, i) => {
          if (i !== slotIndex || !slot) return slot;
          return moveCardInOrder(slot, draggedId, targetId, insertBefore);
        }),
      );
    },
    [],
  );

  const returnCardsToHand = useCallback((cardIds: string[]) => {
    if (cardIds.length === 0) return;
    setReservedCombos((slots) => removeCardsFromReserve(slots, cardIds));
    setSelectedIds(new Set());
  }, []);

  const handlePass = useCallback(() => {
    setSelectedIds(new Set());
    setState((s) => humanPass(s));
  }, []);

  const handleSendChat = useCallback((text: string) => {
    const human = state.players[0];
    if (!human) return;
    setChatMessages((msgs) => [
      ...msgs,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        senderId: 0,
        senderName: human.name,
        text,
        timestamp: Date.now(),
      },
    ]);
  }, [state.players]);

  useEffect(() => {
    if (state.gamePhase === 'DEALING') {
      const t = window.setTimeout(
        () => setState((s) => ({ ...s, gamePhase: 'PLAYING' })),
        700,
      );
      return () => window.clearTimeout(t);
    }
  }, [state.gamePhase]);

  useEffect(() => {
    if (state.gamePhase !== 'PLAYING') return;
    if (state.players[state.activePlayerIndex]?.isHuman) return;

    const timer = window.setTimeout(() => {
      setState((s) => botTakeTurn(s));
    }, BOT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [
    state.activePlayerIndex,
    state.gamePhase,
    state.pile,
    state.consecutivePasses,
    state.freeLeadPlayerIndex,
    state.isOpeningTurn,
  ]);

  const winnerName =
    state.winnerId != null
      ? state.players[state.winnerId]?.name ?? 'Winner'
      : '';

  const humanTurn =
    state.gamePhase === 'PLAYING' && state.activePlayerIndex === 0;
  const isFreeLead = isFreeLeadTurn(state);
  const canPass =
    humanTurn &&
    !isFreeLead &&
    !(state.isOpeningTurn && state.pile === null) &&
    state.pile !== null;
  const passDisabled =
    state.gamePhase !== 'PLAYING' || !humanTurn || !canPass;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a1210]">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-visible">
        <GameTable
          state={state}
          handOrder={handOrder}
          selectedIds={selectedIds}
          onCardClick={toggleCard}
          onPlayCards={playCards}
          onReorderHand={reorderHand}
          reservedCombos={reservedCombos}
          onAddToReserveSlot={addToSlot}
          onReorderReserveSlot={reorderReserveSlot}
          onReturnReserveToHand={returnCardsToHand}
          errorMessage={state.errorMessage}
        />

        {state.gamePhase === 'GAMEOVER' && state.scores && (
          <GameOverModal
            scores={state.scores}
            winnerName={winnerName}
            onPlayAgain={restart}
          />
        )}
      </div>

      <RightGameRail
        actionLog={state.actionLog}
        chatMessages={chatMessages}
        onSendChat={handleSendChat}
        onPass={handlePass}
        passDisabled={passDisabled}
      />
    </div>
  );
}

