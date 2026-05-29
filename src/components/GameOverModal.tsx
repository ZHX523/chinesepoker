import { useTranslation } from '../i18n/LanguageContext';
import type { ScoreEntry } from '../game/types';

interface GameOverModalProps {
  scores: ScoreEntry[];
  winnerName: string;
  onPlayAgain: () => void;
}

export function GameOverModal({
  scores,
  winnerName,
  onPlayAgain,
}: GameOverModalProps) {
  const { t, displayPlayerName } = useTranslation();
  const sorted = [...scores].sort((a, b) => a.penalty - b.penalty);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl border border-emerald-700/50 bg-slate-900 p-6 shadow-2xl"
        role="dialog"
        aria-labelledby="gameover-title"
      >
        <h2 id="gameover-title" className="text-2xl font-bold text-white">
          {t('gameOver.title')}
        </h2>
        <p className="mt-1 text-emerald-300">
          {t('gameOver.winnerSubtitle', { name: displayPlayerName(winnerName) })}
        </p>

        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="pb-2 font-medium">{t('gameOver.player')}</th>
              <th className="pb-2 font-medium">{t('gameOver.cards')}</th>
              <th className="pb-2 font-medium text-right">{t('gameOver.penalty')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.playerId} className="border-b border-slate-800">
                <td className="py-2.5 font-medium text-white">
                  {displayPlayerName(row.name)}
                </td>
                <td className="py-2.5 text-slate-300">{row.cardsLeft}</td>
                <td className="py-2.5 text-right font-mono text-rose-300">
                  {row.penalty}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="button"
          onClick={onPlayAgain}
          className="mt-6 w-full rounded-xl bg-amber-500 py-3 font-semibold text-slate-900 transition hover:bg-amber-400"
        >
          {t('gameOver.playAgain')}
        </button>
      </div>
    </div>
  );
}
