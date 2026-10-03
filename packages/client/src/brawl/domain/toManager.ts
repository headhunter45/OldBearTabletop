import { ChatMessage, Token, SubmapConfig } from '@oldbear/shared';
import { ScoreboardState, PlayerScoreState, ScoreAuditEntry } from './scoreboardEngine.js';
import { isPointInSubmap } from '../../common/engine/SubmapManager.js';

export type BrawlUserRole = 'player' | 'to' | 'spectator';

export interface OfficialRuling {
  id: string;
  timestamp: number;
  toName: string;
  ruling: string;
  context?: string;
}

export interface MatchPrivacySettings {
  allowSpectators: boolean;
  hideSecretObjectives: boolean;
  hideReservesFromSpectators: boolean;
}

export interface MatchReport {
  matchId: string;
  title: string;
  generatedAt: number;
  dateString: string;
  battleRound: number;
  p1: {
    name: string;
    totalVp: number;
    primaryVp: number;
    secondaryVp: number;
    commandPoints: number;
    casualties: number;
    timeRemainingSeconds: number;
  };
  p2: {
    name: string;
    totalVp: number;
    primaryVp: number;
    secondaryVp: number;
    commandPoints: number;
    casualties: number;
    timeRemainingSeconds: number;
  };
  winner: 'Player 1' | 'Player 2' | 'Draw / Tie';
  vpDifferential: number;
  auditTrail: ScoreAuditEntry[];
  rulings: OfficialRuling[];
}

/**
 * Formats a Tournament Organizer (TO) official ruling into a high-visibility ChatMessage.
 */
export function formatOfficialRulingMessage(ruling: OfficialRuling): ChatMessage {
  return {
    id: ruling.id,
    senderId: 'tournament_organizer',
    senderName: `TO: ${ruling.toName}`,
    senderColor: '#f59e0b',
    text: `⚖️ **OFFICIAL TOURNAMENT RULING**\n${ruling.context ? `*Query: ${ruling.context}*\n` : ''}**Ruling:** ${ruling.ruling}`,
    timestamp: ruling.timestamp,
    isCommand: true,
  };
}

/**
 * Applies administrative score and resource overrides by a Tournament Organizer.
 */
