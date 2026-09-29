import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  WargameArmy,
  WargameUnit,
  WargamePhase,
  WargameScoreBoard,
} from './types/brawl.js';

describe('Brawl Tabletop Wargaming Module (OB-136)', () => {
  it('calculates total army points and validates against points limit', () => {
    const army: WargameArmy = {
      id: 'army_tau',
      name: 'Hunter Cadre',
      faction: "T'au Empire",
      pointsLimit: 1000,
      units: [
        {
          id: 'u1',
          name: 'Crisis Battlesuits',
          armyId: 'army_tau',
          points: 200,
          coherencyDistanceInches: 2.0,
          models: [],
          baseActions: [],
        },
        {
          id: 'u2',
          name: 'Broadside Battlesuits',
          armyId: 'army_tau',
          points: 180,
          coherencyDistanceInches: 2.0,
          models: [],
          baseActions: [],
        },
        {
          id: 'u3',
          name: 'Strike Team',
          armyId: 'army_tau',
          points: 80,
          coherencyDistanceInches: 2.0,
          models: [],
          baseActions: [],
        },
      ],
    };

    const totalPoints = army.units.reduce((sum, u) => sum + u.points, 0);
    assert.strictEqual(totalPoints, 460);
    assert.ok(totalPoints <= army.pointsLimit);
  });

  it('evaluates unit coherency for models based on distance in inches', () => {
    // 1 inch = 50px at default 50px/grid standard
    const PX_PER_INCH = 50;

    const unit: WargameUnit = {
      id: 'unit_marines',
      name: 'Tactical Squad',
      armyId: 'army_1',
      points: 100,
      coherencyDistanceInches: 2.0,
      models: [
        { id: 'm1', name: 'Marine 1', unitId: 'unit_marines', x: 100, y: 100, baseShape: { type: 'circle', widthMm: 32 } },
        { id: 'm2', name: 'Marine 2', unitId: 'unit_marines', x: 150, y: 100, baseShape: { type: 'circle', widthMm: 32 } }, // 1 inch away -> coherent
        { id: 'm3', name: 'Marine 3', unitId: 'unit_marines', x: 500, y: 500, baseShape: { type: 'circle', widthMm: 32 } }, // ~11 inches away -> out of coherency
      ],
      baseActions: [],
    };

    const maxCoherencyPx = unit.coherencyDistanceInches * PX_PER_INCH;

    function isModelCoherent(modelIdx: number): boolean {
      const target = unit.models[modelIdx];
      return unit.models.some((other, idx) => {
        if (idx === modelIdx) return false;
        const dist = Math.hypot(target.x - other.x, target.y - other.y);
        return dist <= maxCoherencyPx;
      });
    }

    assert.strictEqual(isModelCoherent(0), true, 'Marine 1 should be in coherency with Marine 2');
    assert.strictEqual(isModelCoherent(1), true, 'Marine 2 should be in coherency with Marine 1');
    assert.strictEqual(isModelCoherent(2), false, 'Marine 3 is stranded beyond coherency range');
  });

  it('cycles wargaming phases correctly across battle rounds', () => {
    const phases: WargamePhase[] = ['Command', 'Movement', 'Shooting', 'Charge', 'Fight', 'Morale'];

    let currentRound = 1;
    let currentPhaseIndex = 0;

    const advancePhase = () => {
      currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
      if (currentPhaseIndex === 0) {
        currentRound += 1;
      }
    };

    assert.strictEqual(phases[currentPhaseIndex], 'Command');
    advancePhase();
    assert.strictEqual(phases[currentPhaseIndex], 'Movement');
    advancePhase();
    assert.strictEqual(phases[currentPhaseIndex], 'Shooting');
    advancePhase();
    assert.strictEqual(phases[currentPhaseIndex], 'Charge');
    advancePhase();
    assert.strictEqual(phases[currentPhaseIndex], 'Fight');
    advancePhase();
    assert.strictEqual(phases[currentPhaseIndex], 'Morale');
    assert.strictEqual(currentRound, 1);

    // Morale -> Command starts Round 2
    advancePhase();
    assert.strictEqual(phases[currentPhaseIndex], 'Command');
    assert.strictEqual(currentRound, 2);
  });
});
