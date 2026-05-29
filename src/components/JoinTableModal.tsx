import { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageToggle } from './LanguageToggle';

const MAX_NAME_LENGTH = 24;

export type PlayModeChoice = 'computer' | 'friends';

interface JoinTableModalProps {
  inviteRoomId?: string | null;
  joinError?: string | null;
  onPlayComputer: (name: string) => void;
  onPlayFriends: (name: string) => void;
}

export function JoinTableModal({
  inviteRoomId = null,
  joinError = null,
  onPlayComputer,
  onPlayFriends,
}: JoinTableModalProps) {
  const { t, language, setLanguage } = useTranslation();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isInvite = Boolean(inviteRoomId);

  const validateName = (): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return t('join.enterName');
    return null;
  };

  const pickComputer = () => {
    const nameError = validateName();
    if (nameError) {
      setError(nameError);
      return;
    }
    setError(null);
    onPlayComputer(name.trim());
  };

  const pickFriends = () => {
    const nameError = validateName();
    if (nameError) {
      setError(nameError);
      return;
    }
    setError(null);
    onPlayFriends(name.trim());
  };

  const resolvedJoinError = joinError
    ? joinError.includes('.')
      ? t(joinError)
      : joinError
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div
        className="relative w-full max-w-sm rounded-2xl border border-[#3d2418] bg-gradient-to-b from-[#1a0f0c] to-[#0d1412] p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-title"
      >
        <div className="absolute right-4 top-4">
          <LanguageToggle language={language} onLanguageChange={setLanguage} />
        </div>
        <h2
          id="join-title"
          className="font-serif text-2xl font-bold tracking-wide text-amber-100"
        >
          {t('join.title')}
        </h2>
        <p className="mt-1 text-sm text-emerald-300/70">
          {isInvite
            ? t('join.subtitleInvite', { roomId: inviteRoomId ?? '' })
            : t('join.subtitleDefault')}
        </p>

        <div className="mt-5">
          <label htmlFor="player-name" className="sr-only">
            {t('join.yourName')}
          </label>
          <input
            id="player-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t('join.yourName')}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="nickname"
            autoFocus
            className="w-full rounded-xl border border-[#3d2418] bg-[#0a1210] px-3.5 py-2.5 text-[#f5f0e6] placeholder:text-emerald-700 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
          {error && (
            <p className="mt-2 text-xs text-rose-300/90" role="alert">
              {error}
            </p>
          )}
          {resolvedJoinError && !error && (
            <p className="mt-2 text-xs text-rose-300/90" role="alert">
              {resolvedJoinError}
            </p>
          )}
        </div>

        {isInvite ? (
          <button
            type="button"
            onClick={pickFriends}
            className="mt-4 w-full rounded-xl bg-gradient-to-b from-[#1f7a5c] to-[#0f5c44] py-3 text-sm font-semibold text-[#f5f0e6] shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition hover:from-[#248f6d] hover:to-[#127052]"
          >
            {t('join.joinTable')}
          </button>
        ) : (
          <>
            <p className="mt-5 text-center text-sm font-medium text-emerald-100/90">
              {t('join.modePrompt')}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={pickComputer}
                className="rounded-xl border border-[#3d2418] bg-[#1a0f0c] px-3 py-3 text-sm font-semibold text-emerald-100 transition hover:border-amber-500/40 hover:bg-[#2d1510] hover:text-amber-100"
              >
                {t('join.computer')}
              </button>
              <button
                type="button"
                onClick={pickFriends}
                className="rounded-xl border border-[#3d2418] bg-[#1a0f0c] px-3 py-3 text-sm font-semibold text-emerald-100 transition hover:border-amber-500/40 hover:bg-[#2d1510] hover:text-amber-100"
              >
                {t('join.friends')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
