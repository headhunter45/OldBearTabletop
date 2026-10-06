import { Token } from '@oldbear/shared';

export interface TileSocketConfig {
  north?: boolean;
  south?: boolean;
  east?: boolean;
  west?: boolean;
}

export interface ModularMapTile {
  id: string;
  name: string;
  imageUrl: string;
  width: number; // in pixels
  height: number; // in pixels
  gridTilesX?: number; // e.g. 8 tiles wide
  gridTilesY?: number; // e.g. 8 tiles high
  category?: 'room' | 'corridor' | 'terrain' | 'hazard' | 'custom';
  sockets?: TileSocketConfig;
  backgroundColor?: string;
  tiles?: (string | null)[][];
}

export interface TileRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapResult {
  x: number;
  y: number;
  snapped: boolean;
  snappedEdge?: 'north' | 'south' | 'east' | 'west';
  targetTileId?: string;
}

/**
 * Magnetically snaps a moving tile or prop edge-to-edge against existing tiles on the canvas.
 * Checks North, South, East, and West boundaries within the magnetic snap threshold.
 */
export function snapTileEdgeToEdge(
  moving: { x: number; y: number; width: number; height: number },
  otherTiles: TileRect[],
  snapThreshold: number = 30,
): SnapResult {
  let bestX = moving.x;
  let bestY = moving.y;
  let minDistance = snapThreshold;
  let snapped = false;
  let snappedEdge: 'north' | 'south' | 'east' | 'west' | undefined;
  let targetTileId: string | undefined;

  for (const other of otherTiles) {
    // Overlap checks
    const overlapY = Math.max(
      0,
      Math.min(moving.y + moving.height, other.y + other.height) -
        Math.max(moving.y, other.y),
    );
    const overlapX = Math.max(
      0,
      Math.min(moving.x + moving.width, other.x + other.width) -
        Math.max(moving.x, other.x),
    );

    // 1. East edge of other (moving.left touches other.right)
    const distEast = Math.abs(moving.x - (other.x + other.width));
    if (
      distEast < minDistance &&
      (overlapY > 0 || Math.abs(moving.y - other.y) < snapThreshold)
    ) {
      minDistance = distEast;
      bestX = other.x + other.width;
      if (Math.abs(moving.y - other.y) < snapThreshold) {
        bestY = other.y;
      }
      snapped = true;
      snappedEdge = 'east';
      targetTileId = other.id;
    }

    // 2. West edge of other (moving.right touches other.left)
    const distWest = Math.abs(moving.x + moving.width - other.x);
    if (
      distWest < minDistance &&
      (overlapY > 0 || Math.abs(moving.y - other.y) < snapThreshold)
    ) {
      minDistance = distWest;
      bestX = other.x - moving.width;
      if (Math.abs(moving.y - other.y) < snapThreshold) {
        bestY = other.y;
      }
      snapped = true;
      snappedEdge = 'west';
      targetTileId = other.id;
    }

    // 3. South edge of other (moving.top touches other.bottom)
    const distSouth = Math.abs(moving.y - (other.y + other.height));
    if (
      distSouth < minDistance &&
      (overlapX > 0 || Math.abs(moving.x - other.x) < snapThreshold)
    ) {
      minDistance = distSouth;
      bestY = other.y + other.height;
      if (Math.abs(moving.x - other.x) < snapThreshold) {
        bestX = other.x;
      }
      snapped = true;
      snappedEdge = 'south';
      targetTileId = other.id;
    }

    // 4. North edge of other (moving.bottom touches other.top)
    const distNorth = Math.abs(moving.y + moving.height - other.y);
    if (
      distNorth < minDistance &&
      (overlapX > 0 || Math.abs(moving.x - other.x) < snapThreshold)
    ) {
      minDistance = distNorth;
      bestY = other.y - moving.height;
      if (Math.abs(moving.x - other.x) < snapThreshold) {
        bestX = other.x;
      }
      snapped = true;
      snappedEdge = 'north';
      targetTileId = other.id;
    }
  }

  return { x: bestX, y: bestY, snapped, snappedEdge, targetTileId };
}

export { DEFAULT_MODULAR_TILES } from './DefaultTiles';

/**
 * Draws a random tile from a Tile Bucket deck (card-deck style in-play procedural generation).
 */
export function drawRandomTile(deck: ModularMapTile[]): ModularMapTile | null {
  if (!deck || deck.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * deck.length);
  return deck[randomIndex];
}

/**
 * Converts a ModularMapTile into a ready-to-place map layer token/prop.
 */
export function createModularTileToken(
  tile: ModularMapTile,
  mapId: string,
  x: number = 0,
  y: number = 0,
  gridSize: number = 50,
): Token {
  const propWidth =
    tile.gridTilesX || Math.max(1, Math.round(tile.width / gridSize));
  const propHeight =
    tile.gridTilesY || Math.max(1, Math.round(tile.height / gridSize));

  return {
    id: `tile_tok_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    mapId,
    name: tile.name,
    imageUrl: tile.imageUrl || '',
    x,
    y,
    size: Math.max(propWidth, propHeight),
    propWidth,
    propHeight,
    rotation: 0,
    ringColor: '#38bdf8',
    fillColor: tile.backgroundColor || '#1e293b',
    clipCircle: false,
    clipShape: 'square',
    currentHp: 100,
    maxHp: 100,
    tempHp: 0,
    speed: 0,
    conditions: [],
    isProp: true,
    layer: 'map', // Map layer renders underneath all tokens and creature markers
    locked: false,
  };
}
