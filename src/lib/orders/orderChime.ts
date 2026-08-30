let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  return ctx;
}

function tone(freq: number, start: number, duration: number) {
  const ac = getCtx();
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.connect(g);
  g.connect(ac.destination);
  o.frequency.value = freq;
  g.gain.value = 0.05;
  o.start(start);
  o.stop(start + duration);
}

export function unlockOrderChime(): void {
  const ac = getCtx();
  if (ac?.state === "suspended") void ac.resume();
}

export function playOrderChime(): void {
  try {
    const ac = getCtx();
    if (!ac) return;
    if (ac.state === "suspended") void ac.resume();
    const t = ac.currentTime;
    tone(880, t, 0.12);
    tone(1175, t + 0.14, 0.18);
  } catch {
    /* ignore */
  }
}
