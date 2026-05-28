import { useLayoutEffect, useRef, useState } from 'react';
import { combinationLabel } from '../game/cards';
import {
  PILE_CARD_OVERLAP,
  PILE_SHELL_HEIGHT_RATIO,
  PILE_SHELL_MAX_HEIGHT,
  PILE_SHELL_MAX_WIDTH,
  PILE_SHELL_MIN_HEIGHT,
  PILE_SHELL_MIN_WIDTH,
  PILE_SHELL_WIDTH_RATIO,
  computePileCardScale,
  fitPileShellDimension,
  pileFiveCardFootprint,
} from '../constants/cardTray';
import type { PileState } from '../game/types';
import { PlayingCard } from './PlayingCard';

interface CenterPileProps {
  pile: PileState | null;
  isOpeningTurn: boolean;
  isFreeLead?: boolean;
  leadPlayerIndex?: number | null;
  droppable?: boolean;
  isDragOver?: boolean;
  fieldRef: React.RefObject<HTMLDivElement | null>;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
}

function playerLabel(index: number): string {
  return index === 0 ? 'You' : `Player ${index + 1}`;
}

const PILE_CARD_SLOT =
  'center-pile-cards relative z-10 flex min-h-0 w-full flex-1 items-center justify-center overflow-visible';

const PILE_SHELL =
  'center-pile shrink-0 rounded-xl border border-[#c9a227]/25 bg-[#062f22]/80 shadow-[0_8px_32px_rgba(0,0,0,0.35)]';

const BADGE_CLASS =
  'shrink-0 rounded-full bg-amber-500/20 px-3 py-0.5 font-serif text-[clamp(0.6rem,1.2vh,0.75rem)] font-bold uppercase tracking-widest text-amber-100';

const FOOTER_CLASS =
  'shrink-0 text-[clamp(0.6rem,1.2vh,0.75rem)] font-medium text-emerald-100/85';

export function CenterPile({
  pile,
  isOpeningTurn,
  isFreeLead = false,
  leadPlayerIndex = null,
  droppable = false,
  isDragOver = false,
  fieldRef,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: CenterPileProps) {
  const pileShellRef = useRef<HTMLDivElement>(null);
  const [pileCardScale, setPileCardScale] = useState(1);
  const [shellSize, setShellSize] = useState({ width: 0, height: 0 });

  const dropHighlight =
    droppable &&
    isDragOver &&
    'border-amber-400/80 bg-amber-500/15 ring-2 ring-amber-400/50';

  const dropIdle =
    droppable && !isDragOver && 'border-emerald-400/40 ring-1 ring-emerald-300/25';

  const hasPile = pile != null;
  const combination = pile?.combination;
  const playedByIndex = pile?.playedByIndex ?? 0;
  const { width: comboWidth, height: comboHeight } = pileFiveCardFootprint();

  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const recompute = () => {
      const fieldWidth = field.clientWidth;
      const fieldHeight = field.clientHeight;
      if (fieldWidth <= 0 || fieldHeight <= 0) return;

      const shellWidth = fitPileShellDimension(
        fieldWidth,
        PILE_SHELL_WIDTH_RATIO,
        PILE_SHELL_MAX_WIDTH,
        PILE_SHELL_MIN_WIDTH,
      );
      const shellHeight = fitPileShellDimension(
        fieldHeight,
        PILE_SHELL_HEIGHT_RATIO,
        PILE_SHELL_MAX_HEIGHT,
        PILE_SHELL_MIN_HEIGHT,
      );
      setShellSize({ width: shellWidth, height: shellHeight });
      setPileCardScale(computePileCardScale(shellWidth, shellHeight));
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(field);

    window.addEventListener('resize', recompute);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [fieldRef, comboWidth, comboHeight]);

  const badgeLabel = hasPile && combination
    ? isFreeLead
      ? 'Free lead'
      : combinationLabel(combination.type)
    : isOpeningTurn
      ? 'Opening lead'
      : 'Center trick';

  const footer = hasPile && combination ? (
    isFreeLead && leadPlayerIndex != null ? (
      <>
        <span className="text-amber-200">{playerLabel(leadPlayerIndex)}</span> may lead
      </>
    ) : (
      <>
        Played by <span className="text-[#f5f0e6]">{playerLabel(playedByIndex)}</span>
      </>
    )
  ) : (
    <>
      {isOpeningTurn ? 'Include 3♦ in your play' : 'Play to lead'}
      {droppable && (
        <>
          {' '}
          <span className="text-amber-200/90">· drag cards here</span>
        </>
      )}
    </>
  );

  return (
    <div
      ref={pileShellRef}
      onDragEnter={droppable ? onDragEnter : undefined}
      onDragLeave={droppable ? onDragLeave : undefined}
      onDragOver={droppable ? onDragOver : undefined}
      onDrop={droppable ? onDrop : undefined}
      style={
        shellSize.width > 0 && shellSize.height > 0
          ? { width: shellSize.width, height: shellSize.height }
          : undefined
      }
      className={[
        'relative flex flex-col items-center justify-center gap-1.5 overflow-visible px-3 py-2.5 text-center backdrop-blur-md',
        PILE_SHELL,
        !hasPile ? 'border-emerald-300/35 bg-[#062f22]/75' : '',
        isFreeLead ? 'ring-1 ring-amber-400/35' : '',
        dropHighlight,
        dropIdle,
      ].join(' ')}
    >
      <span className={BADGE_CLASS}>{badgeLabel}</span>

      <div className={PILE_CARD_SLOT}>
        <div
          className={[
            'relative overflow-visible',
            hasPile && isFreeLead ? 'opacity-70' : '',
          ].join(' ')}
          style={{
            width: comboWidth,
            height: comboHeight,
            transform: `scale(${pileCardScale})`,
            transformOrigin: 'center center',
          }}
        >
          {hasPile && combination ? (
            <div className="absolute bottom-0 left-1/2 inline-flex -translate-x-1/2 items-end justify-center overflow-visible">
              {combination.cards.map((card, i) => (
                <div
                  key={card.id}
                  className={['shrink-0 first:ml-0', i > 0 ? PILE_CARD_OVERLAP : ''].join(' ')}
                  style={{ zIndex: i }}
                >
                  <PlayingCard card={card} size="pile" />
                </div>
              ))}
            </div>
          ) : (
            <p
              className="absolute inset-0 flex items-center justify-center px-3 text-center font-serif text-[clamp(0.7rem,1.4vh,0.9rem)] font-semibold leading-snug text-emerald-50/90"
              aria-hidden
            >
              {isOpeningTurn ? 'Drop your opening play' : 'Drop cards to play'}
            </p>
          )}
        </div>
      </div>

      <p className={FOOTER_CLASS}>{footer}</p>
    </div>
  );
}
