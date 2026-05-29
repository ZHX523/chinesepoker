import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslateI18n, useTranslation } from '../i18n/LanguageContext';
import type { ActionLogEntry, ChatMessage, I18nText } from '../game/types';

interface GameSidebarProps {
  actionLog: ActionLogEntry[];
  chatMessages: ChatMessage[];
  onSendChat: (text: string) => void;
  className?: string;
}

type FeedItem =
  | { kind: 'action'; id: string; i18n: I18nText; timestamp: number }
  | {
      kind: 'chat';
      id: string;
      senderId: number;
      senderName: string;
      text: string;
      timestamp: number;
    };

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mergeFeed(
  actionLog: ActionLogEntry[],
  chatMessages: ChatMessage[],
): FeedItem[] {
  const items: FeedItem[] = [
    ...actionLog.map((entry) => ({
      kind: 'action' as const,
      id: `action-${entry.id}`,
      i18n: entry.i18n,
      timestamp: entry.timestamp,
    })),
    ...chatMessages.map((msg) => ({
      kind: 'chat' as const,
      id: `chat-${msg.id}`,
      senderId: msg.senderId,
      senderName: msg.senderName,
      text: msg.text,
      timestamp: msg.timestamp,
    })),
  ];
  return items.sort((a, b) => a.timestamp - b.timestamp);
}

function EyeIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-4.07 5.18" />
      <path d="M6.12 6.12A18.5 18.5 0 0 0 2 12s3.5 7 10 7c1.01 0 1.97-.15 2.87-.42" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

export function GameSidebar({
  actionLog,
  chatMessages,
  onSendChat,
  className = '',
}: GameSidebarProps) {
  const { t, displayPlayerName } = useTranslation();
  const translateI18n = useTranslateI18n();
  const [draft, setDraft] = useState('');
  const [chatMuted, setChatMuted] = useState(false);
  const feedRef = useRef<HTMLUListElement>(null);

  const feed = useMemo(
    () => mergeFeed(actionLog, chatMessages),
    [actionLog, chatMessages],
  );

  useEffect(() => {
    if (chatMuted) return;
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed.length, chatMuted]);

  const submitChat = (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSendChat(text);
    setDraft('');
  };

  return (
    <div
      className={[
        'flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-[#3d2418]/60 bg-[#0a1210]/90 shadow-inner',
        className,
      ].join(' ')}
      aria-label={t('chat.region')}
    >
      <header className="flex shrink-0 items-start justify-between gap-2 border-b border-[#3d2418]/50 px-3 py-2">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-emerald-100">{t('chat.title')}</h2>
          {chatMuted && (
            <p className="text-[10px] text-emerald-400/50">{t('chat.muted')}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setChatMuted((value) => !value)}
          aria-label={chatMuted ? t('chat.unmute') : t('chat.mute')}
          aria-pressed={chatMuted}
          title={chatMuted ? t('chat.show') : t('chat.hide')}
          className={[
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#3d2418]/80',
            'bg-[#1a0f0c]/80 text-emerald-200/80 transition-colors',
            'hover:border-amber-500/35 hover:bg-[#2d1510] hover:text-amber-100',
            chatMuted && 'border-amber-500/35 bg-[#2d1510] text-amber-100/90',
          ].join(' ')}
        >
          {chatMuted ? (
            <EyeOffIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </button>
      </header>

      {chatMuted ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 py-6 text-center">
          <EyeOffIcon className="h-8 w-8 text-emerald-500/35" />
          <p className="text-sm font-medium text-emerald-200/70">{t('chat.mutedTitle')}</p>
          <p className="text-[11px] text-emerald-500/45">
            {t('chat.mutedHint')}
          </p>
        </div>
      ) : (
        <>
      <ul
        ref={feedRef}
        className="min-h-0 w-full flex-1 list-none space-y-2 overflow-y-auto overscroll-contain px-2.5 py-2 text-left"
      >
        {feed.length === 0 ? (
          <li className="px-1 py-6 text-center text-xs text-emerald-500/45">
            {t('chat.empty')}
          </li>
        ) : (
          feed.map((item) => {
            if (item.kind === 'action') {
              return (
                <li key={item.id} className="w-full">
                  <div className="w-full rounded-md bg-amber-500/10 px-2.5 py-1.5 text-left text-[10px] leading-snug text-amber-200/90 ring-1 ring-amber-500/15 sm:text-[11px]">
                    <span className="mr-1.5 font-mono text-[9px] text-amber-400/55">
                      {formatTime(item.timestamp)}
                    </span>
                    {translateI18n(item.i18n)}
                  </div>
                </li>
              );
            }

            const isYou = item.senderId === 0;
            return (
              <li key={item.id} className="w-full">
                <div
                  className={[
                    'block w-fit max-w-[92%] rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs',
                    isYou
                      ? 'ml-auto bg-emerald-900/50 text-right text-emerald-50 ring-1 ring-emerald-600/30'
                      : 'bg-slate-900/80 text-left text-slate-200 ring-1 ring-slate-700/40',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'mb-0.5 flex items-baseline gap-1.5',
                      isYou ? 'justify-end' : 'justify-start',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'font-semibold',
                        isYou ? 'text-emerald-100/90' : 'text-emerald-200/90',
                      ].join(' ')}
                    >
                      {displayPlayerName(item.senderName)}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] text-emerald-600/60">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                  <p className="leading-snug break-words">{item.text}</p>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <form
        onSubmit={submitChat}
        className="shrink-0 border-t border-[#3d2418]/50 p-2.5"
      >
        <div className="flex gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('chat.placeholder')}
            maxLength={280}
            className="min-w-0 flex-1 rounded-lg border border-[#3d2418] bg-[#0a1210] px-2.5 py-1.5 text-xs text-[#f5f0e6] placeholder:text-emerald-700 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="shrink-0 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('common.send')}
          </button>
        </div>
      </form>
        </>
      )}
    </div>
  );
}
