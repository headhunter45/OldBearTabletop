import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isPathbuilderExport,
  getAbilityModifier,
  getProficiencyBonus,
  extractPathbuilderId,
  parsePathbuilderExport,
  createPathbuilderToken,
  SAMPLE_PATHBUILDER_VALEROS,
} from './pathbuilderParser.js';

describe('Pathbuilder 2e (PF2e) JSON Character Import (OB-144)', () => {
  it('identifies valid Pathbuilder 2e export JSON and rejects invalid input', () => {
    assert.strictEqual(isPathbuilderExport(SAMPLE_PATHBUILDER_VALEROS), true);
    assert.strictEqual(isPathbuilderExport(JSON.stringify(SAMPLE_PATHBUILDER_VALEROS)), true);
    assert.strictEqual(isPathbuilderExport(null), false);
    assert.strictEqual(isPathbuilderExport({}), false);
    assert.strictEqual(isPathbuilderExport({ name: 'Bob' }), false);
    assert.strictEqual(isPathbuilderExport('invalid json string'), false);
  });

  it('calculates standard d20 ability modifiers correctly', () => {
    assert.strictEqual(getAbilityModifier(18), 4);
    assert.strictEqual(getAbilityModifier(14), 2);
    assert.strictEqual(getAbilityModifier(10), 0);
    assert.strictEqual(getAbilityModifier(8), -1);
    assert.strictEqual(getAbilityModifier(7), -2);
  });

  it('calculates PF2e proficiency scaling ranks with level', () => {
    // Level 5 character:
    // Untrained (0) -> 0
    assert.strictEqual(getProficiencyBonus(0, 5), 0);
    // Trained (2) -> 2 + 5 = 7
    assert.strictEqual(getProficiencyBonus(2, 5), 7);
    // Expert (4) -> 4 + 5 = 9
    assert.strictEqual(getProficiencyBonus(4, 5), 9);
    // Master (6) -> 6 + 5 = 11
    assert.strictEqual(getProficiencyBonus(6, 5), 11);
    // Legendary (8) -> 8 + 5 = 13
    assert.strictEqual(getProficiencyBonus(8, 5), 13);
  });

  it('extracts build ID from URLs, query params, and raw IDs', () => {
    assert.strictEqual(
      extractPathbuilderId('https://pathbuilder2e.com/json.php?id=123456'),
      '123456'
    );
    assert.strictEqual(
      extractPathbuilderId('http://pathbuilder2e.com/app.php?id=98765'),
      '98765'
    );
    assert.strictEqual(extractPathbuilderId('45678'), '45678');
    assert.strictEqual(extractPathbuilderId('   78901   '), '78901');
    assert.strictEqual(extractPathbuilderId('invalid_id'), null);
  });

  it('correctly parses PF2e Valeros build into an OldBear DnDCharacter', () => {
    const char = parsePathbuilderExport(SAMPLE_PATHBUILDER_VALEROS);

    assert.strictEqual(char.name, 'Valeros');
    assert.strictEqual(char.level, 5);
    assert.strictEqual(char.classes, 'Fighter');
    assert.strictEqual(char.race, 'Versatile Heritage Human');

    // Abilities
    assert.strictEqual(char.stats.str, 18);
    assert.strictEqual(char.stats.dex, 14);
    assert.strictEqual(char.stats.con, 14);
    assert.strictEqual(char.stats.int, 10);
    assert.strictEqual(char.stats.wis, 12);
    assert.strictEqual(char.stats.cha, 10);

    // HP: ancestry 8 + (class 10 + con 2 + bonusPerLvl 0) * 5 + bonus 0 = 8 + 60 = 68
    assert.strictEqual(char.maxHp, 68);
    assert.strictEqual(char.currentHp, 68);

    // Speed: 25
    assert.strictEqual(char.speed, 25);

    // Saving throws:
    // Fortitude: con(2) + expert(4 + 5) = 11
    assert.strictEqual(char.savingThrows?.con, 11);
    // Reflex: dex(2) + trained(2 + 5) = 9
    assert.strictEqual(char.savingThrows?.dex, 9);
    // Will: wis(1) + trained(2 + 5) = 8
    assert.strictEqual(char.savingThrows?.wis, 8);

    // Perception: wis(1) + expert(4 + 5) = 10, DC = 20
    assert.strictEqual(char.passivePerception, 20);

    // Skills
    const athletics = char.skills?.find((s) => s.name === 'Athletics');
    assert.ok(athletics);
    // Athletics: str(4) + expert(4 + 5) = 13
    assert.strictEqual(athletics.modifier, 13);
    assert.strictEqual(athletics.proficiency, 'expertise');

    const intimidation = char.skills?.find((s) => s.name === 'Intimidation');
    assert.ok(intimidation);
    // Intimidation: cha(0) + trained(2 + 5) = 7
    assert.strictEqual(intimidation.modifier, 7);
    assert.strictEqual(intimidation.proficiency, 'proficient');

    const stealth = char.skills?.find((s) => s.name === 'Stealth');
    assert.ok(stealth);
    // Stealth: dex(2) + untrained(0) = 2
    assert.strictEqual(stealth.modifier, 2);
    assert.strictEqual(stealth.proficiency, 'none');

    // Lore skill
    const warfareLore = char.skills?.find((s) => s.name === 'Warfare Lore');
    assert.ok(warfareLore);
    // Warfare Lore: int(0) + trained(2 + 5) = 7
    assert.strictEqual(warfareLore.modifier, 7);
    assert.strictEqual(warfareLore.stat, 'int');

    // Actions: includes Fist, Longsword strike, feats, specials
    const fist = char.actions?.find((a) => a.name.includes('Fist'));
    assert.ok(fist);

    const sword = char.actions?.find((a) => a.name.includes('Longsword'));
    assert.ok(sword);

    const suddenCharge = char.actions?.find((a) => a.name === 'Sudden Charge');
    assert.ok(suddenCharge);

    const aoo = char.actions?.find((a) => a.name === 'Attack of Opportunity');
    assert.ok(aoo);

    // Items
    assert.ok(char.items?.some((i) => i.name === 'Longsword'));
    assert.ok(char.items?.some((i) => i.name === 'Steel Shield'));
    assert.ok(char.items?.some((i) => i.name === 'Breastplate'));
  });

  it('creates ready-to-fight Token from a parsed PF2e character', () => {
    const char = parsePathbuilderExport(SAMPLE_PATHBUILDER_VALEROS);
    const token = createPathbuilderToken(char, 'map_123', 250, 350);

    assert.strictEqual(token.name, 'Valeros');
    assert.strictEqual(token.mapId, 'map_123');
    assert.strictEqual(token.x, 250);
    assert.strictEqual(token.y, 350);
    assert.strictEqual(token.currentHp, 68);
    assert.strictEqual(token.maxHp, 68);
    assert.strictEqual(token.speed, 25);
    assert.strictEqual(token.size, 1);
    assert.strictEqual(token.isPlayerToken, true);
    assert.strictEqual(token.character?.id, char.id);
  });
});
