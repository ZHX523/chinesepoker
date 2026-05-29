import { createPortal } from 'react-dom';
import { ZODIAC_AVATARS, normalizeZodiacIndex } from '../constants/zodiacAvatars';
import { useTranslation } from '../i18n/LanguageContext';

interface ProfileIconPickerProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export function ProfileIconPicker({
  selectedIndex,
  onSelect,
  onClose,
}: ProfileIconPickerProps) {
  const { t } = useTranslation();
  const active = normalizeZodiacIndex(selectedIndex);

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('profile.pickIcon')}
        className="w-full max-w-xs rounded-2xl border border-[#3d2418] bg-[#0d1412] p-4 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="text-center font-serif text-sm font-semibold text-amber-100">
          {t('profile.pickIcon')}
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {ZODIAC_AVATARS.map((symbol, index) => (
            <button
              key={symbol}
              type="button"
              aria-label={t(`zodiac.${index}`)}
              aria-pressed={index === active}
              onClick={() => onSelect(index)}
              className={[
                'flex aspect-square items-center justify-center rounded-xl border text-2xl transition-colors',
                index === active
                  ? 'border-amber-400/70 bg-[#2d1510] ring-2 ring-amber-400/40'
                  : 'border-[#3d2418] bg-[#1a0f0c] hover:border-amber-500/35 hover:bg-[#2d1510]',
              ].join(' ')}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
