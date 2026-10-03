import { WargameModel } from '../types/brawl.js';
import { calculateBaseToDistanceInches, DEFAULT_PX_PER_INCH } from './armyManager.js';

export interface CoherencyResult {
  isUnitCoherent: boolean;
  modelCoherency: Map<string, boolean>;
  violatingModelIds: string[];
  coherencyEdges: Array<{ fromModelId: string; toModelId: string }>;
}

/**
 * Real-time graph-based unit coherency validation engine (OB-156):
 * - Units of 2–5 models: Each model must be within distance of at least 1 other model in the unit.
 * - Units of 6+ models: Each model must be within distance of at least 2 other models in the unit.
 * - Units must form a single connected graph component.
 */
export function evaluateUnitCoherency(
  models: WargameModel[],
  coherencyDistanceInches: number = 2.0,
  pxPerInch: number = DEFAULT_PX_PER_INCH
): CoherencyResult {
  const activeModels = models.filter((m) => !m.isSlain);
  const n = activeModels.length;

  if (n <= 1) {
    const map = new Map<string, boolean>();
    activeModels.forEach((m) => map.set(m.id, true));
    return {
      isUnitCoherent: true,
      modelCoherency: map,
      violatingModelIds: [],
      coherencyEdges: [],
    };
  }

  // 1. Build adjacency list of models within coherency distance
  const adj = new Map<string, string[]>();
  const edges: Array<{ fromModelId: string; toModelId: string }> = [];

  activeModels.forEach((m) => adj.set(m.id, []));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const mA = activeModels[i];
      const mB = activeModels[j];
      const distInches = calculateBaseToDistanceInches(mA, mB, pxPerInch);

      if (distInches <= coherencyDistanceInches) {
        adj.get(mA.id)!.push(mB.id);
        adj.get(mB.id)!.push(mA.id);
        edges.push({ fromModelId: mA.id, toModelId: mB.id });
      }
    }
  }

  // 2. Minimum degree check per model:
  // Units of 2-5 models: each model needs >= 1 neighbor within coherency distance.
  // Units of 6+ models: each model needs >= 2 neighbors within coherency distance.
  const requiredNeighbors = n <= 5 ? 1 : 2;
  const degreeValid = new Map<string, boolean>();

  activeModels.forEach((m) => {
    const degree = adj.get(m.id)?.length || 0;
    degreeValid.set(m.id, degree >= requiredNeighbors);
  });

  // 3. Connectivity check: all models must form a single connected component
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const m of activeModels) {
    if (!visited.has(m.id)) {
      const component: string[] = [];
      const queue: string[] = [m.id];
      visited.add(m.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        component.push(curr);

        for (const neighbor of adj.get(curr) || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      components.push(component);
    }
  }

  // Identify the largest component
  components.sort((a, b) => b.length - a.length);
  const mainComponent = new Set(components[0] || []);

  const modelCoherency = new Map<string, boolean>();
  const violatingModelIds: string[] = [];

  activeModels.forEach((m) => {
    const isDegreeOk = degreeValid.get(m.id) === true;
    const isInSingleConnectedComponent = mainComponent.has(m.id) && components.length === 1;
    const isCoherent = isDegreeOk && isInSingleConnectedComponent;

    modelCoherency.set(m.id, isCoherent);
    if (!isCoherent) {
      violatingModelIds.push(m.id);
    }
  });

  return {
    isUnitCoherent: violatingModelIds.length === 0,
    modelCoherency,
    violatingModelIds,
    coherencyEdges: edges,
  };
}

/**
 * Updates an array of tokens with real-time isOutOfCoherency status flags.
 */
export function updateTokensCoherency(
  tokens: import('@oldbear/shared').Token[] | Record<string, import('@oldbear/shared').Token> | null | undefined,
  pxPerInch: number = DEFAULT_PX_PER_INCH
): import('@oldbear/shared').Token[] {
  const tokenList: import('@oldbear/shared').Token[] = Array.isArray(tokens)
    ? tokens
    : tokens
    ? Object.values(tokens)
    : [];

  const unitTokens = new Map<string, import('@oldbear/shared').Token[]>();
  tokenList.forEach((t) => {
    const unitId = (t as any).wargameUnitId;
    if (unitId) {
      if (!unitTokens.has(unitId)) unitTokens.set(unitId, []);
      unitTokens.get(unitId)!.push(t);
    }
  });

  const outOfCoherencyIds = new Set<string>();

  unitTokens.forEach((unitTList, unitId) => {
    const models: WargameModel[] = unitTList.map((t) => ({
      id: (t as any).wargameModelId || t.id,
      name: t.name,
      unitId,
      x: t.x,
      y: t.y,
      baseShape: { type: 'circle', widthMm: (t.size || 1) * 25.4 },
    }));

    const result = evaluateUnitCoherency(models, 2.0, pxPerInch);
    result.violatingModelIds.forEach((id) => outOfCoherencyIds.add(id));
  });

  return tokenList.map((t) => {
    const modelId = (t as any).wargameModelId || t.id;
    const isOutOfCoherency = outOfCoherencyIds.has(modelId);
    if (t.isOutOfCoherency !== isOutOfCoherency) {
      return { ...t, isOutOfCoherency };
    }
    return t;
  });
}

