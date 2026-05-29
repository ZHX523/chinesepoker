import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getDisplayLanguage,
  setDisplayLanguage,
  type DisplayLanguage,
} from '../settings/gameSettings';
import {
  comboLabel as comboLabelForLang,
  displayPlayerName as displayPlayerNameForLang,
  translate,
  translateI18n,
} from './messages';
import type { I18nText, TranslationContextValue, TranslateParams } from './types';

const LanguageContext = createContext<TranslationContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(getDisplayLanguage);

  const setLanguage = useCallback((next: DisplayLanguage) => {
    setDisplayLanguage(next);
    setLanguageState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
  }, [language]);

  const value = useMemo<TranslationContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: string, params?: TranslateParams) => translate(language, key, params),
      comboLabel: (type: string) => comboLabelForLang(language, type),
      displayPlayerName: (name: string) => displayPlayerNameForLang(language, name),
    }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation(): TranslationContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return ctx;
}

export function useTranslateI18n() {
  const { language } = useTranslation();
  return (message: I18nText) => translateI18n(language, message);
}
