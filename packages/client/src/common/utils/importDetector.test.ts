import assert from 'node:assert';
import {describe, it} from 'node:test';

import {CONFIRMATION_SIZE_THRESHOLD_BYTES, createTokenFromMonsterCard, formatFileSize, inspectImportFile, isMonsterCard,} from './importDetector.js';

const SAMPLE_DND_CHAR = {
  data: {
    id: 12345,
    name: 'Grom Ironhide',
    classes: [{definition: {name: 'Barbarian'}, level: 5}],
    stats: [{id: 1, value: 16}, {id: 2, value: 14}],
  },
};

const SAMPLE_PB_CHAR = {
  success: true,
  build: {
    name: 'Valeros',
    class: 'Fighter',
    level: 5,
    attributes: {str: 18, dex: 14},
  },
};

describe('Universal File Drag-and-Drop Ingestion (OB-140)', () => {
  it('formats file sizes accurately', () => {
    assert.strictEqual(formatFileSize(500), '500 B');
    assert.strictEqual(formatFileSize(2048), '2.0 KB');
    assert.strictEqual(formatFileSize(250 * 1024), '250.0 KB');
    assert.strictEqual(formatFileSize(1.2 * 1024 * 1024), '1.2 MB');
  });

  it('detects audio and image files without requiring confirmation', () => {
    const audioRes = inspectImportFile(
        {name: 'battle-theme.mp3', size: 5 * 1024 * 1024, type: 'audio/mpeg'},
        '');
    assert.strictEqual(audioRes.category, 'audio');
    assert.strictEqual(audioRes.requiresConfirmation, false);
    assert.strictEqual(audioRes.breakdown.audio, 1);

    const imgRes = inspectImportFile(
        {name: 'dungeon-map.png', size: 3 * 1024 * 1024, type: 'image/png'},
        '');
    assert.strictEqual(imgRes.category, 'image');
    assert.strictEqual(imgRes.requiresConfirmation, false);
    assert.strictEqual(imgRes.breakdown.maps, 1);
  });

  it('triggers confirmation modal for universal .binder packages and extracts breakdown',
     () => {
       const mockBinder = {
         $schema: 'https://schemas.ttrpgwith.me/v1/binder.json',
         schemaVersion: 1,
         collections: [
           {
             name: 'Goblin Ambush',
             cards: [
               {
                 id: 'c1',
                 name: 'Goblin Scout',
                 type: 'monster',
                 strengthScore: 8
               },
               {
                 id: 'c2',
                 name: 'Goblin Shaman',
                 type: 'monster',
                 strengthScore: 8
               },
             ],
           },
         ],
         _oldbear: {
           vtt: {
             session: null,
             assets: [
               {
                 id: 'a1',
                 name: 'Forest Road',
                 type: 'map',
                 dataUrl: 'data:img'
               },
               {
                 id: 'a2',
                 name: 'Ambient Birds',
                 type: 'audio',
                 dataUrl: 'data:audio'
               },
               {
                 id: 'a3',
                 name: 'Grom',
                 character: {name: 'Grom'},
                 type: 'token'
               },
             ],
           },
         },
       };

       const res = inspectImportFile(
           {name: 'adventure.binder', size: 1.2 * 1024 * 1024},
           JSON.stringify(mockBinder));

       assert.strictEqual(res.category, 'binder');
       assert.strictEqual(res.requiresConfirmation, true);
       assert.strictEqual(res.breakdown.npcs, 2);   // 2 cards in collection
       assert.strictEqual(res.breakdown.maps, 1);   // 1 map asset
       assert.strictEqual(res.breakdown.audio, 1);  // 1 audio asset
       assert.strictEqual(res.breakdown.characters, 1);  // 1 character asset
       assert.strictEqual(res.breakdown.total, 5);
       assert.ok(res.summary.includes('Universal .binder package'));
       assert.ok(res.summary.includes('1.2 MB'));
     });

  it('triggers confirmation modal for OldBear full backup archives', () => {
    const mockBackup = {
      app: 'OldBearBattles',
      version: 1,
      assets: [
        {id: 'm1', name: 'Tavern Map', type: 'map'},
        {id: 't1', name: 'Orc', type: 'token'},
        {id: 't2', name: 'Skeleton', type: 'token'},
        {id: 's1', name: 'Battle Ambience', type: 'audio'},
      ],
      localStorage: {
        oldbear_character_grom: JSON.stringify([{id: 'c1', name: 'Grom'}]),
      },
    };

    const res = inspectImportFile(
        {name: 'backup-2026.json', size: 500 * 1024},
        JSON.stringify(mockBackup));

    assert.strictEqual(res.category, 'backup');
    assert.strictEqual(res.requiresConfirmation, true);
    assert.strictEqual(res.breakdown.maps, 1);
    assert.strictEqual(res.breakdown.audio, 1);
    assert.strictEqual(res.breakdown.npcs, 2);
    assert.strictEqual(res.breakdown.characters, 1);
    assert.strictEqual(res.breakdown.total, 5);
  });

  it('triggers confirmation modal for multi-character JSON exports', () => {
    const multiChar = [
      SAMPLE_DND_CHAR.data,
      {
        name: 'Legolas',
        classes: [{definition: {name: 'Ranger'}, level: 5}],
        stats: []
      },
      {
        name: 'Gimli',
        classes: [{definition: {name: 'Fighter'}, level: 5}],
        stats: []
      },
    ];

    const res = inspectImportFile(
        {name: 'party-export.json', size: 45 * 1024},
        JSON.stringify(multiChar));

    assert.strictEqual(res.category, 'multi-character');
    assert.strictEqual(res.requiresConfirmation, true);
    assert.strictEqual(res.breakdown.characters, 3);
    assert.strictEqual(res.breakdown.total, 3);
  });

  it('auto-routes single D&D Beyond and Pathbuilder character files directly (<250KB)',
     () => {
       const dndRes = inspectImportFile(
           {name: 'grom.json', size: 12 * 1024},
           JSON.stringify(SAMPLE_DND_CHAR));
       assert.strictEqual(dndRes.category, 'dndbeyond');
       assert.strictEqual(dndRes.requiresConfirmation, false);

       const pbRes = inspectImportFile(
           {name: 'valeros.json', size: 8 * 1024},
           JSON.stringify(SAMPLE_PB_CHAR));
       assert.strictEqual(pbRes.category, 'pathbuilder');
       assert.strictEqual(pbRes.requiresConfirmation, false);
     });

  it('identifies standalone MonsterCard and converts to Token', () => {
    const sampleCard = {
      $schema: 'https://schemas.ttrpgwith.me/v1/card.json',
      schemaVersion: 1,
      id: 'card-dire-wolf',
      name: 'Dire Wolf',
      size: 'Large',
      type: 'Beast',
      strengthScore: 17,
      dexterityScore: 15,
      constitutionScore: 15,
      hitDice: 5,
      walkSpeed: 50,
      actions: [
        {
          name: 'Bite',
          description:
              'Melee weapon attack: +5 to hit, 2d6+3 piercing damage. Target must succeed DC 13 STR save or be knocked prone.',
        },
      ],
      imageUrl: 'https://example.com/direwolf.png',
    };

    assert.strictEqual(isMonsterCard(sampleCard), true);

    const token = createTokenFromMonsterCard(sampleCard, 'map-10', 300, 400);
    assert.strictEqual(token.name, 'Dire Wolf');
    assert.strictEqual(token.size, 2);  // Large -> 2
    assert.strictEqual(token.speed, 50);
    assert.strictEqual(token.imageUrl, 'https://example.com/direwolf.png');
    assert.strictEqual(token.character?.stats?.str, 17);
    assert.strictEqual(token.character?.actions?.[0]?.name, 'Bite');
  });

  it('triggers confirmation for files exceeding 250 KB threshold', () => {
    // Generate a payload exceeding 250 KB
    const bigBlob: Record<string, string> = {};
    for (let i = 0; i < 5000; i++) {
      bigBlob[`key_${i}`] =
          '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF';
    }
    const jsonStr = JSON.stringify(bigBlob);
    const size = Buffer.byteLength(jsonStr);
    assert.ok(size > CONFIRMATION_SIZE_THRESHOLD_BYTES);

    const res = inspectImportFile({name: 'huge-data.json', size}, jsonStr);
    assert.strictEqual(res.requiresConfirmation, true);
  });
});
