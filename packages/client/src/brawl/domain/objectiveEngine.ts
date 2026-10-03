import { Token } from '@oldbear/shared';
import { calculateBaseRadiusInches } from './armyManager.js';

export interface ObjectiveMarker {
  id: string;
  label: string;
  x: number;
  y: number;
  baseMm: number; // default 40mm
  controlRadiusInches: number; // default 3.0 inches
  vpValue: number; // default 4 VP
}

export type ObjectiveControlStatus = 1 | 2 | 'contested' | 'uncontested';

export interface ObjectiveEvaluation {
  marker: ObjectiveMarker;
  p1ModelsInZone: number;
  p2ModelsInZone: number;
  p1OcTotal: number;
  p2OcTotal: number;
  status: ObjectiveControlStatus;
  controllingPlayerName?: string;
}

export interface MatchObjectivesEvaluation {
  evaluations: ObjectiveEvaluation[];
  p1ControlledCount: number;
  p2ControlledCount: number;
  contestedCount: number;
  uncontestedCount: number;
  p1VpEarned: number;
  p2VpEarned: number;
  auditSummary: string;
}

export const STANDARD_OBJECTIVE_BASE_MM = 40;
export const STANDARD_CONTROL_RADIUS_INCHES = 3.0;
export const DEFAULT_OBJECTIVE_VP = 4;

/**
 * Creates 5 standard tournament wargaming objective markers centered for a 60" x 44" table.
 * Standard scale: 50 pixels per inch.
 */
export function createStandardObjectives(
  tableWidthPx = 3000,
  tableHeightPx = 2200
): ObjectiveMarker[] {
  const centerX = tableWidthPx / 2;
  const centerY = tableHeightPx / 2;

  // 1 Center, 4 Quadrant / Midfield Objectives (approx 12-16" from center)
  const offsetXPx = 14 * 50; // 700px
  const offsetYPx = 10 * 50; // 500px

  return [
    {
      id: 'obj-center',
      label: 'Objective 1 (Center)',
      x: centerX,
      y: centerY,
      baseMm: STANDARD_OBJECTIVE_BASE_MM,
      controlRadiusInches: STANDARD_CONTROL_RADIUS_INCHES,
      vpValue: DEFAULT_OBJECTIVE_VP,
    },
    {
      id: 'obj-nw',
      label: 'Objective 2 (North-West)',
      x: centerX - offsetXPx,
      y: centerY - offsetYPx,
      baseMm: STANDARD_OBJECTIVE_BASE_MM,
      controlRadiusInches: STANDARD_CONTROL_RADIUS_INCHES,
      vpValue: DEFAULT_OBJECTIVE_VP,
    },
    {
      id: 'obj-ne',
      label: 'Objective 3 (North-East)',
      x: centerX + offsetXPx,
      y: centerY - offsetYPx,
      baseMm: STANDARD_OBJECTIVE_BASE_MM,
      controlRadiusInches: STANDARD_CONTROL_RADIUS_INCHES,
      vpValue: DEFAULT_OBJECTIVE_VP,
    },
    {
      id: 'obj-sw',
      label: 'Objective 4 (South-West)',
      x: centerX - offsetXPx,
      y: centerY + offsetYPx,
      baseMm: STANDARD_OBJECTIVE_BASE_MM,
      controlRadiusInches: STANDARD_CONTROL_RADIUS_INCHES,
      vpValue: DEFAULT_OBJECTIVE_VP,
    },
    {
      id: 'obj-se',
      label: 'Objective 5 (South-East)',
      x: centerX + offsetXPx,
      y: centerY + offsetYPx,
      baseMm: STANDARD_OBJECTIVE_BASE_MM,
      controlRadiusInches: STANDARD_CONTROL_RADIUS_INCHES,
      vpValue: DEFAULT_OBJECTIVE_VP,
    },
  ];
}

/**
 * Resolves model's Objective Control (OC) value.
 * Models can have custom `token.oc` or defaults:
 * Vehicles/Monsters/Large = 3 OC, Battleline/Standard = 1-2 OC, Tiny/Swarm = 0.
 */
export function getModelOc(token: Token): number {
  if (typeof (token as any).oc === 'number') {
    return (token as any).oc;
  }
  if (token.size === 'tiny') return 0;
  if (token.size === 'large') return 3;
  if (token.size === 'huge' || token.size === 'gargantuan') return 5;
  return 1;
}

/**
 * Resolves which player (1 or 2) a model token belongs to.
 */
export function getModelPlayer(token: Token, p1UserId?: string, p2UserId?: string): 1 | 2 {
  if ((token as any).player === 2 || (p2UserId && token.userId === p2UserId)) {
    return 2;
  }
  if ((token as any).player === 1 || (p1UserId && token.userId === p1UserId)) {
    return 1;
  }
  return 1;
}

/**
 * Checks if a model's base is within the 3" control zone of an objective marker.
 * Measured edge-to-edge from the 40mm marker base.
 */
