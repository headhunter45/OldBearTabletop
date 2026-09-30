export type ClockWarningStatus = 'normal' | 'warning' | 'danger' | 'overtime';

export interface ChessClockState {
  p1Seconds: number;
  p2Seconds: number;
  activePlayer: 1 | 2;
  isRunning: boolean;
  timeLimitSeconds: number;
}

export const CLOCK_PRESETS: { label: string; seconds: number }[] = [
  { label: '60 Min (1h)', seconds: 3600 },
  { label: '75 Min (1h 15m)', seconds: 4500 },
  { label: '90 Min (1h 30m)', seconds: 5400 },
  { label: '105 Min (1h 45m)', seconds: 6300 },
  { label: '120 Min (2h)', seconds: 7200 },
];

/**
 * Formats seconds into a human-readable chess clock display.
 * If negative, prefixes with '-' and formats the absolute seconds.
 */
export function formatChessClock(seconds: number): { formatted: string; isOvertime: boolean } {
  const isOvertime = seconds < 0;
  const absSeconds = Math.abs(seconds);

  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;

  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;

  let timeStr = '';
  if (hours > 0) {
    const paddedMins = minutes < 10 ? `0${minutes}` : `${minutes}`;
    timeStr = `${hours}:${paddedMins}:${paddedSecs}`;
  } else {
    timeStr = `${minutes}:${paddedSecs}`;
  }

  return {
    formatted: isOvertime ? `-${timeStr}` : timeStr,
    isOvertime,
  };
}

/**
 * Returns visual warning status for remaining seconds.
 */
export function getClockWarningStatus(seconds: number): ClockWarningStatus {
  if (seconds < 0) return 'overtime';
  if (seconds <= 300) return 'danger'; // Under 5 minutes
  if (seconds <= 600) return 'warning'; // Under 10 minutes
  return 'normal';
}

/**
 * Ticks active player's clock down by 1 second.
 * Supports negative values for overtime tracking.
 */
export function tickChessClock(state: ChessClockState): ChessClockState {
  if (!state.isRunning) return state;

  return {
    ...state,
    p1Seconds: state.activePlayer === 1 ? state.p1Seconds - 1 : state.p1Seconds,
    p2Seconds: state.activePlayer === 2 ? state.p2Seconds - 1 : state.p2Seconds,
  };
}

/**
 * Switches the active player (from 1 to 2 or 2 to 1).
 */
export function switchActiveClock(state: ChessClockState): ChessClockState {
  return {
    ...state,
    activePlayer: state.activePlayer === 1 ? 2 : 1,
  };
}

/**
 * Synthesizes a crisp mechanical clock switch click using Web Audio API.
 */
export function playClockSwitchSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Audio might be blocked by browser policy prior to user interaction
  }
}

/**
 * Synthesizes a low-time warning double-beep.
 */
export function playLowTimeWarningSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    [0, 0.12].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, now + offset); // G5
      gain.gain.setValueAtTime(0.2, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.08);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Synthesizes an overtime alarm beep.
 */
export function playOvertimeAlarmSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    [0, 0.15, 0.3].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now + offset);
      gain.gain.setValueAtTime(0.25, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  } catch {
    // Ignore audio errors
  }
}
