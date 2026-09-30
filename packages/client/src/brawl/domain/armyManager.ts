import { Token } from '@oldbear/shared';
import { WargameArmy, WargameUnit, WargameModel, BaseShape } from '../types/brawl.js';

export const MM_PER_INCH = 25.4;
export const DEFAULT_PX_PER_INCH = 50;

/**
 * Automatically disambiguates duplicate units and auto-numbers models in an army roster.
 * Example: Two "Terminators" units become "Terminators A" and "Terminators B",
 * and models inside become "Terminators A 1", "Terminators A 2", etc.
 */
export function disambiguateArmy(army: WargameArmy): WargameArmy {
  // Count unit names to identify duplicates
  const nameCounts: Record<string, number> = {};
  army.units.forEach((u) => {
    nameCounts[u.name] = (nameCounts[u.name] || 0) + 1;
  });

  const nameOccurrences: Record<string, number> = {};

  const disambiguatedUnits: WargameUnit[] = army.units.map((unit) => {
    let resolvedUnitName = unit.name;
    if (nameCounts[unit.name] > 1) {
      const occurrence = (nameOccurrences[unit.name] || 0) + 1;
      nameOccurrences[unit.name] = occurrence;
      const letter = String.fromCharCode(64 + occurrence); // 1 -> 'A', 2 -> 'B'
      resolvedUnitName = `${unit.name} ${letter}`;
    }

    // Disambiguate and auto-number models inside unit
    const models: WargameModel[] = unit.models.map((model, idx) => {
      const modelNum = idx + 1;
      const expectedDefaultPrefix = `${resolvedUnitName} ${modelNum}`;
      const name = !model.name || model.name.trim() === '' || model.name.startsWith(unit.name)
        ? expectedDefaultPrefix
        : model.name;

      return {
        ...model,
        name,
        unitId: unit.id,
      };
    });

    return {
      ...unit,
      name: resolvedUnitName,
      models,
    };
  });

  return {
    ...army,
    units: disambiguatedUnits,
  };
}

/**
 * Calculates true perimeter-to-perimeter (base-to-base) measurement in inches.
 * Accounts for circular and oval base dimensions in millimeters.
 */
export function calculateBaseToDistanceInches(
  modelA: WargameModel,
  modelB: WargameModel,
  pxPerInch: number = DEFAULT_PX_PER_INCH
): number {
  const centerDistPx = Math.hypot(modelA.x - modelB.x, modelA.y - modelB.y);

  // Compute radii in pixels based on base shape
  const radiusAPx = getBaseRadiusPx(modelA.baseShape, pxPerInch);
  const radiusBPx = getBaseRadiusPx(modelB.baseShape, pxPerInch);

  const edgeToEdgeDistPx = Math.max(0, centerDistPx - (radiusAPx + radiusBPx));
  return edgeToEdgeDistPx / pxPerInch;
}

/**
 * Returns average radial size in canvas pixels for a given base shape in millimeters.
 */
export function getBaseRadiusPx(baseShape: BaseShape, pxPerInch: number = DEFAULT_PX_PER_INCH): number {
  const widthInches = (baseShape.widthMm || 32) / MM_PER_INCH;
  const heightInches = (baseShape.heightMm || baseShape.widthMm || 32) / MM_PER_INCH;
  const avgDiameterInches = (widthInches + heightInches) / 2;
  return (avgDiameterInches * pxPerInch) / 2;
}

/**
 * Converts a WargameModel into a fully ready-to-fight VTT canvas Token.
 */
export function modelToToken(
  model: WargameModel,
  unit: WargameUnit,
  army: WargameArmy,
  pxPerInch: number = DEFAULT_PX_PER_INCH
): Token {
  const widthInches = (model.baseShape.widthMm || 32) / MM_PER_INCH;
  const heightInches = (model.baseShape.heightMm || model.baseShape.widthMm || 32) / MM_PER_INCH;
  const size = Math.max(0.5, Math.round(widthInches * 10) / 10);

  const wounds = unit.datasheet?.woundsPerModel || 1;

  return {
    id: `token_${model.id}`,
    name: model.name,
    x: model.x,
    y: model.y,
    size,
    color: '#f59e0b',
    currentHp: wounds,
    maxHp: wounds,
    armorClass: parseInt(unit.datasheet?.armorSave?.replace('+', '') || '3', 10) || 10,
    initiativeBonus: 0,
    // Tag wargaming specific metadata
    wargameArmyId: army.id,
    wargameUnitId: unit.id,
    wargameModelId: model.id,
  } as Token & {
    wargameArmyId: string;
    wargameUnitId: string;
    wargameModelId: string;
  };
}
