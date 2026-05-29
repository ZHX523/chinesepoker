import { useCallback, useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import type { RoomPlayer } from '../multiplayer/room';
import { MAX_TABLE_PLAYERS } from '../multiplayer/constants';

const SEAT_LABEL_KEYS = ['seats.bottom', 'seats.top', 'seats.right', 'seats.left'] as const;

interface ShareFriendsModalProps {
  shareUrl: string;
  seats: (RoomPlayer | null)[];
  isHost: boolean;
  onAddComputer: (seatIndex: number) => void;
  onRemoveComputer: (seatIndex: number) => void;
  onStartGame: () => void;
}

export function ShareFriendsModal({
  shareUrl,
  seats,
  isHost,
  onAddComputer,
  onRemoveComputer,
  onStartGame,
}: ShareFriendsModalProps) {
  const { t, displayPlayerName } = useTranslation();
  const [copied, setCopied] = useState(false);
  const filledCount = seats.filter((seat) => seat != null).length;
  const tableFull = filledCount >= MAX_TABLE_PLAYERS;
  const canStart = isHost && tableFull;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div
        className="w-full max-w-md rounded-2xl border border-[#3d2418] bg-gradient-to-b from-[#1a0f0c] to-[#0d1412] p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
      >
        <h2
          id="share-title"
          className="font-serif text-2xl font-bold tracking-wide text-amber-100"
        >
          {t('share.title')}
        </h2>
        <p className="mt-1 text-sm text-emerald-300/70">{t('share.subtitle')}</p>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="min-w-0 flex-1 rounded-xl border border-[#3d2418] bg-[#0a1210] px-3 py-2 text-xs text-emerald-100/90"
            aria-label={t('share.shareLink')}
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            onClick={copyLink}
            className="shrink-0 rounded-xl border border-amber-500/35 bg-[#2d1510] px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-[#3d2418]"
          >
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/60">
            {t('share.tableSeats', { filled: filledCount, max: MAX_TABLE_PLAYERS })}
          </p>
          <ul className="mt-2 space-y-1.5">
            {seats.map((seat, seatIndex) => {
              const labelKey = SEAT_LABEL_KEYS[seatIndex];
              const label = labelKey
                ? t(labelKey)
                : t('share.seatFallback', { n: seatIndex + 1 });

              if (seat) {
                return (
                  <li
                    key={seat.sessionId}
                    className="flex items-center justify-between gap-2 rounded-lg bg-[#0a1210]/80 px-3 py-2 text-sm text-emerald-100 ring-1 ring-[#3d2418]/60"
                  >
                    <div className="min-w-0">
                      <span className="block truncate font-medium">
                        {displayPlayerName(seat.name)}
                      </span>
                      <span className="text-[10px] text-emerald-500/50">{label}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {seat.isHost && (
                        <span className="text-[10px] font-semibold uppercase text-amber-300/80">
                          {t('common.host')}
                        </span>
                      )}
                      {seat.isComputer && (
                        <span className="text-[10px] font-semibold uppercase text-sky-300/80">
                          {t('common.computer')}
                        </span>
                      )}
                      {isHost && seat.isComputer && (
                        <button
                          type="button"
                          onClick={() => onRemoveComputer(seatIndex)}
                          className="rounded-md border border-[#3d2418]/80 px-1.5 py-0.5 text-[10px] text-emerald-300/70 transition hover:border-rose-500/40 hover:text-rose-200"
                          aria-label={t('share.removeFromSeat', {
                            name: displayPlayerName(seat.name),
                            label,
                          })}
                        >
                          {t('common.remove')}
                        </button>
                      )}
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={`empty-${seatIndex}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-[#3d2418]/50 px-3 py-2"
                >
                  <div>
                    <span className="block text-sm text-emerald-600/45">
                      {t('share.emptySeat')}
                    </span>
                    <span className="text-[10px] text-emerald-600/35">{label}</span>
                  </div>
                  {isHost ? (
                    <button
                      type="button"
                      onClick={() => onAddComputer(seatIndex)}
                      className="shrink-0 rounded-lg border border-sky-500/30 bg-sky-950/40 px-2.5 py-1 text-[11px] font-semibold text-sky-200/90 transition hover:border-sky-400/50 hover:bg-sky-900/50"
                    >
                      {t('share.addComputer')}
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-600/40">
                      {t('common.waiting')}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {isHost ? (
          <button
            type="button"
            disabled={!canStart}
            onClick={onStartGame}
            className="mt-5 w-full rounded-xl bg-gradient-to-b from-[#1f7a5c] to-[#0f5c44] py-3 text-sm font-semibold text-[#f5f0e6] shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition hover:from-[#248f6d] hover:to-[#127052] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {t('share.startGame')}
          </button>
        ) : (
          <p className="mt-5 text-center text-sm text-emerald-300/60">
            {t('share.waitingHost')}
          </p>
        )}
      </div>
    </div>
  );
}
