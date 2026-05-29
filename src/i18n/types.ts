import type { DisplayLanguage } from '../settings/gameSettings';

export interface I18nText {
  key: string;
  params?: Record<string, string | number>;
}

export type TranslateParams = Record<string, string | number>;

export interface TranslationContextValue {
  language: DisplayLanguage;
  setLanguage: (language: DisplayLanguage) => void;
  t: (key: string, params?: TranslateParams) => string;
  comboLabel: (type: string) => string;
  displayPlayerName: (name: string) => string;
}
