/** Shared footprint + layout for hand tray and hold-combo staging */
export const TRAY_CARD_HEIGHT =
  'h-[clamp(3.25rem,13vh,6.75rem)] lg:h-[clamp(4.75rem,18vh,8.5rem)]';

export const TRAY_CARD_SIZE_CLASS = `${TRAY_CARD_HEIGHT} w-[clamp(2.75rem,10vh,6rem)] lg:w-[clamp(3.25rem,12.5vh,6rem)] text-[clamp(0.7rem,1.5vh,1.15rem)] lg:text-[clamp(0.75rem,1.8vh,1.15rem)]`;

export const TRAY_CARD_CORNER =
  'text-[clamp(0.5rem,1vh,0.95rem)] lg:text-[clamp(0.55rem,1.2vh,0.95rem)]';
export const TRAY_CARD_CENTER =
  'text-[clamp(0.9rem,2vh,1.85rem)] lg:text-[clamp(1rem,2.4vh,1.85rem)]';

export const TRAY_CARD_OVERLAP = '-ml-4 first:ml-0 lg:-ml-5 lg:first:ml-0 xl:-ml-6';

export const TRAY_TARGET_FILL = 0.92;
export const TRAY_MAX_SCALE = 2.5;
/** Hand tray fill — ~13% larger than combo dock default (10% + 3%) */
export const HAND_TARGET_FILL = TRAY_TARGET_FILL * 1.1 * 1.03;
/** At max expansion (fewest cards), fill is reduced by this fraction (3% smaller peak) */
export const HAND_PEAK_FILL_REDUCTION = 0.03;
export const HAND_MAX_SCALE = TRAY_MAX_SCALE * (1 - HAND_PEAK_FILL_REDUCTION);
/** Fill factor — share of the available play field the 5-card combo occupies */
export const PILE_TARGET_FILL = 0.98;
export const PILE_FIELD_WIDTH_RATIO = 0.94;
export const PILE_FIELD_HEIGHT_RATIO = 0.78;
export const PILE_LABEL_CHROME_Y = 36;
export const PILE_MAX_SCALE = 3.5;
/** Extra multiplier applied to computed pile card scale (+20%) */
export const PILE_CARD_SIZE_BOOST = 1.2;
/** Global layout scale for center pile cards (+10%) */
export const PILE_CARD_LAYOUT_SCALE = 1.1;
/** Pile card height as a fraction of play-field height (drives visible card size) */
export const PILE_CARD_HEIGHT_RATIO = 0.42;
export const PILE_CARD_MIN_HEIGHT_PX = 132;
export const PILE_CARD_MAX_HEIGHT_PX = 260;
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

/** Standard poker card width / height (matches hand + md card sizes) */
export const PILE_CARD_ASPECT = 5 / 7;
export const PILE_CARD_OVERLAP_RATIO = 0.56;

/** Unscaled pile card footprint (scale transform handles responsiveness) */
export const PILE_CARD_SIZE_CLASS =
  'pile-card-dim h-[var(--pile-card-h)] w-[var(--pile-card-w)] text-[length:calc(var(--pile-card-h)*0.14)]';
export const PILE_CARD_OVERLAP =
  'pile-card-overlap -ml-[calc(var(--pile-card-w)*var(--pile-overlap-ratio))]';

/** Reference footprint at scale 1 — used for layout math */
export const PILE_BASE_CARD_HEIGHT_PX = 173;
export const PILE_BASE_CARD_WIDTH_PX = Math.round(PILE_BASE_CARD_HEIGHT_PX * PILE_CARD_ASPECT);
export const PILE_BASE_CARD_OVERLAP_PX = Math.round(PILE_BASE_CARD_WIDTH_PX * PILE_CARD_OVERLAP_RATIO);

export function pileFiveCardFootprint(): { width: number; height: number } {
  return pileFootprintFromCardSize(PILE_BASE_CARD_WIDTH_PX, PILE_BASE_CARD_HEIGHT_PX);
}

