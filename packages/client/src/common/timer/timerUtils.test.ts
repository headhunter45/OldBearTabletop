import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseTimerDuration, formatTimer } from './timerUtils.js';

describe('Round Timers Parser & Formatter (OB-132)', () => {
  it('parses minutes and decimals correctly', () => {
    assert.strictEqual(parseTimerDuration('10 min'), 600);
    assert.strictEqual(parseTimerDuration('10m'), 600);
    assert.strictEqual(parseTimerDuration('10 minutes'), 600);
    assert.strictEqual(parseTimerDuration('2.5m'), 150);
    assert.strictEqual(parseTimerDuration('2.5 min'), 150);
    assert.strictEqual(parseTimerDuration('0.5m'), 30);
  });

  it('parses seconds correctly', () => {
    assert.strictEqual(parseTimerDuration('30s'), 30);
    assert.strictEqual(parseTimerDuration('30 sec'), 30);
    assert.strictEqual(parseTimerDuration('45 seconds'), 45);
  });

  it('parses composite durations and colon formats', () => {
    assert.strictEqual(parseTimerDuration('1m 30s'), 90);
    assert.strictEqual(parseTimerDuration('1m30s'), 90);
    assert.strictEqual(parseTimerDuration('2 min 15 sec'), 135);
    assert.strictEqual(parseTimerDuration('1:30'), 90);
    assert.strictEqual(parseTimerDuration('02:15'), 135);
  });

  it('defaults bare numbers to seconds', () => {
    assert.strictEqual(parseTimerDuration('90'), 90);
    assert.strictEqual(parseTimerDuration('120'), 120);
  });

  it('rejects invalid or non-positive durations', () => {
    assert.strictEqual(parseTimerDuration(''), null);
    assert.strictEqual(parseTimerDuration('invalid'), null);
    assert.strictEqual(parseTimerDuration('0s'), null);
    assert.strictEqual(parseTimerDuration('-5m'), null);
  });

  it('formats remaining seconds cleanly', () => {
    assert.strictEqual(formatTimer(0), '00:00');
    assert.strictEqual(formatTimer(45), '00:45');
    assert.strictEqual(formatTimer(90), '01:30');
    assert.strictEqual(formatTimer(600), '10:00');
    assert.strictEqual(formatTimer(3665), '1:01:05');
  });
});
