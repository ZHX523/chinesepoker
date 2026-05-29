import { useLayoutEffect, useRef, useState } from 'react';
import { computeProfileLayoutState } from '../constants/cardTray';
import type { GameState, PileState } from '../game/types';
import { CenterPile } from './CenterPile';
import { PlayerProfile } from './PlayerProfile';

interface TableFeltProps {
  players: GameState['players'];
  activePlayerIndex: number;
  pile: PileState | null;
  isOpeningTurn: boolean;
  isFreeLead: boolean;
  humanTurn: boolean;
  isDragOver: boolean;
  seatCounts: { hand: number; reserve: number }[];
  turnSecondsRemaining?: number | null;
  turnTimeLimitSec?: number;
  seatDisconnected?: boolean[];
  canEditAvatar?: boolean;
  onAvatarChange?: (index: number) => void;
  statusOverlay?: React.ReactNode;
  onFeltDragEnter: () => void;
  onFeltDragLeave: () => void;
  onFeltDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onFeltDrop: (event: React.DragEvent<HTMLDivElement>) => void;
}

export function TableFelt({
  players,
  activePlayerIndex,
  pile,
  isOpeningTurn,
  isFreeLead,
  humanTurn,
  isDragOver,
  seatCounts,
  turnSecondsRemaining = null,
  turnTimeLimitSec = 15,
  seatDisconnected = [false, false, false, false],
  canEditAvatar = false,
  onAvatarChange,
  statusOverlay,
  onFeltDragEnter,
  onFeltDragLeave,
  onFeltDragOver,
  onFeltDrop,
}: TableFeltProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const feltRef = useRef<HTMLDivElement>(null);
  const [profileLayout, setProfileLayout] = useState(() =>
    computeProfileLayoutState(0, 0, 0, 0),
  );

  useLayoutEffect(() => {
    const felt = feltRef.current;
    const field = fieldRef.current;
    if (!felt) return;

    const recompute = () => {
      const fieldEl = fieldRef.current;
      setProfileLayout(
        computeProfileLayoutState(
          felt.clientWidth,
          felt.clientHeight,
          fieldEl?.clientWidth ?? felt.clientWidth,
          fieldEl?.clientHeight ?? felt.clientHeight,
        ),
      );
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(felt);
    if (field) observer.observe(field);
    window.addEventListener('resize', recompute);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="table-rim relative h-full max-h-full w-full max-w-full">
        <span className="corner-ornament corner-tl" aria-hidden />
        <span className="corner-ornament corner-tr" aria-hidden />
        <span className="corner-ornament corner-bl" aria-hidden />
        <span className="corner-ornament corner-br" aria-hidden />

        <div
          ref={feltRef}
          className={[
            'felt-inner relative h-full w-full overflow-visible',
            isDragOver && humanTurn ? 'felt-play-target' : '',
          ].join(' ')}
        >
          <PlayerProfile
            player={players[1]!}
            displayNumber={3}
            handCount={seatCounts[1]!.hand}
            reserveCount={seatCounts[1]!.reserve}
            isActive={activePlayerIndex === 1}
            position="top"
            profileScale={profileLayout.scale}
            turnSecondsRemaining={
              activePlayerIndex === 1 ? turnSecondsRemaining : null
            }
            turnTimeLimitSec={turnTimeLimitSec}
            isDisconnected={seatDisconnected[1]}
          />
          <PlayerProfile
            player={players[3]!}
            displayNumber={2}
            handCount={seatCounts[3]!.hand}
            reserveCount={seatCounts[3]!.reserve}
            isActive={activePlayerIndex === 3}
            position="left"
            profileScale={profileLayout.scale}
            layout={profileLayout.sideVertical ? 'vertical' : 'horizontal'}
            turnSecondsRemaining={
              activePlayerIndex === 3 ? turnSecondsRemaining : null
            }
            turnTimeLimitSec={turnTimeLimitSec}
            isDisconnected={seatDisconnected[3]}
          />
          <PlayerProfile
            player={players[2]!}
            displayNumber={4}
            handCount={seatCounts[2]!.hand}
            reserveCount={seatCounts[2]!.reserve}
            isActive={activePlayerIndex === 2}
            position="right"
            profileScale={profileLayout.scale}
            layout={profileLayout.sideVertical ? 'vertical' : 'horizontal'}
            turnSecondsRemaining={
              activePlayerIndex === 2 ? turnSecondsRemaining : null
            }
            turnTimeLimitSec={turnTimeLimitSec}
            isDisconnected={seatDisconnected[2]}
          />
          <PlayerProfile
            player={players[0]!}
            displayNumber={1}
            handCount={seatCounts[0]!.hand}
            reserveCount={seatCounts[0]!.reserve}
            isActive={activePlayerIndex === 0}
            position="bottom"
            profileScale={profileLayout.scale}
            turnSecondsRemaining={
              activePlayerIndex === 0 ? turnSecondsRemaining : null
            }
            turnTimeLimitSec={turnTimeLimitSec}
            isDisconnected={seatDisconnected[0]}
            canEditAvatar={canEditAvatar}
            onAvatarChange={onAvatarChange}
          />

          <div
            ref={fieldRef}
            className="field-container play-drop-field absolute inset-0 z-[5] flex items-center justify-center overflow-visible px-1 pb-8 pt-4 sm:px-4 sm:pt-8 sm:pb-14"
            onDragEnter={humanTurn ? onFeltDragEnter : undefined}
            onDragLeave={humanTurn ? onFeltDragLeave : undefined}
            onDragOver={humanTurn ? onFeltDragOver : undefined}
            onDrop={humanTurn ? onFeltDrop : undefined}
          >
            <CenterPile
              fieldRef={fieldRef}
              players={players}
              pile={pile}
              isOpeningTurn={isOpeningTurn}
              isFreeLead={isFreeLead}
              leadPlayerIndex={isFreeLead ? activePlayerIndex : null}
              droppable={humanTurn}
              isDragOver={isDragOver}
            />
          </div>

          {statusOverlay}
        </div>
      </div>
    </div>
  );
}
