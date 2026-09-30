import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialScoreboard,
  updatePlayerResource,
  calculateTotalVp,
} from './scoreboardEngine.js';

describe('Scoreboard & Resource Tracker Engine (OB-159)', () => {
  it('initializes scoreboard with default scores and 1 CP', () => {
    const sb = createInitialScoreboard('Alice', 'Bob');
    assert.equal(sb.p1Name, 'Alice');
    assert.equal(sb.p2Name, 'Bob');
    assert.equal(sb.p1.primaryVp, 0);
    assert.equal(sb.p1.secondaryVp, 0);
    assert.equal(sb.p1.totalVp, 0);
    assert.equal(sb.p1.commandPoints, 1);
    assert.equal(sb.p1.casualtiesCount, 0);
  });

  it('updates primary VP and automatically computes total VP', () => {
    let sb = createInitialScoreboard();
    const res1 = updatePlayerResource(sb, 1, 'primaryVp', 4, 'Hold 2 Objectives');
    sb = res1.nextState;

    assert.equal(sb.p1.primaryVp, 4);
    assert.equal(sb.p1.totalVp, 4);
    assert(res1.audit.formattedMessage.includes('Primary VP +4'));
    assert(res1.audit.formattedMessage.includes('Hold 2 Objectives'));

    const res2 = updatePlayerResource(sb, 1, 'secondaryVp', 3, 'Assassination');
    sb = res2.nextState;

    assert.equal(sb.p1.secondaryVp, 3);
    assert.equal(sb.p1.totalVp, 7);
  });

  it('manages command points with deduction and prevents negative values', () => {
    let sb = createInitialScoreboard();
    assert.equal(sb.p1.commandPoints, 1);

    // Spend 1 CP for re-roll
    const spend = updatePlayerResource(sb, 1, 'commandPoints', -1, 'Command Re-roll');
    sb = spend.nextState;
    assert.equal(sb.p1.commandPoints, 0);

    // Spending below zero clamps at 0
    const spendBelowZero = updatePlayerResource(sb, 1, 'commandPoints', -2);
    sb = spendBelowZero.nextState;
    assert.equal(sb.p1.commandPoints, 0);

    // Add 1 CP for round start
    const grant = updatePlayerResource(sb, 1, 'commandPoints', 1, 'Turn Turnover CP Grant');
    sb = grant.nextState;
    assert.equal(sb.p1.commandPoints, 1);
  });

  it('tracks casualties count and points destroyed', () => {
    let sb = createInitialScoreboard();
    const res1 = updatePlayerResource(sb, 2, 'casualtiesCount', 5, 'Intercessor Squad wiped');
    sb = res1.nextState;
    assert.equal(sb.p2.casualtiesCount, 5);

    const res2 = updatePlayerResource(sb, 2, 'casualtiesPoints', 85, 'Intercessor Squad value');
    sb = res2.nextState;
    assert.equal(sb.p2.casualtiesPoints, 85);
  });

  it('enforces max VP caps', () => {
    const score = {
      primaryVp: 60,
      secondaryVp: 50,
      totalVp: 0,
      commandPoints: 2,
      casualtiesCount: 0,
      casualtiesPoints: 0,
    };
    assert.equal(calculateTotalVp(score, 100), 100);
  });
});
