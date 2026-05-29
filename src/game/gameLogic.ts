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
import {
  assignUniqueZodiacIndices,
  zodiacAvatar,
} from '../constants/zodiacAvatars';
import type { Card, GameState, I18nText, PileState, Player } from './types';

const BOT_NAMES = ['Bot North', 'Bot East', 'Bot West'];

function err(key: string, params?: Record<string, string | number>): I18nText {
  return { key, params };
}

/** Seat order clockwise: You (bottom) → Bot West (left) → Bot North (top) → Bot East (right) */
export const CLOCKWISE_PLAYER_ORDER = [0, 3, 1, 2] as const;

export { BOT_NAMES };

export function profileIconForPlayer(player: Pick<Player, 'avatarIndex'>): string {
  return zodiacAvatar(player.avatarIndex);
}

export function createInitialPlayers(
  humanName: string,
  humanAvatarIndex?: number,
): Player[] {
  const trimmed = humanName.trim() || 'Player';
  const avatarIndices = assignUniqueZodiacIndices(4, [
    humanAvatarIndex,
    undefined,
    undefined,
    undefined,
  ]);

  return [
    {
      id: 0,
      name: trimmed,
      isHuman: true,
      hand: [],
      avatarIndex: avatarIndices[0]!,
    },
    ...BOT_NAMES.map((name, i) => ({
      id: i + 1,
      name,
      isHuman: false,
      hand: [] as Card[],
      avatarIndex: avatarIndices[i + 1]!,
    })),
  ];
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

/** Empty-table preview shown behind the join-name prompt. */
export function createLobbyPreviewState(): GameState {
  return {
    players: createInitialPlayers(''),
    activePlayerIndex: 0,
    consecutivePasses: 0,
    gamePhase: 'DEALING',
    pile: null,
    isOpeningTurn: true,
    freeLeadPlayerIndex: null,
    lastTrickWinnerIndex: null,
    winnerId: null,
    scores: null,
    errorMessage: null,
    actionLog: [],
    turnStartedAt: null,
  };
}

export function dealNewGame(
  humanName: string,
  humanAvatarIndex?: number,
): GameState {
  const deck = shuffle(createDeck());
  const players = createInitialPlayers(humanName, humanAvatarIndex).map((p, i) => ({
    ...p,
    hand: sortHand(deck.slice(i * 13, (i + 1) * 13)),
  }));

  return buildDealtState(players);
}

/** Deal a friends table with humans and optional computer seats. */
export function dealFriendTableGame(
  roster: { name: string; isHuman: boolean; avatarIndex?: number }[],
): GameState {
  const entries = roster.slice(0, 4);
  while (entries.length < 4) {
    entries.push({ name: `Player ${entries.length + 1}`, isHuman: false });
  }

  const deck = shuffle(createDeck());
  const avatarIndices = assignUniqueZodiacIndices(
    4,
    entries.map((entry) => entry.avatarIndex),
  );
  const players: Player[] = entries.map((entry, id) => ({
    id,
    name: entry.name.trim() || 'Player',
    isHuman: entry.isHuman,
    hand: sortHand(deck.slice(id * 13, (id + 1) * 13)),
    avatarIndex: avatarIndices[id]!,
  }));

  return buildDealtState(players);
}

/** @deprecated Use dealFriendTableGame */
export function dealFriendsGame(playerNames: string[]): GameState {
  return dealFriendTableGame(
    playerNames.map((name) => ({ name, isHuman: true })),
  );
}

function buildDealtState(players: Player[]): GameState {
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
        i18n: formatDealMessage(players[opener]!.name),
        timestamp: Date.now(),
      },
    ],
    turnStartedAt: null,
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

function nextPlayerIndex(current: number, count = CLOCKWISE_PLAYER_ORDER.length): number {
  const idx = CLOCKWISE_PLAYER_ORDER.indexOf(
    current as (typeof CLOCKWISE_PLAYER_ORDER)[number],
  );
  if (idx === -1) return (current + 1) % count;
  return CLOCKWISE_PLAYER_ORDER[(idx + 1) % CLOCKWISE_PLAYER_ORDER.length]!;
}

