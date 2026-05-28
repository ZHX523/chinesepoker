import { GameSidebar } from './GameSidebar';
import { PassButton } from './PassButton';
import type { ActionLogEntry, ChatMessage } from '../game/types';

interface RightGameRailProps {
  actionLog: ActionLogEntry[];
  chatMessages: ChatMessage[];
  onSendChat: (text: string) => void;
  onPass: () => void;
  passDisabled: boolean;
}

export function RightGameRail({
  actionLog,
  chatMessages,
  onSendChat,
  onPass,
  passDisabled,
}: RightGameRailProps) {
  return (
    <aside className="flex h-full w-80 shrink-0 flex-col overflow-hidden border-l border-[#3d2418] bg-[#0d1412]/95 sm:w-96">
      <header className="shrink-0 border-b border-[#3d2418]/80 px-4 py-3">
        <h1 className="font-serif text-lg font-bold tracking-wide text-amber-100">
          Big Two
        </h1>
        <p className="text-[10px] text-emerald-300/60">Cho Dai Di · 4 players</p>
      </header>

      <div className="flex min-h-0 flex-[8] flex-col overflow-hidden p-3 pb-2">
        <GameSidebar
          actionLog={actionLog}
          chatMessages={chatMessages}
          onSendChat={onSendChat}
          className="min-h-0 flex-1"
        />
      </div>

      <div className="mt-auto flex shrink-0 flex-[2] flex-col items-center justify-center border-t border-[#3d2418]/80 px-4 py-4">
        <p className="mb-2 text-center text-[10px] uppercase tracking-widest text-emerald-300/50">
          Action
        </p>
        <PassButton disabled={passDisabled} onClick={onPass} />
      </div>
    </aside>
  );
}
