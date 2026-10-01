import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Token } from '@oldbear/shared';
import {
  createStandardObjectives,
  isModelInControlZone,
  evaluateObjectiveMarker,
  evaluateAllObjectives,
  ObjectiveMarker,
} from './objectiveEngine.js';

describe('Objective Marker Control Zone Calculation & Auto-Scoring (OB-160)', () => {
  const marker: ObjectiveMarker = {
    id: 'obj-test',
    label: 'Objective Alpha',
    x: 500,
    y: 500,
    baseMm: 40,
    controlRadiusInches: 3.0,
    vpValue: 4,
  };

  const createTestToken = (
    id: string,
    x: number,
    y: number,
    player: 1 | 2,
    oc?: number,
    baseMm = 32
  ): Token =>
    ({
      id,
      name: `Model ${id}`,
      x,
      y,
      size: 'medium',
      color: player === 1 ? '#38bdf8' : '#ec4899',
      player,
      oc,
      baseShape: { type: 'circle', widthMm: baseMm },
      dead: false,
      invisible: false,
    } as unknown as Token);

  it('generates standard layout of 5 objective markers', () => {
    const objs = createStandardObjectives(3000, 2200);
    assert.equal(objs.length, 5);
    assert.equal(objs[0].id, 'obj-center');
    assert.equal(objs[0].x, 1500);
    assert.equal(objs[0].y, 1100);
  });

  it('determines if model base is inside or outside 3" control zone edge-to-edge', () => {
    // 50px = 1 inch
    // Center distance of 100px = 2.0 inches
    // Marker radius = ~0.787 in, Model radius = ~0.63 in
    // Edge distance = 2.0 - 0.787 - 0.63 = 0.583 inches <= 3.0 inches -> In Zone!
    const tokenIn = createTestToken('m1', 600, 500, 1);
    const resIn = isModelInControlZone(marker, tokenIn, 50);
    assert.equal(resIn.inZone, true);
    assert(resIn.edgeDistanceInches < 3.0);

    // Center distance of 300px = 6.0 inches
    // Edge distance = 6.0 - 0.787 - 0.63 = 4.58 inches > 3.0 inches -> Outside Zone!
    const tokenOut = createTestToken('m2', 800, 500, 1);
    const resOut = isModelInControlZone(marker, tokenOut, 50);
    assert.equal(resOut.inZone, false);
    assert(resOut.edgeDistanceInches > 3.0);
  });

  it('calculates player Objective Control (OC) totals and awards control', () => {
    // Player 1 has 2 models with 1 OC each = 2 OC
    const p1_1 = createTestToken('p1-1', 520, 500, 1, 1);
    const p1_2 = createTestToken('p1-2', 540, 500, 1, 1);

    // Player 2 has 1 model with 3 OC (e.g. dreadnought/vehicle) = 3 OC
    const p2_1 = createTestToken('p2-1', 480, 500, 2, 3);

    const evaluation = evaluateObjectiveMarker(marker, [p1_1, p1_2, p2_1]);
    assert.equal(evaluation.p1ModelsInZone, 2);
    assert.equal(evaluation.p1OcTotal, 2);
    assert.equal(evaluation.p2ModelsInZone, 1);
    assert.equal(evaluation.p2OcTotal, 3);
    assert.equal(evaluation.status, 2); // Player 2 controls by OC!
  });

  it('marks objective as contested when OC is tied', () => {
    const p1 = createTestToken('p1-1', 520, 500, 1, 2);
    const p2 = createTestToken('p2-1', 480, 500, 2, 2);

    const evaluation = evaluateObjectiveMarker(marker, [p1, p2]);
    assert.equal(evaluation.status, 'contested');
  });

  it('evaluates all objectives on table and scores VP accurately', () => {
    const objs = [
      { ...marker, id: 'obj-1', x: 500, y: 500 },
      { ...marker, id: 'obj-2', x: 1000, y: 1000 },
      { ...marker, id: 'obj-3', x: 1500, y: 1500 },
    ];

    // P1 controls obj-1 (2 OC vs 0)
    const t1 = createTestToken('t1', 520, 500, 1, 2);

    // P2 controls obj-2 (3 OC vs 0)
    const t2 = createTestToken('t2', 1020, 1000, 2, 3);

    // obj-3 is uncontested

    const matchEval = evaluateAllObjectives(objs, [t1, t2]);
    assert.equal(matchEval.p1ControlledCount, 1);
    assert.equal(matchEval.p2ControlledCount, 1);
    assert.equal(matchEval.uncontestedCount, 1);
    assert.equal(matchEval.p1VpEarned, 4);
    assert.equal(matchEval.p2VpEarned, 4);
    assert(matchEval.auditSummary.includes('Player 1 controls 1 (+4 VP)'));
  });
});