export function applyScoreOverride(
  scoreboard: ScoreboardState,
  player: 1 | 2,
  updates: Partial<PlayerScoreState>,
  reason: string,
  toName: string
): { updatedScoreboard: ScoreboardState; auditEntry: ScoreAuditEntry } {
  const targetKey = player === 1 ? 'p1' : 'p2';
  const current = scoreboard[targetKey];
  const pName = player === 1 ? scoreboard.p1Name : scoreboard.p2Name;

  const nextPlayer: PlayerScoreState = {
    ...current,
    ...updates,
  };

  // Recompute totalVp
  nextPlayer.totalVp = Math.min(100, Math.max(0, nextPlayer.primaryVp + nextPlayer.secondaryVp));

  const updatedScoreboard: ScoreboardState = {
    ...scoreboard,
    [targetKey]: nextPlayer,
  };

  const auditEntry: ScoreAuditEntry = {
    id: `audit_to_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    player,
    resource: 'primaryVp',
    previousValue: current.totalVp,
    newValue: nextPlayer.totalVp,
    delta: nextPlayer.totalVp - current.totalVp,
    reason: `[TO Override by ${toName}] ${reason || 'Score adjusted'}`,
    formattedMessage: `⚖️ [TO ${toName}] Adjusted **${pName}** scores: Primary VP: ${nextPlayer.primaryVp}, Secondary VP: ${nextPlayer.secondaryVp}, Total VP: ${nextPlayer.totalVp} (Reason: ${reason || 'Official adjustment'})`,
  };

  return {
    updatedScoreboard,
    auditEntry,
  };
}

/**
 * Adjusts chess clock remaining seconds for a player (e.g. adding time for a ruling or applying a clock penalty).
 */
export function adjustClockTime(currentSeconds: number, deltaSeconds: number): number {
  return currentSeconds + deltaSeconds;
}

/**
 * Generates an exportable tournament match report document.
 */
export function generateMatchReport(params: {
  matchId: string;
  title: string;
  battleRound: number;
  scoreboard: ScoreboardState;
  p1ClockSeconds: number;
  p2ClockSeconds: number;
  auditTrail: ScoreAuditEntry[];
  rulings: OfficialRuling[];
}): MatchReport {
  const { matchId, title, battleRound, scoreboard, p1ClockSeconds, p2ClockSeconds, auditTrail, rulings } = params;

  let winner: 'Player 1' | 'Player 2' | 'Draw / Tie' = 'Draw / Tie';
  if (scoreboard.p1.totalVp > scoreboard.p2.totalVp) {
    winner = 'Player 1';
  } else if (scoreboard.p2.totalVp > scoreboard.p1.totalVp) {
    winner = 'Player 2';
  }

  const vpDifferential = Math.abs(scoreboard.p1.totalVp - scoreboard.p2.totalVp);

  return {
    matchId,
    title: title || 'Old Bear Brawl Tournament Match',
    generatedAt: Date.now(),
    dateString: new Date().toISOString(),
    battleRound,
    p1: {
      name: scoreboard.p1Name,
      totalVp: scoreboard.p1.totalVp,
      primaryVp: scoreboard.p1.primaryVp,
      secondaryVp: scoreboard.p1.secondaryVp,
      commandPoints: scoreboard.p1.commandPoints,
      casualties: scoreboard.p1.casualties,
      timeRemainingSeconds: p1ClockSeconds,
    },
    p2: {
      name: scoreboard.p2Name,
      totalVp: scoreboard.p2.totalVp,
      primaryVp: scoreboard.p2.primaryVp,
      secondaryVp: scoreboard.p2.secondaryVp,
      commandPoints: scoreboard.p2.commandPoints,
      casualties: scoreboard.p2.casualties,
      timeRemainingSeconds: p2ClockSeconds,
    },
    winner,
    vpDifferential,
    auditTrail,
    rulings,
  };
}

/**
 * Formats a MatchReport into printable text / markdown for tournament submission cards.
 */
export function formatMatchReportAsText(report: MatchReport): string {
  const formatTime = (secs: number) => {
    const mins = Math.floor(Math.abs(secs) / 60);
    const s = Math.abs(secs) % 60;
    const sign = secs < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return `=====================================================
OLD BEAR BRAWL TOURNAMENT MATCH REPORT
=====================================================
Match: ${report.title} (ID: ${report.matchId})
Date: ${report.dateString}
Final Battle Round: ${report.battleRound}
Outcome: ${report.winner} (Differential: ${report.vpDifferential} VP)

-----------------------------------------------------
PLAYER 1: ${report.p1.name}
-----------------------------------------------------
Total Victory Points: ${report.p1.totalVp} / 100
- Primary VP:         ${report.p1.primaryVp}
- Secondary VP:       ${report.p1.secondaryVp}
Command Points Remaining: ${report.p1.commandPoints}
Casualties Suffered:      ${report.p1.casualties}
Clock Time Remaining:     ${formatTime(report.p1.timeRemainingSeconds)}

-----------------------------------------------------
PLAYER 2: ${report.p2.name}
-----------------------------------------------------
Total Victory Points: ${report.p2.totalVp} / 100
- Primary VP:         ${report.p2.primaryVp}
- Secondary VP:       ${report.p2.secondaryVp}
Command Points Remaining: ${report.p2.commandPoints}
Casualties Suffered:      ${report.p2.casualties}
Clock Time Remaining:     ${formatTime(report.p2.timeRemainingSeconds)}

-----------------------------------------------------
OFFICIAL TOURNAMENT RULINGS (${report.rulings.length})
-----------------------------------------------------
${report.rulings.length === 0 ? 'None' : report.rulings.map((r, i) => `${i + 1}. [TO: ${r.toName}] ${r.context ? `(${r.context}) ` : ''}=> ${r.ruling}`).join('\n')}

-----------------------------------------------------
MATCH AUDIT LOG (${report.auditTrail.length} events)
-----------------------------------------------------
${report.auditTrail.slice(0, 20).map((a) => `- [${new Date(a.timestamp).toLocaleTimeString()}] ${a.formattedMessage}`).join('\n')}
=====================================================`;
}

/**
 * Filters game tokens for spectator mode based on match privacy settings.
 * Redacts tokens located in hidden reserves or secret staging submaps.
 */
export function filterTokensForSpectator(
  tokens: Token[] | Record<string, Token> | null | undefined,
  privacy: MatchPrivacySettings,
  submaps: SubmapConfig[] = []
): Token[] {
  const tokenList: Token[] = Array.isArray(tokens)
    ? tokens
    : tokens
    ? Object.values(tokens)
    : [];

  if (!privacy.hideReservesFromSpectators) {
    return tokenList;
  }

  // Find reserves submaps
  const reserveSubmaps = submaps.filter(
    (s) => s.type === 'staging_area' && s.name.toLowerCase().includes('reserves')
  );

  if (reserveSubmaps.length === 0) {
    return tokenList;
  }

  return tokenList.filter((token) => {
    // If token is inside any reserves submap, hide from spectator
    const inReserves = reserveSubmaps.some((sub) => isPointInSubmap(sub, token.x, token.y));
    return !inReserves;
  });
}

