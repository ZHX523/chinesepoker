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
  statusOverlay?: React.ReactNode;
  onPileDragEnter: () => void;
  onPileDragLeave: () => void;
  onPileDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onPileDrop: (event: React.DragEvent<HTMLDivElement>) => void;
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
  statusOverlay,
  onPileDragEnter,
  onPileDragLeave,
  onPileDragOver,
  onPileDrop,
}: TableFeltProps) {
  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center p-1 sm:p-2">
      <div className="table-rim relative h-full max-h-full w-full max-w-full">
        <span className="corner-ornament corner-tl" aria-hidden />
        <span className="corner-ornament corner-tr" aria-hidden />
        <span className="corner-ornament corner-bl" aria-hidden />
        <span className="corner-ornament corner-br" aria-hidden />

        <div className="felt-inner relative h-full w-full overflow-hidden">
          <PlayerProfile
            player={players[1]!}
            displayNumber={3}
            handCount={seatCounts[1]!.hand}
            reserveCount={seatCounts[1]!.reserve}
            isActive={activePlayerIndex === 1}
            isLocal={false}
            position="top"
          />
          <PlayerProfile
            player={players[3]!}
            displayNumber={2}
            handCount={seatCounts[3]!.hand}
            reserveCount={seatCounts[3]!.reserve}
            isActive={activePlayerIndex === 3}
            isLocal={false}
            position="left"
          />
          <PlayerProfile
            player={players[2]!}
            displayNumber={4}
            handCount={seatCounts[2]!.hand}
            reserveCount={seatCounts[2]!.reserve}
            isActive={activePlayerIndex === 2}
            isLocal={false}
            position="right"
          />
          <PlayerProfile
            player={players[0]!}
            displayNumber={1}
            handCount={seatCounts[0]!.hand}
            reserveCount={seatCounts[0]!.reserve}
            isActive={activePlayerIndex === 0}
            isLocal
            position="bottom"
          />

          <div className="absolute inset-0 flex items-center justify-center px-4 pt-8 pb-14">
            <CenterPile
              pile={pile}
              isOpeningTurn={isOpeningTurn}
              isFreeLead={isFreeLead}
              leadPlayerIndex={isFreeLead ? activePlayerIndex : null}
              droppable={humanTurn}
              isDragOver={isDragOver}
              onDragEnter={onPileDragEnter}
              onDragLeave={onPileDragLeave}
              onDragOver={onPileDragOver}
              onDrop={onPileDrop}
            />
          </div>

          {statusOverlay}
        </div>
      </div>
    </div>
  );
}
