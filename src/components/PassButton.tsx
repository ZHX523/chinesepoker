import { useTranslation } from '../i18n/LanguageContext';

interface PassButtonProps {
  disabled: boolean;
  onClick: () => void;
  className?: string;
}

export function PassButton({ disabled, onClick, className = '' }: PassButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={t('pass.aria')}
      title={disabled ? t('pass.titleDisabled') : t('pass.titleEnabled')}
      className={[
        'group relative flex aspect-square items-center justify-center rounded-full',
        'transition-transform duration-200',
        'disabled:cursor-not-allowed disabled:opacity-45',
        !disabled && 'hover:scale-[1.04] active:scale-[0.98]',
        className,
      ].join(' ')}
    >
      <span
        className={[
          'absolute inset-0 rounded-full bg-gradient-to-b from-[#d4af37] via-[#8b6914] to-[#5c4a12] p-[3px]',
          'shadow-[0_0_14px_rgba(52,211,153,0.24),0_6px_20px_rgba(0,0,0,0.45)]',
          !disabled && 'group-hover:shadow-[0_0_18px_rgba(52,211,153,0.32),0_6px_20px_rgba(0,0,0,0.45)]',
        ].join(' ')}
        aria-hidden
      >
        <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#1f7a5c] via-[#0f5c44] to-[#083d2e] shadow-[inset_0_2px_8px_rgba(255,255,255,0.2),inset_0_-4px_10px_rgba(0,0,0,0.35)]">
          <span className="font-bold tracking-widest text-[#f5f0e6] drop-shadow-sm [font-size:min(1.75rem,28cqmin)]">
            {t('pass.label')}
          </span>
        </span>
      </span>
    </button>
  );
}
