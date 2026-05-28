import {
  classifyCombination,
  compareCards,
  createDeck,
  isThreeOfDiamonds,
  shuffle,
  validateAndComparePlay,
} from './cards';
import { findBotPlay } from './ai';
import {
  appendLog,
  formatDealMessage,
  formatPassMessage,
  formatPlayMessage,
  formatTrickWonMessage,
  formatWinMessage,
} from './gameLog';
import { calculateScores } from './scoring';
import type { Card, GameState, PileState, Player } from './types';

const PLAYER_NAMES = ['You', 'Bot North', 'Bot East', 'Bot West'];

export function createInitialPlayers(): Player[] {
  return PLAYER_NAMES.map((name, id) => ({
    id,
    name,
    isHuman: id === 0,
    hand: [],
  }));
}

function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => compareCards(a, b));
}

function findOpeningPlayerIndex(players: Player[]): number {
  for (const p of players) {
    if (p.hand.some(isThreeOfDiamonds)) return p.id;
  }
  return 0;
}

export function dealNewGame(): GameState {
  const deck = shuffle(createDeck());
  const players = createInitialPlayers().map((p, i) => ({
    ...p,
    hand: sortHand(deck.slice(i * 13, (i + 1) * 13)),
  }));

  const opener = findOpeningPlayerIndex(players);

  return {
    players,
    activePlayerIndex: opener,
    consecutivePasses: 0,
    gamePhase: 'DEALING',
    pile: null,
    isOpeningTurn: true,
    freeLeadPlayerIndex: null,
    lastTrickWinnerIndex: null,
    winnerId: null,
    scores: null,
    errorMessage: null,
    actionLog: [
      {
        id: 'deal-open',
        text: formatDealMessage(players[opener]!.name),
        timestamp: Date.now(),
      },
    ],
  };
}

/** Resolve cards in the order given by ids (important for reserve slots). */
export function resolveCardsFromIds(
  hand: Card[],
  cardIds: Iterable<string>,
): Card[] | null {
  const byId = new Map(hand.map((c) => [c.id, c]));
  const cards: Card[] = [];
  for (const id of cardIds) {
    const card = byId.get(id);
    if (!card) return null;
    cards.push(card);
  }
  return cards.length > 0 ? cards : null;
}

function nextPlayerIndex(current: number, count = 4): number {
  return (current + 1) % count;
}

/** Combination that must be beaten; null when leading a new trick or opening. */
export function pileToBeat(state: GameState): PileState | null {
  if (isFreeLeadTurn(state) || state.pile === null) return null;
  return state.pile;
}

/** True when the active player may lead any valid combo (after three passes). */
export function isFreeLeadTurn(state: GameState): boolean {
  return (
    state.freeLeadPlayerIndex !== null &&
    state.activePlayerIndex === state.freeLeadPlayerIndex
  );
}

function playValidationError(state: GameState): string {
  if (state.isOpeningTurn) {
    return 'Opening play must include the 3♦ and be a valid combination.';
  }
  if (isFreeLeadTurn(state)) {
    return 'Play any valid combination — single, pair, triple, or five-card hand.';
  }
  return 'Invalid play — match the pile type and beat it.';
}

function removeCardsFromHand(hand: Card[], played: Card[]): Card[] {
  const ids = new Set(played.map((c) => c.id));
  return hand.filter((c) => !ids.has(c.id));
}

function applyPlay(
  state: GameState,
  playerIndex: number,
  cards: Card[],
): GameState {
  const players = state.players.map((p, i) =>
    i === playerIndex
      ? { ...p, hand: removeCardsFromHand(p.hand, cards) }
      : p,
  );

  const combination = classifyCombination(cards)!;
  const player = players[playerIndex]!;
  const playerName = state.players[playerIndex]!.name;
  const playLog = appendLog(
    state.actionLog,
    formatPlayMessage(playerName, combination),
  );

  if (player.hand.length === 0) {
    return {
      ...state,
      players,
      gamePhase: 'GAMEOVER',
      winnerId: playerIndex,
      scores: calculateScores(players, playerIndex),
      pile: {
        combination,
        playedByIndex: playerIndex,
      },
      freeLeadPlayerIndex: null,
      actionLog: appendLog(playLog, formatWinMessage(playerName)),
      errorMessage: null,
    };
  }

  return {
    ...state,
    players,
    pile: { combination, playedByIndex: playerIndex },
    activePlayerIndex: nextPlayerIndex(playerIndex),
    consecutivePasses: 0,
    isOpeningTurn: false,
    freeLeadPlayerIndex: null,
    lastTrickWinnerIndex: playerIndex,
    actionLog: playLog,
    errorMessage: null,
  };
}

