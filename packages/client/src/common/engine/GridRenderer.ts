import { GameMap } from '@oldbear/shared';
import { Viewport } from './Viewport.js';

export interface TokenPivotInfo {
  pivotTileX: number;
  pivotTileY: number;
  pivotOffsetX: number;
  pivotOffsetY: number;
  pivotX: number;
  pivotY: number;
  propW: number;
  propH: number;
}

/**
 * Calculates the pivot grid cell and pivot center offset for any token or modular tile.
 *
 * Rules:
 * - If gridTilesX and gridTilesY are odd: picks the center full tile.
 * - If gridTilesX and gridTilesY are even: picks the upper-left of the 4 center tiles.
 * - If gridTilesX is even and gridTilesY is odd: picks the left of the center 2 tiles.
 * - If gridTilesX is odd and gridTilesY is even: picks the top of the center 2 tiles.
 *
 * This formula guarantees that rotating by multiples of 90 degrees around the pivot center
 * keeps every sub-tile of the token or modular tile 100% aligned to the grid cells.
 */
export function getTokenPivot(
  token: { propWidth?: number; propHeight?: number; size?: number; isProp?: boolean; x?: number; y?: number },
  gridSize: number
): TokenPivotInfo {
  const isProp = Boolean(token.isProp);
  const size = token.size ?? 1;
  const tilesW = isProp && token.propWidth !== undefined ? token.propWidth : size;
  const tilesH = isProp && token.propHeight !== undefined ? token.propHeight : size;
  const propW = tilesW * gridSize;
  const propH = tilesH * gridSize;

  const pivotTileX = Math.floor((Math.max(1, tilesW) - 1) / 2);
  const pivotTileY = Math.floor((Math.max(1, tilesH) - 1) / 2);
  const pivotOffsetX = (pivotTileX + 0.5) * gridSize;
  const pivotOffsetY = (pivotTileY + 0.5) * gridSize;
  const pivotX = (token.x ?? 0) + pivotOffsetX;
  const pivotY = (token.y ?? 0) + pivotOffsetY;

  return {
    pivotTileX,
    pivotTileY,
    pivotOffsetX,
    pivotOffsetY,
    pivotX,
    pivotY,
    propW,
    propH,
  };
}

/**
 * Computes axis-aligned bounding box (AABB) for a token or modular tile taking pivot and rotation into account.
 */
export function getTokenAABB(
  token: { propWidth?: number; propHeight?: number; size?: number; isProp?: boolean; x: number; y: number; rotation?: number },
  gridSize: number
): { x: number; y: number; width: number; height: number } {
  const { pivotOffsetX, pivotOffsetY, pivotX, pivotY, propW, propH } = getTokenPivot(token, gridSize);
  const rot = ((token.rotation || 0) % 360 + 360) % 360;

  if (rot === 0 || !token.isProp) {
    return { x: token.x, y: token.y, width: propW, height: propH };
  }

  const corners = [
    { x: -pivotOffsetX, y: -pivotOffsetY },
    { x: propW - pivotOffsetX, y: -pivotOffsetY },
    { x: -pivotOffsetX, y: propH - pivotOffsetY },
    { x: propW - pivotOffsetX, y: propH - pivotOffsetY },
  ];

  const rad = (rot * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const c of corners) {
    const rx = c.x * cos - c.y * sin;
    const ry = c.x * sin + c.y * cos;
    minX = Math.min(minX, rx);
    maxX = Math.max(maxX, rx);
    minY = Math.min(minY, ry);
    maxY = Math.max(maxY, ry);
  }

  return {
    x: Math.round(pivotX + minX),
    y: Math.round(pivotY + minY),
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY),
  };
}

