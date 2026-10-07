import {GameMap, Token} from '@oldbear/shared';
import assert from 'node:assert';
import {afterEach, beforeEach, describe, it} from 'node:test';

import {DEFAULT_STATUS_DEFINITIONS, formatCondition, parseCondition, processTurnTransition, resolveStatusDefinitions,} from './StatusManager.js';

describe('Custom Configurable Statuses & Turn Lifecycles (OB-131)', () => {
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
      clear: () => {
        mockStore = {};
      },
    };
  });

  afterEach(() => {
    (globalThis as any).localStorage = originalLocalStorage;
  });

  it('resolves hierarchy from defaults, localStorage, and per-scene overrides',
     () => {
       // 1. Built-in defaults
       const defs1 = resolveStatusDefinitions();
       assert.strictEqual(defs1.Dying.label, 'Dying');
       assert.strictEqual(defs1.Dying.counter?.max, 3);

       // 2. Global localStorage override
       localStorage.setItem('obb_custom_statuses', JSON.stringify({
         Dying: {
           label: 'Dying',
           color: '#b91c1c',
           counter: {start: 1, update: 1, max: 5},  // 5 death saves
           clearWhen: 'beginning_of_turn',
           updates: 'end_of_turn',
         },
         Frenzy: {
           label: 'Frenzy',
           color: '#e11d48',
           counter: {start: 1, update: 1},
           showOnToken: true,
         },
       }));

       const defs2 = resolveStatusDefinitions();
       assert.strictEqual(defs2.Dying.counter?.max, 5);
       assert.strictEqual(defs2.Frenzy.label, 'Frenzy');

       // 3. Per-scene override takes highest precedence
       const mockScene = {
         id: 'map-boss',
         name: 'Boss Room',
         customStatuses: {
           Frenzy: {
             label: 'Frenzy',
             color: '#9333ea',
             counter: {start: 2, update: 2, max: 10},
           },
         },
       } as unknown as GameMap;

       const defs3 = resolveStatusDefinitions(mockScene);
       assert.strictEqual(defs3.Frenzy.counter?.max, 10);
       assert.strictEqual(defs3.Frenzy.color, '#9333ea');
       assert.strictEqual(defs3.Dying.counter?.max, 5);  // retained from global
     });

  it('parses and formats condition strings with numeric counters', () => {
    assert.deepStrictEqual(
        parseCondition('Dying:2'), {label: 'Dying', count: 2});
    assert.deepStrictEqual(
        parseCondition('Blinded'), {label: 'Blinded', count: undefined});
    assert.strictEqual(formatCondition('Dying', 3), 'Dying:3');
    assert.strictEqual(formatCondition('Blinded'), 'Blinded');
  });

  it('advances counters and clears statuses on turn transitions according to lifecycle',
     () => {
       const definitions = resolveStatusDefinitions();

       const heroToken: Token = {
         id: 'tok-hero',
         mapId: 'map-1',
         name: 'Hero',
         x: 0,
         y: 0,
         size: 1,
         rotation: 0,
         ringColor: '#38bdf8',
         fillColor: '#000',
         clipCircle: true,
         currentHp: 0,
         maxHp: 20,
         tempHp: 0,
         speed: 30,
         conditions: ['Dying:1', 'Stunned'],
         isProp: false,
         layer: 'token',
       };

       const bossToken: Token = {
         id: 'tok-boss',
         mapId: 'map-1',
         name: 'Boss',
         x: 50,
         y: 50,
         size: 2,
         rotation: 0,
         ringColor: '#ef4444',
         fillColor: '#000',
         clipCircle: true,
         currentHp: 100,
         maxHp: 100,
         tempHp: 0,
         speed: 30,
         conditions: ['Bleeding:3'],
         isProp: false,
         layer: 'token',
       };

       const tokens = {[heroToken.id]: heroToken, [bossToken.id]: bossToken};

       // Scenario 1: Hero finishes their turn (endingTokenId = tok-hero), Boss
       // starts (startingTokenId = tok-boss)
       // - Hero has 'Dying:1' which updates on 'end_of_turn': counter should
       // increment to 2!
       // - Hero has 'Stunned' which has clearWhen: 'end_of_turn': should be
       // cleared!
       // - Boss has 'Bleeding:3' which updates and clears on
       // 'beginning_of_turn': counter should decrement to 2!
       const result1 = processTurnTransition(
           tokens, heroToken.id, bossToken.id, definitions);

       const updatedHero = result1.updatedTokens[heroToken.id];
       assert.ok(updatedHero, 'Hero token updated');
       assert.deepStrictEqual(updatedHero.conditions, ['Dying:2']);
       assert.strictEqual(updatedHero.statusCounters?.Dying, 2);

       const updatedBoss = result1.updatedTokens[bossToken.id];
       assert.ok(updatedBoss, 'Boss token updated');
       assert.deepStrictEqual(updatedBoss.conditions, ['Bleeding:2']);
       assert.strictEqual(updatedBoss.statusCounters?.Bleeding, 2);

       assert.ok(result1.auditMessages.some(
           (m) => m.includes('Dying') && m.includes('updated to **2**')));
       assert.ok(result1.auditMessages.some(
           (m) => m.includes('Stunned') && m.includes('expired')));
       assert.ok(result1.auditMessages.some(
           (m) => m.includes('Bleeding') && m.includes('updated to **2**')));
     });
});
