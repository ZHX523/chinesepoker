/** Shared footprint + layout for hand tray and hold-combo staging */
export const TRAY_CARD_HEIGHT = 'h-[clamp(4.75rem,18vh,8.5rem)]';

export const TRAY_CARD_SIZE_CLASS = `${TRAY_CARD_HEIGHT} w-[clamp(3.25rem,12.5vh,6rem)] text-[clamp(0.75rem,1.8vh,1.15rem)]`;

export const TRAY_CARD_CORNER = 'text-[clamp(0.55rem,1.2vh,0.95rem)]';
export const TRAY_CARD_CENTER = 'text-[clamp(1rem,2.4vh,1.85rem)]';

export const TRAY_CARD_OVERLAP = '-ml-5 first:ml-0 sm:-ml-6';

export const TRAY_TARGET_FILL = 0.92;
export const TRAY_MAX_SCALE = 2.5;

export function computeTrayCardScale(
  availableWidth: number,
  availableHeight: number,
  requiredWidth: number,
  requiredHeight: number,
): number {
  if (
    availableWidth <= 0 ||
    availableHeight <= 0 ||
    requiredWidth <= 0 ||
    requiredHeight <= 0
  ) {
    return 1;
  }
  const widthRatio = (availableWidth * TRAY_TARGET_FILL) / requiredWidth;
  const heightRatio = (availableHeight * TRAY_TARGET_FILL) / requiredHeight;
  return Math.min(widthRatio, heightRatio, TRAY_MAX_SCALE);
}
