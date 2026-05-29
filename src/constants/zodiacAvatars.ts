/** Twelve Chinese zodiac animals (生肖) for table avatars — Rat through Pig. */
export const ZODIAC_AVATARS = [
  '🐭', // Rat 鼠
  '🐮', // Ox 牛
  '🐯', // Tiger 虎
  '🐰', // Rabbit 兔
  '🐲', // Dragon 龙
  '🐍', // Snake 蛇
  '🐴', // Horse 马
  '🐐', // Goat 羊
  '🐵', // Monkey 猴
  '🐔', // Rooster 鸡
  '🐶', // Dog 狗
  '🐷', // Pig 猪
] as const;

export const ZODIAC_COUNT = ZODIAC_AVATARS.length;

export type ZodiacIndex = number;

export function isValidZodiacIndex(index: number): index is ZodiacIndex {
  return Number.isInteger(index) && index >= 0 && index < ZODIAC_COUNT;
}

export function normalizeZodiacIndex(index: number): ZodiacIndex {
  return ((index % ZODIAC_COUNT) + ZODIAC_COUNT) % ZODIAC_COUNT;
}

export function zodiacAvatar(index: number): string {
  return ZODIAC_AVATARS[normalizeZodiacIndex(index)]!;
}

export function randomZodiacIndex(): ZodiacIndex {
  return Math.floor(Math.random() * ZODIAC_COUNT);
}

function shuffleIndices(indices: number[]): number[] {
  const copy = [...indices];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** One random zodiac index not already used at the table. */
export function pickUniqueZodiacIndex(excluded: ReadonlyArray<number> = []): ZodiacIndex {
  const used = new Set(
    excluded.filter(isValidZodiacIndex).map((index) => normalizeZodiacIndex(index)),
  );
  const available = Array.from({ length: ZODIAC_COUNT }, (_, i) => i).filter(
    (index) => !used.has(index),
  );
  if (available.length === 0) return randomZodiacIndex();
  return available[Math.floor(Math.random() * available.length)]!;
}

/**
 * Assign `count` unique zodiac indices. Optional preferred pins are kept when
 * valid and not already taken (first seat wins on duplicates).
 */
export function assignUniqueZodiacIndices(
  count: number,
  preferred: ReadonlyArray<number | null | undefined> = [],
): ZodiacIndex[] {
  const used = new Set<ZodiacIndex>();
  const result: ZodiacIndex[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const pin = preferred[i];
    if (pin != null && isValidZodiacIndex(pin) && !used.has(pin)) {
      result[i] = pin;
      used.add(pin);
    }
  }

  const pool = shuffleIndices(
    Array.from({ length: ZODIAC_COUNT }, (_, i) => i).filter((index) => !used.has(index)),
  );

  for (let i = 0; i < count; i++) {
    if (result[i] != null) continue;
    result[i] = pool.pop()!;
  }

  return result;
}

export function resolveAvatarIndex(saved?: number | null): ZodiacIndex {
  if (saved != null && isValidZodiacIndex(saved)) {
    return saved;
  }
  return randomZodiacIndex();
}
