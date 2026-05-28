import type { Card, Combination, CombinationType, Rank, Suit } from './types';

export const RANKS: Rank[] = [
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
  '2',
];

export const SUITS: Suit[] = ['diamonds', 'clubs', 'hearts', 'spades'];

const RANK_VALUE: Record<Rank, number> = {
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
  '2': 15,
};

const SUIT_VALUE: Record<Suit, number> = {
  diamonds: 0,
  clubs: 1,
  hearts: 2,
  spades: 3,
};

export function rankValue(rank: Rank): number {
  return RANK_VALUE[rank];
}

export function suitValue(suit: Suit): number {
  return SUIT_VALUE[suit];
}

/** Compare two cards: positive if a beats b */
export function compareCards(a: Card, b: Card): number {
  const rankDiff = rankValue(a.rank) - rankValue(b.rank);
  if (rankDiff !== 0) return rankDiff;
  return suitValue(a.suit) - suitValue(b.suit);
}

export function cardStrength(card: Card): number {
  return rankValue(card.rank) * 10 + suitValue(card.suit);
}

export function highestCard(cards: Card[]): Card {
  return [...cards].sort((a, b) => compareCards(b, a))[0]!;
}

export function isThreeOfDiamonds(card: Card): boolean {
  return card.rank === '3' && card.suit === 'diamonds';
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${rank}-${suit}`, rank, suit });
    }
  }
  return deck;
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

const FIVE_CARD_TYPE_ORDER: CombinationType[] = [
  'straight',
  'flush',
  'fullhouse',
  'fourofakind',
  'straightflush',
];

export function fiveCardTypeRank(type: CombinationType): number {
  return FIVE_CARD_TYPE_ORDER.indexOf(type);
}

function sortedByRank(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
}

function isStraight(cards: Card[]): boolean {
  if (cards.length !== 5) return false;
  const ranks = sortedByRank(cards).map((c) => rankValue(c.rank));
  if (ranks.includes(15)) return false; // 2 cannot be in a straight
  const unique = [...new Set(ranks)];
  if (unique.length !== 5) return false;
  for (let i = 1; i < unique.length; i++) {
    if (unique[i]! - unique[i - 1]! !== 1) return false;
  }
  return true;
}

function isFlush(cards: Card[]): boolean {
  if (cards.length !== 5) return false;
  const suit = cards[0]!.suit;
  return cards.every((c) => c.suit === suit);
}

function rankCounts(cards: Card[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const c of cards) {
    const r = rankValue(c.rank);
    counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  return counts;
}

function classifyFiveCardHand(cards: Card[]): Combination | null {
  if (cards.length !== 5) return null;

  const straight = isStraight(cards);
  const flush = isFlush(cards);
  const counts = rankCounts(cards);
  const countValues = [...counts.values()].sort((a, b) => b - a);

  if (straight && flush) {
    const high = highestCard(cards);
    return {
      type: 'straightflush',
      cards,
      strength: cardStrength(high),
      highCard: high,
    };
  }

  if (countValues[0] === 4) {
    const quadRank = [...counts.entries()].find(([, n]) => n === 4)![0];
    return {
      type: 'fourofakind',
      cards,
      strength: quadRank * 100,
      highCard: highestCard(cards.filter((c) => rankValue(c.rank) === quadRank)),
    };
  }

  if (countValues[0] === 3 && countValues[1] === 2) {
    const tripRank = [...counts.entries()].find(([, n]) => n === 3)![0];
    const pairRank = [...counts.entries()].find(([, n]) => n === 2)![0];
    const tripCards = cards.filter((c) => rankValue(c.rank) === tripRank);
    return {
      type: 'fullhouse',
      cards,
      strength: tripRank * 100 + pairRank,
      highCard: highestCard(tripCards),
    };
  }

  if (flush) {
    const high = highestCard(cards);
    return {
      type: 'flush',
      cards,
      strength: cardStrength(high),
      highCard: high,
    };
  }

  if (straight) {
    const high = highestCard(cards);
    return {
      type: 'straight',
      cards,
      strength: cardStrength(high),
      highCard: high,
    };
  }

  return null;
}

export function classifyCombination(cards: Card[]): Combination | null {
  const sorted = [...cards];
  if (sorted.length === 0) return null;

  if (sorted.length === 1) {
    const c = sorted[0]!;
    return {
      type: 'single',
      cards: sorted,
      strength: cardStrength(c),
      highCard: c,
    };
  }

  if (sorted.length === 2) {
    if (sorted[0]!.rank !== sorted[1]!.rank) return null;
    const high = highestCard(sorted);
    return {
      type: 'pair',
      cards: sorted,
      strength: rankValue(high.rank) * 10,
      highCard: high,
    };
  }

  if (sorted.length === 3) {
    if (
      sorted[0]!.rank !== sorted[1]!.rank ||
      sorted[1]!.rank !== sorted[2]!.rank
    )
      return null;
    const high = highestCard(sorted);
    return {
      type: 'triple',
      cards: sorted,
      strength: rankValue(high.rank) * 10,
      highCard: high,
    };
  }

  if (sorted.length === 5) {
    return classifyFiveCardHand(sorted);
  }

  return null;
}

function compareCombinations(
  incoming: Combination,
  current: Combination,
): boolean {
  if (incoming.cards.length !== current.cards.length) return false;

  const inFive = incoming.cards.length === 5;
  const curFive = current.cards.length === 5;

  if (inFive && curFive) {
    const inRank = fiveCardTypeRank(incoming.type);
    const curRank = fiveCardTypeRank(current.type);
    if (inRank < 0 || curRank < 0) return false;
    if (inRank > curRank) return true;
    if (inRank < curRank) return false;
    return compareCards(incoming.highCard, current.highCard) > 0;
  }

  if (incoming.type !== current.type) return false;
  if (incoming.strength > current.strength) return true;
  if (incoming.strength < current.strength) return false;
  return compareCards(incoming.highCard, current.highCard) > 0;
}

/**
 * Validates incoming play against the pile.
 * Returns true if the play is legal and beats the current pile (or opens on empty pile).
 */
export function validateAndComparePlay(
  incomingCards: Card[],
  currentPile: import('./types').PileState | null,
  isOpeningTurn: boolean,
  isFreeLead = false,
): boolean {
  const incoming = classifyCombination(incomingCards);
  if (!incoming) return false;

  if (currentPile === null || isFreeLead) {
    if (isOpeningTurn) {
      const hasThreeDiamonds = incomingCards.some(isThreeOfDiamonds);
      if (!hasThreeDiamonds) return false;
    }
    return true;
  }

  return compareCombinations(incoming, currentPile.combination);
}

export function combinationLabel(type: CombinationType): string {
  const labels: Record<CombinationType, string> = {
    single: 'Single',
    pair: 'Pair',
    triple: 'Triple',
    straight: 'Straight',
    flush: 'Flush',
    fullhouse: 'Full House',
    fourofakind: 'Four of a Kind',
    straightflush: 'Straight Flush',
  };
  return labels[type];
}

export const MAX_RESERVE_CARDS = 5;

export function isBombCombination(type: CombinationType): boolean {
  return type === 'fourofakind' || type === 'straightflush';
}

/** Label for combo reserve slots (any card count 1–5). */
export function describeReserveCombo(cards: Card[]): {
  label: string;
  playable: boolean;
  hint?: string;
} {
  const count = cards.length;
  if (count === 0) return { label: '', playable: false };

  const combo = classifyCombination(cards);
  if (combo) {
    const base = combinationLabel(combo.type);
    const label = isBombCombination(combo.type) ? `Bomb · ${base}` : base;
    return { label, playable: true };
  }

  if (count === 4) {
    const counts = rankCounts(cards);
    const values = [...counts.values()];
    if (values.includes(4)) {
      return {
        label: 'Bomb setup · 4 of a Kind',
        playable: false,
        hint: 'Stash all 5 for a bomb',
      };
    }
    if (values.includes(3)) {
      return {
        label: '4 cards',
        playable: false,
        hint: 'Add kicker for full house',
      };
    }
    return {
      label: '4 cards',
      playable: false,
      hint: 'Not playable as-is',
    };
  }

  if (count === 2) {
    return { label: '2 cards', playable: false, hint: 'Needs a pair' };
  }
  if (count === 3) {
    return { label: '3 cards', playable: false, hint: 'Needs a triple' };
  }

  return {
    label: `${count} card${count === 1 ? '' : 's'}`,
    playable: false,
    hint: 'Not a legal play',
  };
}
