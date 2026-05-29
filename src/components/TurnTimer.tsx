import { useTranslation } from '../i18n/LanguageContext';

interface TurnTimerProps {
  secondsRemaining: number;
  totalSeconds: number;
}

export function TurnTimer({ secondsRemaining, totalSeconds }: TurnTimerProps) {
  const { t } = useTranslation();
  const progress = Math.max(0, Math.min(1, secondsRemaining / totalSeconds));
  const urgent = secondsRemaining <= 5;
  const size = 44;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div
      className={[
        'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
        'bg-[#1a0f0c]/95 ring-1',
        urgent ? 'ring-rose-400/70' : 'ring-amber-500/35',
      ].join(' ')}
      role="timer"
      aria-live="polite"
      aria-label={t('common.secondsRemaining', {
        count: Math.ceil(secondsRemaining),
      })}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-[#3d2418]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={urgent ? 'text-rose-400' : 'text-emerald-400'}
        />
      </svg>
      <span
        className={[
          'relative font-mono text-sm font-bold tabular-nums',
          urgent ? 'text-rose-200' : 'text-amber-100',
        ].join(' ')}
      >
        {Math.ceil(secondsRemaining)}
      </span>
    </div>
  );
}
