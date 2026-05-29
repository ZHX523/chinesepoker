import type { Card, Combination } from './types';
import type { I18nText } from './types';

export function formatCardShort(card: Card): string {
  const SUIT_SYMBOL = {
    diamonds: '♦',
    clubs: '♣',
    hearts: '♥',
    spades: '♠',
  } as const;
  return `${card.rank}${SUIT_SYMBOL[card.suit]}`;
}

export function createLogEntry(i18n: I18nText): {
  id: string;
  i18n: I18nText;
  timestamp: number;
} {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    i18n,
    timestamp: Date.now(),
  };
}

export function formatDealMessage(openerName: string): I18nText {
  return { key: 'log.deal', params: { name: openerName } };
}

export function formatPlayMessage(
  playerName: string,
  combination: Combination,
): I18nText {
  const cards = combination.cards.map(formatCardShort).join(', ');
  return {
    key: 'log.play',
    params: {
      name: playerName,
      comboType: combination.type,
      cards,
    },
  };
}

export function formatPassMessage(playerName: string): I18nText {
  return { key: 'log.pass', params: { name: playerName } };
}

export function formatTrickWonMessage(playerName: string): I18nText {
  return { key: 'log.trickWon', params: { name: playerName } };
}

export function formatWinMessage(playerName: string): I18nText {
  return { key: 'log.win', params: { name: playerName } };
}

export function appendLog(
  log: { id: string; i18n: I18nText; timestamp: number }[],
  i18n: I18nText,
  max = 100,
) {
  return [...log, createLogEntry(i18n)].slice(-max);
}
