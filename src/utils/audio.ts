// Web Audio API synthesized chimes for clean UX notifications without external audio assets

export function playOrderAlertSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Pleasant two-tone chime
    playTone(523.25, 0, 0.2); // C5
    playTone(659.25, 0.15, 0.25); // E5
    playTone(783.99, 0.3, 0.35); // G5
  } catch {
    // Ignore audio autoplay restrictions
  }
}