export function isHumanTurn(state: GameState): boolean {
  return state.gamePhase === 'PLAYING' && state.activePlayerIndex === 0;
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

function playValidationError(state: GameState): I18nText {
  if (state.isOpeningTurn) {
    return err('errors.openingPlayInvalid');
  }
  if (isFreeLeadTurn(state)) {
    return err('errors.freeLeadPlay');
  }
  return err('errors.invalidBeat');
}

function removeCardsFromHand(hand: Card[], played: Card[]): Card[] {
  const ids = new Set(played.map((c) => c.id));
  return hand.filter((c) => !ids.has(c.id));
}

function stampTurnStart(state: GameState): GameState {
  if (state.gamePhase !== 'PLAYING') {
    return { ...state, turnStartedAt: null };
  }
  return { ...state, turnStartedAt: Date.now() };
}

export function enterPlayingPhase(state: GameState): GameState {
  return stampTurnStart({ ...state, gamePhase: 'PLAYING' });
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
    return stampTurnStart({
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
    });
  }

  return stampTurnStart({
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
  });
}

function applyPass(state: GameState): GameState {
  const passes = state.consecutivePasses + 1;
  const winner = state.pile?.playedByIndex ?? state.lastTrickWinnerIndex;

  if (passes >= 3) {
    const leadIndex = winner ?? state.activePlayerIndex;
    const leadName = state.players[leadIndex]?.name ?? 'Player';
    return stampTurnStart({
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
    });
  }

  const passerName = state.players[state.activePlayerIndex]?.name ?? 'Player';
  return stampTurnStart({
    ...state,
    consecutivePasses: passes,
    activePlayerIndex: nextPlayerIndex(state.activePlayerIndex),
    actionLog: appendLog(state.actionLog, formatPassMessage(passerName)),
    errorMessage: null,
  });
}

export function humanPlayCardIds(
  state: GameState,
  cardIds: Iterable<string>,
): GameState {
  if (state.gamePhase !== 'PLAYING') {
    return { ...state, errorMessage: err('errors.handNotStarted') };
  }
  if (state.activePlayerIndex !== 0) {
    return {
      ...state,
      errorMessage: err('errors.wrongTurn', {
        name:
          state.players[state.activePlayerIndex]?.name ?? '__another__',
      }),
    };
  }

  const idList = [...cardIds];
  if (idList.length === 0) {
    return { ...state, errorMessage: err('errors.selectCard') };
  }

  const hand = state.players[0]!.hand;
  const cards = resolveCardsFromIds(hand, idList);
  if (!cards || cards.length !== idList.length) {
    return {
      ...state,
      errorMessage: err('errors.cardsNotInHand'),
    };
  }

  const combo = classifyCombination(cards);
  if (!combo) {
    return {
      ...state,
      errorMessage: err('errors.invalidCombo'),
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
        errorMessage: err('errors.openingNeed3D'),
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
  if (state.gamePhase !== 'PLAYING') {
    return { ...state, errorMessage: err('errors.handNotStarted') };
  }
  if (state.activePlayerIndex !== 0) {
    return {
      ...state,
      errorMessage: err('errors.wrongTurn', {
        name:
          state.players[state.activePlayerIndex]?.name ?? '__another__',
      }),
    };
  }
  if (state.isOpeningTurn && state.pile === null) {
    return {
      ...state,
      errorMessage: err('errors.mustPlayOpening'),
    };
  }
  if (isFreeLeadTurn(state)) {
    return {
      ...state,
      errorMessage: err('errors.freeLeadMustPlay'),
    };
  }
  return applyPass(state);
}

/** Auto-pass or auto-play when a turn runs out of time. */
export function applyTurnTimeout(state: GameState): GameState {
  if (state.gamePhase !== 'PLAYING') return state;

  const idx = state.activePlayerIndex;
  const player = state.players[idx]!;
  const freeLead = isFreeLeadTurn(state);
  const canPass =
    !freeLead &&
    !(state.isOpeningTurn && state.pile === null) &&
    state.pile !== null;

  if (canPass) {
    return applyPass(state);
  }

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

  return state;
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
