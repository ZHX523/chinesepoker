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
/** Fill factor — share of the interior card slot the 5-card combo occupies */
export const PILE_TARGET_FILL = 0.9;
export const PILE_MAX_SCALE = TRAY_MAX_SCALE;
/** Shell is always sized for five overlapping cards; scales with play field only */
export const PILE_COMBO_CARD_COUNT = 5;
export const PILE_SHELL_WIDTH_RATIO = 0.86;
export const PILE_SHELL_HEIGHT_RATIO = 0.64;
export const PILE_SHELL_MAX_WIDTH = 440;
export const PILE_SHELL_MAX_HEIGHT = 340;
/** Absolute floor — never larger than the play field (see fitPileShellDimension) */
export const PILE_SHELL_MIN_WIDTH = 160;
export const PILE_SHELL_MIN_HEIGHT = 120;
/** Uniform bump for center pile shell (+35% over base ratios/caps) */
export const PILE_SHELL_SIZE_FACTOR = 1.35;

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

/** Interior card area inside the pile shell (badge + footer reserved) */
export const PILE_SHELL_PADDING_X = 24;
export const PILE_SHELL_CHROME_Y = 82;

export function pileCardSlotDimensions(
  shellWidth: number,
  shellHeight: number,
): { width: number; height: number } {
  return {
    width: Math.max(0, shellWidth - PILE_SHELL_PADDING_X),
    height: Math.max(0, shellHeight - PILE_SHELL_CHROME_Y),
  };
}

/** Scale pile cards from shell size — always sized for a 5-card footprint */
export function computePileCardScale(shellWidth: number, shellHeight: number): number {
  const { width: slotWidth, height: slotHeight } = pileCardSlotDimensions(
    shellWidth,
    shellHeight,
  );
  const { width: comboWidth, height: comboHeight } = pileFiveCardFootprint();
  return computeTrayCardScale(
    slotWidth,
    slotHeight,
    comboWidth,
    comboHeight,
    PILE_TARGET_FILL,
    PILE_MAX_SCALE,
  );
}

/** Size the center pile shell from the play field; always fits inside the field when shrunk */
export function fitPileShellDimension(
  fieldDim: number,
  ratio: number,
  maxCap: number,
  minCap: number,
): number {
  if (fieldDim <= 0) return minCap * PILE_SHELL_SIZE_FACTOR;
  const scale = PILE_SHELL_SIZE_FACTOR;
  const fieldMargin = 8;
  const maxAllowed = Math.min(maxCap * scale, fieldDim - fieldMargin);
  const minAllowed = Math.min(minCap * scale, maxAllowed);
  const target = fieldDim * ratio * scale;
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
export const PROFILE_MIN_SCALE = 0.45;
export const PROFILE_MAX_SCALE = 1;
/** Unscaled profile footprint (horizontal: avatar overlap + card) */
export const PROFILE_HORIZONTAL_WIDTH_PX = 250;
export const PROFILE_VERTICAL_WIDTH_PX = 132;
export const PROFILE_SIDE_INSET_RATIO = 0.02;
export const PROFILE_SIDE_CLEARANCE_PX = 10;

export function computeProfileScale(feltWidth: number, feltHeight: number): number {
  if (feltWidth <= 0 || feltHeight <= 0) return 1;
  const ratio = Math.min(
    feltWidth / PROFILE_REF_WIDTH,
    feltHeight / PROFILE_REF_HEIGHT,
  );
  return Math.max(PROFILE_MIN_SCALE, Math.min(ratio, PROFILE_MAX_SCALE));
}

export interface ProfileLayoutState {
  scale: number;
  sideVertical: boolean;
}

/** Fit profiles beside the center pile; switch left/right to vertical when tight */
export function computeProfileLayoutState(
  feltWidth: number,
  feltHeight: number,
  fieldWidth: number,
  fieldHeight: number,
): ProfileLayoutState {
  let scale = computeProfileScale(feltWidth, feltHeight);
  if (fieldWidth <= 0 || fieldHeight <= 0) {
    return { scale, sideVertical: false };
  }

  const pileWidth = fitPileShellDimension(
    fieldWidth,
    PILE_SHELL_WIDTH_RATIO,
    PILE_SHELL_MAX_WIDTH,
    PILE_SHELL_MIN_WIDTH,
  );
  const sideInset = fieldWidth * PROFILE_SIDE_INSET_RATIO;
  const sideLane =
    (fieldWidth - pileWidth) / 2 - sideInset - PROFILE_SIDE_CLEARANCE_PX;

  if (sideLane <= 0) {
    return { scale: PROFILE_MIN_SCALE, sideVertical: true };
  }

  const horizontalWidth = PROFILE_HORIZONTAL_WIDTH_PX * scale;
  if (horizontalWidth > sideLane) {
    const verticalWidth = PROFILE_VERTICAL_WIDTH_PX * scale;
    if (verticalWidth <= sideLane) {
      return { scale, sideVertical: true };
    }
    const fitScale = sideLane / PROFILE_VERTICAL_WIDTH_PX;
    scale = Math.max(PROFILE_MIN_SCALE, Math.min(scale, fitScale));
    return { scale, sideVertical: true };
  }

  return { scale, sideVertical: false };
}
