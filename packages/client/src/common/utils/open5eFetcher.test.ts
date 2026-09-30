import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import {
  fetchOpen5eSpell,
  fetchOpen5eMonster,
  fetchOpen5eItem,
  fetchOpen5eReference,
} from './open5eFetcher.js';

describe('Open5e Client-Side Reference Fetcher & Cache (OB-141, OB-142, OB-180)', () => {
  it('correctly maps spell response to EntityStatBlock with traits and action cost', async () => {
    // Mock global fetch for spell
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any) => {
      if (String(url).includes('/spells/magic-missile/')) {
        return {
          ok: true,
          json: async () => ({
            slug: 'magic-missile',
            name: 'Magic Missile',
            level: '1st-level',
            level_int: 1,
            school: 'Evocation',
            casting_time: '1 action',
            range: '120 feet',
            duration: 'Instantaneous',
            desc: 'You create three glowing darts of magical force...',
            higher_level: 'When you cast this spell using a spell slot of 2nd level or higher...',
            requires_concentration: false,
          }),
        } as any;
      }
      return { ok: false } as any;
    };

    try {
      const spell = await fetchOpen5eSpell('magic missile');
      assert.ok(spell);
      assert.strictEqual(spell.name, 'Magic Missile');
      assert.strictEqual(spell.type, 'spell');
      assert.strictEqual(spell.level, 1);
      assert.strictEqual(spell.school, 'Evocation');
      assert.strictEqual(spell.cost, 'action');
      assert.deepStrictEqual(spell.traits, ['Evocation']);
      assert.strictEqual(spell.range, '120 feet');
      assert.strictEqual(spell.duration, 'Instantaneous');
      assert.ok(spell.description.includes('At Higher Levels'));
      assert.strictEqual(spell.sourceSystem, '5e');

      // Test memory cache: subsequent call shouldn't even need fetch
      globalThis.fetch = () => {
        throw new Error('Should have hit cache!');
      };
      const cached = await fetchOpen5eSpell('magic-missile');
      assert.strictEqual(cached?.name, 'Magic Missile');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('correctly maps monster response to EntityStatBlock with stats and actions', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any) => {
      if (String(url).includes('/monsters/goblin/')) {
        return {
          ok: true,
          json: async () => ({
            slug: 'goblin',
            name: 'Goblin',
            size: 'Small',
            type: 'Humanoid',
            subtype: 'goblinoid',
            alignment: 'neutral evil',
            armor_class: 15,
            hit_points: 7,
            hit_dice: '2d6',
            speed: { walk: 30 },
            strength: 8,
            dexterity: 14,
            constitution: 10,
            intelligence: 10,
            wisdom: 8,
            charisma: 8,
            challenge_rating: '1/4',
            actions: [
              {
                name: 'Scimitar',
                desc: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.',
              },
            ],
            special_abilities: [
              {
                name: 'Nimble Escape',
                desc: 'The goblin can take the Disengage or Hide action as a bonus action on each of its turns.',
              },
            ],
          }),
        } as any;
      }
      return { ok: false } as any;
    };

    try {
      const monster = await fetchOpen5eMonster('goblin');
      assert.ok(monster);
      assert.strictEqual(monster.name, 'Goblin');
      assert.strictEqual(monster.type, 'monster');
      assert.strictEqual(monster.armorClass, 15);
      assert.strictEqual(monster.hp, '7 (2d6)');
      assert.strictEqual(monster.speed, '30 ft.');
      assert.strictEqual(monster.challenge, 'CR 1/4');
      assert.strictEqual(monster.stats?.dex, 14);
      assert.strictEqual(monster.actions?.length, 1);
      assert.strictEqual(monster.actions?.[0].name, 'Scimitar');
      assert.strictEqual(monster.specialAbilities?.length, 1);
      assert.strictEqual(monster.specialAbilities?.[0].name, 'Nimble Escape');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('correctly maps magic item response to EntityStatBlock with traits', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any) => {
      if (String(url).includes('/magicitems/potion-of-healing/')) {
        return {
          ok: true,
          json: async () => ({
            slug: 'potion-of-healing',
            name: 'Potion of Healing',
            type: 'Potion',
            rarity: 'Common',
            requires_attunement: '',
            desc: 'You regain 2d4 + 2 hit points when you drink this potion.',
          }),
        } as any;
      }
      return { ok: false } as any;
    };

    try {
      const item = await fetchOpen5eItem('potion of healing');
      assert.ok(item);
      assert.strictEqual(item.name, 'Potion of Healing');
      assert.strictEqual(item.type, 'item');
      assert.deepStrictEqual(item.traits, ['Common']);
      assert.strictEqual(item.subtitle, 'Common Potion');
      assert.strictEqual(item.description, 'You regain 2d4 + 2 hit points when you drink this potion.');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
