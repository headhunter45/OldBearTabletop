import { describe, it } from 'node:test';
import assert from 'node:assert';
import { evaluateUnitCoherency } from './coherencyEngine.js';
import { WargameModel } from '../types/brawl.js';

describe('Unit Coherency Graph Engine & Real-Time Warning Halos (OB-156)', () => {
  const PX_PER_INCH = 50;

  it('validates small units (2-5 models) where each model needs at least 1 neighbor within 2 inches', () => {
    // 3 models in a line, 1.5 inches apart center-to-center
    // 32mm base diameter is ~1.26 inches (combined radii is ~1.26 inches)
    // Center distance = 80px = 1.6 inches. Edge-to-edge distance = 1.6 - 1.26 = ~0.34 inches (< 2.0 inches)
    const models: WargameModel[] = [
      { id: 'm1', name: 'Marine 1', unitId: 'u1', x: 100, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm2', name: 'Marine 2', unitId: 'u1', x: 180, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm3', name: 'Marine 3', unitId: 'u1', x: 260, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
    ];

    const result = evaluateUnitCoherency(models, 2.0, PX_PER_INCH);

    assert.strictEqual(result.isUnitCoherent, true);
    assert.strictEqual(result.violatingModelIds.length, 0);
    assert.strictEqual(result.modelCoherency.get('m1'), true);
    assert.strictEqual(result.modelCoherency.get('m2'), true);
    assert.strictEqual(result.modelCoherency.get('m3'), true);
  });

  it('flags isolated model that is beyond coherency distance in a small unit', () => {
    const models: WargameModel[] = [
      { id: 'm1', name: 'Marine 1', unitId: 'u1', x: 100, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm2', name: 'Marine 2', unitId: 'u1', x: 180, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm3', name: 'Marine 3', unitId: 'u1', x: 600, y: 600, baseShape: { type: 'circle', widthMm: 32 } }, // ~14 inches away
    ];

    const result = evaluateUnitCoherency(models, 2.0, PX_PER_INCH);

    assert.strictEqual(result.isUnitCoherent, false);
    assert.ok(result.violatingModelIds.includes('m3'));
    assert.strictEqual(result.modelCoherency.get('m3'), false);
  });

  it('enforces higher degree rule for units of 6+ models (each model requires >= 2 neighbors)', () => {
    // 6 models in a single file "daisy chain"
    // End models (m1 and m6) only have 1 neighbor, which violates 6+ model coherency rule!
    const models: WargameModel[] = [
      { id: 'm1', name: 'Boy 1', unitId: 'u1', x: 100, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm2', name: 'Boy 2', unitId: 'u1', x: 210, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm3', name: 'Boy 3', unitId: 'u1', x: 320, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm4', name: 'Boy 4', unitId: 'u1', x: 430, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm5', name: 'Boy 5', unitId: 'u1', x: 540, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm6', name: 'Boy 6', unitId: 'u1', x: 650, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
    ];

    const result = evaluateUnitCoherency(models, 2.0, PX_PER_INCH);

    assert.strictEqual(result.isUnitCoherent, false);
    // m1 and m6 have only 1 neighbor each, so they fail the 6+ rule
    assert.strictEqual(result.modelCoherency.get('m1'), false, 'End model m1 should violate coherency');
    assert.strictEqual(result.modelCoherency.get('m6'), false, 'End model m6 should violate coherency');
    // Middle models have 2 neighbors each, so their degree is valid
    assert.strictEqual(result.modelCoherency.get('m2'), true);
    assert.strictEqual(result.modelCoherency.get('m3'), true);
  });

  it('passes a 6+ model unit arranged in a triangle/block formation where all models have >= 2 neighbors', () => {
    // 6 models arranged in a 2x3 block where all have at least 2 neighbors within 2"
    const models: WargameModel[] = [
      { id: 'm1', name: 'Boy 1', unitId: 'u1', x: 100, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm2', name: 'Boy 2', unitId: 'u1', x: 180, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm3', name: 'Boy 3', unitId: 'u1', x: 260, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm4', name: 'Boy 4', unitId: 'u1', x: 100, y: 180, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm5', name: 'Boy 5', unitId: 'u1', x: 180, y: 180, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm6', name: 'Boy 6', unitId: 'u1', x: 260, y: 180, baseShape: { type: 'circle', widthMm: 32 } },
    ];

    const result = evaluateUnitCoherency(models, 2.0, PX_PER_INCH);

    assert.strictEqual(result.isUnitCoherent, true);
    assert.strictEqual(result.violatingModelIds.length, 0);
  });

  it('detects split units into multiple disconnected islands', () => {
    // Two groups of 2 models each, but the groups are 10 inches apart
    const models: WargameModel[] = [
      { id: 'm1', name: 'M1', unitId: 'u1', x: 100, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm2', name: 'M2', unitId: 'u1', x: 150, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
      // Far island:
      { id: 'm3', name: 'M3', unitId: 'u1', x: 800, y: 800, baseShape: { type: 'circle', widthMm: 32 } },
      { id: 'm4', name: 'M4', unitId: 'u1', x: 850, y: 800, baseShape: { type: 'circle', widthMm: 32 } },
    ];

    const result = evaluateUnitCoherency(models, 2.0, PX_PER_INCH);

    assert.strictEqual(result.isUnitCoherent, false);
    assert.ok(result.violatingModelIds.length > 0, 'Disconnected units must be flagged');
  });
});
