import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseAndRollAdvanced,
  isAdvancedDiceExpression,
  formatRollDetails,
} from './AdvancedDiceEngine.js';

describe('Advanced Dice Expression Engine (OB-133)', () => {
  it('detects advanced grouped and threshold expressions correctly', () => {
    assert.strictEqual(isAdvancedDiceExpression('40(d6+3)'), true);
    assert.strictEqual(isAdvancedDiceExpression('10(d6+2 >= 5)'), true);
    assert.strictEqual(isAdvancedDiceExpression('8(d10 >= 7)'), true);
    // Slash threshold syntax is invalid (OB-171)
    assert.strictEqual(isAdvancedDiceExpression('10(d6+2)/5'), false);
    assert.strictEqual(isAdvancedDiceExpression('5(d6+2)/4'), false);
    assert.strictEqual(isAdvancedDiceExpression('1d20+5'), false);
    assert.strictEqual(isAdvancedDiceExpression('3d6'), false);
  });

  it('rolls grouped modified rolls: 40(d6+3)', () => {
    // Deterministic random generator returning 0.5 (so d6 rolls 4)
    const mockRandom = () => 0.5;
    const res = parseAndRollAdvanced('40(d6+3)', mockRandom);

    assert.ok(res, 'Roll parsed successfully');
    assert.strictEqual(res.isGrouped, true);
    assert.strictEqual(res.count, 40);
    assert.strictEqual(res.sides, 6);
    assert.strictEqual(res.modifier, 3);
    assert.strictEqual(res.details.length, 40);

    // Each roll is raw 4, modified 7
    assert.strictEqual(res.details[0].rawTotal, 4);
    assert.strictEqual(res.details[0].modifiedTotal, 7);
    assert.strictEqual(res.totalRaw, 4 * 40); // 160
    assert.strictEqual(res.totalModified, (4 + 3) * 40); // 280
    assert.ok(res.summaryText.includes('Total: **280**'));
  });

  it('evaluates threshold success/failure counting: 10(d6+2 >= 5)', () => {
    // Array of predetermined rolls: alternating rolls of 1 (modified 3 < 5 -> fail) and 5 (modified 7 >= 5 -> success)
    const sequence = [0.0, 0.7, 0.0, 0.7, 0.0, 0.7, 0.0, 0.7, 0.0, 0.7];
    let idx = 0;
    const mockRandom = () => sequence[idx++];

    const res = parseAndRollAdvanced('10(d6+2 >= 5)', mockRandom);
    assert.ok(res);
    assert.strictEqual(res.count, 10);
    assert.deepStrictEqual(res.threshold, { operator: '>=', target: 5 });
    assert.strictEqual(res.successCount, 5);
    assert.strictEqual(res.failureCount, 5);
    assert.strictEqual(res.botchCount, 5); // 5 ones were rolled
    assert.strictEqual(res.isGlitch, true); // 5 ones >= 10 / 2
    assert.strictEqual(res.netSuccesses, 0); // 5 successes - 5 botches

    const preview = formatRollDetails(res, 5);
    assert.ok(preview.startsWith('['));
    assert.ok(preview.includes('✅') && preview.includes('❌'));
  });

  it('rejects slash threshold syntax as invalid syntax (OB-171)', () => {
    assert.strictEqual(parseAndRollAdvanced('10(d6+2)/5'), null);
    assert.strictEqual(parseAndRollAdvanced('5(d6+2)/4'), null);
    assert.strictEqual(isAdvancedDiceExpression('5(d6+2)/4'), false);
  });

  it('tracks botches and glitches in dice pools', () => {
    // 6 dice pool: 4 ones rolled (0.0 -> 1), 2 fives rolled (0.8 -> 5)
    const sequence = [0.0, 0.0, 0.0, 0.0, 0.8, 0.8];
    let idx = 0;
    const mockRandom = () => sequence[idx++];

    const res = parseAndRollAdvanced('6(d6 >= 5)', mockRandom);
    assert.ok(res);
    assert.strictEqual(res.count, 6);
    assert.strictEqual(res.successCount, 2);
    assert.strictEqual(res.botchCount, 4);
    assert.strictEqual(res.isGlitch, true); // 4 >= ceil(6/2) = 3
    assert.strictEqual(res.isCriticalGlitch, false); // has 2 successes
    assert.ok(res.summaryText.includes('GLITCH ALERT'));
  });

  it('detects critical glitches when 0 successes and glitch occurred', () => {
    // 4 dice pool: all ones
    const mockRandom = () => 0.0; // raw 1
    const res = parseAndRollAdvanced('4(d6 >= 5)', mockRandom);

    assert.ok(res);
    assert.strictEqual(res.successCount, 0);
    assert.strictEqual(res.botchCount, 4);
    assert.strictEqual(res.isGlitch, true);
    assert.strictEqual(res.isCriticalGlitch, true);
    assert.ok(res.summaryText.includes('CRITICAL GLITCH'));
  });
});
