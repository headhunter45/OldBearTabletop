import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatOfficialRulingMessage,
  applyScoreOverride,
  adjustClockTime,
  generateMatchReport,
  formatMatchReportAsText,
  filterTokensForSpectator,
} from './toManager.js';
import { createInitialScoreboard } from './scoreboardEngine.js';
import { SubmapConfig, Token } from '@oldbear/shared';

describe('Tournament Organizer (TO) Mode, Match Privacy & Spectator Controls (OB-163)', () => {
  describe('Official Rulings', () => {
    it('formats official TO rulings into marked system chat messages', () => {
      const msg = formatOfficialRulingMessage({
        id: 'rule_1',
        timestamp: 1700000000000,
        toName: 'Judge Dredd',
        context: 'Can Terminators charge after Rapid Ingress?',
        ruling: 'No, Rapid Ingress occurs at the end of the opponent Movement phase.',
      });

      assert.strictEqual(msg.senderId, 'tournament_organizer');
      assert.strictEqual(msg.senderName, 'TO: Judge Dredd');
      assert.strictEqual(msg.senderColor, '#f59e0b');
      assert(msg.text.includes('OFFICIAL TOURNAMENT RULING'));
      assert(msg.text.includes('Rapid Ingress'));
      assert.strictEqual(msg.isCommand, true);
    });
  });

  describe('Score Overrides & Clock Adjustments', () => {
    it('applies score override and records audit log tagged with TO name', () => {
      const scoreboard = createInitialScoreboard('Player 1', 'Player 2');
      const { updatedScoreboard, auditEntry } = applyScoreOverride(
        scoreboard,
        1,
        { primaryVp: 20, secondaryVp: 15 },
        'Rectified incorrect objective scoring in Round 2',
        'Head Judge Sarah'
      );

      assert.strictEqual(updatedScoreboard.p1.primaryVp, 20);
      assert.strictEqual(updatedScoreboard.p1.secondaryVp, 15);
      assert.strictEqual(updatedScoreboard.p1.totalVp, 35);
      assert(auditEntry.reason.includes('Head Judge Sarah'));
      assert(auditEntry.formattedMessage.includes('Head Judge Sarah'));
    });

    it('adjusts clock times with positive or negative deltas', () => {
      assert.strictEqual(adjustClockTime(3600, 300), 3900); // +5 min for ruling
      assert.strictEqual(adjustClockTime(3600, -120), 3480); // -2 min clock penalty
    });
  });

  describe('Match Report Export', () => {
    it('generates a complete match report with winner, scores, and rulings', () => {
      let sb = createInitialScoreboard('Roboute Guilliman', 'Abaddon the Despoiler');
      sb = {
        ...sb,
        p1: { ...sb.p1, totalVp: 85, primaryVp: 45, secondaryVp: 40, commandPoints: 2, casualties: 6 },
        p2: { ...sb.p2, totalVp: 72, primaryVp: 40, secondaryVp: 32, commandPoints: 1, casualties: 14 },
      };

      const report = generateMatchReport({
        matchId: 'match_final_round_1',
        title: 'Grand Tournament 2026 - Finals Table 1',
        battleRound: 5,
        scoreboard: sb,
        p1ClockSeconds: 450,
        p2ClockSeconds: -95,
        auditTrail: [],
        rulings: [
          {
            id: 'r1',
            timestamp: Date.now(),
            toName: 'Chief Referee',
            ruling: 'Measurement was verified within 1" engagement range.',
          },
        ],
      });

      assert.strictEqual(report.winner, 'Player 1');
      assert.strictEqual(report.vpDifferential, 13);
      assert.strictEqual(report.p1.name, 'Roboute Guilliman');
      assert.strictEqual(report.p2.name, 'Abaddon the Despoiler');
      assert.strictEqual(report.rulings.length, 1);

      const text = formatMatchReportAsText(report);
      assert(text.includes('OLD BEAR BRAWL TOURNAMENT MATCH REPORT'));
      assert(text.includes('Winner: Player 1') || text.includes('Outcome: Player 1'));
      assert(text.includes('Chief Referee'));
      assert(text.includes('Total Victory Points: 85'));
    });
  });

  describe('Spectator Privacy Filtering', () => {
    const reservesSubmap: SubmapConfig = {
      id: 'sub_res',
      name: 'Strategic Reserves',
      type: 'staging_area',
      x: 0,
      y: -400,
      width: 1000,
      height: 300,
    };

    const tokenTable: Token = {
      id: 't_table',
      mapId: 'map1',
      name: 'Intercessors',
      x: 500,
      y: 500,
      size: 1,
      rotation: 0,
      ringColor: '#38bdf8',
      fillColor: '#000',
      clipCircle: true,
      currentHp: 2,
      maxHp: 2,
      tempHp: 0,
      speed: 30,
      conditions: [],
      isProp: false,
      layer: 'token',
    };

    const tokenReserve: Token = {
      id: 't_res',
      mapId: 'map1',
      name: 'Hidden Terminators',
      x: 100,
      y: -300, // Inside reserves submap
      size: 1,
      rotation: 0,
      ringColor: '#38bdf8',
      fillColor: '#000',
      clipCircle: true,
      currentHp: 3,
      maxHp: 3,
      tempHp: 0,
      speed: 30,
      conditions: [],
      isProp: false,
      layer: 'token',
    };

    it('filters out tokens in strategic reserves when hideReservesFromSpectators is enabled', () => {
      const tokens = [tokenTable, tokenReserve];
      const filtered = filterTokensForSpectator(
        tokens,
        {
          allowSpectators: true,
          hideSecretObjectives: true,
          hideReservesFromSpectators: true,
        },
        [reservesSubmap]
      );

      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].id, 't_table');
    });

    it('preserves all tokens when hideReservesFromSpectators is disabled', () => {
      const tokens = [tokenTable, tokenReserve];
      const visible = filterTokensForSpectator(
        tokens,
        {
          allowSpectators: true,
          hideSecretObjectives: false,
          hideReservesFromSpectators: false,
        },
        [reservesSubmap]
      );

      assert.strictEqual(visible.length, 2);
    });
  });
});
