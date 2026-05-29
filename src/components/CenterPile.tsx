import { useLayoutEffect, useState } from 'react';
import {
  PILE_CARD_OVERLAP,
  pileFootprintFromCardSize,
  pileLayoutVars,
  type PileLayoutVars,
} from '../constants/cardTray';
import { useTranslation } from '../i18n/LanguageContext';
import type { PileState, Player } from '../game/types';
import { profileIconForPlayer } from '../game/gameLogic';
import { PlayingCard } from './PlayingCard';

interface CenterPileProps {
  pile: PileState | null;
  players: Player[];
  isOpeningTurn: boolean;
  isFreeLead?: boolean;
  leadPlayerIndex?: number | null;
  droppable?: boolean;
  isDragOver?: boolean;
  fieldRef: React.RefObject<HTMLDivElement | null>;
}

function playerName(
  players: Player[],
  index: number,
  displayPlayerName: (name: string) => string,
): string {
  const raw = players[index]?.name;
  if (!raw) return displayPlayerName('Player');
  return displayPlayerName(raw);
}

const BADGE_CLASS =
  'shrink-0 font-serif text-[length:var(--pile-badge-size)] font-extrabold uppercase tracking-[0.18em] text-amber-300 [text-shadow:0_0_10px_rgba(252,211,77,0.85),0_0_22px_rgba(251,191,36,0.45)]';

const FOOTER_CLASS =
  'shrink-0 text-[length:var(--pile-footer-size)] font-medium text-emerald-100/80';

export function CenterPile({
  pile,
  players,
  isOpeningTurn,
  isFreeLead = false,
  leadPlayerIndex = null,
  droppable = false,
  isDragOver = false,
  fieldRef,
}: CenterPileProps) {
  const { t, comboLabel, displayPlayerName } = useTranslation();
  const [pileLayout, setPileLayout] = useState<PileLayoutVars>(() =>
    pileLayoutVars(640, 360),
  );

  const hasPile = pile != null;
  const combination = pile?.combination;
  const playedByIndex = pile?.playedByIndex ?? 0;
  const lastPlayer = hasPile ? players[playedByIndex] : null;
  const cardHeight = parseFloat(String(pileLayout['--pile-card-h']));
  const cardWidth = parseFloat(String(pileLayout['--pile-card-w']));
  const comboFootprint = pileFootprintFromCardSize(cardWidth, cardHeight);

  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const recompute = () => {
      const fieldWidth = field.clientWidth;
      const fieldHeight = field.clientHeight;
      if (fieldWidth <= 0 || fieldHeight <= 0) return;
      setPileLayout(pileLayoutVars(fieldWidth, fieldHeight));
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(field);
    window.addEventListener('resize', recompute);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [fieldRef]);

  const badgeLabel = hasPile && combination
    ? isFreeLead
      ? t('pile.freeLead')
      : comboLabel(combination.type)
    : isOpeningTurn
      ? t('pile.openingLead')
      : t('pile.centerTrick');

  const footer = hasPile && combination ? (
    isFreeLead && leadPlayerIndex != null ? (
      t('pile.mayLeadNext', {
        name: playerName(players, leadPlayerIndex, displayPlayerName),
      })
    ) : (
      t('pile.beatOrPass')
    )
  ) : (
    <>
      {isOpeningTurn ? t('pile.include3D') : t('pile.playToLead')}
      {droppable && (
        <>
          {' '}
          <span className="text-amber-200/90">{t('pile.dropHint')}</span>
        </>
      )}
    </>
  );

  return (
    <div
      style={pileLayout as React.CSSProperties}
      className="center-pile pointer-events-none relative z-10 flex flex-col items-center justify-center overflow-visible text-center [gap:var(--pile-gap)]"
    >
      <span className={BADGE_CLASS}>{badgeLabel}</span>

      {hasPile && lastPlayer && (
        <div
          className="flex max-w-[min(100%,18rem)] items-center gap-2.5 rounded-full border border-[#5c3d2e]/90 bg-[#1a0f0c]/95 px-3 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.45)] ring-1 ring-[#c9a227]/40"
          role="status"
          aria-label={t('pile.lastPlayedByAria', {
            name: displayPlayerName(lastPlayer.name),
          })}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3d2418] to-[#2d1510] text-xl ring-2 ring-[#c9a227]/55"
            aria-hidden
          >
            {profileIconForPlayer(lastPlayer)}
          </span>
          <div className="min-w-0 text-left">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-400/75">
              {t('pile.lastPlayedBy')}
            </p>
            <p className="truncate font-serif text-sm font-bold leading-tight text-amber-100/95 sm:text-base">
              {displayPlayerName(lastPlayer.name)}
            </p>
          </div>
        </div>
      )}

      <div
        className={[
          'center-pile-cards relative flex items-center justify-center overflow-visible',
          hasPile && isFreeLead ? 'opacity-70' : '',
        ].join(' ')}
      >
        <div
          className={[
            'relative overflow-visible transition-[filter] duration-150',
            droppable && isDragOver
              ? 'brightness-110 drop-shadow-[0_0_18px_rgba(251,191,36,0.45)]'
              : '',
          ].join(' ')}
          style={{ width: comboFootprint.width, height: comboFootprint.height }}
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
              className="absolute inset-0 flex items-center justify-center px-3 text-center font-serif text-[length:var(--pile-hint-size)] font-semibold leading-snug text-emerald-50/75"
              aria-hidden
            >
              {isOpeningTurn ? t('pile.dropOpening') : t('pile.dropToPlay')}
            </p>
          )}
        </div>
      </div>

      <p className={FOOTER_CLASS}>{footer}</p>
    </div>
  );
}
