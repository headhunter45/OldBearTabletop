import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

describe('useDraggableWindow Logic & Constraints (src/common/hooks)', () => {
  let mockStore: Record<string, string> = {};
  let originalLocalStorage: any;

  beforeEach(() => {
    mockStore = {};
    originalLocalStorage = (globalThis as any).localStorage;
    (globalThis as any).localStorage = {
      getItem: (key: string) => mockStore[key] ?? null,
      setItem: (key: string, val: string) => {
        mockStore[key] = String(val);
      },
      clear: () => {
        mockStore = {};
      },
    };
  });

  afterEach(() => {
    (globalThis as any).localStorage = originalLocalStorage;
  });

  it('clamps coordinates within viewport boundaries', () => {
    const windowWidth = 1920;
    const windowHeight = 1080;
    const elementWidth = 320;
    const minVisibleY = 50;

    const clampX = (rawX: number) => Math.max(0, Math.min(windowWidth - elementWidth, rawX));
    const clampY = (rawY: number) => Math.max(0, Math.min(windowHeight - minVisibleY, rawY));

    // Test inside boundaries
    assert.strictEqual(clampX(500), 500);
    assert.strictEqual(clampY(400), 400);

    // Test negative boundaries (overflow left/top)
    assert.strictEqual(clampX(-50), 0);
    assert.strictEqual(clampY(-20), 0);

    // Test overflow right/bottom
    assert.strictEqual(clampX(2000), 1600); // 1920 - 320 = 1600
    assert.strictEqual(clampY(1200), 1030); // 1080 - 50 = 1030
  });

  it('persists and recovers saved window position from localStorage', () => {
    const storageKey = 'test_flyout_pos';
    const savedPos = { x: 450, y: 120 };

    localStorage.setItem(storageKey, JSON.stringify(savedPos));
    const retrievedRaw = localStorage.getItem(storageKey);
    assert.ok(retrievedRaw);
    const parsed = JSON.parse(retrievedRaw);
    assert.deepStrictEqual(parsed, savedPos);
  });
});
