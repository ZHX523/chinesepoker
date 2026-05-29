import { useState } from 'react';
import { createPortal } from 'react-dom';
import { GameSidebar } from './GameSidebar';
import { BigTwoMenu } from './BigTwoMenu';
import { LanguageToggle } from './LanguageToggle';
import { PassButton } from './PassButton';
import type { ActionLogEntry, ChatMessage } from '../game/types';
import { GAME_TITLES } from '../settings/gameSettings';
import { useTranslation } from '../i18n/LanguageContext';

interface RightGameRailProps {
  actionLog: ActionLogEntry[];
  chatMessages: ChatMessage[];
  onSendChat: (text: string) => void;
  onPass: () => void;
  onRestartGame: () => void;
  onLobby: () => void;
  passDisabled: boolean;
  turnTimerSeconds: number;
  onTurnTimerChange: (seconds: number) => void;
  turnAlertMuted: boolean;
  onTurnAlertMutedChange: (muted: boolean) => void;
}

function GameTitle({
  language,
  variant = 'default',
}: {
  language: 'en' | 'zh';
  variant?: 'default' | 'rail';
}) {
  const titleLines =
    language === 'zh' ? [GAME_TITLES.zh] : GAME_TITLES.en.split(' ');

  const sizeClass =
    variant === 'rail'
      ? language === 'zh'
        ? 'text-xs @[11rem]/rail-header:text-sm @[14rem]/rail-header:text-base @[18rem]/rail-header:text-xl @[22rem]/rail-header:text-3xl'
        : 'text-[0.55rem] leading-[1.08] @[11rem]/rail-header:text-[0.625rem] @[14rem]/rail-header:text-xs @[18rem]/rail-header:text-lg @[22rem]/rail-header:text-2xl'
      : language === 'zh'
        ? 'text-base sm:text-lg md:text-xl'
        : 'text-xs sm:text-sm md:text-lg';

  return (
    <h1
      className={[
        'flex min-w-0 max-w-full flex-col items-center justify-center text-center font-serif font-bold tracking-wide text-amber-100',
        sizeClass,
      ].join(' ')}
    >
      {titleLines.map((line) => (
        <span key={line} className="block max-w-full truncate whitespace-nowrap">
          {line}
        </span>
      ))}
    </h1>
  );
}

function ChatBubbleIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

export function RightGameRail({
  actionLog,
  chatMessages,
  onSendChat,
  onPass,
  onRestartGame,
  onLobby,
  passDisabled,
  turnTimerSeconds,
  onTurnTimerChange,
  turnAlertMuted,
  onTurnAlertMutedChange,
}: RightGameRailProps) {
  const { language, setLanguage, t } = useTranslation();
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const unreadChat = chatMessages.length > 0;

  const mobileChatDrawer =
    mobileChatOpen &&
    createPortal(
      <div
        className="fixed inset-0 z-[10060] flex flex-col justify-end bg-black/50 md:hidden"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setMobileChatOpen(false);
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('chat.region')}
          className="safe-area-bottom flex max-h-[min(72dvh,520px)] min-h-[40dvh] flex-col rounded-t-2xl border border-[#3d2418] bg-[#0d1412] shadow-2xl"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[#3d2418]/80 px-4 py-3">
            <p className="font-serif text-base font-semibold text-amber-100">
              {t('chat.region')}
            </p>
            <button
              type="button"
              onClick={() => setMobileChatOpen(false)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-amber-100/80"
            >
              {t('common.close')}
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 pb-2">
            <GameSidebar
              actionLog={actionLog}
              chatMessages={chatMessages}
              onSendChat={onSendChat}
              className="min-h-0 flex-1"
            />
          </div>
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      <header className="relative z-40 flex h-14 shrink-0 items-center border-b border-[#3d2418]/80 bg-[#0d1412]/95 px-2 md:hidden">
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 sm:gap-2">
          <div className="shrink-0">
            <LanguageToggle
              language={language}
              onLanguageChange={setLanguage}
              size="lg"
            />
          </div>
          <div className="min-w-0 overflow-hidden px-0.5">
            <GameTitle language={language} />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMobileChatOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-[#3d2418] bg-[#1a0f0c]/90 text-amber-100/90"
              aria-label={t('chat.show')}
            >
              <ChatBubbleIcon className="h-5 w-5" />
              {unreadChat && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-400" />
              )}
            </button>
            <BigTwoMenu
              onRestartGame={onRestartGame}
              onLobby={onLobby}
              turnTimerSeconds={turnTimerSeconds}
              onTurnTimerChange={onTurnTimerChange}
              turnAlertMuted={turnAlertMuted}
              onTurnAlertMutedChange={onTurnAlertMutedChange}
              menuButtonSize="lg"
            />
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="relative z-30 hidden h-full min-h-0 min-w-0 flex-[1] flex-col overflow-hidden border-l border-[#3d2418] bg-[#0d1412]/95 md:flex">
        <header className="@container/rail-header relative z-40 flex min-h-[3.25rem] flex-[8] shrink-0 items-center border-b border-[#3d2418]/80 px-1.5 sm:px-2">
          <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1">
            <div className="shrink-0">
              <LanguageToggle
                language={language}
                onLanguageChange={setLanguage}
                size="lg"
                compact
              />
            </div>
            <div className="min-w-0 overflow-hidden px-0.5">
              <GameTitle language={language} variant="rail" />
            </div>
            <div className="shrink-0">
              <BigTwoMenu
                onRestartGame={onRestartGame}
                onLobby={onLobby}
                turnTimerSeconds={turnTimerSeconds}
                onTurnTimerChange={onTurnTimerChange}
                turnAlertMuted={turnAlertMuted}
                onTurnAlertMutedChange={onTurnAlertMutedChange}
                menuButtonSize="md"
              />
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-[72] flex-col overflow-hidden p-3 pb-2">
          <GameSidebar
            actionLog={actionLog}
            chatMessages={chatMessages}
            onSendChat={onSendChat}
            className="min-h-0 flex-1"
          />
        </div>

        <div className="pass-action-panel flex min-h-0 w-full shrink-0 flex-[20] items-center justify-center px-2 py-2">
          <PassButton
            disabled={passDisabled}
            onClick={onPass}
            className="@container aspect-square h-[75%] w-[75%] max-h-full max-w-full min-h-20 min-w-20"
          />
        </div>
      </aside>

      {mobileChatDrawer}
    </>
  );
}
