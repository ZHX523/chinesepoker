import type { Player, ScoreEntry } from './types';

export function penaltyForCardCount(count: number): number {
  if (count <= 0) return 0;
  return count;
}

export function calculateScores(
  players: Player[],
  winnerId: number,
): ScoreEntry[] {
  return players.map((p) => {
    const cardsLeft = p.id === winnerId ? 0 : p.hand.length;
    return {
      playerId: p.id,
      name: p.name,
      cardsLeft,
      penalty: penaltyForCardCount(cardsLeft),
    };
  });
}
