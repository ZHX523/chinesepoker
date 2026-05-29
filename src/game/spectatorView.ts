import type { GameState } from './types';

/** Public table view for spectators — hands hidden, counts preserved elsewhere. */
export function toSpectatorViewState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      hand: [],
    })),
    errorMessage: null,
  };
}

export function handCountsFromState(state: GameState): { hand: number; reserve: number }[] {
  return state.players.map((player) => ({
    hand: player.hand.length,
    reserve: 0,
  }));
}
