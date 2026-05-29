import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DEFAULT_TURN_TIMER_SECONDS,
  MAX_TURN_TIMER_SECONDS,
  MIN_TURN_TIMER_SECONDS,
  setTurnTimerSeconds,
} from '../settings/gameSettings';
import { TurnAlertIcon } from './TurnAlertIcon';
import { useTranslation } from '../i18n/LanguageContext';

interface BigTwoMenuProps {
  onRestartGame: () => void;
  onLobby: () => void;
  turnTimerSeconds: number;
  onTurnTimerChange: (seconds: number) => void;
  turnAlertMuted: boolean;
  onTurnAlertMutedChange: (muted: boolean) => void;
  menuButtonSize?: 'md' | 'lg';
}

type MenuView = 'main' | 'settings';
type PendingConfirm = 'restart' | 'lobby' | null;

const MENU_WIDTH = 224;
const MENU_MAIN_HEIGHT = 132;
const MENU_SETTINGS_HEIGHT = 300;
const MENU_CONFIRM_HEIGHT = 148;

export function BigTwoMenu({
  onRestartGame,
  onLobby,
  turnTimerSeconds,
  onTurnTimerChange,
  turnAlertMuted,
  onTurnAlertMutedChange,
  menuButtonSize = 'md',
}: BigTwoMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MenuView>('main');
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [draftTimer, setDraftTimer] = useState(turnTimerSeconds);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => {
    setOpen(false);
    setView('main');
    setPendingConfirm(null);
    setDraftTimer(turnTimerSeconds);
  };

  const openMenu = () => {
    setView('main');
    setPendingConfirm(null);
    setDraftTimer(turnTimerSeconds);
    setOpen(true);
  };

  useEffect(() => {
    if (open) setDraftTimer(turnTimerSeconds);
  }, [open, turnTimerSeconds]);

  const menuHeight =
    pendingConfirm != null
      ? MENU_CONFIRM_HEIGHT
      : view === 'settings'
        ? MENU_SETTINGS_HEIGHT
        : MENU_MAIN_HEIGHT;

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const openUp = spaceBelow < menuHeight && rect.top > menuHeight;

      let top = openUp ? rect.top - menuHeight - 6 : rect.bottom + 6;
      top = Math.max(8, Math.min(top, window.innerHeight - menuHeight - 8));

      let left = rect.right - MENU_WIDTH;
      left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));

      setMenuPos({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, view, pendingConfirm, menuHeight]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest('[data-bigtwo-menu-panel]')
      ) {
        return;
      }
      closeMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (pendingConfirm) {
          setPendingConfirm(null);
        } else if (view === 'settings') {
          setView('main');
        } else {
          closeMenu();
        }
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, view, pendingConfirm]);

  const applyTimerSetting = () => {
    const next = setTurnTimerSeconds(draftTimer);
    onTurnTimerChange(next);
    closeMenu();
  };

  const confirmRestart = () => {
    onRestartGame();
    closeMenu();
  };

  const confirmLobby = () => {
    onLobby();
    closeMenu();
  };

  const menuPanel = open ? (
    <div
      data-bigtwo-menu-panel
      role="menu"
      aria-label={
        pendingConfirm === 'restart'
          ? t('menu.confirmRestart')
          : pendingConfirm === 'lobby'
            ? t('menu.confirmLobby')
            : view === 'settings'
              ? t('menu.settings')
              : t('menu.gameMenu')
      }
      style={{
        position: 'fixed',
        top: menuPos.top,
        left: menuPos.left,
        width: MENU_WIDTH,
        zIndex: 10000,
      }}
      className="overflow-visible rounded-lg border border-[#3d2418] bg-[#0d1412] py-1 shadow-[0_10px_28px_rgba(0,0,0,0.55)]"
    >
      {pendingConfirm === 'restart' ? (
        <div className="px-3 py-2.5">
          <p className="text-sm font-semibold text-amber-100">{t('menu.restartTitle')}</p>
          <p className="mt-1.5 text-[11px] leading-snug text-emerald-300/65">
            {t('menu.restartBody')}
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={confirmRestart}
              className="w-full rounded-lg bg-amber-800/90 px-2 py-1.5 text-xs font-semibold text-amber-50 hover:bg-amber-700"
            >
              {t('menu.restart')}
            </button>
          </div>
        </div>
      ) : pendingConfirm === 'lobby' ? (
        <div className="px-3 py-2.5">
          <p className="text-sm font-semibold text-amber-100">{t('menu.lobbyTitle')}</p>
          <p className="mt-1.5 text-[11px] leading-snug text-emerald-300/65">
            {t('menu.lobbyBody')}
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={confirmLobby}
              className="w-full rounded-lg bg-emerald-800 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {t('menu.lobby')}
            </button>
          </div>
        </div>
      ) : view === 'main' ? (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => setView('settings')}
            className="block w-full px-3 py-2 text-left text-xs font-medium text-emerald-100 transition-colors hover:bg-[#1a0f0c] hover:text-amber-100"
          >
            {t('menu.settings')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => setPendingConfirm('restart')}
            className="block w-full px-3 py-2 text-left text-xs font-medium text-emerald-100 transition-colors hover:bg-[#1a0f0c] hover:text-amber-100"
          >
            {t('menu.restartGame')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => setPendingConfirm('lobby')}
            className="block w-full px-3 py-2 text-left text-xs font-medium text-emerald-100 transition-colors hover:bg-[#1a0f0c] hover:text-amber-100"
          >
            {t('menu.lobby')}
          </button>
        </>
      ) : (
        <div className="px-3 py-2.5">
          <button
            type="button"
            onClick={() => setView('main')}
            className="mb-2 text-[11px] font-medium text-emerald-400/70 hover:text-amber-200/90"
          >
            {t('menu.backToMenu')}
          </button>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/80">
            {t('menu.settings')}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11px] text-emerald-300/70">{t('menu.turnAlert')}</span>
            <button
              type="button"
              onClick={() => onTurnAlertMutedChange(!turnAlertMuted)}
              aria-label={turnAlertMuted ? t('menu.unmuteTurnAlert') : t('menu.muteTurnAlert')}
              aria-pressed={turnAlertMuted}
              title={turnAlertMuted ? t('menu.unmuteTurnAlert') : t('menu.muteTurnAlert')}
              className={[
                'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                turnAlertMuted
                  ? 'border-[#3d2418]/80 bg-[#1a0f0c]/80 text-emerald-600/50'
                  : 'border-amber-500/35 bg-[#2d1510] text-amber-100',
              ].join(' ')}
            >
              <TurnAlertIcon muted={turnAlertMuted} />
            </button>
          </div>
          <label className="mt-3 block">
            <span className="text-[11px] text-emerald-300/70">
              {t('menu.turnTimer')}
            </span>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="range"
                min={MIN_TURN_TIMER_SECONDS}
                max={MAX_TURN_TIMER_SECONDS}
                step={1}
                value={draftTimer}
                onChange={(e) => setDraftTimer(Number(e.target.value))}
                className="min-w-0 flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min={MIN_TURN_TIMER_SECONDS}
                max={MAX_TURN_TIMER_SECONDS}
                value={draftTimer}
                onChange={(e) =>
                  setDraftTimer(
                    Number.parseInt(e.target.value, 10) ||
                      DEFAULT_TURN_TIMER_SECONDS,
                  )
                }
                className="w-12 rounded-md border border-[#3d2418] bg-[#0a1210] px-1.5 py-1 text-center font-mono text-xs text-emerald-100"
              />
            </div>
          </label>
          <p className="mt-1 text-[10px] text-emerald-600/50">
            {t('menu.turnTimerHint', {
              default: DEFAULT_TURN_TIMER_SECONDS,
              min: MIN_TURN_TIMER_SECONDS,
              max: MAX_TURN_TIMER_SECONDS,
            })}
          </p>
          <button
            type="button"
            onClick={applyTimerSetting}
            className="mt-3 w-full rounded-lg bg-emerald-800 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            {t('common.save')}
          </button>
        </div>
      )}
    </div>
  ) : null;

  const menuButtonClass =
    menuButtonSize === 'lg'
      ? 'h-14 w-14 rounded-2xl'
      : 'h-12 w-12 rounded-xl';

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? closeMenu() : openMenu())}
        aria-label={t('menu.open')}
        aria-haspopup="menu"
        aria-expanded={open}
        className={[
          menuButtonClass,
          'flex items-center justify-center border border-[#3d2418]/80',
          'bg-[#1a0f0c]/80 text-amber-100/90 transition-colors',
          'hover:border-amber-500/35 hover:bg-[#2d1510] hover:text-amber-50',
          open && 'border-amber-500/40 bg-[#2d1510] text-amber-50',
        ].join(' ')}
      >
        <span
          className={[
            'flex flex-col items-center justify-center gap-1',
            menuButtonSize === 'lg' ? 'w-6' : 'w-5',
          ].join(' ')}
          aria-hidden
        >
          <span className="h-0.5 w-full rounded-full bg-current" />
          <span className="h-0.5 w-full rounded-full bg-current" />
          <span className="h-0.5 w-full rounded-full bg-current" />
        </span>
      </button>

      {menuPanel && createPortal(menuPanel, document.body)}
    </div>
  );
}
