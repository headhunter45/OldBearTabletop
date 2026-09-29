/**
 * Advanced Dice Expression Engine & Action-Tied Roll Parser (OB-133, OB-171)
 *
 * Supports:
 * - Grouped modified rolls: 40(d6+3)
 * - Threshold success/failure counting: 10(d6+2 >= 5)
 * - Dice pool botch & glitch tracking (Shadowrun / World of Darkness style)
 */

export interface DiceRollDetail {
  raw: number[];
  rawTotal: number;
  modifier: number;
  modifiedTotal: number;
  success?: boolean;
  isBotch: boolean; // rolled a raw 1
}

export type ThresholdOperator = '>=' | '>' | '<=' | '<' | '==' | '=';

export interface AdvancedRollResult {
  expression: string;
  isGrouped: boolean;
  count: number;
  dieCountPerGroup: number;
  sides: number;
  modifier: number;
  threshold?: {
    operator: ThresholdOperator;
    target: number;
  };
  details: DiceRollDetail[];
  totalModified: number;
  totalRaw: number;
  successCount?: number;
  failureCount?: number;
  botchCount: number; // total raw 1s
  isGlitch?: boolean; // 1s >= half of total dice
  isCriticalGlitch?: boolean; // glitch with 0 successes
  netSuccesses?: number; // successes - botches
  summaryText: string;
}

/**
 * Checks whether an expression uses advanced grouped or threshold syntax.
 */
export function isAdvancedDiceExpression(expr: string): boolean {
  if (!expr) return false;
  const clean = expr.trim();
  return /^\d+\s*\(.+\)$/.test(clean);
}

/**
 * Evaluates whether a value meets a threshold condition.
 */
export function evaluateThreshold(
  val: number,
  op: ThresholdOperator,
  target: number
): boolean {
  switch (op) {
    case '>=':
      return val >= target;
    case '>':
      return val > target;
    case '<=':
      return val <= target;
    case '<':
      return val < target;
    case '==':
    case '=':
      return val === target;
    default:
      return val >= target;
  }
}

/**
 * Parses and executes an advanced dice expression:
 * - 40(d6+3)
 * - 10(d6+2 >= 5)
 * - 8(d10 >= 7)
 */
export function parseAndRollAdvanced(
  expr: string,
  randomFn: () => number = Math.random
): AdvancedRollResult | null {
  if (!expr) return null;
  const raw = expr.trim();

  // Pattern: N( <inner> )
  // e.g. 40(d6+3) or 10(d6+2 >= 5)
  // (OB-171: /roll 5(d6+2)/4 slash threshold syntax is invalid)
  const groupedMatch = raw.match(
    /^(\d+)\s*\(\s*(\d*)d(\d+)\s*(?:([+-])\s*(\d+))?\s*(?:(>=|>|<=|<|==|=)\s*(\d+))?\s*\)$/i
  );

  if (!groupedMatch) {
    return null;
  }

  const count = parseInt(groupedMatch[1], 10);
  if (count <= 0 || count > 500) return null; // Sanity limit

  const dieCountPerGroup = groupedMatch[2] ? parseInt(groupedMatch[2], 10) : 1;
  const sides = parseInt(groupedMatch[3], 10);
  if (sides <= 0 || sides > 1000) return null;

  const sign = groupedMatch[4] === '-' ? -1 : 1;
  const modVal = groupedMatch[5] ? parseInt(groupedMatch[5], 10) : 0;
  const modifier = sign * modVal;

  let threshold: { operator: ThresholdOperator; target: number } | undefined;

  // Comparison operator inside parentheses: e.g. >= 5
  if (groupedMatch[6] && groupedMatch[7]) {
    threshold = {
      operator: groupedMatch[6] as ThresholdOperator,
      target: parseInt(groupedMatch[7], 10),
    };
  }

  const details: DiceRollDetail[] = [];
  let totalRaw = 0;
  let totalModified = 0;
  let successCount = 0;
  let failureCount = 0;
  let botchCount = 0;

  for (let i = 0; i < count; i++) {
    const rawRolls: number[] = [];
    let groupRawTotal = 0;
    let hasOne = false;

    for (let d = 0; d < dieCountPerGroup; d++) {
      const r = Math.floor(randomFn() * sides) + 1;
      rawRolls.push(r);
      groupRawTotal += r;
      if (r === 1) {
        hasOne = true;
        botchCount++;
      }
    }

    totalRaw += groupRawTotal;
    const modifiedTotal = groupRawTotal + modifier;
    totalModified += modifiedTotal;

    let success: boolean | undefined;
    if (threshold) {
      success = evaluateThreshold(modifiedTotal, threshold.operator, threshold.target);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    details.push({
      raw: rawRolls,
      rawTotal: groupRawTotal,
      modifier,
      modifiedTotal,
      success,
      isBotch: hasOne,
    });
  }

  // Shadowrun/WoD glitch tracking:
  // Glitch occurs when 1s equal or exceed half the total dice rolled
  const totalDiceRolled = count * dieCountPerGroup;
  const isGlitch = botchCount >= Math.ceil(totalDiceRolled / 2);
  const isCriticalGlitch = isGlitch && threshold !== undefined && successCount === 0;
  const netSuccesses = threshold ? successCount - botchCount : undefined;

  // Build user-friendly summary text
  let summaryText = '';
  if (threshold) {
    summaryText = `🎯 **${successCount} Successes**, ${failureCount} Failures (Threshold ${threshold.operator} ${threshold.target})`;
    if (botchCount > 0) {
      summaryText += ` • 💥 **${botchCount} Botches** (raw 1s)`;
    }
    if (isCriticalGlitch) {
      summaryText += ` • 🚨 **CRITICAL GLITCH!**`;
    } else if (isGlitch) {
      summaryText += ` • ⚠️ **GLITCH ALERT!** (More than half dice are 1s)`;
    }
  } else {
    summaryText = `🎲 Total: **${totalModified}** (Raw Sum: ${totalRaw} + Mod: ${modifier * count})`;
    if (botchCount > 0) {
      summaryText += ` • 💥 ${botchCount} 1s rolled`;
    }
  }

  return {
    expression: raw,
    isGrouped: true,
    count,
    dieCountPerGroup,
    sides,
    modifier,
    threshold,
    details,
    totalModified,
    totalRaw,
    successCount: threshold ? successCount : undefined,
    failureCount: threshold ? failureCount : undefined,
    botchCount,
    isGlitch,
    isCriticalGlitch,
    netSuccesses,
    summaryText,
  };
}

/**
 * Formats a preview list of individual roll results for chat messages.
 */
export function formatRollDetails(result: AdvancedRollResult, maxDisplay = 20): string {
  const parts: string[] = [];
  const itemsToShow = result.details.slice(0, maxDisplay);

  for (const d of itemsToShow) {
    if (result.threshold) {
      const icon = d.success ? '✅' : '❌';
      const botchMark = d.isBotch ? '💥' : '';
      parts.push(`${icon}${botchMark}${d.modifiedTotal}`);
    } else if (result.modifier !== 0) {
      const botchMark = d.isBotch ? '💥' : '';
      parts.push(`${botchMark}${d.modifiedTotal}(${d.rawTotal})`);
    } else {
      const botchMark = d.isBotch ? '💥' : '';
      parts.push(`${botchMark}${d.rawTotal}`);
    }
  }

  if (result.details.length > maxDisplay) {
    parts.push(`...+${result.details.length - maxDisplay} more`);
  }

  return `[${parts.join(', ')}]`;
}
