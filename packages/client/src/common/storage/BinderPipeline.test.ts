import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isBinderData,
  createBinderPayload,
  importBinderData,
  BINDER_SCHEMA_VERSION,
  BINDER_SCHEMA_ID,
  BINDER_JSON_SCHEMA,
  BinderData,
} from './BinderPipeline.js';
import { GameSession } from '@oldbear/shared';

describe('Universal .binder Export/Import Pipeline (OB-135)', () => {
  it('validates binder schema data and recognizes valid binder structure', () => {
    assert.strictEqual(isBinderData(null), false);
    assert.strictEqual(isBinderData({}), false);
    assert.strictEqual(isBinderData({ schemaVersion: 0 }), false);

    // Valid binder with _oldbear
    const validWithOldbear: BinderData = {
      schemaVersion: 1,
      _oldbear: { vtt: {} },
    };
    assert.strictEqual(isBinderData(validWithOldbear), true);

    // Valid binder with collections
    const validWithCollections: BinderData = {
      schemaVersion: 1,
      collections: [{ name: 'Test Collection', cards: [] }],
    };
    assert.strictEqual(isBinderData(validWithCollections), true);
  });

  it('constructs a compliant .binder payload conforming to docs/schema/binder.json', async () => {
    const mockSession: any = {
      id: 'session-test-123',
      name: 'Curse of Strahd',
      activeMapId: 'map-castle-ravenloft',
      maps: [
        {
          id: 'map-castle-ravenloft',
          name: 'Castle Ravenloft',
          imageUrl: 'https://example.com/map.jpg',
          gridSize: 50,
          gridType: 'square',
          gridColor: '#ffffff',
          gridOpacity: 0.5,
          scaleFtPerCell: 5,
          width: 2000,
          height: 1500,
          showGrid: true,
        },
      ],
      tokens: {
        'tok-strahd': {
          id: 'tok-strahd',
          name: 'Count Strahd von Zarovich',
          mapId: 'map-castle-ravenloft',
          x: 100,
          y: 200,
          rotation: 0,
          size: 1,
          imageUrl: 'https://example.com/strahd.png',
          currentHp: 144,
          maxHp: 144,
          conditions: [],
          ringColor: '#ef4444',
          fillColor: '#7f1d1d',
          clipCircle: true,
          tempHp: 0,
          speed: 30,
          isProp: false,
          layer: 'token',
        },
      },
      players: {},
    };

    const mockBrawlData = {
      rosters: [{ id: 'roster-1', name: 'Ultramarines 2000pts', points: 1995 }],
      units: [{ id: 'unit-1', name: 'Intercessors', count: 5 }],
      points: 2000,
    };

    const binder = await createBinderPayload({
      session: mockSession,
      includeAssets: false,
      includeLocalStorage: false,
      brawlData: mockBrawlData,
    });

    // Schema invariants
    assert.strictEqual(binder.$schema, BINDER_JSON_SCHEMA);
    assert.strictEqual(binder.$id, BINDER_SCHEMA_ID);
    assert.strictEqual(binder.schemaVersion, BINDER_SCHEMA_VERSION);
    assert.ok(Array.isArray(binder.collections));
    assert.ok(Array.isArray(binder.dashboard));

    // Private extension block
    assert.ok(binder._oldbear, '_oldbear private namespace must exist');
    assert.strictEqual(binder._oldbear.vtt?.session?.id, 'session-test-123');
    assert.strictEqual(binder._oldbear.vtt?.session?.name, 'Curse of Strahd');
    assert.strictEqual(binder._oldbear.brawl?.points, 2000);
    assert.strictEqual(binder._oldbear.brawl?.rosters?.length, 1);
  });

  it('imports and unpacks .binder document, restoring VTT and Brawl modules', async () => {
    const testDoc: any = {
      $schema: BINDER_JSON_SCHEMA,
      schemaVersion: 1,
      collections: [],
      dashboard: [],
      _oldbear: {
        vtt: {
          session: {
            id: 'imported-session-456',
            name: 'Lost Mine of Phandelver',
            activeMapId: 'map-cragmaw',
            maps: [],
            tokens: {},
            players: {},
          },
          assets: [],
          localStorage: {
            oldbear_test_key: 'test_value',
          },
        },
        brawl: {
          rosters: [{ id: 'roster-orks', name: 'Waaagh! 1500pts' }],
        },
      },
    };

    const result = await importBinderData(JSON.stringify(testDoc));

    assert.strictEqual(result.schemaVersion, 1);
    assert.strictEqual(result.session?.id, 'imported-session-456');
    assert.strictEqual(result.session?.name, 'Lost Mine of Phandelver');
    assert.strictEqual(result.brawlRosterCount, 1);
    assert.strictEqual(result.rawBinder.schemaVersion, 1);
  });

  it('gracefully handles third-party .binder files containing only collections', async () => {
    const externalDoc = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      schemaVersion: 1,
      collections: [
        {
          name: 'MonsterCards Deck',
          cards: [
            { id: 'card-1', name: 'Goblin Archer', type: 'monster', data: { hp: 7, ac: 15 } },
            { id: 'card-2', name: 'Hobgoblin Warlord', type: 'monster', data: { hp: 45, ac: 17 } },
          ],
        },
      ],
      dashboard: [],
    };

    const result = await importBinderData(externalDoc);
    assert.strictEqual(result.schemaVersion, 1);
    assert.strictEqual(result.collectionsCount, 1);
    assert.strictEqual(result.session, null);
    assert.strictEqual(result.rawBinder._oldbear, undefined);
  });

  it('rejects malformed or invalid documents', async () => {
    await assert.rejects(
      async () => {
        await importBinderData('invalid-json');
      },
      /Failed to parse .binder file/
    );

    await assert.rejects(
      async () => {
        await importBinderData({ foo: 'bar' });
      },
      /Invalid .binder file/
    );
  });

  it('uses showSaveFilePicker when available to avoid browser keep warnings (OB-166)', async () => {
    const { downloadBinderFile } = await import('./BinderPipeline.js');
    let pickerCalled = false;
    let writtenBlob: any = null;

    (globalThis as any).window = {
      showSaveFilePicker: async (opts: any) => {
        pickerCalled = true;
        assert.ok(opts.types[0].accept['application/json'].includes('.binder'));
        return {
          createWritable: async () => ({
            write: async (b: any) => { writtenBlob = b; },
            close: async () => {},
          }),
        };
      },
    };

    const dummyBlob = new Blob(['{}'], { type: 'application/json' });
    const saved = await downloadBinderFile(dummyBlob, 'test-export.binder');
    assert.strictEqual(saved, true);
    assert.strictEqual(pickerCalled, true);
    assert.strictEqual(writtenBlob, dummyBlob);

    // Test AbortError handling when user cancels
    (globalThis as any).window.showSaveFilePicker = async () => {
      const err = new Error('The user aborted a request.');
      err.name = 'AbortError';
      throw err;
    };
    const cancelled = await downloadBinderFile(dummyBlob, 'test-export.binder');
    assert.strictEqual(cancelled, false);

    delete (globalThis as any).window;
  });
});