export function snapToGrid(
  x: number,
  y: number,
  gridSize: number,
  tokenSize = 1,
  offsetX = 0,
  offsetY = 0,
  gridType: 'square' | 'hex' | 'none' = 'square'
): { x: number; y: number } {
  if (gridType === 'none' || gridSize <= 0) {
    return { x, y };
  }

  if (gridType === 'hex') {
    const hexRadius = gridSize / Math.sqrt(3);
    const hexHeight = gridSize;
    const horizDist = hexRadius * 1.5;
    const vertDist = hexHeight;

    const tokRadius = (tokenSize * gridSize) / 2;
    const centerX = x + tokRadius;
    const centerY = y + tokRadius;

    const baseCol = Math.round((centerX - offsetX) / horizDist);
    let bestCx = centerX;
    let bestCy = centerY;
    let minDiffSq = Infinity;

    for (let c = baseCol - 2; c <= baseCol + 2; c++) {
      const colOffset = Math.abs(c) % 2 === 1 ? hexHeight / 2 : 0;
      const baseRow = Math.round((centerY - offsetY - colOffset) / vertDist);
      for (let r = baseRow - 2; r <= baseRow + 2; r++) {
        const cx = c * horizDist + offsetX;
        const cy = r * vertDist + colOffset + offsetY;
        const diffSq = (centerX - cx) ** 2 + (centerY - cy) ** 2;
        if (diffSq < minDiffSq) {
          minDiffSq = diffSq;
          bestCx = cx;
          bestCy = cy;
        }
      }
    }

    return {
      x: Math.round(bestCx - tokRadius),
      y: Math.round(bestCy - tokRadius),
    };
  }

  const offX = ((offsetX % gridSize) + gridSize) % gridSize;
  const offY = ((offsetY % gridSize) + gridSize) % gridSize;
  const snappedX = Math.round((x - offX) / gridSize) * gridSize + offX;
  const snappedY = Math.round((y - offY) / gridSize) * gridSize + offY;
  return { x: snappedX, y: snappedY };
}

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  map: GameMap,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number
) {
  const gridType = map.gridType || 'square';
  if (map.showGrid === false || gridType === 'none' || map.gridSize <= 0) return;

  const { gridSize, gridColor, gridOpacity, width: mapWidth, height: mapHeight } = map;

  const offsetX = (((map.gridOffsetX || 0) % gridSize) + gridSize) % gridSize;
  const offsetY = (((map.gridOffsetY || 0) % gridSize) + gridSize) % gridSize;

  // Viewport bounds in world coordinates
  const topLeft = viewport.screenToWorld(0, 0);
  const bottomRight = viewport.screenToWorld(canvasWidth, canvasHeight);

  const startX = Math.max(0, Math.floor(topLeft.x / gridSize) * gridSize);
  const endX = Math.min(mapWidth, Math.ceil(bottomRight.x / gridSize) * gridSize);

  const startY = Math.max(0, Math.floor(topLeft.y / gridSize) * gridSize);
  const endY = Math.min(mapHeight, Math.ceil(bottomRight.y / gridSize) * gridSize);

  ctx.save();
  ctx.strokeStyle = gridColor || 'rgba(255, 255, 255, 0.4)';
  ctx.globalAlpha = gridOpacity ?? 0.4;
  ctx.lineWidth = Math.max(1 / viewport.scale, 1); // Maintain crisp 1px visible line

  ctx.beginPath();

  if (gridType === 'square') {
    // Vertical grid lines with offset
    const firstLineX = startX + (((offsetX - (startX % gridSize)) % gridSize) + gridSize) % gridSize;
    for (let x = firstLineX; x <= endX; x += gridSize) {
      ctx.moveTo(x, Math.max(0, startY));
      ctx.lineTo(x, Math.min(mapHeight, endY));
    }
    // Horizontal grid lines with offset
    const firstLineY = startY + (((offsetY - (startY % gridSize)) % gridSize) + gridSize) % gridSize;
    for (let y = firstLineY; y <= endY; y += gridSize) {
      ctx.moveTo(Math.max(0, startX), y);
      ctx.lineTo(Math.min(mapWidth, endX), y);
    }
  } else if (gridType === 'hex') {
    // Hexagonal grid
    const hexRadius = gridSize / Math.sqrt(3);
    const hexHeight = gridSize;
    const horizDist = hexRadius * 1.5;
    const vertDist = hexHeight;

    const minCol = Math.floor(startX / horizDist) - 1;
    const maxCol = Math.ceil(endX / horizDist) + 1;
    const minRow = Math.floor(startY / vertDist) - 1;
    const maxRow = Math.ceil(endY / vertDist) + 1;

    for (let col = minCol; col <= maxCol; col++) {
      const colOffset = Math.abs(col) % 2 === 1 ? hexHeight / 2 : 0;
      for (let row = minRow; row <= maxRow; row++) {
        const cx = col * horizDist + offsetX;
        const cy = row * vertDist + colOffset + offsetY;
        drawHexagon(ctx, cx, cy, hexRadius);
      }
    }
  }

  ctx.stroke();
  ctx.restore();
}

function drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