export function pileFootprintFromCardSize(
  cardWidth: number,
  cardHeight: number,
): { width: number; height: number } {
  const overlap = cardWidth * PILE_CARD_OVERLAP_RATIO;
  const width =
    cardWidth + (PILE_COMBO_CARD_COUNT - 1) * Math.max(0, cardWidth - overlap);
  return { width, height: cardHeight };
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

/** Card height from play field — respects both width and height limits */
export function computePileCardHeight(fieldWidth: number, fieldHeight: number): number {
  const compact = fieldWidth < 480 || fieldHeight < 280;
  const minHeight = compact ? 88 : PILE_CARD_MIN_HEIGHT_PX;
  const heightFromField =
    fieldHeight * PILE_CARD_HEIGHT_RATIO * PILE_CARD_SIZE_BOOST;
  const availWidth = fieldWidth * PILE_FIELD_WIDTH_RATIO * PILE_TARGET_FILL;
  const spreadFactor =
    1 + (PILE_COMBO_CARD_COUNT - 1) * (1 - PILE_CARD_OVERLAP_RATIO);
  const maxCardWidth = availWidth / spreadFactor;
  const heightFromWidth = maxCardWidth / PILE_CARD_ASPECT;
  const cardHeight = Math.min(heightFromField, heightFromWidth) * PILE_CARD_LAYOUT_SCALE;

  return Math.max(
    minHeight * PILE_CARD_LAYOUT_SCALE,
    Math.min(cardHeight, PILE_CARD_MAX_HEIGHT_PX * PILE_CARD_LAYOUT_SCALE),
  );
}

/** Scale pile cards from play field — always sized for a 5-card footprint */
export function computePileCardScaleFromField(
  fieldWidth: number,
  fieldHeight: number,
): number {
  return computePileCardHeight(fieldWidth, fieldHeight) / PILE_BASE_CARD_HEIGHT_PX;
}

export interface PileLayoutVars {
  '--pile-card-h': string;
  '--pile-card-w': string;
  '--pile-overlap-ratio': string;
  '--pile-badge-size': string;
  '--pile-footer-size': string;
  '--pile-hint-size': string;
  '--pile-gap': string;
}

export function pileLayoutVars(
  fieldWidth: number,
  fieldHeight: number,
): PileLayoutVars {
  const cardHeight = computePileCardHeight(fieldWidth, fieldHeight);
  const cardWidth = cardHeight * PILE_CARD_ASPECT;

  return {
    '--pile-card-h': `${cardHeight}px`,
    '--pile-card-w': `${cardWidth}px`,
    '--pile-overlap-ratio': String(PILE_CARD_OVERLAP_RATIO),
    '--pile-badge-size': `${cardHeight * 0.095}px`,
    '--pile-footer-size': `${cardHeight * 0.062}px`,
    '--pile-hint-size': `${cardHeight * 0.068}px`,
    '--pile-gap': `${cardHeight * 0.055}px`,
  };
}

/** @deprecated Use pileLayoutVars */
export function pileCardCssVars(fieldWidth: number, fieldHeight: number): PileLayoutVars {
  return pileLayoutVars(fieldWidth, fieldHeight);
}

/** Scale pile cards from shell size — always sized for a 5-card footprint */
export function computePileCardScale(shellWidth: number, shellHeight: number): number {
  const { width: slotWidth, height: slotHeight } = pileCardSlotDimensions(
    shellWidth,
    shellHeight,
  );
  const { width: comboWidth, height: comboHeight } = pileFiveCardFootprint();
  const baseScale = computeTrayCardScale(
    slotWidth,
    slotHeight,
    comboWidth,
    comboHeight,
    PILE_TARGET_FILL,
    PILE_MAX_SCALE,
  );
  return Math.min(baseScale * PILE_CARD_SIZE_BOOST, PILE_MAX_SCALE * PILE_CARD_SIZE_BOOST);
}

/** Size the center pile shell from the play field; always fits inside the field when shrunk */
export function fitPileShellDimension(
  fieldDim: number,
  ratio: number,
  maxCap: number,
  minCap: number,
): number {
  if (fieldDim <= 0) return minCap * PILE_SHELL_SIZE_FACTOR;
  const compact = fieldDim < 320;
  const scale = PILE_SHELL_SIZE_FACTOR * (compact ? 0.88 : 1);
  const fieldMargin = compact ? 4 : 8;
  const minFloor = compact ? minCap * 0.75 : minCap;
  const maxAllowed = Math.min(maxCap * scale, fieldDim - fieldMargin);
  const minAllowed = Math.min(minFloor * scale, maxAllowed);
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
  const refWidth = feltWidth < 640 ? 360 : PROFILE_REF_WIDTH;
  const refHeight = feltWidth < 640 ? 300 : PROFILE_REF_HEIGHT;
  const minScale = feltWidth < 640 ? 0.38 : PROFILE_MIN_SCALE;
  const ratio = Math.min(feltWidth / refWidth, feltHeight / refHeight);
  return Math.max(minScale, Math.min(ratio, PROFILE_MAX_SCALE));
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
