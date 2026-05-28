import { dragSession } from './dragSession';

export const CARD_DRAG_MIME = 'application/x-bigtwo-cards';
export const REORDER_DRAG_MIME = 'application/x-bigtwo-reorder';

export function setReorderDragData(
  dataTransfer: DataTransfer,
  cardId: string,
): void {
  dataTransfer.setData(REORDER_DRAG_MIME, cardId);
}

export function getReorderDragData(dataTransfer: DataTransfer): string | null {
  const raw = dataTransfer.getData(REORDER_DRAG_MIME);
  return raw || null;
}

export function setCardDragData(dataTransfer: DataTransfer, cardIds: string[]): void {
  const payload = JSON.stringify(cardIds);
  dataTransfer.setData(CARD_DRAG_MIME, payload);
  dataTransfer.setData('text/plain', payload);
  dataTransfer.effectAllowed = 'move';
}

/** Use a clone of the element as the drag preview so the source card stays crisp. */
export function setCardDragPreview(
  dataTransfer: DataTransfer,
  element: HTMLElement,
  clientX: number,
  clientY: number,
): void {
  const rect = element.getBoundingClientRect();
  const offsetX = clientX - rect.left;
  const offsetY = clientY - rect.top;
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.pointerEvents = 'none';
  clone.style.margin = '0';
  document.body.appendChild(clone);
  dataTransfer.setDragImage(clone, offsetX, offsetY);
  requestAnimationFrame(() => {
    clone.remove();
  });
}

export function getActiveDragCardIds(): string[] | null {
  return dragSession.cardIds;
}

export function getCardDragData(dataTransfer: DataTransfer): string[] | null {
  if (dragSession.cardIds && dragSession.cardIds.length > 0) {
    return dragSession.cardIds;
  }

  let raw = dataTransfer.getData(CARD_DRAG_MIME);
  if (!raw) raw = dataTransfer.getData('text/plain');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return null;
  }
}

export function resolveReorderDraggedId(
  dataTransfer: DataTransfer,
): string | null {
  return dragSession.reorderId ?? getReorderDragData(dataTransfer);
}
