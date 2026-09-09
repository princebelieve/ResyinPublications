export function playNotificationTone({ userInitiated = false } = {}) {
  if (typeof window === "undefined") return;

  // Browsers block audio that was not triggered directly by a user gesture.
  // Notification polling must never cause a console warning or affect the UI.
  if (!userInitiated) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;

    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const master = ctx.createGain();

    master.gain.value = 0.03;
    master.connect(ctx.destination);

    const notes = [660, 880, 1040];

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.08);
      gain.gain.setValueAtTime(0.0001, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.06, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.12);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.14);
    });

    setTimeout(() => ctx.close().catch(() => {}), 500);
  } catch {
    // Audio feedback is optional; a blocked browser policy is not an app error.
  }
}
