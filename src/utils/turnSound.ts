import { getAudioContext, primeAudio } from '../audio/audioContext';
import { isTurnAlertMuted } from '../settings/gameSettings';

/** Call after a user gesture so the browser allows playback. */
export function primeTurnSound(): void {
  primeAudio();
}

/** Short ding when it becomes the local player's turn. */
export function playTurnDing(): void {
  if (isTurnAlertMuted()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const play = () => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1318, now);
    osc.frequency.exponentialRampToValueAtTime(988, now + 0.1);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  };

  if (ctx.state === 'suspended') {
    void ctx.resume().then(play).catch(() => {});
    return;
  }

  play();
}
