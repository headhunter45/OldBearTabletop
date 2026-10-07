import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Viewport } from './Viewport.js';

describe('Viewport', () => {
  it('correctly maps screen to world coordinates', () => {
    const vp = new Viewport(100, 50, 2.0);
    const world = vp.screenToWorld(200, 150);
    assert.strictEqual(world.x, 50);
    assert.strictEqual(world.y, 50);

    const screen = vp.worldToScreen(50, 50);
    assert.strictEqual(screen.x, 200);
    assert.strictEqual(screen.y, 150);
  });
});
