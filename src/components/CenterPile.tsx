import { combinationLabel } from '../game/cards';
import type { PileState } from '../game/types';
import { PlayingCard } from './PlayingCard';

interface CenterPileProps {
  pile: PileState | null;
  isOpeningTurn: boolean;
  isFreeLead?: boolean;
  leadPlayerIndex?: number | null;
  droppable?: boolean;
  isDragOver?: boolean;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
}

function playerLabel(index: number): string {
  return index === 0 ? 'You' : `Player ${index + 1}`;
}

function cardOverlapClass(count: number): string {
  if (count >= 5) return '-ml-[2.25rem] sm:-ml-[2.65rem]';
  if (count === 4) return '-ml-4 sm:-ml-5';
  return '-ml-3 sm:-ml-4';
}

export function CenterPile({
  pile,
  isOpeningTurn,
  isFreeLead = false,
  leadPlayerIndex = null,
  droppable = false,
  isDragOver = false,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: CenterPileProps) {
  const dropHighlight =
    droppable &&
    isDragOver &&
    'border-amber-400/80 bg-amber-500/15 ring-2 ring-amber-400/50';

  const dropIdle =
    droppable && !isDragOver && 'border-emerald-400/40 ring-1 ring-emerald-300/25';

  if (!pile) {
    return (
      <div
        onDragEnter={droppable ? onDragEnter : undefined}
        onDragLeave={droppable ? onDragLeave : undefined}
        onDragOver={droppable ? onDragOver : undefined}
        onDrop={droppable ? onDrop : undefined}
        className={[
          'flex min-h-[8rem] min-w-[14rem] max-w-[90%] flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center backdrop-blur-sm transition-all duration-200 sm:min-w-[18rem]',
          'border-emerald-300/35 bg-[#062f22]/75',
          dropHighlight,
          dropIdle,
        ].join(' ')}
      >
        <p className="font-serif text-sm font-semibold text-emerald-50 sm:text-base">
          {isOpeningTurn
            ? 'Opening lead — include 3♦'
            : 'Center trick — play to lead'}
        </p>
        {droppable && (
          <p className="mt-2 text-xs text-amber-200/85">
            Drag cards here to play
          </p>
        )}
      </div>
    );
  }

  const { combination, playedByIndex } = pile;

  return (
    <div
      onDragEnter={droppable ? onDragEnter : undefined}
      onDragLeave={droppable ? onDragLeave : undefined}
      onDragOver={droppable ? onDragOver : undefined}
      onDrop={droppable ? onDrop : undefined}
      className={[
        'flex max-w-[95%] flex-col items-center gap-2 rounded-xl border px-3 py-3 backdrop-blur-md transition-all duration-200 sm:px-4 sm:py-4',
        'border-[#c9a227]/25 bg-[#062f22]/80 shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
        isFreeLead ? 'ring-1 ring-amber-400/35' : '',
        dropHighlight,
        dropIdle,
      ].join(' ')}
    >
      <span className="rounded-full bg-amber-500/20 px-3 py-0.5 font-serif text-xs font-bold uppercase tracking-widest text-amber-100">
        {isFreeLead ? 'Free lead' : combinationLabel(combination.type)}
      </span>
      <div
        className={[
          'inline-flex items-end justify-center overflow-visible',
          isFreeLead ? 'opacity-70' : '',
        ].join(' ')}
      >
        {combination.cards.map((card, i) => (
          <div
            key={card.id}
            className={[
              'shrink-0 first:ml-0',
              i > 0 ? cardOverlapClass(combination.cards.length) : '',
            ].join(' ')}
            style={{ zIndex: i }}
          >
            <PlayingCard card={card} size="lg" />
          </div>
        ))}
      </div>
      <p className="text-center text-[11px] font-medium text-emerald-100/85 sm:text-xs">
        {isFreeLead && leadPlayerIndex != null ? (
          <>
            <span className="text-amber-200">{playerLabel(leadPlayerIndex)}</span>{' '}
            may lead
          </>
        ) : (
          <>
            Played by <span className="text-[#f5f0e6]">{playerLabel(playedByIndex)}</span>
          </>
        )}
      </p>
      {droppable && (
        <p className="text-[10px] text-amber-200/70">Drop cards to play</p>
      )}
    </div>
  );
}
