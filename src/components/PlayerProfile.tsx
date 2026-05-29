import { useState } from 'react';
import type { Player } from '../game/types';
import { profileIconForPlayer } from '../game/gameLogic';
import { useTranslation } from '../i18n/LanguageContext';
import { ProfileIconPicker } from './ProfileIconPicker';
import { TurnTimer } from './TurnTimer';

export type TableSeatPosition = 'top' | 'left' | 'right' | 'bottom';
export type ProfileLayout = 'horizontal' | 'vertical';

interface PlayerProfileProps {
  player: Player;
  displayNumber: number;
  handCount: number;
  reserveCount: number;
  isActive: boolean;
  position: TableSeatPosition;
  profileScale?: number;
  layout?: ProfileLayout;
  turnSecondsRemaining?: number | null;
  turnTimeLimitSec?: number;
  isDisconnected?: boolean;
  canEditAvatar?: boolean;
  onAvatarChange?: (index: number) => void;
}

const POSITION_CLASS: Record<TableSeatPosition, string> = {
  top: 'left-1/2 top-[1%] -translate-x-1/2 lg:top-[3%]',
  left: 'left-[1%] top-1/2 -translate-y-1/2 lg:left-[2%]',
  right: 'right-[1%] top-1/2 -translate-y-1/2 lg:right-[2%]',
  bottom: 'bottom-[2%] left-1/2 -translate-x-1/2 lg:bottom-[5%]',
};

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

const ACTIVE_TURN_GLOW =
  'shadow-[0_0_19px_rgba(255,255,255,0.32),0_0_37px_rgba(255,255,255,0.14)]';

export function PlayerProfile({
  player,
  displayNumber: _displayNumber,
  handCount,
  reserveCount,
  isActive,
  position,
  profileScale = 1,
  layout = 'horizontal',
  turnSecondsRemaining = null,
  turnTimeLimitSec = 15,
  isDisconnected = false,
  canEditAvatar = false,
  onAvatarChange,
}: PlayerProfileProps) {
  const { t, displayPlayerName } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const showTimer =
    isActive &&
    turnSecondsRemaining != null &&
    turnSecondsRemaining >= 0;
  const icon = profileIconForPlayer(player);
  const totalCards = handCount + reserveCount;
  const useVertical =
    layout === 'vertical' && (position === 'left' || position === 'right');
  const editable = canEditAvatar && player.isHuman && onAvatarChange != null;

  const cardStateClass = isActive
    ? 'border-amber-400/90 shadow-[0_0_17px_rgba(255,255,255,0.30)]'
    : 'border-[#5c3d2e]/85';

  const avatarInner = (
    <>
      <span className="text-[2.15rem] leading-none lg:text-[2.5rem] xl:text-[3rem]">{icon}</span>
      {isActive && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-[#1a0f0c] ring-1 ring-[#1a0f0c]/40"
          title={t('profile.currentTurn')}
        >
          ✓
        </span>
      )}
    </>
  );

  const avatar = editable ? (
    <button
      type="button"
      onClick={() => setPickerOpen(true)}
      title={t('profile.changeIcon')}
      aria-label={t('profile.changeIcon')}
      className={[
        AVATAR_CLASS,
        'relative h-[3.75rem] w-[3.75rem] cursor-pointer transition-transform hover:scale-105 lg:h-[4.5rem] lg:w-[4.5rem] xl:h-[5rem] xl:w-[5rem]',
        isActive ? 'ring-amber-400/80 shadow-[0_0_14px_rgba(255,255,255,0.37)]' : '',
        isDisconnected ? 'opacity-45 grayscale' : '',
      ].join(' ')}
    >
      {avatarInner}
    </button>
  ) : (
    <div
      className={[
        AVATAR_CLASS,
        'relative h-[3.75rem] w-[3.75rem] lg:h-[4.5rem] lg:w-[4.5rem] xl:h-[5rem] xl:w-[5rem]',
        isActive ? 'ring-amber-400/80 shadow-[0_0_14px_rgba(255,255,255,0.37)]' : '',
        isDisconnected ? 'opacity-45 grayscale' : '',
      ].join(' ')}
      aria-hidden
    >
      {avatarInner}
    </div>
  );

  const cardBody = (
    <>
      <p className="truncate font-serif text-base font-bold leading-none text-amber-100/95 sm:text-lg">
        {displayPlayerName(player.name)}
      </p>
      <div
        className="mx-auto my-1 h-px w-[88%] bg-gradient-to-r from-transparent via-amber-400/45 to-transparent sm:my-1.5"
        aria-hidden
      />
      {isDisconnected ? (
        <p className="font-serif text-sm font-semibold leading-tight text-rose-300/95">
          {t('profile.disconnected')}
        </p>
      ) : (
        <p className="flex items-baseline justify-center gap-1.5 leading-none">
          <span className="font-serif text-[1.5rem] font-bold tabular-nums text-emerald-100 sm:text-[1.65rem] lg:text-[1.85rem]">
            {totalCards}
          </span>
          <span className="font-serif text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-emerald-100/75 sm:text-xs">
            {t('profile.cardsLabel')}
          </span>
        </p>
      )}
    </>
  );

  const timer =
    showTimer ? (
      <TurnTimer
        secondsRemaining={turnSecondsRemaining}
        totalSeconds={turnTimeLimitSec}
      />
    ) : null;

  return (
    <>
      <div
        className={[
          'absolute z-20',
          editable ? 'pointer-events-auto' : 'pointer-events-none',
          POSITION_CLASS[position],
        ].join(' ')}
      >
        <div
          className={[
            useVertical
              ? 'transition-transform duration-200'
              : 'pl-[2.3rem] transition-transform duration-200 sm:pl-[2.55rem]',
          ].join(' ')}
          style={{
            transform: `scale(${profileScale})`,
            transformOrigin: SCALE_ORIGIN[position],
          }}
        >
          <div className="flex items-center gap-2">
            {useVertical ? (
              <div
                className={[
                  'relative flex flex-col items-center pt-[2.2rem] sm:pt-[2.4rem]',
                  isActive ? ACTIVE_TURN_GLOW : '',
                ].join(' ')}
              >
                <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
                  {avatar}
                </div>
                <div
                  className={[
                    CARD_CLASS,
                    cardStateClass,
                    'min-w-[7.75rem] px-3 pb-2 pt-[2.45rem] sm:min-w-[8.5rem] sm:px-3.5 sm:pb-2.5 sm:pt-[2.65rem]',
                  ].join(' ')}
                >
                  {cardBody}
                </div>
              </div>
            ) : (
              <div className={['relative', isActive ? ACTIVE_TURN_GLOW : ''].join(' ')}>
                <div className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                  {avatar}
                </div>
                <div
                  className={[
                    CARD_CLASS,
                    cardStateClass,
                    'min-w-[10.5rem] py-1 pl-[2.55rem] pr-3 lg:min-w-[12rem] lg:py-1.5 lg:pl-[3rem] lg:pr-4 xl:min-w-[13.5rem] xl:py-1.5 xl:pl-[3.35rem] xl:pr-5',
                  ].join(' ')}
                >
                  {cardBody}
                </div>
              </div>
            )}
            {timer}
          </div>
        </div>
      </div>

      {pickerOpen && onAvatarChange && (
        <ProfileIconPicker
          selectedIndex={player.avatarIndex}
          onSelect={(index) => {
            onAvatarChange(index);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