export function isModelInControlZone(
  marker: ObjectiveMarker,
  token: Token,
  pixelsPerInch = 50
): { inZone: boolean; edgeDistanceInches: number } {
  const dx = (token.x - marker.x) / pixelsPerInch;
  const dy = (token.y - marker.y) / pixelsPerInch;
  const centerDistanceInches = Math.sqrt(dx * dx + dy * dy);

  const markerBaseRadiusInches = (marker.baseMm / 25.4) / 2;
  const modelBaseRadiusInches = calculateBaseRadiusInches(token);

  const edgeDistanceInches = Math.max(
    0,
    centerDistanceInches - markerBaseRadiusInches - modelBaseRadiusInches
  );

  return {
    inZone: edgeDistanceInches <= marker.controlRadiusInches,
    edgeDistanceInches,
  };
}

/**
 * Evaluates control status for a single objective marker.
 */
export function evaluateObjectiveMarker(
  marker: ObjectiveMarker,
  tokens: Token[] | Record<string, Token> | null | undefined,
  options: {
    pixelsPerInch?: number;
    p1UserId?: string;
    p2UserId?: string;
    p1Name?: string;
    p2Name?: string;
  } = {}
): ObjectiveEvaluation {
  const tokenList: Token[] = Array.isArray(tokens)
    ? tokens
    : tokens
    ? Object.values(tokens)
    : [];

  const pixelsPerInch = options.pixelsPerInch ?? 50;
  const p1Name = options.p1Name ?? 'Player 1';
  const p2Name = options.p2Name ?? 'Player 2';

  let p1ModelsInZone = 0;
  let p2ModelsInZone = 0;
  let p1OcTotal = 0;
  let p2OcTotal = 0;

  for (const token of tokenList) {
    // Skip dead or invisible tokens
    if (token.dead || token.invisible) continue;

    const { inZone } = isModelInControlZone(marker, token, pixelsPerInch);
    if (!inZone) continue;

    const player = getModelPlayer(token, options.p1UserId, options.p2UserId);
    const oc = getModelOc(token);

    if (player === 1) {
      p1ModelsInZone += 1;
      p1OcTotal += oc;
    } else {
      p2ModelsInZone += 1;
      p2OcTotal += oc;
    }
  }

  let status: ObjectiveControlStatus = 'uncontested';
  let controllingPlayerName: string | undefined = undefined;

  if (p1OcTotal > p2OcTotal) {
    status = 1;
    controllingPlayerName = p1Name;
  } else if (p2OcTotal > p1OcTotal) {
    status = 2;
    controllingPlayerName = p2Name;
  } else if (p1OcTotal === p2OcTotal && p1OcTotal > 0) {
    status = 'contested';
  }

  return {
    marker,
    p1ModelsInZone,
    p2ModelsInZone,
    p1OcTotal,
    p2OcTotal,
    status,
    controllingPlayerName,
  };
}

/**
 * Evaluates all objectives on the battlefield and tallies victory points.
 */
export function evaluateAllObjectives(
  markers: ObjectiveMarker[],
  tokens: Token[] | Record<string, Token> | null | undefined,
  options: {
    pixelsPerInch?: number;
    p1UserId?: string;
    p2UserId?: string;
    p1Name?: string;
    p2Name?: string;
    scoringPlayer?: 1 | 2; // if only active player scores
  } = {}
): MatchObjectivesEvaluation {
  const tokenList: Token[] = Array.isArray(tokens)
    ? tokens
    : tokens
    ? Object.values(tokens)
    : [];

  const p1Name = options.p1Name ?? 'Player 1';
  const p2Name = options.p2Name ?? 'Player 2';

  const evaluations = markers.map((m) => evaluateObjectiveMarker(m, tokenList, options));

  let p1ControlledCount = 0;
  let p2ControlledCount = 0;
  let contestedCount = 0;
  let uncontestedCount = 0;

  let p1VpEarned = 0;
  let p2VpEarned = 0;

  for (const ev of evaluations) {
    if (ev.status === 1) {
      p1ControlledCount += 1;
      if (!options.scoringPlayer || options.scoringPlayer === 1) {
        p1VpEarned += ev.marker.vpValue;
      }
    } else if (ev.status === 2) {
      p2ControlledCount += 1;
      if (!options.scoringPlayer || options.scoringPlayer === 2) {
        p2VpEarned += ev.marker.vpValue;
      }
    } else if (ev.status === 'contested') {
      contestedCount += 1;
    } else {
      uncontestedCount += 1;
    }
  }

  const p1Summary = `${p1Name} controls ${p1ControlledCount} (+${p1VpEarned} VP)`;
  const p2Summary = `${p2Name} controls ${p2ControlledCount} (+${p2VpEarned} VP)`;
  const contestSummary = contestedCount > 0 ? `, ${contestedCount} contested` : '';

  const auditSummary = `🎯 **Objective Scoring**: ${p1Summary} | ${p2Summary}${contestSummary}.`;

  return {
    evaluations,
    p1ControlledCount,
    p2ControlledCount,
    contestedCount,
    uncontestedCount,
    p1VpEarned,
    p2VpEarned,
    auditSummary,
  };
}
