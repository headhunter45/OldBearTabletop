import { WargamePhase } from '../types/brawl.js';

export const WARGAME_PHASES: WargamePhase[] = [
  'Command',
  'Movement',
  'Shooting',
  'Charge',
  'Fight',
  'Morale',
];

export interface PhaseState {
  currentRound: number;
  maxRounds: number;
  activePlayer: 1 | 2;
  currentPhaseIndex: number;
  player1Name: string;
  player2Name: string;
}

export interface PhaseTransitionEvent {
  type: 'phase_change' | 'turn_change' | 'round_change' | 'game_over';
  previousPhase: WargamePhase;
  newPhase: WargamePhase;
  activePlayer: 1 | 2;
  currentRound: number;
  bannerTitle: string;
  bannerSubtitle: string;
  chatAuditMessage: string;
  commandPointsGranted?: { player: 1 | 2; amount: number };
}

/**
 * Advances to the next wargaming phase or passes turn to the next player.
 * In competitive wargames (e.g. 40k), Player 1 completes all phases (Command -> Morale),
 * then turn passes to Player 2 (Command -> Morale). Once Player 2 finishes Morale,
 * the battle round increments!
 */
export function advanceWargamePhase(state: PhaseState): {
  nextState: PhaseState;
  event: PhaseTransitionEvent;
} {
  const previousPhase = WARGAME_PHASES[state.currentPhaseIndex];
  const isEndOfTurn = state.currentPhaseIndex === WARGAME_PHASES.length - 1;

  if (!isEndOfTurn) {
    // Normal phase advance within active player's turn
    const nextPhaseIndex = state.currentPhaseIndex + 1;
    const newPhase = WARGAME_PHASES[nextPhaseIndex];
    const activePlayerName = state.activePlayer === 1 ? state.player1Name : state.player2Name;

    const nextState: PhaseState = {
      ...state,
      currentPhaseIndex: nextPhaseIndex,
    };

    const event: PhaseTransitionEvent = {
      type: 'phase_change',
      previousPhase,
      newPhase,
      activePlayer: state.activePlayer,
      currentRound: state.currentRound,
      bannerTitle: `${newPhase.toUpperCase()} PHASE`,
      bannerSubtitle: `Round ${state.currentRound} • ${activePlayerName}'s Turn`,
      chatAuditMessage: `⚔️ **[Round ${state.currentRound}]** ${activePlayerName} advanced to **${newPhase} Phase**.`,
    };

    return { nextState, event };
  }

  // End of player turn: check if passing to Player 2 or starting next Round
  const isEndOfRound = state.activePlayer === 2;

  if (!isEndOfRound) {
    // Player 1 finished Morale -> Pass turn to Player 2 (Command phase)
    const nextState: PhaseState = {
      ...state,
      activePlayer: 2,
      currentPhaseIndex: 0,
    };

    const newPhase = WARGAME_PHASES[0]; // Command
    const event: PhaseTransitionEvent = {
      type: 'turn_change',
      previousPhase,
      newPhase,
      activePlayer: 2,
      currentRound: state.currentRound,
      bannerTitle: `PLAYER 2 TURN: ${newPhase.toUpperCase()}`,
      bannerSubtitle: `Round ${state.currentRound} • ${state.player2Name}'s Turn begins (+1 CP)`,
      chatAuditMessage: `🛡️ **[Round ${state.currentRound}]** Turn passed to **${state.player2Name}** (${newPhase} Phase). +1 CP awarded.`,
      commandPointsGranted: { player: 2, amount: 1 },
    };

    return { nextState, event };
  }

  // Player 2 finished Morale -> Round completes, advance to next Battle Round!
  const nextRound = state.currentRound + 1;
  const isGameOver = nextRound > state.maxRounds;

  if (isGameOver) {
    const nextState: PhaseState = {
      ...state,
      currentRound: state.maxRounds,
      currentPhaseIndex: WARGAME_PHASES.length - 1,
    };

    const event: PhaseTransitionEvent = {
      type: 'game_over',
      previousPhase,
      newPhase: previousPhase,
      activePlayer: state.activePlayer,
      currentRound: state.maxRounds,
      bannerTitle: 'BATTLE COMPLETE!',
      bannerSubtitle: `All ${state.maxRounds} Battle Rounds have concluded. Tallying final Victory Points!`,
      chatAuditMessage: `🏆 **BATTLE FINISHED!** All ${state.maxRounds} Battle Rounds concluded. Check Scoreboard for final victory tally!`,
    };

    return { nextState, event };
  }

  // Begin next Battle Round with Player 1 Command phase
  const nextState: PhaseState = {
    ...state,
    currentRound: nextRound,
    activePlayer: 1,
    currentPhaseIndex: 0,
  };

  const newPhase = WARGAME_PHASES[0]; // Command
  const event: PhaseTransitionEvent = {
    type: 'round_change',
    previousPhase,
    newPhase,
    activePlayer: 1,
    currentRound: nextRound,
    bannerTitle: `BATTLE ROUND ${nextRound}`,
    bannerSubtitle: `${state.player1Name}'s Turn begins (${newPhase} Phase, +1 CP)`,
    chatAuditMessage: `🎺 **BATTLE ROUND ${nextRound} BEGINS!** Turn passed to **${state.player1Name}** (${newPhase} Phase). +1 CP awarded.`,
    commandPointsGranted: { player: 1, amount: 1 },
  };

  return { nextState, event };
}
