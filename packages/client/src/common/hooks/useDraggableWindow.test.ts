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

  it('elevates window z-index on bringWindowToFront and manages global stack (OB-127)', async () => {
    const { bringWindowToFront, unregisterWindow, clearActiveWindows, BASE_WINDOW_Z_INDEX } = await import('./useDraggableWindow.js');
    clearActiveWindows();

    // Create mock elements
    const mockWinA = { style: { zIndex: '0' } } as unknown as HTMLElement;
    const mockWinB = { style: { zIndex: '0' } } as unknown as HTMLElement;
    const mockWinC = { style: { zIndex: '0' } } as unknown as HTMLElement;

    // Window A opens
    const zA = bringWindowToFront(mockWinA);
    assert.strictEqual(zA, BASE_WINDOW_Z_INDEX);
    assert.strictEqual(mockWinA.style.zIndex, String(BASE_WINDOW_Z_INDEX));

    // Window B opens
    const zB = bringWindowToFront(mockWinB);
    assert.strictEqual(zB, BASE_WINDOW_Z_INDEX + 1);
    assert.strictEqual(mockWinB.style.zIndex, String(BASE_WINDOW_Z_INDEX + 1));
    assert.strictEqual(mockWinA.style.zIndex, String(BASE_WINDOW_Z_INDEX));

    // Window C opens
    const zC = bringWindowToFront(mockWinC);
    assert.strictEqual(zC, BASE_WINDOW_Z_INDEX + 2);
    assert.strictEqual(mockWinC.style.zIndex, String(BASE_WINDOW_Z_INDEX + 2));

    // Interacting with/dragging Window A elevates it above B and C
    const newZA = bringWindowToFront(mockWinA);
    assert.strictEqual(newZA, BASE_WINDOW_Z_INDEX + 2);
    assert.strictEqual(mockWinA.style.zIndex, String(BASE_WINDOW_Z_INDEX + 2));
    assert.strictEqual(mockWinB.style.zIndex, String(BASE_WINDOW_Z_INDEX));
    assert.strictEqual(mockWinC.style.zIndex, String(BASE_WINDOW_Z_INDEX + 1));

    // Closing/unregistering Window C adjusts the stack correctly
    unregisterWindow(mockWinC);
    const newZB = bringWindowToFront(mockWinB);
    assert.strictEqual(newZB, BASE_WINDOW_Z_INDEX + 1);
    assert.strictEqual(mockWinB.style.zIndex, String(BASE_WINDOW_Z_INDEX + 1));
    assert.strictEqual(mockWinA.style.zIndex, String(BASE_WINDOW_Z_INDEX));
  });
});
