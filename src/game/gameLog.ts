import { combinationLabel } from './cards';
import type { ActionLogEntry, Card, Combination, Suit } from './types';

const SUIT_SYMBOL: Record<Suit, string> = {
  diamonds: '♦',
  clubs: '♣',
  hearts: '♥',
  spades: '♠',
};

export function formatCardShort(card: Card): string {
  return `${card.rank}${SUIT_SYMBOL[card.suit]}`;
}

export function createLogEntry(text: string): ActionLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    text,
    timestamp: Date.now(),
  };
}

export function formatDealMessage(openerName: string): string {
  return `New hand — ${openerName} opens (must play 3♦).`;
}

export function formatPlayMessage(
  playerName: string,
  combination: Combination,
): string {
  const cards = combination.cards.map(formatCardShort).join(', ');
  return `${playerName} played ${combinationLabel(combination.type)} (${cards})`;
}

export function formatPassMessage(playerName: string): string {
  return `${playerName} passed.`;
}

export function formatTrickWonMessage(playerName: string): string {
  return `Everyone passed — ${playerName} may lead any valid hand.`;
}

export function formatWinMessage(playerName: string): string {
  return `${playerName} emptied their hand and wins!`;
}

export function appendLog(
  log: ActionLogEntry[],
  text: string,
  max = 100,
): ActionLogEntry[] {
  return [...log, createLogEntry(text)].slice(-max);
}
