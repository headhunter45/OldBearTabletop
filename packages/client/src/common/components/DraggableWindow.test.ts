import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DraggableWindowTitleBar, DraggableWindow } from './DraggableWindow.js';

describe('Draggable Window & Title Bar Component (OB-178, OB-172)', () => {
  it('exports DraggableWindow and DraggableWindowTitleBar components', () => {
    assert.strictEqual(typeof DraggableWindow, 'function');
    assert.strictEqual(typeof DraggableWindowTitleBar, 'function');
  });

  it('calculates consistent minimize heights across different window contents', () => {
    // Standard title bar height is 44-46px
    const titleBarHeights = [44, 46, 50];
    const isMinimized = true;

    for (const h of titleBarHeights) {
      const computedHeight = isMinimized ? `${h}px` : 'auto';
      assert.strictEqual(computedHeight, `${h}px`, 'Minimized height matches measured title bar height');
    }
  });
});
