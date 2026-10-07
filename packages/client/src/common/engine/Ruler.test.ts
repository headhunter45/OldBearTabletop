import { describe, it } from 'node:test';
import assert from 'node:assert';
import { measureDistance } from './Ruler.js';

describe('Ruler', () => {
  it('measures distance and flags speed excess', () => {
    // 6 cells = 30ft (at 50px/cell, 5ft/cell)
    const measurementNormal = measureDistance(
      { x: 0, y: 0 },
      { x: 300, y: 0 },
      50,
      30,
      5,
    );
    assert.strictEqual(measurementNormal.distanceFt, 30);
    assert.strictEqual(measurementNormal.isOverSpeed, false);

    // 8 cells = 40ft (exceeds 30ft speed)
    const measurementOver = measureDistance(
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      50,
      30,
      5,
    );
    assert.strictEqual(measurementOver.distanceFt, 40);
    assert.strictEqual(measurementOver.isOverSpeed, true);
    assert.strictEqual(measurementOver.color, '#ef4444');
  });

  it('measures distance with measuring tape tool without speed limit (Task #97)', () => {
    // 12 cells at 50px/cell, 5ft/cell = 60ft
    const tapeMeasurement = measureDistance(
      { x: 100, y: 100 },
      { x: 700, y: 100 },
      50,
      Infinity,
      5,
    );
    assert.strictEqual(tapeMeasurement.distanceFt, 60);
    assert.strictEqual(tapeMeasurement.isOverSpeed, false);
  });
});
