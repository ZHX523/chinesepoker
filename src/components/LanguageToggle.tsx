import type { DisplayLanguage } from '../settings/gameSettings';

interface LanguageToggleProps {
  language: DisplayLanguage;
  onLanguageChange: (language: DisplayLanguage) => void;
  size?: 'md' | 'lg';
}

export function LanguageToggle({
  language,
  onLanguageChange,
  size = 'md',
}: LanguageToggleProps) {
  const isLarge = size === 'lg';

  return (
    <div
      role="group"
      aria-label="Display language"
      className={[
        'flex rounded-lg border border-[#3d2418] bg-[#1a0f0c]',
        isLarge ? 'p-1' : 'p-0.5',
      ].join(' ')}
    >
      <button
        type="button"
        aria-pressed={language === 'en'}
        onClick={() => onLanguageChange('en')}
        className={[
          'rounded-md font-semibold uppercase tracking-wide transition-colors',
          isLarge ? 'px-3 py-1.5 text-xs' : 'px-2 py-1 text-[10px]',
          language === 'en'
            ? 'bg-[#2d1510] text-amber-100'
            : 'text-emerald-300/55 hover:text-emerald-100/80',
        ].join(' ')}
      >
        ENG
      </button>
      <button
        type="button"
        aria-pressed={language === 'zh'}
        onClick={() => onLanguageChange('zh')}
        className={[
          'rounded-md font-semibold tracking-wide transition-colors',
          isLarge ? 'px-3 py-1.5 text-xs' : 'px-2 py-1 text-[10px]',
          language === 'zh'
            ? 'bg-[#2d1510] text-amber-100'
            : 'text-emerald-300/55 hover:text-emerald-100/80',
        ].join(' ')}
      >
        中文
      </button>
    </div>
  );
}
