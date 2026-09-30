import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getActionCostGlyph,
  parseActionCost,
  convertDnDActionToEntityAction,
  convertDnDSpellToEntityAction,
  convertDnDItemToEntityAction,
  convertCharacterToMonsterStatBlock,
  EntityAction,
  EntityStatBlock,
  DnDAction,
  DnDSpell,
  DnDItem,
  DnDCharacter,
} from './index.js';

describe('System-Agnostic EntityAction Schema & Cost Parsing (OB-180)', () => {
  it('correctly maps action cost types to visual glyphs & badges', () => {
    // PF2e glyphs
    assert.strictEqual(getActionCostGlyph('1_action'), '◆');
    assert.strictEqual(getActionCostGlyph('2_actions'), '◆◆');
    assert.strictEqual(getActionCostGlyph('3_actions'), '◆◆◆');
    assert.strictEqual(getActionCostGlyph('reaction_pf2e'), '↺');
    assert.strictEqual(getActionCostGlyph('free_pf2e'), '◇');

    // 5e / generic badges
    assert.strictEqual(getActionCostGlyph('action'), 'Action');
    assert.strictEqual(getActionCostGlyph('bonus_action'), 'Bonus Action');
    assert.strictEqual(getActionCostGlyph('reaction'), 'Reaction');
    assert.strictEqual(getActionCostGlyph('free'), 'Free');
    assert.strictEqual(getActionCostGlyph('minute'), '1 Min');
    assert.strictEqual(getActionCostGlyph('hour'), '1 Hour');

    // Empty or unknown fallback
    assert.strictEqual(getActionCostGlyph(undefined), '');
    assert.strictEqual(getActionCostGlyph('custom'), 'custom');
  });

  it('correctly parses raw cost strings and glyphs into ActionCostType', () => {
    // PF2e
    assert.strictEqual(parseActionCost('◆'), '1_action');
    assert.strictEqual(parseActionCost('[1A]'), '1_action');
    assert.strictEqual(parseActionCost('1 action', 'pf2e'), '1_action');
    assert.strictEqual(parseActionCost('1', 'pf2e'), '1_action');
    assert.strictEqual(parseActionCost('◆◆'), '2_actions');
    assert.strictEqual(parseActionCost('[2a]'), '2_actions');
    assert.strictEqual(parseActionCost('2 actions'), '2_actions');
    assert.strictEqual(parseActionCost('◆◆◆'), '3_actions');
    assert.strictEqual(parseActionCost('[3a]'), '3_actions');
    assert.strictEqual(parseActionCost('3 actions'), '3_actions');
    assert.strictEqual(parseActionCost('↺'), 'reaction_pf2e');
    assert.strictEqual(parseActionCost('[R]'), 'reaction_pf2e');
    assert.strictEqual(parseActionCost('◇'), 'free_pf2e');
    assert.strictEqual(parseActionCost('[FA]'), 'free_pf2e');

    // 5e / generic
    assert.strictEqual(parseActionCost('1 action'), 'action');
    assert.strictEqual(parseActionCost('Action'), 'action');
    assert.strictEqual(parseActionCost('Bonus Action'), 'bonus_action');
    assert.strictEqual(parseActionCost('bonus'), 'bonus_action');
    assert.strictEqual(parseActionCost('Reaction'), 'reaction');
    assert.strictEqual(parseActionCost('Free Action'), 'free');
    assert.strictEqual(parseActionCost('10 minutes'), 'minute');
    assert.strictEqual(parseActionCost('1 hour'), 'hour');

    assert.strictEqual(parseActionCost(''), undefined);
    assert.strictEqual(parseActionCost(undefined), undefined);
  });

  it('converts DnDAction into EntityAction', () => {
    const dndAct: DnDAction = {
      name: 'Greataxe',
      type: 'melee',
      activationType: 'action',
      toHitModifier: 7,
      damageDice: '1d12+4',
      reach: '5 ft.',
      description: 'Heavy, two-handed greataxe slash',
    };

    const action = convertDnDActionToEntityAction(dndAct, '5e');
    assert.strictEqual(action.name, 'Greataxe');
    assert.strictEqual(action.type, 'attack');
    assert.strictEqual(action.cost, 'action');
    assert.strictEqual(action.rollFormula, '1d20+7');
    assert.strictEqual(action.damageFormula, '1d12+4');
    assert.strictEqual(action.range, '5 ft.');
    assert.strictEqual(action.sourceSystem, '5e');
  });

  it('converts DnDSpell into EntityStatBlock with traits and subtitle', () => {
    const dndSpell: DnDSpell = {
      id: 'spell-fireball',
      name: 'Fireball',
      level: 3,
      school: 'Evocation',
      castingTime: '1 action',
      range: '150 feet',
      duration: 'Instantaneous',
      description: 'A bright streak flashes from your pointing finger to a point you choose...',
      dndBeyondUrl: 'https://www.dndbeyond.com/spells/fireball',
    };

    const block = convertDnDSpellToEntityAction(dndSpell, '5e');
    assert.strictEqual(block.name, 'Fireball');
    assert.strictEqual(block.type, 'spell');
    assert.strictEqual(block.level, 3);
    assert.strictEqual(block.cost, 'action');
    assert.deepStrictEqual(block.traits, ['Evocation']);
    assert.strictEqual(block.subtitle, 'Level 3 (Evocation)');
    assert.strictEqual(block.range, '150 feet');
    assert.strictEqual(block.sourceUrl, 'https://www.dndbeyond.com/spells/fireball');
  });

  it('converts DnDItem into EntityStatBlock', () => {
    const item: DnDItem = {
      name: 'Potion of Healing',
      description: 'You regain 2d4 + 2 hit points when you drink this potion.',
      quantity: 3,
      dndBeyondUrl: 'https://www.dndbeyond.com/magic-items/potion-of-healing',
    };

    const block = convertDnDItemToEntityAction(item, '5e');
    assert.strictEqual(block.name, 'Potion of Healing');
    assert.strictEqual(block.type, 'item');
    assert.strictEqual(block.subtitle, 'Item (Qty: 3)');
  });

  it('converts DnDCharacter into full monster/creature EntityStatBlock', () => {
    const monsterChar: DnDCharacter = {
      id: 'goblin-1',
      name: 'Goblin',
      level: 1,
      classes: 'Small humanoid (goblinoid), neutral evil',
      race: 'Goblin',
      currentHp: 7,
      maxHp: 7,
      tempHp: 0,
      armorClass: 15,
      speed: 30,
      passivePerception: 9,
      stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
      spells: [],
      actions: [
        {
          name: 'Scimitar',
          activationType: 'action',
          toHitModifier: 4,
          damageDice: '1d6+2',
          reach: '5 ft.',
          description: 'Melee weapon attack.',
        },
      ],
    };

    const statBlock = convertCharacterToMonsterStatBlock(monsterChar, '5e');
    assert.strictEqual(statBlock.name, 'Goblin');
    assert.strictEqual(statBlock.type, 'monster');
    assert.strictEqual(statBlock.armorClass, 15);
    assert.strictEqual(statBlock.hp, '7/7');
    assert.strictEqual(statBlock.speed, '30 ft.');
    assert.strictEqual(statBlock.actions?.length, 1);
    assert.strictEqual(statBlock.actions?.[0].name, 'Scimitar');
  });
});
