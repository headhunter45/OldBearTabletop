import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  disambiguateArmy,
  calculateBaseToDistanceInches,
  modelToToken,
  MM_PER_INCH,
} from './armyManager.js';
import { WargameArmy } from '../types/brawl.js';

describe('Army, Unit, and Model Domain Hierarchy & Disambiguation (OB-155)', () => {
  it('disambiguates duplicate unit names into letters A, B and auto-numbers models', () => {
    const rawArmy: WargameArmy = {
      id: 'army_sm',
      name: 'Gladius Task Force',
      faction: 'Adeptus Astartes',
      pointsLimit: 2000,
      units: [
        {
          id: 'u1',
          name: 'Terminators',
          armyId: 'army_sm',
          points: 185,
          coherencyDistanceInches: 2.0,
          models: [
            { id: 'm1', name: '', unitId: 'u1', x: 0, y: 0, baseShape: { type: 'circle', widthMm: 40 } },
            { id: 'm2', name: '', unitId: 'u1', x: 0, y: 0, baseShape: { type: 'circle', widthMm: 40 } },
          ],
          baseActions: [],
        },
        {
          id: 'u2',
          name: 'Terminators',
          armyId: 'army_sm',
          points: 185,
          coherencyDistanceInches: 2.0,
          models: [
            { id: 'm3', name: '', unitId: 'u2', x: 0, y: 0, baseShape: { type: 'circle', widthMm: 40 } },
            { id: 'm4', name: '', unitId: 'u2', x: 0, y: 0, baseShape: { type: 'circle', widthMm: 40 } },
          ],
          baseActions: [],
        },
        {
          id: 'u3',
          name: 'Repulsor',
          armyId: 'army_sm',
          points: 190,
          coherencyDistanceInches: 2.0,
          models: [
            { id: 'm5', name: '', unitId: 'u3', x: 0, y: 0, baseShape: { type: 'rect', widthMm: 170, heightMm: 100 } },
          ],
          baseActions: [],
        },
      ],
    };

    const disambiguated = disambiguateArmy(rawArmy);

    // Duplicate units are suffixed with A and B
    assert.strictEqual(disambiguated.units[0].name, 'Terminators A');
    assert.strictEqual(disambiguated.units[1].name, 'Terminators B');
    // Unique unit name is preserved
    assert.strictEqual(disambiguated.units[2].name, 'Repulsor');

    // Models inside duplicate units are auto-numbered
    assert.strictEqual(disambiguated.units[0].models[0].name, 'Terminators A 1');
    assert.strictEqual(disambiguated.units[0].models[1].name, 'Terminators A 2');
    assert.strictEqual(disambiguated.units[1].models[0].name, 'Terminators B 1');
    assert.strictEqual(disambiguated.units[1].models[1].name, 'Terminators B 2');

    // Models inside unique unit are auto-numbered with unit name
    assert.strictEqual(disambiguated.units[2].models[0].name, 'Repulsor 1');
  });

  it('calculates true base-to-base (perimeter-to-perimeter) measurements in inches', () => {
    // 50px per inch
    const PX_PER_INCH = 50;

    // Two 32mm circular bases: radius = (32 / 25.4 * 50) / 2 = ~31.496 px
    const modelA = {
      id: 'm1',
      name: 'Marine 1',
      unitId: 'u1',
      x: 0,
      y: 0,
      baseShape: { type: 'circle' as const, widthMm: 32 },
    };

    // Center distance = 100px = 2.0 inches center-to-center
    const modelB = {
      id: 'm2',
      name: 'Marine 2',
      unitId: 'u1',
      x: 100,
      y: 0,
      baseShape: { type: 'circle' as const, widthMm: 32 },
    };

    const baseDistanceInches = calculateBaseToDistanceInches(modelA, modelB, PX_PER_INCH);

    // Center distance is 2.0 inches. Combined radii is ~1.26 inches (32mm in inches).
    // Perimeter-to-perimeter distance should be approximately 2.0 - 1.26 = 0.74 inches.
    assert.ok(baseDistanceInches > 0.7 && baseDistanceInches < 0.75, `Expected ~0.74 inches, got ${baseDistanceInches}`);

    // If models are touching or overlapping, distance should clamp to 0
    const touchingModel = {
      id: 'm3',
      name: 'Marine 3',
      unitId: 'u1',
      x: 30, // 30px is within the 63px sum of radii
      y: 0,
      baseShape: { type: 'circle' as const, widthMm: 32 },
    };

    const overlapDist = calculateBaseToDistanceInches(modelA, touchingModel, PX_PER_INCH);
    assert.strictEqual(overlapDist, 0, 'Touching or overlapping bases must return 0 inches distance');
  });

  it('converts a WargameModel into a battlemap Token with base scale and wound profile', () => {
    const army: WargameArmy = {
      id: 'army_orks',
      name: 'Green Tide',
      faction: 'Orks',
      pointsLimit: 1000,
      units: [],
    };

    const unit = {
      id: 'u_boyz',
      name: 'Boyz',
      armyId: 'army_orks',
      points: 85,
      coherencyDistanceInches: 2.0,
      models: [],
      baseActions: [],
      datasheet: {
        movementInches: 5,
        toughness: 5,
        armorSave: '5+',
        woundsPerModel: 1,
        leadership: '7+',
        objectiveControl: 2,
      },
    };

    const model = {
      id: 'm_nob',
      name: 'Boyz 1',
      unitId: 'u_boyz',
      x: 250,
      y: 300,
      baseShape: { type: 'circle' as const, widthMm: 32 },
    };

    const token = modelToToken(model, unit, army);

    assert.strictEqual(token.id, 'token_m_nob');
    assert.strictEqual(token.name, 'Boyz 1');
    assert.strictEqual(token.x, 250);
    assert.strictEqual(token.y, 300);
    assert.strictEqual(token.currentHp, 1);
    assert.strictEqual(token.maxHp, 1);
    assert.strictEqual(token.armorClass, 5);
    // 32mm / 25.4mm = ~1.26 -> rounded to 1.3
    assert.strictEqual(token.size, 1.3);
  });
});
