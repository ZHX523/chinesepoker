const TURN_TIMER_KEY = 'bigtwo-turn-timer-seconds';
const TURN_ALERT_MUTED_KEY = 'bigtwo-turn-alert-muted';
const LEGACY_MUSIC_MUTED_KEY = 'bigtwo-music-muted';
const DISPLAY_LANGUAGE_KEY = 'bigtwo-display-language';

export type DisplayLanguage = 'en' | 'zh';

export const GAME_TITLES: Record<DisplayLanguage, string> = {
  en: 'Chinese Poker',
  zh: '鋤大D',
};

export const GAME_TITLE_LINES: Record<DisplayLanguage, string[]> = {
  en: ['Chinese', 'Poker'],
  zh: ['鋤大D'],
};

export const DEFAULT_DISPLAY_LANGUAGE: DisplayLanguage = 'zh';

export const DEFAULT_TURN_TIMER_SECONDS = 15;
export const MIN_TURN_TIMER_SECONDS = 5;
export const MAX_TURN_TIMER_SECONDS = 120;

export function getTurnTimerSeconds(): number {
  if (typeof window === 'undefined') return DEFAULT_TURN_TIMER_SECONDS;
  const raw = localStorage.getItem(TURN_TIMER_KEY);
  if (!raw) return DEFAULT_TURN_TIMER_SECONDS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_TURN_TIMER_SECONDS;
  return Math.min(MAX_TURN_TIMER_SECONDS, Math.max(MIN_TURN_TIMER_SECONDS, parsed));
}

export function setTurnTimerSeconds(seconds: number): number {
  const clamped = Math.min(
    MAX_TURN_TIMER_SECONDS,
    Math.max(MIN_TURN_TIMER_SECONDS, Math.round(seconds)),
  );
  localStorage.setItem(TURN_TIMER_KEY, String(clamped));
  return clamped;
}

export function isTurnAlertMuted(): boolean {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem(TURN_ALERT_MUTED_KEY) === '1') return true;
  if (localStorage.getItem(LEGACY_MUSIC_MUTED_KEY) === '1') return true;
  return false;
}

export function setTurnAlertMuted(muted: boolean): void {
  localStorage.setItem(TURN_ALERT_MUTED_KEY, muted ? '1' : '0');
}

export function getDisplayLanguage(): DisplayLanguage {
  if (typeof window === 'undefined') return DEFAULT_DISPLAY_LANGUAGE;
  const raw = localStorage.getItem(DISPLAY_LANGUAGE_KEY);
  return raw === 'en' || raw === 'zh' ? raw : DEFAULT_DISPLAY_LANGUAGE;
}

export function setDisplayLanguage(language: DisplayLanguage): DisplayLanguage {
  localStorage.setItem(DISPLAY_LANGUAGE_KEY, language);
  return language;
}
