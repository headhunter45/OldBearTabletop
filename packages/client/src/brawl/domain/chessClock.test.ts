import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatChessClock,
  getClockWarningStatus,
  tickChessClock,
  switchActiveClock,
  ChessClockState,
} from './chessClock.js';

describe('Chess Clock Logic & Overtime Tracking (OB-158)', () => {
  it('formats positive remaining times properly', () => {
    assert.deepEqual(formatChessClock(5400), { formatted: '1:30:00', isOvertime: false });
    assert.deepEqual(formatChessClock(3600), { formatted: '1:00:00', isOvertime: false });
    assert.deepEqual(formatChessClock(59), { formatted: '0:59', isOvertime: false });
    assert.deepEqual(formatChessClock(65), { formatted: '1:05', isOvertime: false });
  });

  it('formats overtime (negative) times accurately with prefix', () => {
    assert.deepEqual(formatChessClock(-1), { formatted: '-0:01', isOvertime: true });
    assert.deepEqual(formatChessClock(-65), { formatted: '-1:05', isOvertime: true });
    assert.deepEqual(formatChessClock(-3661), { formatted: '-1:01:01', isOvertime: true });
  });

  it('evaluates warning thresholds correctly', () => {
    assert.equal(getClockWarningStatus(900), 'normal');
    assert.equal(getClockWarningStatus(601), 'normal');
    assert.equal(getClockWarningStatus(600), 'warning');
    assert.equal(getClockWarningStatus(301), 'warning');
    assert.equal(getClockWarningStatus(300), 'danger');
    assert.equal(getClockWarningStatus(1), 'danger');
    assert.equal(getClockWarningStatus(0), 'danger');
    assert.equal(getClockWarningStatus(-1), 'overtime');
    assert.equal(getClockWarningStatus(-50), 'overtime');
  });

  it('ticks active player clock down and supports overtime without clamping', () => {
    const initialState: ChessClockState = {
      p1Seconds: 10,
      p2Seconds: 100,
      activePlayer: 1,
      isRunning: true,
      timeLimitSeconds: 5400,
    };

    const ticked1 = tickChessClock(initialState);
    assert.equal(ticked1.p1Seconds, 9);
    assert.equal(ticked1.p2Seconds, 100);

    // Ticking when paused does not change time
    const pausedState = { ...ticked1, isRunning: false };
    const tickedPaused = tickChessClock(pausedState);
    assert.equal(tickedPaused.p1Seconds, 9);

    // Ticking past zero counts into negative overtime
    let state = { ...initialState, p1Seconds: 1 };
    state = tickChessClock(state);
    assert.equal(state.p1Seconds, 0);
    state = tickChessClock(state);
    assert.equal(state.p1Seconds, -1);
    state = tickChessClock(state);
    assert.equal(state.p1Seconds, -2);
  });

  it('switches active player cleanly', () => {
    const state: ChessClockState = {
      p1Seconds: 5400,
      p2Seconds: 5400,
      activePlayer: 1,
      isRunning: true,
      timeLimitSeconds: 5400,
    };

    const swapped = switchActiveClock(state);
    assert.equal(swapped.activePlayer, 2);

    const swappedBack = switchActiveClock(swapped);
    assert.equal(swappedBack.activePlayer, 1);
  });
});
