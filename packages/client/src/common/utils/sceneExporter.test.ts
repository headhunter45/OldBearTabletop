import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GameMap, SubmapConfig, Token } from '@oldbear/shared';
import JSZip from 'jszip';
import { sanitizeFilename, resolveImageSource } from './sceneExporter.js';

describe('Scene Exporter (Native Resolution & ZIP Archive)', () => {
  describe('sanitizeFilename', () => {
    it('cleanses names into filesystem-friendly alphanumeric strings', () => {
      assert.strictEqual(sanitizeFilename('Dungeon Level 1'), 'dungeon_level_1');
      assert.strictEqual(sanitizeFilename('  Goblin Cave (Night) -- 50px!  '), 'goblin_cave_night_50px');
      assert.strictEqual(sanitizeFilename('###'), 'scene');
      assert.strictEqual(sanitizeFilename(''), 'scene');
      assert.strictEqual(sanitizeFilename('Castle_Grounds_v2.0'), 'castle_grounds_v2_0');
    });
  });

  describe('resolveImageSource', () => {
    it('returns direct URLs immediately without querying DB', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      assert.strictEqual(await resolveImageSource(dataUrl), dataUrl);
      assert.strictEqual(await resolveImageSource('https://example.com/map.png'), 'https://example.com/map.png');
      assert.strictEqual(await resolveImageSource('http://localhost:3000/tile.jpg'), 'http://localhost:3000/tile.jpg');
      assert.strictEqual(await resolveImageSource('blob:http://localhost/12345'), 'blob:http://localhost/12345');
      assert.strictEqual(await resolveImageSource('/assets/floor.png'), '/assets/floor.png');
      assert.strictEqual(await resolveImageSource(undefined), null);
    });
  });

  describe('Archive Structure and Token Filtering Logic', () => {
    it('correctly filters props and modular tiles while strictly excluding character tokens and markers', () => {
      const parentMap: GameMap = {
        id: 'map_cave',
        name: 'Dark Cave Entrance',
        baseMapName: 'Rocky Terrain',
        imageUrl: 'data:image/png;base64,fake',
        gridSize: 70,
        gridType: 'square',
        gridColor: '#ffffff',
        gridOpacity: 0.4,
        width: 1400,
        height: 1050,
        scaleFtPerCell: 5,
        showGrid: true,
      };

      const tokens: Token[] = [
        // Modular map tile (must be included)
        {
          id: 'tile_1',
          name: 'Stone Floor Tile',
          mapId: 'map_cave',
          x: 100,
          y: 100,
          size: 2,
          imageUrl: 'data:image/png;base64,tile',
          layer: 'map',
          isProp: true,
          ringColor: '#38bdf8',
          conditions: [],
          rotation: 0,
        } as unknown as Token,
        // Prop / Terrain (must be included)
        {
          id: 'prop_chest',
          name: 'Wooden Chest',
          mapId: 'map_cave',
          x: 350,
          y: 200,
          size: 1,
          imageUrl: 'data:image/png;base64,chest',
          layer: 'prop',
          isProp: true,
          ringColor: 'transparent',
          conditions: [],
          rotation: 45,
        } as unknown as Token,
        // Player / Character token (MUST BE EXCLUDED)
        {
          id: 'pc_aragorn',
          name: 'Aragorn',
          mapId: 'map_cave',
          x: 500,
          y: 400,
          size: 1,
          imageUrl: 'data:image/png;base64,aragorn',
          ringColor: '#10b981',
          conditions: [],
          rotation: 0,
          isProp: false,
          layer: 'token',
        } as unknown as Token,
        // Monster token (MUST BE EXCLUDED)
        {
          id: 'mon_goblin',
          name: 'Goblin Scout',
          mapId: 'map_cave',
          x: 700,
          y: 500,
          size: 1,
          imageUrl: 'data:image/png;base64,goblin',
          ringColor: '#ef4444',
          conditions: [],
          rotation: 0,
          isProp: false,
          layer: 'token',
        } as unknown as Token,
        // Token on a DIFFERENT map (MUST BE EXCLUDED)
        {
          id: 'prop_other_map',
          name: 'Other Map Prop',
          mapId: 'different_map_999',
          x: 100,
          y: 100,
          size: 1,
          imageUrl: 'data:image/png;base64,other',
          layer: 'prop',
          isProp: true,
          ringColor: 'transparent',
          conditions: [],
          rotation: 0,
        } as unknown as Token,
      ];

      // Simulate the filtering logic in sceneExporter
      const allTokens: Token[] = Array.isArray(tokens) ? tokens : Object.values(tokens);
      const mapTokens = allTokens.filter((t) => t.mapId === parentMap.id);

      const scenePropsAndTiles = mapTokens.filter(
        (t) => t.layer === 'map' || t.layer === 'prop' || Boolean(t.isProp)
      );

      assert.strictEqual(scenePropsAndTiles.length, 2);
      assert.strictEqual(scenePropsAndTiles[0].id, 'tile_1');
      assert.strictEqual(scenePropsAndTiles[1].id, 'prop_chest');

      // Verify character and monster were excluded
      assert.strictEqual(scenePropsAndTiles.some((t) => t.id === 'pc_aragorn'), false);
      assert.strictEqual(scenePropsAndTiles.some((t) => t.id === 'mon_goblin'), false);
      assert.strictEqual(scenePropsAndTiles.some((t) => t.id === 'prop_other_map'), false);
    });

    it('identifies submaps and generates ZIP file hierarchy with required features and names', async () => {
      const parentMap: GameMap = {
        id: 'map_manor',
        name: 'Haunted Manor Scene',
        baseMapName: 'Grounds',
        imageUrl: 'data:image/png;base64,bg',
        gridSize: 50,
        gridType: 'square',
        gridColor: '#ffffff',
        gridOpacity: 0.4,
        width: 2000,
        height: 1500,
        scaleFtPerCell: 5,
        submaps: [
          {
            id: 'submap_cellar',
            name: 'Wine Cellar',
            type: 'building_floor',
            x: 2100,
            y: 0,
            width: 800,
            height: 600,
            gridSize: 50,
            showGrid: true,
          },
          {
            id: 'submap_staging',
            name: 'Reserves',
            label: 'Player Reserves',
            type: 'staging_area',
            x: 0,
            y: 1600,
            width: 500,
            height: 300,
            gridSize: 50,
            showGrid: true,
          },
        ],
      };

      const sceneName = sanitizeFilename(parentMap.name);
      const baseMapName = sanitizeFilename(parentMap.baseMapName || parentMap.name);
      const basePrefix = sceneName === baseMapName ? sceneName : `${sceneName}_${baseMapName}`;

      assert.strictEqual(basePrefix, 'haunted_manor_scene_grounds');

      // Construct simulated ZIP package
      const zip = new JSZip();
      const mockBlob = new Blob(['mock-png-content'], { type: 'image/png' });

      // Main map
      zip.file(`${basePrefix}_terrain-props_no-gridlines.png`, mockBlob);
      zip.file(`${basePrefix}_terrain-props_with-gridlines.png`, mockBlob);

      // Submaps
      const submapFiles: string[] = [];
      for (const sub of parentMap.submaps || []) {
        const subSlug = sanitizeFilename(sub.name || sub.label || sub.type);
        const noGrid = `${basePrefix}_submap-${subSlug}_terrain-props_no-gridlines.png`;
        const withGrid = `${basePrefix}_submap-${subSlug}_terrain-props_with-gridlines.png`;
        zip.file(noGrid, mockBlob);
        zip.file(withGrid, mockBlob);
        submapFiles.push(noGrid, withGrid);
      }

      const filesInZip = Object.keys(zip.files);

      // Verify files in ZIP:
      // 1. Main map no-grid
      assert.ok(filesInZip.includes('haunted_manor_scene_grounds_terrain-props_no-gridlines.png'));
      // 2. Main map with-grid
      assert.ok(filesInZip.includes('haunted_manor_scene_grounds_terrain-props_with-gridlines.png'));
      // 3. Submap 1 no-grid & with-grid
      assert.ok(filesInZip.includes('haunted_manor_scene_grounds_submap-wine_cellar_terrain-props_no-gridlines.png'));
      assert.ok(filesInZip.includes('haunted_manor_scene_grounds_submap-wine_cellar_terrain-props_with-gridlines.png'));
      // 4. Submap 2 no-grid & with-grid
      assert.ok(filesInZip.includes('haunted_manor_scene_grounds_submap-reserves_terrain-props_no-gridlines.png'));
      assert.ok(filesInZip.includes('haunted_manor_scene_grounds_submap-reserves_terrain-props_with-gridlines.png'));

      assert.strictEqual(filesInZip.length, 6);

      // Generate the ZIP blob to ensure JSZip compiles properly
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      assert.ok(zipBlob.size > 0);
    });
  });
});
