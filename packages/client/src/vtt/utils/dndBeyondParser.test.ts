import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isDnDBeyondExport,
  parseDnDBeyondCharacter,
  createDnDBeyondToken,
} from './dndBeyondParser.js';

export const SAMPLE_DNDBEYOND_GROM = {
  id: 47804290,
  success: true,
  data: {
    id: 47804290,
    name: 'Grom Ironhide',
    baseHitPoints: 40,
    bonusHitPoints: 5,
    removedHitPoints: 10,
    temporaryHitPoints: 3,
    avatarUrl: 'https://example.com/avatar.jpg',
    classes: [
      {
        level: 5,
        definition: {
          name: 'Barbarian',
        },
      },
    ],
    race: {
      fullName: 'Half-Orc',
      weightSpeeds: {
        normal: {
          walk: 35,
        },
      },
    },
    stats: [
      { id: 1, value: 16 }, // str
      { id: 2, value: 14 }, // dex
      { id: 3, value: 16 }, // con
      { id: 4, value: 10 }, // int
      { id: 5, value: 12 }, // wis
      { id: 6, value: 8 },  // cha
    ],
    modifiers: {
      race: [
        { type: 'proficiency', subType: 'athletics', value: null },
        { type: 'proficiency', subType: 'strength-saving-throws', value: null },
        { type: 'proficiency', subType: 'constitution-saving-throws', value: null },
      ],
      class: [
        { type: 'bonus', subType: 'strength-score', value: 2 },
      ],
    },
    inventory: [
      {
        equipped: true,
        definition: {
          name: 'Greataxe',
          filterType: 'Weapon',
          attackType: 1, // melee
          damage: { diceString: '1d12' },
          range: 5,
        },
      },
      {
        equipped: true,
        definition: {
          name: 'Javelin',
          filterType: 'Weapon',
          attackType: 2, // ranged/thrown
          damage: { diceString: '1d6' },
          range: 30,
          longRange: 120,
          properties: [{ name: 'Thrown' }],
        },
      },
    ],
    actions: {
      class: [
        {
          name: 'Rage',
          activation: { activationType: 3 }, // Bonus Action
          description: 'In battle, you fight with primal ferocity.',
        },
      ],
      reaction: [
        {
          name: 'Uncanny Dodge',
          activation: { activationType: 4 },
          description: 'Halve damage from an attack you can see.',
        },
      ],
    },
  },
};

describe('D&D Beyond Character Client-Side Parser (OB-140)', () => {
  it('identifies valid D&D Beyond exports and rejects invalid input', () => {
    assert.strictEqual(isDnDBeyondExport(SAMPLE_DNDBEYOND_GROM), true);
    assert.strictEqual(isDnDBeyondExport(SAMPLE_DNDBEYOND_GROM.data), true);
    assert.strictEqual(isDnDBeyondExport(JSON.stringify(SAMPLE_DNDBEYOND_GROM)), true);

    assert.strictEqual(isDnDBeyondExport(null), false);
    assert.strictEqual(isDnDBeyondExport({}), false);
    assert.strictEqual(isDnDBeyondExport({ name: 'Bob' }), false);
    assert.strictEqual(isDnDBeyondExport('invalid string'), false);
  });

  it('correctly parses stats, level, proficiency bonus, and HP', () => {
    const char = parseDnDBeyondCharacter(SAMPLE_DNDBEYOND_GROM);
    assert.strictEqual(char.name, 'Grom Ironhide');
    assert.strictEqual(char.level, 5);
    assert.strictEqual(char.proficiencyBonus, 3); // level 5 -> +3

    // Strength was 16 + 2 bonus = 18 (+4)
    assert.strictEqual(char.stats.str, 18);
    assert.strictEqual(char.stats.dex, 14);
    assert.strictEqual(char.stats.con, 16);
    assert.strictEqual(char.stats.int, 10);
    assert.strictEqual(char.stats.wis, 12);
    assert.strictEqual(char.stats.cha, 8);

    // HP: base 40 + bonus 5 + conMod(3)*5 = 60 max HP; current = 60 - 10 = 50; temp = 3
    assert.strictEqual(char.maxHp, 60);
    assert.strictEqual(char.currentHp, 50);
    assert.strictEqual(char.tempHp, 3);
    assert.strictEqual(char.speed, 35);
    assert.strictEqual(char.avatarUrl, 'https://example.com/avatar.jpg');
  });

  it('parses weapon attacks, unarmed strike, and action categories', () => {
    const char = parseDnDBeyondCharacter(SAMPLE_DNDBEYOND_GROM);
    assert.ok(char.actions);
    assert.ok(char.actions.length >= 3);

    // Greataxe: melee, str mod (4) + prof (3) = +7 to hit, 1d12+4 damage
    const greataxe = char.actions.find((a) => a.name === 'Greataxe');
    assert.ok(greataxe);
    assert.strictEqual(greataxe.type, 'melee');
    assert.strictEqual(greataxe.toHitModifier, 7);
    assert.strictEqual(greataxe.damageDice, '1d12+4');

    // Unarmed strike is present
    const unarmed = char.actions.find((a) => a.name === 'Unarmed Strike');
    assert.ok(unarmed);
    assert.strictEqual(unarmed.toHitModifier, 7);

    // Bonus Action Rage
    const rage = char.actions.find((a) => a.name === 'Rage');
    assert.ok(rage);
    assert.strictEqual(rage.activationType, 'bonus');

    // Reaction Uncanny Dodge
    const dodge = char.actions.find((a) => a.name === 'Uncanny Dodge');
    assert.ok(dodge);
    assert.strictEqual(dodge.activationType, 'reaction');
  });

  it('parses skills, saving throws, and passive perception', () => {
    const char = parseDnDBeyondCharacter(SAMPLE_DNDBEYOND_GROM);
    assert.ok(char.skills);
    assert.ok(char.savingThrows);

    // Athletics proficient: strMod(4) + prof(3) = 7
    const athletics = char.skills.find((s) => s.name === 'Athletics');
    assert.ok(athletics);
    assert.strictEqual(athletics.proficiency, 'proficient');
    assert.strictEqual(athletics.modifier, 7);

    // Saving throws: str & con proficient
    assert.strictEqual(char.savingThrows.str, 7); // 4 + 3
    assert.strictEqual(char.savingThrows.con, 6); // 3 + 3
    assert.strictEqual(char.savingThrows.dex, 2); // 2 (not proficient)

    // Passive perception: 10 + wisMod(1) = 11
    assert.strictEqual(char.passivePerception, 11);
  });

  it('creates ready-to-fight Token from a parsed D&D Beyond character', () => {
    const char = parseDnDBeyondCharacter(SAMPLE_DNDBEYOND_GROM);
    const token = createDnDBeyondToken(char, 'map-1', 150, 200);

    assert.strictEqual(token.name, 'Grom Ironhide');
    assert.strictEqual(token.mapId, 'map-1');
    assert.strictEqual(token.x, 150);
    assert.strictEqual(token.y, 200);
    assert.strictEqual(token.size, 1);
    assert.strictEqual(token.currentHp, 50);
    assert.strictEqual(token.maxHp, 60);
    assert.strictEqual(token.tempHp, 3);
    assert.strictEqual(token.speed, 35);
    assert.strictEqual(token.imageUrl, 'https://example.com/avatar.jpg');
    assert.strictEqual(token.clipCircle, true);
    assert.strictEqual(token.character?.name, 'Grom Ironhide');
  });
});
