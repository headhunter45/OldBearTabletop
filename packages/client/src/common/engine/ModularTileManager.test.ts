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
import { getTokenPivot, getTokenAABB, snapToGrid } from './GridRenderer.js';

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

  it('loads DEFAULT_MODULAR_TILES with image URLs and 1x1 sub-tile matrices', () => {
    assert.ok(DEFAULT_MODULAR_TILES.length >= 8, 'Expected default modular tiles to be loaded');
    for (const tile of DEFAULT_MODULAR_TILES) {
      assert.ok(tile.id, 'Tile must have an id');
      assert.ok(tile.name !== undefined, 'Tile must have a name defined');
      assert.ok(tile.imageUrl.startsWith('/tiles/'), `Tile ${tile.id} must have a public imageUrl`);
      assert.ok(tile.gridTilesX && tile.gridTilesX > 0, 'gridTilesX must be positive');
      assert.ok(tile.gridTilesY && tile.gridTilesY > 0, 'gridTilesY must be positive');
      assert.strictEqual(tile.width, tile.gridTilesX * 50);
      assert.strictEqual(tile.height, tile.gridTilesY * 50);
      assert.ok(Array.isArray(tile.tiles), `Tile ${tile.id} must have a 2D tiles matrix`);
      assert.strictEqual(tile.tiles!.length, tile.gridTilesY);
      assert.strictEqual(tile.tiles![0].length, tile.gridTilesX);
    }
  });

  it('calculates token pivot near the center based on even/odd grid dimension rules', () => {
    // 1. Odd x Odd (center full tile)
    const odd1x1 = getTokenPivot({ size: 1 }, 50);
    assert.strictEqual(odd1x1.pivotTileX, 0);
    assert.strictEqual(odd1x1.pivotTileY, 0);

    const odd3x3 = getTokenPivot({ size: 3 }, 50);
    assert.strictEqual(odd3x3.pivotTileX, 1);
    assert.strictEqual(odd3x3.pivotTileY, 1);

    // 2. Even x Even (upper left of the 4 center tiles)
    const even2x2 = getTokenPivot({ size: 2 }, 50);
    assert.strictEqual(even2x2.pivotTileX, 0);
    assert.strictEqual(even2x2.pivotTileY, 0);

    const even4x4 = getTokenPivot({ size: 4 }, 50);
    assert.strictEqual(even4x4.pivotTileX, 1);
    assert.strictEqual(even4x4.pivotTileY, 1);

    const even8x8 = getTokenPivot({ propWidth: 8, propHeight: 8, isProp: true, size: 8 }, 50);
    assert.strictEqual(even8x8.pivotTileX, 3);
    assert.strictEqual(even8x8.pivotTileY, 3);

    // 3. Even x Odd (left of the center 2 tiles horizontally)
    const evenOdd4x1 = getTokenPivot({ propWidth: 4, propHeight: 1, isProp: true, size: 4 }, 50);
    assert.strictEqual(evenOdd4x1.pivotTileX, 1);
    assert.strictEqual(evenOdd4x1.pivotTileY, 0);

    // 4. Odd x Even (top of the center 2 tiles vertically - e.g. 1x2 corridor)
    const oddEven1x2 = getTokenPivot({ propWidth: 1, propHeight: 2, isProp: true, size: 2 }, 50);
    assert.strictEqual(oddEven1x2.pivotTileX, 0);
    assert.strictEqual(oddEven1x2.pivotTileY, 0);
  });

  it('keeps 1x2 tile bounding box 100% aligned to grid when rotated at 0, 90, 180, and 270 degrees', () => {
    const tile1x2 = {
      x: 100,
      y: 200,
      propWidth: 1,
      propHeight: 2,
      isProp: true,
      size: 2,
      rotation: 0,
    };

    const aabb0 = getTokenAABB({ ...tile1x2, rotation: 0 }, 50);
    assert.strictEqual(aabb0.x % 50, 0);
    assert.strictEqual(aabb0.y % 50, 0);
    assert.strictEqual(aabb0.width, 50);
    assert.strictEqual(aabb0.height, 100);

    const aabb90 = getTokenAABB({ ...tile1x2, rotation: 90 }, 50);
    assert.strictEqual(aabb90.x % 50, 0);
    assert.strictEqual(aabb90.y % 50, 0);
    assert.strictEqual(aabb90.width, 100);
    assert.strictEqual(aabb90.height, 50);

    const aabb180 = getTokenAABB({ ...tile1x2, rotation: 180 }, 50);
    assert.strictEqual(aabb180.x % 50, 0);
    assert.strictEqual(aabb180.y % 50, 0);
    assert.strictEqual(aabb180.width, 50);
    assert.strictEqual(aabb180.height, 100);

    const aabb270 = getTokenAABB({ ...tile1x2, rotation: 270 }, 50);
    assert.strictEqual(aabb270.x % 50, 0);
    assert.strictEqual(aabb270.y % 50, 0);
    assert.strictEqual(aabb270.width, 100);
    assert.strictEqual(aabb270.height, 50);
  });

  it('snaps even-sized and modular tiles to exact grid lines without 25px half-tile error', () => {
    // 4x4 token placed near (102, 198)
    const snapped4x4 = snapToGrid(102, 198, 50, 4);
    assert.strictEqual(snapped4x4.x, 100);
    assert.strictEqual(snapped4x4.y, 200);

    // 8x8 tile placed near (305, 412)
    const snapped8x8 = snapToGrid(305, 412, 50, 8);
    assert.strictEqual(snapped8x8.x, 300);
    assert.strictEqual(snapped8x8.y, 400);
  });

  it('calculates proper duplication step offset for adjacent placement avoiding overlap', () => {
    // 1x1 token: steps by 1 grid cell (50px)
    const aabb1x1 = getTokenAABB({ x: 100, y: 100, size: 1 }, 50);
    assert.strictEqual(aabb1x1.width, 50);

    // 8x8 modular tile: steps by 8 grid cells (400px) horizontally
    const aabb8x8 = getTokenAABB({ x: 0, y: 0, propWidth: 8, propHeight: 8, isProp: true, size: 8 }, 50);
    assert.strictEqual(aabb8x8.width, 400);
    assert.strictEqual(aabb8x8.height, 400);

    // 1x2 rotated tile: steps by rotated width (100px) when rotated 90 degrees
    const aabb1x2Rotated = getTokenAABB(
      { x: 100, y: 200, propWidth: 1, propHeight: 2, isProp: true, size: 2, rotation: 90 },
      50
    );
    assert.strictEqual(aabb1x2Rotated.width, 100);
  });
});

