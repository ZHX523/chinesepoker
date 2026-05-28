import type { Player } from '../game/types';

interface PlayerBadgeProps {
  player: Player;
  handCount: number;
  reserveCount: number;
  isActive: boolean;
}

const AVATAR_STYLES: Record<number, string> = {
  0: 'from-amber-400 to-amber-600 text-slate-900',
  1: 'from-sky-400 to-sky-600 text-white',
  2: 'from-violet-400 to-violet-600 text-white',
  3: 'from-rose-400 to-rose-600 text-white',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function PlayerBadge({
  player,
  handCount,
  reserveCount,
  isActive,
}: PlayerBadgeProps) {
  const avatarStyle = AVATAR_STYLES[player.id] ?? AVATAR_STYLES[0]!;

  return (
    <div
      className={[
        'flex max-w-[9rem] flex-col items-center gap-1.5 text-center transition-all duration-300',
        isActive ? 'scale-105' : '',
      ].join(' ')}
    >
      <div
        className={[
          'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold shadow-lg sm:h-16 sm:w-16 sm:text-base',
          avatarStyle,
          isActive
            ? 'ring-[3px] ring-amber-400 ring-offset-2 ring-offset-emerald-950 shadow-[0_0_20px_rgba(251,191,36,0.45)]'
            : 'ring-2 ring-white/15',
        ].join(' ')}
        aria-hidden
      >
        {initials(player.name)}
        {isActive && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-emerald-950 bg-amber-400" />
        )}
      </div>
      <p
        className={[
          'text-xs font-semibold leading-tight sm:text-sm',
          isActive ? 'text-amber-200' : 'text-emerald-100/90',
        ].join(' ')}
      >
        {player.name}
      </p>
      <div className="space-y-0.5 text-[10px] leading-snug text-emerald-300/75 sm:text-xs">
        <p>
          <span className="font-mono font-medium text-emerald-100/90">
            {handCount}
          </span>{' '}
          in hand
        </p>
        {reserveCount > 0 && (
          <p>
            <span className="font-mono font-medium text-emerald-100/90">
              {reserveCount}
            </span>{' '}
            in reserve
          </p>
        )}
      </div>
    </div>
  );
}
