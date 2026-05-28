interface PassButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export function PassButton({ disabled, onClick }: PassButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Pass"
      title={
        disabled
          ? 'Pass is only available on your turn when you may pass'
          : 'Pass your turn'
      }
      className={[
        'group relative mx-auto flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center rounded-full',
        'transition-transform duration-200',
        'disabled:cursor-not-allowed disabled:opacity-45',
        !disabled && 'hover:scale-[1.04] active:scale-[0.98]',
      ].join(' ')}
    >
      <span
        className="absolute inset-0 rounded-full bg-gradient-to-b from-[#d4af37] via-[#8b6914] to-[#5c4a12] p-[3px] shadow-[0_6px_20px_rgba(0,0,0,0.45)]"
        aria-hidden
      >
        <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#1f7a5c] via-[#0f5c44] to-[#083d2e] shadow-[inset_0_2px_8px_rgba(255,255,255,0.2),inset_0_-4px_10px_rgba(0,0,0,0.35)]">
          <span className="relative flex flex-col items-center leading-none">
            <span
              className="pointer-events-none absolute text-3xl font-serif text-[#f5f0e6]/15"
              aria-hidden
            >
              過
            </span>
            <span className="text-sm font-bold tracking-widest text-[#f5f0e6] drop-shadow-sm">
              PASS
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
