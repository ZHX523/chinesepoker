import { CLOCKWISE_PLAYER_ORDER } from './gameLogic';
import type { GameState, Player } from './types';

/** View indices placed clockwise on screen: bottom → left → top → right. */
export const VIEW_SLOTS_CLOCKWISE = [0, 3, 1, 2] as const;

/** Canonical player ids in turn order starting at `seat` (you first). */
export function clockwiseChainFromSeat(seat: number, count = 4): number[] {
  const order = CLOCKWISE_PLAYER_ORDER as readonly number[];
  const start = order.indexOf(seat);
  if (start === -1) {
    return Array.from({ length: count }, (_, i) => (seat + i) % count);
  }
  return Array.from({ length: count }, (_, step) => order[(start + step) % count]!);
}

function buildCanonicalToViewMap(
  seat: number,
  count: number,
): (canonicalIndex: number) => number {
  const chain = clockwiseChainFromSeat(seat, count);
  const map = new Array<number>(count).fill(0);
  for (let step = 0; step < count; step++) {
    const viewIdx = VIEW_SLOTS_CLOCKWISE[step % VIEW_SLOTS_CLOCKWISE.length]!;
    map[chain[step]!] = viewIdx;
  }
  return (canonicalIndex) => map[canonicalIndex] ?? canonicalIndex;
}

function buildViewToCanonicalMap(
  seat: number,
  count: number,
): (viewIndex: number) => number {
  const chain = clockwiseChainFromSeat(seat, count);
  const map = new Array<number>(count).fill(0);
  for (let step = 0; step < count; step++) {
    const viewIdx = VIEW_SLOTS_CLOCKWISE[step % VIEW_SLOTS_CLOCKWISE.length]!;
    map[viewIdx] = chain[step]!;
  }
  return (viewIndex) => map[viewIndex] ?? viewIndex;
}

function remapPlayersForView(
  players: Player[],
  seat: number,
): Player[] {
  const count = players.length;
  const chain = clockwiseChainFromSeat(seat, count);
  const remapped: Player[] = new Array(count);
  for (let step = 0; step < count; step++) {
    const viewIdx = VIEW_SLOTS_CLOCKWISE[step % VIEW_SLOTS_CLOCKWISE.length]!;
    remapped[viewIdx] = players[chain[step]!]!;
  }
  return remapped;
}

function remapPlayersToCanonical(
  players: Player[],
  seat: number,
): Player[] {
  const count = players.length;
  const chain = clockwiseChainFromSeat(seat, count);
  const remapped: Player[] = new Array(count);
  for (let step = 0; step < count; step++) {
    const viewIdx = VIEW_SLOTS_CLOCKWISE[step % VIEW_SLOTS_CLOCKWISE.length]!;
    remapped[chain[step]!] = players[viewIdx]!;
  }
  return remapped;
}

function remapGameIndices(
  state: GameState,
  map: (index: number) => number,
): Pick<
  GameState,
  | 'activePlayerIndex'
  | 'pile'
  | 'freeLeadPlayerIndex'
  | 'lastTrickWinnerIndex'
  | 'winnerId'
  | 'scores'
> {
  return {
    activePlayerIndex: map(state.activePlayerIndex),
    pile: state.pile
      ? { ...state.pile, playedByIndex: map(state.pile.playedByIndex) }
      : null,
    freeLeadPlayerIndex:
      state.freeLeadPlayerIndex != null
        ? map(state.freeLeadPlayerIndex)
        : null,
    lastTrickWinnerIndex:
      state.lastTrickWinnerIndex != null
        ? map(state.lastTrickWinnerIndex)
        : null,
    winnerId: state.winnerId != null ? map(state.winnerId) : null,
    scores:
      state.scores?.map((row) => ({
        ...row,
        playerId: map(row.playerId),
      })) ?? null,
  };
}

/** Rotate so you are bottom center; opponents follow clockwise turn order around the table. */
export function rotateStateForSeat(state: GameState, seat: number): GameState {
  const count = state.players.length;
  if (seat === 0 && count === 4) {
    const chain = clockwiseChainFromSeat(0, count);
    const matchesDefault = VIEW_SLOTS_CLOCKWISE.every(
      (viewIdx, step) => chain[step] === viewIdx,
    );
    if (matchesDefault) return state;
  }

  const map = buildCanonicalToViewMap(seat, count);
  return {
    ...state,
    ...remapGameIndices(state, map),
    players: remapPlayersForView(state.players, seat),
  };
}

/** Convert a locally rotated view back to canonical table order. */
export function unrotateStateFromSeat(view: GameState, seat: number): GameState {
  const count = view.players.length;
  if (seat === 0 && count === 4) {
    const chain = clockwiseChainFromSeat(0, count);
    const matchesDefault = VIEW_SLOTS_CLOCKWISE.every(
      (viewIdx, step) => chain[step] === viewIdx,
    );
    if (matchesDefault) return view;
  }

  const map = buildViewToCanonicalMap(seat, count);
  return {
    ...view,
    ...remapGameIndices(view, map),
    players: remapPlayersToCanonical(view.players, seat),
  };
}

/** Rotate per-seat flags (e.g. disconnect) to match the local view layout. */
export function rotateSeatFlagsForSeat(flags: boolean[], seat: number): boolean[] {
  const count = flags.length;
  const chain = clockwiseChainFromSeat(seat, count);
  const remapped = new Array<boolean>(count).fill(false);
  for (let step = 0; step < count; step++) {
    const viewIdx = VIEW_SLOTS_CLOCKWISE[step % VIEW_SLOTS_CLOCKWISE.length]!;
    remapped[viewIdx] = flags[chain[step]!] ?? false;
  }
  return remapped;
}
