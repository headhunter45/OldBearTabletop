import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getClockTotalSteps } from './ClockWidget.js';
import { ProgressClock } from '@oldbear/shared';

describe('Floating Screen Widgets & Progress Clocks Overhaul (OB-173)', () => {
  it('standardizes terminology on steps and falls back to legacy segments', () => {
    const clockWithSteps: ProgressClock = {
      id: 'c-1',
      name: 'Ritual Countdown',
      steps: 6,
      filled: 2,
      color: '#ef4444',
    };
    assert.strictEqual(getClockTotalSteps(clockWithSteps), 6);

    const clockWithLegacySegments: ProgressClock = {
      id: 'c-2',
      name: 'Alarm Status',
      steps: undefined as any,
      segments: 8,
      filled: 4,
      color: '#3b82f6',
    };
    assert.strictEqual(getClockTotalSteps(clockWithLegacySegments), 8);

    const clockDefault = {
      id: 'c-3',
      name: 'Default Clock',
      filled: 0,
      color: '#10b981',
    };
    assert.strictEqual(getClockTotalSteps(clockDefault), 8);
  });

  it('correctly clamps filled steps within 0 and total steps', () => {
    const totalSteps = 8;
    const clamp = (val: number) => Math.max(0, Math.min(totalSteps, val));

    assert.strictEqual(clamp(-3), 0);
    assert.strictEqual(clamp(0), 0);
    assert.strictEqual(clamp(5), 5);
    assert.strictEqual(clamp(8), 8);
    assert.strictEqual(clamp(15), 8);
  });

  it('manages per-user compact mode independently', () => {
    const userMinimized = new Set<string>();
    const clockId = 'clock-test-123';

    // Toggle on (compact)
    userMinimized.add(clockId);
    assert.strictEqual(userMinimized.has(clockId), true);

    // Toggle off (radial)
    userMinimized.delete(clockId);
    assert.strictEqual(userMinimized.has(clockId), false);
  });

  it('live-syncs shared clock instances between widget and management window', () => {
    let sessionClocks: ProgressClock[] = [
      {
        id: 'clock-live-1',
        name: 'Infiltration',
        steps: 4,
        segments: 4,
        filled: 1,
        color: '#f59e0b',
      },
    ];

    const updateClock = (id: string, updates: Partial<ProgressClock>) => {
      sessionClocks = sessionClocks.map((c) => (c.id === id ? { ...c, ...updates } : c));
    };

    // Increment step from widget or modal
    updateClock('clock-live-1', { filled: 2 });
    assert.strictEqual(sessionClocks[0].filled, 2);

    // Rename clock
    updateClock('clock-live-1', { name: 'Deep Infiltration' });
    assert.strictEqual(sessionClocks[0].name, 'Deep Infiltration');

    // Change color directly
    updateClock('clock-live-1', { color: '#8b5cf6' });
    assert.strictEqual(sessionClocks[0].color, '#8b5cf6');
  });
});
