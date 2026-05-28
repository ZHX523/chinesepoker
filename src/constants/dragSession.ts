export type DragSource = 'hand' | 'reserve';

export const dragSession: {
  source: DragSource | null;
  cardIds: string[] | null;
  reorderId: string | null;
} = {
  source: null,
  cardIds: null,
  reorderId: null,
};

export function startHandDrag(cardIds: string[]): void {
  dragSession.source = 'hand';
  dragSession.cardIds = cardIds;
  dragSession.reorderId = cardIds.length === 1 ? cardIds[0]! : null;
}

export function startReserveDrag(cardIds: string[]): void {
  dragSession.source = 'reserve';
  dragSession.cardIds = cardIds;
  dragSession.reorderId = null;
}

export function clearDragSession(): void {
  dragSession.source = null;
  dragSession.cardIds = null;
  dragSession.reorderId = null;
}

export function isReserveDrag(): boolean {
  return dragSession.source === 'reserve';
}

export function isReorderDrag(): boolean {
  return dragSession.reorderId !== null;
}

export function getReorderDraggedId(): string | null {
  return dragSession.reorderId;
}

export function isHandDrag(): boolean {
  return dragSession.source === 'hand';
}
