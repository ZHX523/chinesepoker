let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  return audioContext;
}

export function primeAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
}
