import type { Card } from '../game/types';

/** Keep custom order for remaining cards; append newly dealt cards at the end. */
export function syncHandOrder(previous: string[], hand: Card[]): string[] {
  const ids = hand.map((c) => c.id);
  if (previous.length === 0) return ids;

  const kept = previous.filter((id) => ids.includes(id));
  const added = ids.filter((id) => !kept.includes(id));
  return [...kept, ...added];
}

export function orderHand(hand: Card[], order: string[]): Card[] {
  const byId = new Map(hand.map((c) => [c.id, c]));
  const ordered = order
    .map((id) => byId.get(id))
    .filter((c): c is Card => c !== undefined);
  const inOrder = new Set(order);
  const rest = hand.filter((c) => !inOrder.has(c.id));
  return [...ordered, ...rest];
}

export function moveCardInOrder(
  order: string[],
  draggedId: string,
  targetId: string | null,
  insertBefore: boolean,
): string[] {
  if (draggedId === targetId) return order;

  const fromIndex = order.indexOf(draggedId);
  if (fromIndex === -1) return order;

  const next = order.filter((id) => id !== draggedId);

  if (targetId === null) {
    next.push(draggedId);
    return next;
  }

  let targetIndex = next.indexOf(targetId);
  if (targetIndex === -1) return order;
  if (!insertBefore) targetIndex += 1;

  next.splice(targetIndex, 0, draggedId);
  return next;
}
