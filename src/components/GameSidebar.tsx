import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActionLogEntry, ChatMessage } from '../game/types';

interface GameSidebarProps {
  actionLog: ActionLogEntry[];
  chatMessages: ChatMessage[];
  onSendChat: (text: string) => void;
  className?: string;
}

type FeedItem =
  | { kind: 'action'; id: string; text: string; timestamp: number }
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
      text: entry.text,
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

export function GameSidebar({
  actionLog,
  chatMessages,
  onSendChat,
  className = '',
}: GameSidebarProps) {
  const [draft, setDraft] = useState('');
  const feedRef = useRef<HTMLUListElement>(null);

  const feed = useMemo(
    () => mergeFeed(actionLog, chatMessages),
    [actionLog, chatMessages],
  );

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed.length]);

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
      aria-label="Game chat"
    >
      <header className="shrink-0 border-b border-[#3d2418]/50 px-3 py-2">
        <h2 className="text-sm font-bold text-emerald-100">Table Chat</h2>
        <p className="text-[10px] text-emerald-400/50">System · players</p>
      </header>

      <ul
        ref={feedRef}
        className="min-h-0 w-full flex-1 list-none space-y-2 overflow-y-auto overscroll-contain px-2.5 py-2 text-left"
      >
        {feed.length === 0 ? (
          <li className="px-1 py-6 text-center text-xs text-emerald-500/45">
            Game log and chat appear here…
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
                    {item.text}
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
                      {item.senderName}
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
          <button
            type="button"
            className="shrink-0 rounded-lg border border-[#3d2418] bg-[#1a0f0c] px-2 text-sm text-emerald-300/70 hover:bg-[#2d1510]"
            aria-label="Emoji picker"
            title="Emoji (coming soon)"
          >
            ☺
          </button>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message…"
            maxLength={280}
            className="min-w-0 flex-1 rounded-lg border border-[#3d2418] bg-[#0a1210] px-2.5 py-1.5 text-xs text-[#f5f0e6] placeholder:text-emerald-700 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="shrink-0 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
