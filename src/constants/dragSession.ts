export type DragSource = 'hand' | 'reserve';

export const dragSession: {
  source: DragSource | null;
  cardIds: string[] | null;
  reorderId: string | null;
  /** Full combo ids when dragging from a playable hold slot to the pile */
  playComboIds: string[] | null;
  reserveSlotIndex: number | null;
} = {
  source: null,
  cardIds: null,
  reorderId: null,
  playComboIds: null,
  reserveSlotIndex: null,
};

/** primaryCardId is the card under the pointer (always reorderable within the hand). */
export function startHandDrag(cardIds: string[], primaryCardId: string): void {
  dragSession.source = 'hand';
  dragSession.cardIds = cardIds;
  dragSession.reorderId = primaryCardId;
  dragSession.playComboIds = null;
  dragSession.reserveSlotIndex = null;
}

export function startReserveDrag(
  cardIds: string[],
  slotIndex: number,
  options?: { playComboIds?: string[] | null },
): void {
  dragSession.source = 'reserve';
  dragSession.cardIds = cardIds;
  dragSession.reserveSlotIndex = slotIndex;
  dragSession.reorderId = cardIds.length === 1 ? cardIds[0]! : null;
  dragSession.playComboIds = options?.playComboIds ?? null;
}

export function clearDragSession(): void {
  dragSession.source = null;
  dragSession.cardIds = null;
  dragSession.reorderId = null;
  dragSession.playComboIds = null;
  dragSession.reserveSlotIndex = null;
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

export function getReserveSlotIndex(): number | null {
  return dragSession.reserveSlotIndex;
}

export function getReservePlayIds(): string[] | null {
  return dragSession.playComboIds;
}

export function isHandDrag(): boolean {
  return dragSession.source === 'hand';
}
