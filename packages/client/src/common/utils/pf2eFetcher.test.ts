import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeFoundryUrl,
  formatPf2eDescription,
  extractPf2eActionCost,
  parseFoundryPF2eJson,
} from './pf2eFetcher.js';

describe('Foundry PF2e Pack Parser & Fetcher (OB-177)', () => {
  it('normalizes GitHub web URLs into raw.githubusercontent.com URLs', () => {
    const webUrl =
      'https://github.com/foundryvtt/pf2e/blob/master/packs/spells/1st-rank/acidic-burst.json';
    const normalized = normalizeFoundryUrl(webUrl);
    assert.strictEqual(
      normalized,
      'https://raw.githubusercontent.com/foundryvtt/pf2e/master/packs/spells/1st-rank/acidic-burst.json'
    );

    const treeUrl =
      'https://github.com/foundryvtt/pf2e/tree/v14-dev/packs/equipment/healing-potion.json';
    assert.strictEqual(
      normalizeFoundryUrl(treeUrl),
      'https://raw.githubusercontent.com/foundryvtt/pf2e/v14-dev/packs/equipment/healing-potion.json'
    );

    const rawUrl =
      'https://raw.githubusercontent.com/foundryvtt/pf2e/master/packs/actions/strike.json';
    assert.strictEqual(normalizeFoundryUrl(rawUrl), rawUrl);

    // Strips enclosing quotes
    assert.strictEqual(
      normalizeFoundryUrl('"https://raw.githubusercontent.com/test.json"'),
      'https://raw.githubusercontent.com/test.json'
    );
  });

  it('formats PF2e HTML and UUID references into clean Markdown', () => {
    const rawHtml =
      '<p>You unleash a wave of flame.</p><hr /><p>Whenever an ally uses @UUID[Compendium.pf2e.actionspf2e.Item.Reactive Strike]{Reactive Strike}, deal @Damage[1d6[fire]] damage.</p>';
    const cleaned = formatPf2eDescription(rawHtml);
    assert.ok(cleaned.includes('You unleash a wave of flame.'));
    assert.ok(cleaned.includes('---'));
    assert.ok(cleaned.includes('**Reactive Strike**'));
    assert.ok(cleaned.includes('[1d6[fire]]'));
    assert.strictEqual(cleaned.includes('<p>'), false);
    assert.strictEqual(cleaned.includes('<hr'), false);
  });

  it('correctly maps PF2e action costs to 3-action economy glyph values', () => {
    // Spells system.time.value
    assert.strictEqual(extractPf2eActionCost({ time: { value: '1' } }), '1_action');
    assert.strictEqual(extractPf2eActionCost({ time: { value: '2' } }), '2_actions');
    assert.strictEqual(extractPf2eActionCost({ time: { value: '3' } }), '3_actions');
    assert.strictEqual(extractPf2eActionCost({ time: { value: 'reaction' } }), 'reaction_pf2e');
    assert.strictEqual(extractPf2eActionCost({ time: { value: 'free' } }), 'free_pf2e');

    // Actions & Feats system.actions.value
    assert.strictEqual(extractPf2eActionCost({ actions: { value: 1 } }), '1_action');
    assert.strictEqual(extractPf2eActionCost({ actions: { value: 2 } }), '2_actions');
    assert.strictEqual(extractPf2eActionCost({ actions: { value: 3 } }), '3_actions');
    assert.strictEqual(extractPf2eActionCost({ actionType: { value: 'reaction' } }), 'reaction_pf2e');
    assert.strictEqual(extractPf2eActionCost({ actionType: { value: 'free' } }), 'free_pf2e');
  });

  it('parses a Foundry PF2e spell JSON into an EntityStatBlock', () => {
    const sampleSpell = {
      _id: 'rnNGALRtsjspFTws',
      name: 'Acidic Burst',
      type: 'spell',
      system: {
        time: { value: '2' },
        level: { value: 1 },
        damage: {
          '0': { formula: '2d6', type: 'acid' },
        },
        defense: {
          save: { basic: true, statistic: 'reflex' },
        },
        description: {
          value: '<p>You create a shell of acid that bursts outward.</p>',
        },
        traits: {
          rarity: 'common',
          traditions: ['arcane', 'primal'],
          value: ['acid', 'concentrate', 'manipulate'],
        },
      },
    };

    const block = parseFoundryPF2eJson(sampleSpell, 'https://example.com/spell.json');

    assert.strictEqual(block.name, 'Acidic Burst');
    assert.strictEqual(block.type, 'spell');
    assert.strictEqual(block.cost, '2_actions');
    assert.strictEqual(block.level, 1);
    assert.strictEqual(block.damageFormula, '2d6');
    assert.strictEqual(block.damageType, 'acid');
    assert.strictEqual(block.savingThrow, 'Basic Reflex');
    assert.strictEqual(block.sourceSystem, 'pf2e');
    assert.strictEqual(block.sourceUrl, 'https://example.com/spell.json');
    assert.ok(block.traits?.includes('Acid'));
    assert.ok(block.traits?.includes('Concentrate'));
    assert.ok(block.subtitle?.includes('Rank 1 Spell'));
  });

  it('parses a Foundry PF2e equipment/weapon JSON into an EntityStatBlock', () => {
    const sampleWeapon = {
      _id: 'wpn123',
      name: 'Longsword',
      type: 'weapon',
      system: {
        category: 'martial',
        level: { value: 0 },
        damage: {
          dice: 1,
          die: 'd8',
          damageType: 'slashing',
        },
        description: {
          value: '<p>A classic versatile blade.</p>',
        },
        traits: {
          rarity: 'common',
          value: ['versatile-p'],
        },
      },
    };

    const block = parseFoundryPF2eJson(sampleWeapon);

    assert.strictEqual(block.name, 'Longsword');
    assert.strictEqual(block.type, 'item');
    assert.strictEqual(block.damageFormula, '1d8');
    assert.strictEqual(block.damageType, 'slashing');
    assert.ok(block.traits?.includes('Versatile P'));
    assert.ok(block.subtitle?.includes('Martial'));
  });

  it('parses a Foundry PF2e action/feat JSON into an EntityStatBlock', () => {
    const sampleAction = {
      _id: 'act123',
      name: 'A Challenge for Heroes',
      type: 'action',
      system: {
        actions: { value: 2 },
        description: {
          value: '<p>You declare an enemy to be a heroic test.</p>',
        },
        traits: {
          rarity: 'uncommon',
          value: ['concentrate', 'mental'],
        },
      },
    };

    const block = parseFoundryPF2eJson(sampleAction);

    assert.strictEqual(block.name, 'A Challenge for Heroes');
    assert.strictEqual(block.type, 'ability');
    assert.strictEqual(block.cost, '2_actions');
    assert.ok(block.traits?.includes('Uncommon'));
    assert.ok(block.traits?.includes('Mental'));
  });

  it('parses a Foundry PF2e NPC/Bestiary creature into an EntityStatBlock with strikes', () => {
    const sampleNpc = {
      _id: 'npc123',
      name: 'Animated Armor',
      type: 'npc',
      system: {
        details: { level: { value: 2 }, alignment: { value: 'N' } },
        attributes: {
          hp: { value: 20, max: 20 },
          ac: { value: 17 },
          speed: { value: 20 },
        },
        abilities: {
          str: { mod: 3 },
          dex: { mod: -1 },
          con: { mod: 2 },
          int: { mod: -5 },
          wis: { mod: 0 },
          cha: { mod: -5 },
        },
        traits: {
          size: { value: 'med' },
          value: ['construct', 'mindless'],
        },
      },
      items: [
        {
          _id: 'strike1',
          name: 'Slam',
          type: 'melee',
          system: {
            bonus: { value: 9 },
            damageRolls: {
              first: { damage: '1d8+3', damageType: 'bludgeoning' },
            },
            traits: { value: ['magical'] },
          },
        },
      ],
    };

    const block = parseFoundryPF2eJson(sampleNpc);

    assert.strictEqual(block.name, 'Animated Armor');
    assert.strictEqual(block.type, 'monster');
    assert.strictEqual(block.armorClass, 17);
    assert.strictEqual(block.hp, '20/20');
    assert.strictEqual(block.challenge, 'Level 2');
    assert.strictEqual(block.stats?.str, 16); // 10 + 3*2
    assert.strictEqual(block.stats?.dex, 8); // 10 + (-1)*2
    assert.strictEqual(block.actions?.length, 1);
    assert.strictEqual(block.actions?.[0].name, 'Slam');
    assert.strictEqual(block.actions?.[0].cost, '1_action');
    assert.strictEqual(block.actions?.[0].rollFormula, '1d20+9');
    assert.strictEqual(block.actions?.[0].damageFormula, '1d8+3');
    assert.strictEqual(block.actions?.[0].damageType, 'bludgeoning');
  });
});
