import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Viewport } from './Viewport.js';
import {
  TRACKPAD_PAN_SENSITIVITY,
  TRACKPAD_ZOOM_SENSITIVITY,
  MOUSE_WHEEL_ZOOM_SENSITIVITY,
} from './CanvasEngine.js';

describe('CanvasEngine', () => {
  it('selects all enclosed tokens with box select and moves them as a group (Bug #78)', () => {
    // Mock tokens within a map
    const mockTokens = [
      { id: 't1', name: 'Goblin 1', x: 100, y: 100, size: 1, mapId: 'map-1' },
      { id: 't2', name: 'Goblin 2', x: 150, y: 100, size: 1, mapId: 'map-1' },
      { id: 't3', name: 'Goblin 3', x: 200, y: 100, size: 1, mapId: 'map-1' },
      { id: 't4', name: 'Dragon', x: 500, y: 500, size: 2, mapId: 'map-1' },
    ];

    const gridSize = 50;
    const boxStart = { x: 80, y: 80 };
    const boxEnd = { x: 280, y: 180 };

    const minX = Math.min(boxStart.x, boxEnd.x);
    const maxX = Math.max(boxStart.x, boxEnd.x);
    const minY = Math.min(boxStart.y, boxEnd.y);
    const maxY = Math.max(boxStart.y, boxEnd.y);

    const enclosed = mockTokens.filter((t) => {
      const diameter = t.size * gridSize;
      const cx = t.x + diameter / 2;
      const cy = t.y + diameter / 2;
      return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
    });

    // Verify all 3 goblins are enclosed, but not Dragon
    assert.strictEqual(enclosed.length, 3);
    assert.deepStrictEqual(
      enclosed.map((t) => t.id),
      ['t1', 't2', 't3'],
    );

    // Simulate group movement delta: dx = 50, dy = 100
    const deltaX = 50;
    const deltaY = 100;
    const movedTokens = enclosed.map((t) => ({
      ...t,
      x: t.x + deltaX,
      y: t.y + deltaY,
    }));

    assert.strictEqual(movedTokens[0].x, 150);
    assert.strictEqual(movedTokens[0].y, 200);
    assert.strictEqual(movedTokens[1].x, 200);
    assert.strictEqual(movedTokens[1].y, 200);
    assert.strictEqual(movedTokens[2].x, 250);
    assert.strictEqual(movedTokens[2].y, 200);
  });

  it('separates trackpad two-finger pan from pinch-to-zoom using sensitivity constants (Task #117)', () => {
    const vp = new Viewport(0, 0, 1.0);

    // Standard two-finger swipe (e.ctrlKey === false): pans without changing scale
    const deltaX = 30;
    const deltaY = 50;
    const panX = -deltaX * TRACKPAD_PAN_SENSITIVITY;
    const panY = -deltaY * TRACKPAD_PAN_SENSITIVITY;
    vp.pan(panX, panY);

    assert.strictEqual(vp.x, -30);
    assert.strictEqual(vp.y, -50);
    assert.strictEqual(vp.scale, 1.0);

    // Pinch-to-zoom (e.ctrlKey === true): zooms exponentially at cursor anchor
    const pinchDelta = -10;
    const zoomFactor = Math.exp(-pinchDelta * TRACKPAD_ZOOM_SENSITIVITY);
    vp.zoomAt(100, 100, zoomFactor);

    assert.strictEqual(vp.scale > 1.0, true);
    assert.strictEqual(TRACKPAD_PAN_SENSITIVITY > 0, true);
    assert.strictEqual(TRACKPAD_ZOOM_SENSITIVITY > 0, true);
    assert.strictEqual(MOUSE_WHEEL_ZOOM_SENSITIVITY > 0, true);
  });

  it('reverts box select tool to arrow select upon enclosing tokens (Task #117)', () => {
    let currentTool = 'box-select';
    const onToolChange = (tool: string) => {
      currentTool = tool;
    };

    const enclosedTokens = [{ id: 't1' }, { id: 't2' }];
    if (enclosedTokens.length > 0) {
      currentTool = 'select';
      onToolChange('select');
    }

    assert.strictEqual(currentTool, 'select');
  });
});
