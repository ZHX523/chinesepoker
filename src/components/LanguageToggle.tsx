import type { DisplayLanguage } from '../settings/gameSettings';

interface LanguageToggleProps {
  language: DisplayLanguage;
  onLanguageChange: (language: DisplayLanguage) => void;
  size?: 'md' | 'lg';
  /** Smaller padding/text for narrow rails; scales up at lg+. */
  compact?: boolean;
}

export function LanguageToggle({
  language,
  onLanguageChange,
  size = 'md',
  compact = false,
}: LanguageToggleProps) {
  const isLarge = size === 'lg';

  const buttonClass = compact
    ? 'rounded-md font-semibold uppercase tracking-wide transition-colors px-1.5 py-0.5 text-[9px] lg:px-3 lg:py-1.5 lg:text-xs'
    : [
        'rounded-md font-semibold uppercase tracking-wide transition-colors',
        isLarge ? 'px-3 py-1.5 text-xs' : 'px-2 py-1 text-[10px]',
      ].join(' ');

  const zhButtonClass = compact
    ? 'rounded-md font-semibold tracking-wide transition-colors px-1.5 py-0.5 text-[9px] lg:px-3 lg:py-1.5 lg:text-xs'
    : [
        'rounded-md font-semibold tracking-wide transition-colors',
        isLarge ? 'px-3 py-1.5 text-xs' : 'px-2 py-1 text-[10px]',
      ].join(' ');

  return (
    <div
      role="group"
      aria-label="Display language"
      className={[
        'flex shrink-0 rounded-lg border border-[#3d2418] bg-[#1a0f0c]',
        isLarge ? (compact ? 'p-0.5 lg:p-1' : 'p-1') : 'p-0.5',
      ].join(' ')}
    >
      <button
        type="button"
        aria-pressed={language === 'en'}
        onClick={() => onLanguageChange('en')}
        className={[
          buttonClass,
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
          zhButtonClass,
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
