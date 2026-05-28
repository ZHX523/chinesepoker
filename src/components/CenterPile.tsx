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
  PILE_TARGET_FILL,
  computeTrayCardScale,
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
  'center-pile shrink-0 rounded-xl border border-[#c9a227]/25 bg-[#062f22]/80';

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
  const pileCardSlotRef = useRef<HTMLDivElement>(null);
  const pileCardsRef = useRef<HTMLDivElement>(null);
  const [pileCardScale, setPileCardScale] = useState(1);

  const dropHighlight =
    droppable &&
    isDragOver &&
    'border-amber-400/80 bg-amber-500/15 ring-2 ring-amber-400/50';

  const dropIdle =
    droppable && !isDragOver && 'border-emerald-400/40 ring-1 ring-emerald-300/25';

  const hasPile = pile != null;
  const combination = pile?.combination;
  const playedByIndex = pile?.playedByIndex ?? 0;
  const cardCount = combination?.cards.length ?? 0;

  useLayoutEffect(() => {
    const field = fieldRef.current;
    const shell = pileShellRef.current;
    const cardSlot = pileCardSlotRef.current;
    if (!field || !shell) return;

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
      shell.style.width = `${shellWidth}px`;
      shell.style.height = `${shellHeight}px`;

      const slotWidth = cardSlot?.clientWidth ?? shellWidth;
      const slotHeight = cardSlot?.clientHeight ?? shellHeight * 0.68;
      const { width: comboWidth, height: comboHeight } = pileFiveCardFootprint();

      if (slotWidth <= 0 || slotHeight <= 0) {
        setPileCardScale(1);
        return;
      }

      setPileCardScale(
        computeTrayCardScale(
          slotWidth,
          slotHeight,
          comboWidth,
          comboHeight,
          PILE_TARGET_FILL,
        ),
      );
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(field);
    observer.observe(shell);
    if (cardSlot) observer.observe(cardSlot);

    window.addEventListener('resize', recompute);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [fieldRef, hasPile, cardCount]);

  return (
    <div
      ref={pileShellRef}
      onDragEnter={droppable ? onDragEnter : undefined}
      onDragLeave={droppable ? onDragLeave : undefined}
      onDragOver={droppable ? onDragOver : undefined}
      onDrop={droppable ? onDrop : undefined}
      className={[
        'relative flex flex-col items-center justify-center gap-1.5 overflow-visible px-3 py-2.5 text-center backdrop-blur-md',
        PILE_SHELL,
        hasPile ? 'shadow-[0_8px_32px_rgba(0,0,0,0.35)]' : 'border-emerald-300/35 bg-[#062f22]/75 backdrop-blur-sm',
        isFreeLead ? 'ring-1 ring-amber-400/35' : '',
        dropHighlight,
        dropIdle,
      ].join(' ')}
    >
      {hasPile && combination ? (
        <>
          <span className="shrink-0 rounded-full bg-amber-500/20 px-3 py-0.5 font-serif text-[clamp(0.6rem,1.2vh,0.75rem)] font-bold uppercase tracking-widest text-amber-100">
            {isFreeLead ? 'Free lead' : combinationLabel(combination.type)}
          </span>
          <div ref={pileCardSlotRef} className={PILE_CARD_SLOT}>
            <div
              ref={pileCardsRef}
              className={[
                'inline-flex items-end justify-center overflow-visible',
                isFreeLead ? 'opacity-70' : '',
              ].join(' ')}
              style={{
                transform: `scale(${pileCardScale})`,
                transformOrigin: 'center center',
              }}
            >
              {combination.cards.map((card, i) => (
                <div
                  key={card.id}
                  className={[
                    'shrink-0 first:ml-0',
                    i > 0 ? PILE_CARD_OVERLAP : '',
                  ].join(' ')}
                  style={{ zIndex: i }}
                >
                  <PlayingCard card={card} size="pile" />
                </div>
              ))}
            </div>
          </div>
          <p className="shrink-0 text-[clamp(0.6rem,1.2vh,0.75rem)] font-medium text-emerald-100/85">
            {isFreeLead && leadPlayerIndex != null ? (
              <>
                <span className="text-amber-200">{playerLabel(leadPlayerIndex)}</span>{' '}
                may lead
              </>
            ) : (
              <>
                Played by{' '}
                <span className="text-[#f5f0e6]">{playerLabel(playedByIndex)}</span>
              </>
            )}
          </p>
        </>
      ) : (
        <>
          <div ref={pileCardSlotRef} className={`${PILE_CARD_SLOT} min-h-[4rem]`} aria-hidden />
          <p className="font-serif text-[clamp(0.75rem,1.6vh,1rem)] font-semibold text-emerald-50">
            {isOpeningTurn
              ? 'Opening lead — include 3♦'
              : 'Center trick — play to lead'}
          </p>
          {droppable && (
            <p className="text-[clamp(0.6rem,1.3vh,0.75rem)] text-amber-200/85">
              Drag cards here to play
            </p>
          )}
        </>
      )}
    </div>
  );
}
