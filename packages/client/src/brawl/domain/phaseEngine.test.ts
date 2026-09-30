import { describe, it } from 'node:test';
import assert from 'node:assert';
import { advanceWargamePhase, PhaseState, WARGAME_PHASES } from './phaseEngine.js';

describe('Battle Round Stepper & Wargaming Phase Engine (OB-157)', () => {
  it('advances sequentially through wargaming phases for active player', () => {
    const initialState: PhaseState = {
      currentRound: 1,
      maxRounds: 5,
      activePlayer: 1,
      currentPhaseIndex: 0, // Command
      player1Name: 'Player 1',
      player2Name: 'Player 2',
    };

    // Step to Movement
    const step1 = advanceWargamePhase(initialState);
    assert.strictEqual(step1.nextState.currentPhaseIndex, 1);
    assert.strictEqual(WARGAME_PHASES[step1.nextState.currentPhaseIndex], 'Movement');
    assert.strictEqual(step1.event.type, 'phase_change');
    assert.ok(step1.event.chatAuditMessage.includes('Movement Phase'));

    // Step through to Shooting, Charge, Fight, Morale
    let state = step1.nextState;
    const expected = ['Shooting', 'Charge', 'Fight', 'Morale'];
    for (const exp of expected) {
      const step = advanceWargamePhase(state);
      assert.strictEqual(WARGAME_PHASES[step.nextState.currentPhaseIndex], exp);
      assert.strictEqual(step.nextState.activePlayer, 1);
      state = step.nextState;
    }
    assert.strictEqual(WARGAME_PHASES[state.currentPhaseIndex], 'Morale');
  });

  it('switches turn to Player 2 when Player 1 finishes Morale phase and grants CP', () => {
    const moraleState: PhaseState = {
      currentRound: 1,
      maxRounds: 5,
      activePlayer: 1,
      currentPhaseIndex: 5, // Morale
      player1Name: 'Alice',
      player2Name: 'Bob',
    };

    const turnChange = advanceWargamePhase(moraleState);
    assert.strictEqual(turnChange.event.type, 'turn_change');
    assert.strictEqual(turnChange.nextState.activePlayer, 2);
    assert.strictEqual(turnChange.nextState.currentPhaseIndex, 0); // Command
    assert.strictEqual(turnChange.nextState.currentRound, 1);
    assert.deepStrictEqual(turnChange.event.commandPointsGranted, { player: 2, amount: 1 });
    assert.ok(turnChange.event.chatAuditMessage.includes('Bob'));
  });

  it('advances Battle Round when Player 2 finishes Morale phase', () => {
    const p2MoraleState: PhaseState = {
      currentRound: 1,
      maxRounds: 5,
      activePlayer: 2,
      currentPhaseIndex: 5, // Morale
      player1Name: 'Alice',
      player2Name: 'Bob',
    };

    const roundChange = advanceWargamePhase(p2MoraleState);
    assert.strictEqual(roundChange.event.type, 'round_change');
    assert.strictEqual(roundChange.nextState.currentRound, 2);
    assert.strictEqual(roundChange.nextState.activePlayer, 1);
    assert.strictEqual(roundChange.nextState.currentPhaseIndex, 0); // Command
    assert.deepStrictEqual(roundChange.event.commandPointsGranted, { player: 1, amount: 1 });
    assert.ok(roundChange.event.bannerTitle.includes('ROUND 2'));
  });

  it('triggers game_over when final battle round concludes', () => {
    const finalRoundP2Morale: PhaseState = {
      currentRound: 5,
      maxRounds: 5,
      activePlayer: 2,
      currentPhaseIndex: 5, // Morale
      player1Name: 'Alice',
      player2Name: 'Bob',
    };

    const gameOver = advanceWargamePhase(finalRoundP2Morale);
    assert.strictEqual(gameOver.event.type, 'game_over');
    assert.strictEqual(gameOver.nextState.currentRound, 5);
    assert.ok(gameOver.event.bannerTitle.includes('BATTLE COMPLETE'));
  });
});
