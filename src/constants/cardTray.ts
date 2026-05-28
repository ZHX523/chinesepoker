/** Shared footprint + layout for hand tray and hold-combo staging */
export const TRAY_CARD_HEIGHT = 'h-[clamp(4.75rem,18vh,8.5rem)]';

export const TRAY_CARD_SIZE_CLASS = `${TRAY_CARD_HEIGHT} w-[clamp(3.25rem,12.5vh,6rem)] text-[clamp(0.75rem,1.8vh,1.15rem)]`;

export const TRAY_CARD_CORNER = 'text-[clamp(0.55rem,1.2vh,0.95rem)]';
export const TRAY_CARD_CENTER = 'text-[clamp(1rem,2.4vh,1.85rem)]';

export const TRAY_CARD_OVERLAP = '-ml-5 first:ml-0 sm:-ml-6';

export const TRAY_TARGET_FILL = 0.92;
export const TRAY_MAX_SCALE = 2.5;
/** Hand tray fill — ~13% larger than combo dock default (10% + 3%) */
export const HAND_TARGET_FILL = TRAY_TARGET_FILL * 1.1 * 1.03;
/** At max expansion (fewest cards), fill is reduced by this fraction (3% smaller peak) */
export const HAND_PEAK_FILL_REDUCTION = 0.03;
export const HAND_MAX_SCALE = TRAY_MAX_SCALE * (1 - HAND_PEAK_FILL_REDUCTION);
/** Fill factor for center pile cards (+10% over previous 0.75) */
export const PILE_TARGET_FILL = 0.75 * 1.1;
/** Shell is always sized for five overlapping cards; scales with play field only */
export const PILE_COMBO_CARD_COUNT = 5;
export const PILE_SHELL_WIDTH_RATIO = 0.86;
export const PILE_SHELL_HEIGHT_RATIO = 0.64;
export const PILE_SHELL_MAX_WIDTH = 440;
export const PILE_SHELL_MAX_HEIGHT = 340;
/** Absolute floor — never larger than the play field (see fitPileShellDimension) */
export const PILE_SHELL_MIN_WIDTH = 160;
export const PILE_SHELL_MIN_HEIGHT = 120;

/** Unscaled pile card footprint (scale transform handles responsiveness) */
export const PILE_CARD_SIZE_CLASS =
  'h-28 w-[4.75rem] text-lg sm:h-32 sm:w-[5.25rem] sm:text-xl';
export const PILE_CARD_OVERLAP = '-ml-[2.25rem] sm:-ml-[2.65rem]';

/** Five overlapping pile cards at scale 1 — used for layout math */
export const PILE_BASE_CARD_WIDTH_PX = 80;
export const PILE_BASE_CARD_HEIGHT_PX = 128;
export const PILE_BASE_CARD_OVERLAP_PX = 44;

export function pileFiveCardFootprint(): { width: number; height: number } {
  const width =
    PILE_BASE_CARD_WIDTH_PX +
    (PILE_COMBO_CARD_COUNT - 1) * (PILE_BASE_CARD_WIDTH_PX - PILE_BASE_CARD_OVERLAP_PX);
  return { width, height: PILE_BASE_CARD_HEIGHT_PX };
}

/** Size the violet shell from the play field; always fits inside the field when shrunk */
export function fitPileShellDimension(
  fieldDim: number,
  ratio: number,
  maxCap: number,
  minCap: number,
): number {
  if (fieldDim <= 0) return minCap;
  const maxAllowed = Math.min(maxCap, fieldDim - 12);
  const minAllowed = Math.min(minCap, maxAllowed);
  const target = fieldDim * ratio;
  return Math.max(minAllowed, Math.min(target, maxAllowed));
}

/** 0 = fullest hand, 1 = fewest cards — drives peak fill reduction */
export function handExpansionRatio(visibleCount: number, peakCount: number): number {
  if (peakCount <= 1 || visibleCount >= peakCount) return 0;
  return (peakCount - visibleCount) / (peakCount - 1);
}

export function handTargetFill(visibleCount: number, peakCount: number): number {
  const expansion = handExpansionRatio(visibleCount, peakCount);
  return HAND_TARGET_FILL * (1 - HAND_PEAK_FILL_REDUCTION * expansion);
}

export function computeTrayCardScale(
  availableWidth: number,
  availableHeight: number,
  requiredWidth: number,
  requiredHeight: number,
  targetFill: number = TRAY_TARGET_FILL,
  maxScale: number = TRAY_MAX_SCALE,
): number {
  if (
    availableWidth <= 0 ||
    availableHeight <= 0 ||
    requiredWidth <= 0 ||
    requiredHeight <= 0
  ) {
    return 1;
  }
  const widthRatio = (availableWidth * targetFill) / requiredWidth;
  const heightRatio = (availableHeight * targetFill) / requiredHeight;
  return Math.min(widthRatio, heightRatio, maxScale);
}

/** Scale seat profiles with the felt so they do not crowd the board */
export const PROFILE_REF_WIDTH = 760;
export const PROFILE_REF_HEIGHT = 540;
export const PROFILE_MIN_SCALE = 0.52;
export const PROFILE_MAX_SCALE = 1;

export function computeProfileScale(feltWidth: number, feltHeight: number): number {
  if (feltWidth <= 0 || feltHeight <= 0) return 1;
  const ratio = Math.min(
    feltWidth / PROFILE_REF_WIDTH,
    feltHeight / PROFILE_REF_HEIGHT,
  );
  return Math.max(PROFILE_MIN_SCALE, Math.min(ratio, PROFILE_MAX_SCALE));
}
