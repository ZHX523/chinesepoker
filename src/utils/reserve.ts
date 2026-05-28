import { classifyCombination } from '../game/cards';
import type { Card } from '../game/types';

export const RESERVE_SLOT_COUNT = 2;
export const MAX_CARDS_PER_SLOT = 5;

export function createEmptyReserveSlots(): (string[] | null)[] {
  return Array.from({ length: RESERVE_SLOT_COUNT }, () => null);
}

export function countReservedCards(slots: (string[] | null)[]): number {
  return slots.reduce((sum, slot) => sum + (slot?.length ?? 0), 0);
}

export function getReservedIdSet(slots: (string[] | null)[]): Set<string> {
  const ids = new Set<string>();
  for (const slot of slots) {
    if (slot) slot.forEach((id) => ids.add(id));
  }
  return ids;
}

export function pruneReserveSlots(
  slots: (string[] | null)[],
  handCardIds: Set<string>,
): (string[] | null)[] {
  return slots.map((slot) => {
    if (!slot) return null;
    const kept = slot.filter((id) => handCardIds.has(id));
    return kept.length > 0 ? kept : null;
  });
}

export function firstEmptySlotIndex(slots: (string[] | null)[]): number {
  return slots.findIndex((slot) => !slot || slot.length === 0);
}

/** Prefer continuing a partial slot, then an empty one. */
export function targetSlotForStash(slots: (string[] | null)[]): number {
  const partial = slots.findIndex(
    (slot) => slot && slot.length > 0 && slot.length < MAX_CARDS_PER_SLOT,
  );
  if (partial >= 0) return partial;
  const empty = firstEmptySlotIndex(slots);
  if (empty >= 0) return empty;
  return slots.findIndex(
    (slot) => !slot || slot.length < MAX_CARDS_PER_SLOT,
  );
}

/** Add cards into a slot (mini hand) without replacing existing cards. */
export function addCardsToSlot(
  slots: (string[] | null)[],
  slotIndex: number,
  incomingIds: string[],
): (string[] | null)[] {
  const incoming = [...new Set(incomingIds)];
  if (incoming.length === 0) return slots;

  const current = slots[slotIndex] ?? [];
  const merged = [...current];
  for (const id of incoming) {
    if (merged.includes(id)) continue;
    if (merged.length >= MAX_CARDS_PER_SLOT) break;
    merged.push(id);
  }

  if (merged.length === 0) return slots;

  const mergedSet = new Set(merged);

  return slots.map((slot, i) => {
    if (i === slotIndex) return merged;
    if (!slot) return null;
    const remaining = slot.filter((id) => !mergedSet.has(id));
    return remaining.length > 0 ? remaining : null;
  });
}

export function removeCardsFromReserve(
  slots: (string[] | null)[],
  cardIds: string[],
): (string[] | null)[] {
  const remove = new Set(cardIds);
  return slots.map((slot) => {
    if (!slot) return null;
    const remaining = slot.filter((id) => !remove.has(id));
    return remaining.length > 0 ? remaining : null;
  });
}

export function isSlotPlayable(cards: Card[]): boolean {
  return classifyCombination(cards) !== null;
}

export function resolveSlotCards(hand: Card[], cardIds: string[]): Card[] {
  const byId = new Map(hand.map((c) => [c.id, c]));
  return cardIds
    .map((id) => byId.get(id))
    .filter((c): c is Card => c !== undefined);
}

export function firstPlayableReserveSlot(
  slots: (string[] | null)[],
  hand: Card[],
): string[] | null {
  for (const slot of slots) {
    if (!slot?.length) continue;
    const cards = resolveSlotCards(hand, slot);
    if (cards.length !== slot.length) continue;
    if (isSlotPlayable(cards)) return slot;
  }
  return null;
}

export function slotHasRoom(slot: string[] | null | undefined): boolean {
  return (slot?.length ?? 0) < MAX_CARDS_PER_SLOT;
}
