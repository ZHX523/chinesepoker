import type { Player } from '../game/types';

export type TableSeatPosition = 'top' | 'left' | 'right' | 'bottom';

interface PlayerProfileProps {
  player: Player;
  displayNumber: number;
  handCount: number;
  reserveCount: number;
  isActive: boolean;
  isLocal: boolean;
  position: TableSeatPosition;
}

const ZODIAC_ICON: Record<number, string> = {
  0: '🐼',
  1: '🐯',
  2: '🐉',
  3: '🦅',
};

const POSITION_CLASS: Record<TableSeatPosition, string> = {
  top: 'left-1/2 top-[4%] -translate-x-1/2',
  left: 'left-[3%] top-1/2 -translate-y-1/2',
  right: 'right-[3%] top-1/2 -translate-y-1/2',
  bottom: 'bottom-[6%] left-1/2 -translate-x-1/2',
};

export function PlayerProfile({
  player,
  displayNumber,
  handCount,
  reserveCount,
  isActive,
  isLocal,
  position,
}: PlayerProfileProps) {
  const icon = ZODIAC_ICON[player.id] ?? '🀄';

  return (
    <div
      className={[
        'absolute z-20 w-[8.5rem] max-w-[34vw] rounded-lg px-2 py-1.5 text-center shadow-lg transition-all duration-300 sm:w-[9.5rem]',
        'border bg-[#1a0f0c]/88 backdrop-blur-sm',
        isLocal
          ? 'border-amber-400/90 shadow-[0_0_18px_rgba(212,175,55,0.35)]'
          : 'border-[#5c3d2e]/80',
        isActive && !isLocal ? 'ring-2 ring-amber-300/50' : '',
        POSITION_CLASS[position],
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <div
          className={[
            'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg',
            'bg-gradient-to-br from-[#3d2418] to-[#2d1510] ring-1 ring-[#c9a227]/40',
          ].join(' ')}
          aria-hidden
        >
          {icon}
          {isLocal && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-[#1a0f0c]"
              title="You"
            >
              ✓
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-amber-100/90">
            P{displayNumber}
          </p>
          <p
            className={[
              'truncate text-xs font-semibold',
              isLocal ? 'text-amber-200' : 'text-[#f5f0e6]',
            ].join(' ')}
          >
            {player.name}
          </p>
          <p className="font-mono text-[10px] text-emerald-200/75">
            {handCount} cards
            {reserveCount > 0 ? ` · ${reserveCount} held` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
