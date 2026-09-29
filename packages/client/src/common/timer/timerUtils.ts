/**
 * Timer parsing, formatting, and audio alert utilities (OB-132)
 */

/**
 * Parses user input string into total seconds.
 * Supports:
 * - "10 min", "10m", "10 minutes", "2.5m", "2.5 min"
 * - "30s", "30 sec", "30 seconds"
 * - "1m 30s", "1m30s", "2 min 15 sec"
 * - "1:30", "02:15"
 * - "90" (defaults to seconds)
 */
export function parseTimerDuration(input: string): number | null {
  if (!input) return null;
  const raw = input.trim().toLowerCase();
  if (!raw || raw.startsWith('-')) return null;

  // 1. Colon format: MM:SS or HH:MM:SS
  if (/^\d+:\d+(?::\d+)?$/.test(raw)) {
    const parts = raw.split(':').map((p) => parseInt(p, 10));
    if (parts.some(isNaN)) return null;
    if (parts.length === 2) {
      const [m, s] = parts;
      const total = m * 60 + s;
      return total > 0 ? total : null;
    }
    if (parts.length === 3) {
      const [h, m, s] = parts;
      const total = h * 3600 + m * 60 + s;
      return total > 0 ? total : null;
    }
  }

  // 2. Combined format: e.g. "1m 30s", "2 min 15 sec", "1m30s"
  let totalSeconds = 0;
  let matched = false;

  // Match hours: e.g. "1.5h", "1 hr", "2 hours"
  const hrMatch = raw.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:h|hr|hrs|hour|hours)(?![a-z])/);
  if (hrMatch) {
    totalSeconds += Math.round(parseFloat(hrMatch[1]) * 3600);
    matched = true;
  }

  // Match minutes: e.g. "2.5m", "10 min", "5 minutes", "2m"
  const minMatch = raw.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:m|min|mins|minute|minutes)(?![a-z])/);
  if (minMatch) {
    totalSeconds += Math.round(parseFloat(minMatch[1]) * 60);
    matched = true;
  }

  // Match seconds: e.g. "30s", "45 sec", "10 seconds"
  const secMatch = raw.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:s|sec|secs|second|seconds)(?![a-z])/);
  if (secMatch) {
    totalSeconds += Math.round(parseFloat(secMatch[1]));
    matched = true;
  }

  if (matched) {
    return totalSeconds > 0 ? totalSeconds : null;
  }

  // 3. Bare numeric input: defaults to seconds
  const bareNum = parseFloat(raw);
  if (!isNaN(bareNum) && isFinite(bareNum) && bareNum > 0) {
    return Math.round(bareNum);
  }

  return null;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS string.
 */
export function formatTimer(seconds: number): string {
  const sec = Math.max(0, Math.floor(seconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');

  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Formats completion announcement text for chat and toasts (OB-175).
 */
export function formatTimerCompletionText(label?: string): string {
  const safeLabel = label?.trim() || 'Round Timer';
  return `⏰ Timer "${safeLabel}" completed!`;
}

/**
 * Synthesizes a gentle two-tone completion chime using Web Audio API.
 */
export function playTimerChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.22, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.7);
  } catch {
    // Ignore audio playback errors if audio context is blocked
  }
}
