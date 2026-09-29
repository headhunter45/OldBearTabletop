import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  getSavedCharacters,
  saveCharacterToStorage,
  deleteSavedCharacter,
  LOCAL_STORAGE_KEY,
  GM_STORAGE_KEY,
} from './characterStorage.js';
import { DnDCharacter } from '@oldbear/shared';

describe('VTT Character Storage (src/vtt/storage)', () => {
  let mockStore: Record<string, string> = {};
  let originalLocalStorage: any;

  beforeEach(() => {
    mockStore = {};
    originalLocalStorage = (globalThis as any).localStorage;
    (globalThis as any).localStorage = {
      getItem: (key: string) => mockStore[key] ?? null,
      setItem: (key: string, val: string) => {
        mockStore[key] = String(val);
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
    };
  });

  afterEach(() => {
    (globalThis as any).localStorage = originalLocalStorage;
  });

function mockCharacter(overrides: Partial<DnDCharacter> & { id: string; name: string }): DnDCharacter {
  return {
    level: 1,
    classes: 'Adventurer',
    race: 'Human',
    currentHp: 20,
    maxHp: 20,
    tempHp: 0,
    speed: 30,
    armorClass: 14,
    passivePerception: 12,
    stats: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    spells: [],
    ...overrides,
  };
}

  it('saves character to player storage and retrieves it', () => {
    const char = mockCharacter({
      id: 'char_fighter',
      name: 'Thorin',
      classes: 'Fighter 5',
      maxHp: 44,
      currentHp: 44,
      speed: 30,
      initiativeBonus: 1,
    });

    saveCharacterToStorage(char, false);
    const chars = getSavedCharacters(false);
    assert.strictEqual(chars.length, 1);
    assert.strictEqual(chars[0].name, 'Thorin');
    assert.strictEqual(chars[0].classes, 'Fighter 5');
    assert.strictEqual(chars[0].charData.maxHp, 44);
  });

  it('GM sees both player and GM characters without duplicates', () => {
    const playerChar = mockCharacter({
      id: 'char_1',
      name: 'Rogue',
      classes: 'Rogue 3',
    });
    const gmChar = mockCharacter({
      id: 'char_2',
      name: 'Goblin Boss',
      classes: 'Monster',
    });

    saveCharacterToStorage(playerChar, false);
    saveCharacterToStorage(gmChar, true);

    const playerView = getSavedCharacters(false);
    assert.strictEqual(playerView.length, 1);
    assert.strictEqual(playerView[0].name, 'Rogue');

    const gmView = getSavedCharacters(true);
    assert.strictEqual(gmView.length, 2);
    const names = gmView.map((c) => c.name).sort();
    assert.deepStrictEqual(names, ['Goblin Boss', 'Rogue']);
  });

  it('deletes characters correctly for players and GMs', () => {
    const char1 = mockCharacter({ id: 'char_del_1', name: 'Hero 1' });
    const char2 = mockCharacter({ id: 'char_del_2', name: 'Hero 2' });

    saveCharacterToStorage(char1, false);
    saveCharacterToStorage(char2, false);

    deleteSavedCharacter('char_del_1', false);
    const remaining = getSavedCharacters(false);
    assert.strictEqual(remaining.length, 1);
    assert.strictEqual(remaining[0].id, 'char_del_2');
  });
});
