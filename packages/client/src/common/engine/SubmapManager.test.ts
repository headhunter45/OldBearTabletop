import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GameMap, SubmapConfig } from '@oldbear/shared';
import {
  createSubmapPreset,
  isPointInSubmap,
  findSubmapAt,
  duplicateSceneAsTemplate,
  renderSubmap,
} from './SubmapManager.js';

function mockGameMap(overrides?: Partial<GameMap>): GameMap {
  return {
    id: 'map_main_123',
    name: 'Tavern Ground Floor',
    imageUrl: 'https://example.com/tavern.png',
    gridSize: 50,
    gridType: 'square',
    gridColor: 'rgba(255, 255, 255, 0.4)',
    gridOpacity: 0.4,
    width: 2000,
    height: 1500,
    scaleFtPerCell: 5,
    showGrid: true,
    ...overrides,
  };
}

describe('Submaps & Secondary Logical Maps per Scene (OB-130)', () => {
  it('creates multi-floor building submap positioned side-by-side with parent map', () => {
    const parentMap = mockGameMap();
    const floor = createSubmapPreset('building_floor', parentMap, 'Floor 2 - Bedrooms');

    assert.strictEqual(floor.type, 'building_floor');
    assert.strictEqual(floor.name, 'Floor 2 - Bedrooms');
    assert.ok(floor.x >= parentMap.width, 'Should place floor to the right of parent map');
    assert.strictEqual(floor.y, 0);
    assert.ok(floor.width > 0 && floor.height > 0);
    assert.strictEqual(floor.showGrid, true);
    assert.strictEqual(floor.gridSize, parentMap.gridSize);
  });

  it('creates casualty tray / graveyard positioned below the active map', () => {
    const parentMap = mockGameMap();
    const casualtyTray = createSubmapPreset('casualty_tray', parentMap);

    assert.strictEqual(casualtyTray.type, 'casualty_tray');
    assert.ok(casualtyTray.name.includes('Casualty Tray'));
    assert.strictEqual(casualtyTray.x, 0);
    assert.ok(casualtyTray.y >= parentMap.height, 'Should place casualty tray below parent map');
    assert.strictEqual(casualtyTray.borderColor, '#dc2626');
  });

  it('creates off-table staging area for reserves and embarked units', () => {
    const parentMap = mockGameMap();
    const stagingArea = createSubmapPreset('staging_area', parentMap);

    assert.strictEqual(stagingArea.type, 'staging_area');
    assert.ok(stagingArea.name.includes('Staging Area'));
    assert.strictEqual(stagingArea.x, 0);
    assert.ok(stagingArea.y < 0, 'Should place staging area in top staging gutter');
    assert.strictEqual(stagingArea.borderColor, '#818cf8');
  });

  it('creates color-coded wargaming deployment zone with custom color', () => {
    const parentMap = mockGameMap();
    const deployZone = createSubmapPreset('deployment_zone', parentMap, 'Red Army Deployment', '#ef4444');

    assert.strictEqual(deployZone.type, 'deployment_zone');
    assert.strictEqual(deployZone.name, 'Red Army Deployment');
    assert.strictEqual(deployZone.colorCode, '#ef4444');
    assert.strictEqual(deployZone.borderColor, '#ef4444');
  });

  it('correctly tests point containment and finds submap at world coordinates', () => {
    const submap: SubmapConfig = {
      id: 'sub_1',
      name: 'Basement Crypt',
      type: 'connected_dungeon',
      x: 2100,
      y: 100,
      width: 800,
      height: 600,
      showGrid: true,
    };

    assert.strictEqual(isPointInSubmap(submap, 2200, 200), true);
    assert.strictEqual(isPointInSubmap(submap, 2100, 100), true);
    assert.strictEqual(isPointInSubmap(submap, 2900, 700), true);
    assert.strictEqual(isPointInSubmap(submap, 2099, 100), false);
    assert.strictEqual(isPointInSubmap(submap, 2200, 701), false);
    assert.strictEqual(isPointInSubmap(submap, 100, 100), false);

    const map = mockGameMap({ submaps: [submap] });
    assert.strictEqual(findSubmapAt(map, 2500, 300)?.id, 'sub_1');
    assert.strictEqual(findSubmapAt(map, 500, 500), null);
  });

  it('duplicates scene as a template, preserving all submaps and settings', () => {
    const submap1 = createSubmapPreset('building_floor', mockGameMap());
    const submap2 = createSubmapPreset('casualty_tray', mockGameMap());
    const sourceScene = mockGameMap({
      id: 'scene_base_wargame',
      name: 'Standard Tournament Layout',
      submaps: [submap1, submap2],
    });

    const cloned = duplicateSceneAsTemplate(
      sourceScene,
      'Desert Tournament Battle',
      'https://example.com/desert-map.jpg'
    );

    assert.notStrictEqual(cloned.id, sourceScene.id);
    assert.strictEqual(cloned.name, 'Desert Tournament Battle');
    assert.strictEqual(cloned.imageUrl, 'https://example.com/desert-map.jpg');
    assert.strictEqual(cloned.isTemplate, true);
    assert.strictEqual(cloned.submaps?.length, 2);
    // Submap IDs are regenerated
    assert.notStrictEqual(cloned.submaps?.[0].id, submap1.id);
    assert.strictEqual(cloned.submaps?.[0].name, submap1.name);
    assert.strictEqual(cloned.submaps?.[1].name, submap2.name);
  });

  it('renders submap to canvas 2D context cleanly without error', () => {
    const parentMap = mockGameMap();
    const submap = createSubmapPreset('casualty_tray', parentMap);

    const mockCtx: any = {
      save: () => {},
      restore: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      roundRect: () => {},
      setLineDash: () => {},
      measureText: (text: string) => ({ width: text.length * 8 }),
      fillText: () => {},
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      globalAlpha: 1,
    };

    assert.doesNotThrow(() => {
      renderSubmap(mockCtx, submap, parentMap, 1.0);
    });
  });
});
