import {
  cardStrength,
  classifyCombination,
  fiveCardTypeRank,
  validateAndComparePlay,
} from './cards';
import type { Card, PileState } from './types';

function playMetric(cards: Card[]): number {
  const combo = classifyCombination(cards);
  if (!combo) return Infinity;
  const fiveBonus =
    combo.cards.length === 5 ? fiveCardTypeRank(combo.type) * 1_000_000 : 0;
  return fiveBonus + cardStrength(combo.highCard);
}

function* combinationsOfSize<T>(arr: T[], size: number): Generator<T[]> {
  if (size === 0) {
    yield [];
    return;
  }
  if (arr.length < size) return;
  const [first, ...rest] = arr;
  for (const combo of combinationsOfSize(rest, size - 1)) {
    yield [first!, ...combo];
  }
  yield* combinationsOfSize(rest, size);
}

function groupByRank(hand: Card[]): Map<string, Card[]> {
  const map = new Map<string, Card[]>();
  for (const card of hand) {
    const group = map.get(card.rank) ?? [];
    group.push(card);
    map.set(card.rank, group);
  }
  return map;
}

/** Candidate plays to validate — rank groups for pairs/triples, brute force for 5-card. */
function* enumerateCandidates(hand: Card[], size: number): Generator<Card[]> {
  if (size === 1) {
    for (const card of hand) yield [card];
    return;
  }

  if (size === 2 || size === 3) {
    const minRankCount = size;
    for (const group of groupByRank(hand).values()) {
      if (group.length < minRankCount) continue;
      yield* combinationsOfSize(group, size);
    }
    return;
  }

  if (size === 5) {
    yield* combinationsOfSize(hand, 5);
  }
}

function enumeratePlaySizes(pile: PileState | null): number[] {
  return pile ? [pile.combination.cards.length] : [1, 2, 3, 5];
}

function collectValidPlays(
  hand: Card[],
  pile: PileState | null,
  isOpeningTurn: boolean,
  isFreeLead: boolean,
): Card[][] {
  const valid: Card[][] = [];
  for (const size of enumeratePlaySizes(pile)) {
    for (const combo of enumerateCandidates(hand, size)) {
      if (!classifyCombination(combo)) continue;
      if (!validateAndComparePlay(combo, pile, isOpeningTurn, isFreeLead))
        continue;
      valid.push(combo);
    }
  }
  return valid;
}

function pickLowestMetric(plays: Card[][]): Card[] | null {
  if (plays.length === 0) return null;
  let best = plays[0]!;
  let bestMetric = playMetric(best);
  for (let i = 1; i < plays.length; i++) {
    const play = plays[i]!;
    const metric = playMetric(play);
    if (metric < bestMetric) {
      bestMetric = metric;
      best = play;
    }
  }
  return best;
}

/**
 * Chooses a legal bot play. When beating the pile, plays the weakest valid
 * combo of the required size. When leading (empty pile, not opening), prefers
 * multi-card combos so bots dump pairs, triples, and five-card hands.
 */
export function findBotPlay(
  hand: Card[],
  pile: PileState | null,
  isOpeningTurn: boolean,
  isFreeLead = false,
): Card[] | null {
  const valid = collectValidPlays(hand, pile, isOpeningTurn, isFreeLead);
  if (valid.length === 0) return null;

  if (!isFreeLead && (pile !== null || isOpeningTurn)) {
    return pickLowestMetric(valid);
  }

  const multiCard = valid.filter((play) => play.length > 1);
  if (multiCard.length > 0) {
    return pickLowestMetric(multiCard);
  }

  return pickLowestMetric(valid);
}

/** @deprecated Use findBotPlay — kept for tests or external callers */
export function findLowestValidPlay(
  hand: Card[],
  pile: PileState | null,
  isOpeningTurn: boolean,
): Card[] | null {
  return findBotPlay(hand, pile, isOpeningTurn);
}
