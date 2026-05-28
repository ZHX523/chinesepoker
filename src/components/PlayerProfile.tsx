import type { Player } from '../game/types';

export type TableSeatPosition = 'top' | 'left' | 'right' | 'bottom';
export type ProfileLayout = 'horizontal' | 'vertical';

interface PlayerProfileProps {
  player: Player;
  displayNumber: number;
  handCount: number;
  reserveCount: number;
  isActive: boolean;
  isLocal: boolean;
  position: TableSeatPosition;
  profileScale?: number;
  layout?: ProfileLayout;
}

/** Stable “random” icon per player id */
const PROFILE_ICONS = [
  '🐼',
  '🐯',
  '🐉',
  '🦅',
  '🦊',
  '🐸',
  '🦉',
  '🐙',
  '🦁',
  '🐨',
  '🦄',
  '🐲',
  '🦋',
  '🐺',
  '🦈',
  '🐢',
] as const;

function profileIcon(playerId: number): string {
  return PROFILE_ICONS[playerId % PROFILE_ICONS.length] ?? '🀄';
}

const POSITION_CLASS: Record<TableSeatPosition, string> = {
  top: 'left-1/2 top-[3%] -translate-x-1/2',
  left: 'left-[2%] top-1/2 -translate-y-1/2',
  right: 'right-[2%] top-1/2 -translate-y-1/2',
  bottom: 'bottom-[5%] left-1/2 -translate-x-1/2',
};

/** Scale toward table center so profiles tuck inward when shrunk */
const SCALE_ORIGIN: Record<TableSeatPosition, string> = {
  top: 'center bottom',
  left: 'right center',
  right: 'left center',
  bottom: 'center top',
};

const CARD_CLASS = [
  'rounded-lg border text-center shadow-lg backdrop-blur-sm',
  'bg-[#1a0f0c]/90',
].join(' ');

const AVATAR_CLASS = [
  'flex items-center justify-center rounded-full bg-gradient-to-br from-[#3d2418] to-[#2d1510]',
  'ring-2 ring-[#c9a227]/55 shadow-md',
].join(' ');

export function PlayerProfile({
  player,
  displayNumber: _displayNumber,
  handCount,
  reserveCount,
  isActive,
  isLocal,
  position,
  profileScale = 1,
  layout = 'horizontal',
}: PlayerProfileProps) {
  const icon = profileIcon(player.id);
  const totalCards = handCount + reserveCount;
  const useVertical =
    layout === 'vertical' && (position === 'left' || position === 'right');

  const cardStateClass = [
    isLocal
      ? 'border-amber-400/90 shadow-[0_0_20px_rgba(212,175,55,0.35)]'
      : 'border-[#5c3d2e]/85',
    isActive && !isLocal ? 'ring-2 ring-amber-300/50' : '',
  ].join(' ');

  const avatar = (
    <div
      className={[
        AVATAR_CLASS,
        'relative h-[4.5rem] w-[4.5rem] sm:h-[5rem] sm:w-[5rem]',
        isLocal ? 'ring-amber-400/80' : '',
      ].join(' ')}
      aria-hidden
    >
      <span className="text-[1.75rem] leading-none sm:text-[2rem]">{icon}</span>
      {isLocal && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-[#1a0f0c] ring-1 ring-[#1a0f0c]/40"
          title="You"
        >
          ✓
        </span>
      )}
    </div>
  );

  const cardBody = (
    <>
      <p className="truncate font-serif text-base font-bold leading-tight text-amber-100/95 sm:text-lg">
        {player.name}
      </p>
      <p className="mt-[0.475rem] font-serif text-base font-semibold leading-tight tabular-nums text-emerald-100/90 sm:text-lg">
        {totalCards} cards
      </p>
    </>
  );

  return (
    <div className={['absolute z-20', POSITION_CLASS[position]].join(' ')}>
      <div
        className={useVertical ? 'transition-transform duration-200' : 'pl-[2.3rem] transition-transform duration-200 sm:pl-[2.55rem]'}
        style={{
          transform: `scale(${profileScale})`,
          transformOrigin: SCALE_ORIGIN[position],
        }}
      >
        {useVertical ? (
          <div className="relative flex flex-col items-center pt-[2.35rem] sm:pt-[2.6rem]">
            <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
              {avatar}
            </div>
            <div
              className={[
                CARD_CLASS,
                cardStateClass,
                'min-w-[7.75rem] px-3 pb-[0.7125rem] pt-[2.65rem] sm:min-w-[8.5rem] sm:px-3.5 sm:pb-[0.83125rem] sm:pt-[2.9rem]',
              ].join(' ')}
            >
              {cardBody}
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
              {avatar}
            </div>
            <div
              className={[
                CARD_CLASS,
                cardStateClass,
                'min-w-[12rem] py-[0.7125rem] pl-[3rem] pr-4 sm:min-w-[13.5rem] sm:py-[0.83125rem] sm:pl-[3.35rem] sm:pr-5',
              ].join(' ')}
            >
              {cardBody}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
