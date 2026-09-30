export interface PlayerScoreState {
  primaryVp: number;
  secondaryVp: number;
  totalVp: number;
  commandPoints: number;
  casualtiesCount: number;
  casualtiesPoints: number;
}

export interface ScoreboardState {
  p1: PlayerScoreState;
  p2: PlayerScoreState;
  p1Name: string;
  p2Name: string;
  maxVp: number; // Default 100 max VP
}

export type ResourceType =
  | 'primaryVp'
  | 'secondaryVp'
  | 'commandPoints'
  | 'casualtiesCount'
  | 'casualtiesPoints';

export interface ScoreAuditEntry {
  id: string;
  timestamp: number;
  player: 1 | 2;
  playerName: string;
  resource: ResourceType;
  delta: number;
  newValue: number;
  reason?: string;
  formattedMessage: string;
}

export function createInitialPlayerScore(): PlayerScoreState {
  return {
    primaryVp: 0,
    secondaryVp: 0,
    totalVp: 0,
    commandPoints: 1, // Start with 1 CP
    casualtiesCount: 0,
    casualtiesPoints: 0,
  };
}

export function createInitialScoreboard(p1Name = 'Player 1', p2Name = 'Player 2'): ScoreboardState {
  return {
    p1: createInitialPlayerScore(),
    p2: createInitialPlayerScore(),
    p1Name,
    p2Name,
    maxVp: 100,
  };
}

export function calculateTotalVp(score: PlayerScoreState, maxVp = 100): number {
  return Math.min(maxVp, Math.max(0, score.primaryVp + score.secondaryVp));
}

/**
 * Updates a player resource, recalculates totals, and returns audit information.
 */
export function updatePlayerResource(
  state: ScoreboardState,
  player: 1 | 2,
  resource: ResourceType,
  delta: number,
  reason?: string
): { nextState: ScoreboardState; audit: ScoreAuditEntry } {
  const targetKey = player === 1 ? 'p1' : 'p2';
  const targetPlayer = state[targetKey];
  const playerName = player === 1 ? state.p1Name : state.p2Name;

  let nextPrimaryVp = targetPlayer.primaryVp;
  let nextSecondaryVp = targetPlayer.secondaryVp;
  let nextCp = targetPlayer.commandPoints;
  let nextCasualtiesCount = targetPlayer.casualtiesCount;
  let nextCasualtiesPoints = targetPlayer.casualtiesPoints;

  let newValue = 0;
  let resourceLabel = '';
  let emoji = '📊';

  switch (resource) {
    case 'primaryVp':
      nextPrimaryVp = Math.max(0, nextPrimaryVp + delta);
      newValue = nextPrimaryVp;
      resourceLabel = 'Primary VP';
      emoji = '🎯';
      break;
    case 'secondaryVp':
      nextSecondaryVp = Math.max(0, nextSecondaryVp + delta);
      newValue = nextSecondaryVp;
      resourceLabel = 'Secondary VP';
      emoji = '⭐';
      break;
    case 'commandPoints':
      nextCp = Math.max(0, nextCp + delta);
      newValue = nextCp;
      resourceLabel = 'Command Points';
      emoji = '⚡';
      break;
    case 'casualtiesCount':
      nextCasualtiesCount = Math.max(0, nextCasualtiesCount + delta);
      newValue = nextCasualtiesCount;
      resourceLabel = 'Casualty Models';
      emoji = '💀';
      break;
    case 'casualtiesPoints':
      nextCasualtiesPoints = Math.max(0, nextCasualtiesPoints + delta);
      newValue = nextCasualtiesPoints;
      resourceLabel = 'Casualty Points';
      emoji = '⚰️';
      break;
  }

  const updatedTarget: PlayerScoreState = {
    primaryVp: nextPrimaryVp,
    secondaryVp: nextSecondaryVp,
    totalVp: calculateTotalVp(
      {
        ...targetPlayer,
        primaryVp: nextPrimaryVp,
        secondaryVp: nextSecondaryVp,
      },
      state.maxVp
    ),
    commandPoints: nextCp,
    casualtiesCount: nextCasualtiesCount,
    casualtiesPoints: nextCasualtiesPoints,
  };

  const nextState: ScoreboardState = {
    ...state,
    [targetKey]: updatedTarget,
  };

  const sign = delta >= 0 ? `+${delta}` : `${delta}`;
  const reasonText = reason?.trim() ? ` (${reason.trim()})` : '';
  const formattedMessage = `${emoji} **[${playerName}]** ${resourceLabel} ${sign} ➔ ${newValue}${reasonText}. Total VP: ${updatedTarget.totalVp}`;

  const audit: ScoreAuditEntry = {
    id: `audit-score-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    player,
    playerName,
    resource,
    delta,
    newValue,
    reason,
    formattedMessage,
  };

  return { nextState, audit };
}
