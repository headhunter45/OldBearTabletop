import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  snapTileEdgeToEdge,
  drawRandomTile,
  createModularTileToken,
  DEFAULT_MODULAR_TILES,
  TileRect,
  ModularMapTile,
} from './ModularTileManager.js';

describe('Modular / Tileable Maps & Snapping Map Tiles (OB-128)', () => {
  const existingTile: TileRect = {
    id: 'tile_existing_1',
    x: 500,
    y: 500,
    width: 400,
    height: 400,
  };

  it('magnetically snaps moving tile to the East edge of an existing tile', () => {
    // Moving tile placed near (905, 510) - close to East edge (900, 500)
    const moving = { x: 915, y: 510, width: 400, height: 400 };
    const result = snapTileEdgeToEdge(moving, [existingTile], 30);

    assert.strictEqual(result.snapped, true);
    assert.strictEqual(result.snappedEdge, 'east');
    assert.strictEqual(result.x, 900); // 500 + 400
    assert.strictEqual(result.y, 500); // aligned to y
    assert.strictEqual(result.targetTileId, 'tile_existing_1');
  });

  it('magnetically snaps moving tile to the West edge of an existing tile', () => {
    // Moving tile placed near (85, 495) - right edge touches 500
    const moving = { x: 85, y: 495, width: 400, height: 400 };
    const result = snapTileEdgeToEdge(moving, [existingTile], 30);

    assert.strictEqual(result.snapped, true);
    assert.strictEqual(result.snappedEdge, 'west');
    assert.strictEqual(result.x, 100); // 500 - 400
    assert.strictEqual(result.y, 500);
  });

  it('magnetically snaps moving tile to the South edge of an existing tile', () => {
    // Moving tile placed near (505, 910) - top edge touches 900
    const moving = { x: 505, y: 910, width: 400, height: 400 };
    const result = snapTileEdgeToEdge(moving, [existingTile], 30);

    assert.strictEqual(result.snapped, true);
    assert.strictEqual(result.snappedEdge, 'south');
    assert.strictEqual(result.x, 500);
    assert.strictEqual(result.y, 900); // 500 + 400
  });

  it('magnetically snaps moving tile to the North edge of an existing tile', () => {
    // Moving tile placed near (510, 85) - bottom edge touches 500
    const moving = { x: 510, y: 85, width: 400, height: 400 };
    const result = snapTileEdgeToEdge(moving, [existingTile], 30);

    assert.strictEqual(result.snapped, true);
    assert.strictEqual(result.snappedEdge, 'north');
    assert.strictEqual(result.x, 500);
    assert.strictEqual(result.y, 100); // 500 - 400
  });

  it('does not snap if outside the magnetic snap threshold', () => {
    const moving = { x: 1200, y: 1200, width: 400, height: 400 };
    const result = snapTileEdgeToEdge(moving, [existingTile], 25);

    assert.strictEqual(result.snapped, false);
    assert.strictEqual(result.x, 1200);
    assert.strictEqual(result.y, 1200);
  });

  it('draws a random tile from a deck (card deck style in-play procedural generation)', () => {
    const drawn = drawRandomTile(DEFAULT_MODULAR_TILES);
    assert.ok(drawn);
    assert.ok(DEFAULT_MODULAR_TILES.some((t) => t.id === drawn?.id));

    const empty = drawRandomTile([]);
    assert.strictEqual(empty, null);
  });

  it('creates ready-to-place map layer token/prop from a modular tile', () => {
    const tile: ModularMapTile = {
      id: 'tile_chamber_8x8',
      name: 'Stone Chamber',
      category: 'room',
      width: 400,
      height: 400,
      gridTilesX: 8,
      gridTilesY: 8,
      imageUrl: '',
      backgroundColor: '#1e293b',
    };

    const token = createModularTileToken(tile, 'map_active_1', 900, 500, 50);

    assert.strictEqual(token.name, 'Stone Chamber');
    assert.strictEqual(token.mapId, 'map_active_1');
    assert.strictEqual(token.x, 900);
    assert.strictEqual(token.y, 500);
    assert.strictEqual(token.isProp, true);
    assert.strictEqual(token.layer, 'map'); // placed on map layer underneath tokens
    assert.strictEqual(token.propWidth, 8);
    assert.strictEqual(token.propHeight, 8);
    assert.strictEqual(token.fillColor, '#1e293b');
  });
});