function applyPass(state: GameState): GameState {
  const passes = state.consecutivePasses + 1;
  const winner = state.pile?.playedByIndex ?? state.lastTrickWinnerIndex;

  if (passes >= 3) {
    const leadIndex = winner ?? state.activePlayerIndex;
    const leadName = state.players[leadIndex]?.name ?? 'Player';
    return {
      ...state,
      consecutivePasses: 0,
      activePlayerIndex: leadIndex,
      isOpeningTurn: false,
      freeLeadPlayerIndex: leadIndex,
      lastTrickWinnerIndex: leadIndex,
      actionLog: appendLog(
        state.actionLog,
        formatTrickWonMessage(leadName),
      ),
      errorMessage: null,
    };
  }

  const passerName = state.players[state.activePlayerIndex]?.name ?? 'Player';
  return {
    ...state,
    consecutivePasses: passes,
    activePlayerIndex: nextPlayerIndex(state.activePlayerIndex),
    actionLog: appendLog(state.actionLog, formatPassMessage(passerName)),
    errorMessage: null,
  };
}

export function humanPlayCardIds(
  state: GameState,
  cardIds: Iterable<string>,
): GameState {
  if (state.gamePhase !== 'PLAYING') {
    return { ...state, errorMessage: 'The hand has not started yet.' };
  }
  if (state.activePlayerIndex !== 0) {
    return {
      ...state,
      errorMessage: `It's ${state.players[state.activePlayerIndex]?.name ?? 'another player'}'s turn.`,
    };
  }

  const idList = [...cardIds];
  if (idList.length === 0) {
    return { ...state, errorMessage: 'Select at least one card.' };
  }

  const hand = state.players[0]!.hand;
  const cards = resolveCardsFromIds(hand, idList);
  if (!cards || cards.length !== idList.length) {
    return {
      ...state,
      errorMessage:
        'Those cards are not in your hand. Use Play combo on a reserve slot if they are stashed there.',
    };
  }

  const combo = classifyCombination(cards);
  if (!combo) {
    return {
      ...state,
      errorMessage:
        'Not a valid combination. Use a single, pair, triple, or five-card hand.',
    };
  }

  const freeLead = isFreeLeadTurn(state);

  if (freeLead) {
    return applyPlay(state, 0, cards);
  }

  if (state.isOpeningTurn && state.pile === null) {
    if (!cards.some(isThreeOfDiamonds)) {
      return {
        ...state,
        errorMessage: 'Opening play must include the 3♦.',
      };
    }
    return applyPlay(state, 0, cards);
  }

  const pile = pileToBeat(state);
  if (!pile) {
    return applyPlay(state, 0, cards);
  }

  if (!validateAndComparePlay(cards, pile, false, false)) {
    return { ...state, errorMessage: playValidationError(state) };
  }

  return applyPlay(state, 0, cards);
}

export function humanPlaySelected(
  state: GameState,
  selectedIds: Set<string>,
): GameState {
  return humanPlayCardIds(state, selectedIds);
}

export function humanPass(state: GameState): GameState {
  if (state.gamePhase !== 'PLAYING' || state.activePlayerIndex !== 0) {
    return state;
  }
  if (state.isOpeningTurn && state.pile === null) {
    return {
      ...state,
      errorMessage: 'You must play on the opening turn (include 3♦).',
    };
  }
  if (isFreeLeadTurn(state)) {
    return {
      ...state,
      errorMessage:
        'You won the trick — play any valid combination (no need to beat the cards shown).',
    };
  }
  return applyPass(state);
}

export function botTakeTurn(state: GameState): GameState {
  if (state.gamePhase !== 'PLAYING') return state;

  const idx = state.activePlayerIndex;
  const player = state.players[idx]!;
  if (player.isHuman) return state;

  const freeLead = isFreeLeadTurn(state);
  const play = findBotPlay(
    player.hand,
    pileToBeat(state),
    state.isOpeningTurn,
    freeLead,
  );

  if (play) {
    return applyPlay(state, idx, play);
  }

  if (freeLead || (state.pile === null && state.isOpeningTurn)) {
    const fallback = [...player.hand].sort((a, b) => compareCards(a, b))[0];
    if (fallback) return applyPlay(state, idx, [fallback]);
  }

  return applyPass(state);
}

export function clearError(state: GameState): GameState {
  return { ...state, errorMessage: null };
}
