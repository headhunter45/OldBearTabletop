import { GameMap, SubmapConfig, SubmapType } from '@oldbear/shared';

export const SUBMAP_TYPE_DEFAULTS: Record<
  SubmapType,
  {
    name: string;
    bgColor: string;
    borderColor: string;
    colorCode?: string;
    dashed: boolean;
    defaultWidth: number;
    defaultHeight: number;
  }
> = {
  building_floor: {
    name: 'Upper Floor',
    bgColor: '#1e293b',
    borderColor: '#38bdf8',
    dashed: false,
    defaultWidth: 1000,
    defaultHeight: 1000,
  },
  connected_dungeon: {
    name: 'Connected Dungeon / Cave',
    bgColor: '#172554',
    borderColor: '#60a5fa',
    dashed: false,
    defaultWidth: 1200,
    defaultHeight: 900,
  },
  deployment_zone: {
    name: 'Deployment Zone',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#ef4444',
    colorCode: '#ef4444',
    dashed: true,
    defaultWidth: 1200,
    defaultHeight: 300,
  },
  casualty_tray: {
    name: 'Casualty Tray / Graveyard',
    bgColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: '#dc2626',
    colorCode: '#dc2626',
    dashed: true,
    defaultWidth: 1000,
    defaultHeight: 300,
  },
  staging_area: {
    name: 'Staging Area (Reserves / Embarked)',
    bgColor: 'rgba(30, 27, 75, 0.9)',
    borderColor: '#818cf8',
    colorCode: '#818cf8',
    dashed: true,
    defaultWidth: 1000,
    defaultHeight: 300,
  },
  custom: {
    name: 'Secondary Logical Area',
    bgColor: '#1f2937',
    borderColor: '#10b981',
    dashed: false,
    defaultWidth: 800,
    defaultHeight: 800,
  },
};

/**
 * Checks if a world coordinate point is enclosed within a submap's bounds.
 */
export function isPointInSubmap(submap: SubmapConfig, worldX: number, worldY: number): boolean {
  return (
    worldX >= submap.x &&
    worldX <= submap.x + submap.width &&
    worldY >= submap.y &&
    worldY <= submap.y + submap.height
  );
}

/**
 * Finds the topmost submap enclosing the specified world coordinate.
 */
export function findSubmapAt(map: GameMap, worldX: number, worldY: number): SubmapConfig | null {
  if (!map.submaps || map.submaps.length === 0) return null;
  // Search in reverse order to favor top-most submaps
  for (let i = map.submaps.length - 1; i >= 0; i--) {
    const sub = map.submaps[i];
    if (isPointInSubmap(sub, worldX, worldY)) {
      return sub;
    }
  }
  return null;
}

/**
 * Creates a preset SubmapConfig with smart offset placement relative to the parent map.
 */
export function createSubmapPreset(
  type: SubmapType,
  parentMap: GameMap,
  customName?: string,
  colorCode?: string
): SubmapConfig {
  const defaults = SUBMAP_TYPE_DEFAULTS[type] || SUBMAP_TYPE_DEFAULTS.custom;
  const existingCount = (parentMap.submaps || []).filter((s) => s.type === type).length;
  const id = `submap_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const name = customName || (existingCount > 0 ? `${defaults.name} ${existingCount + 1}` : defaults.name);

  const parentWidth = parentMap.width || 2000;
  const parentHeight = parentMap.height || 2000;
  const spacing = 80;

  let x = parentWidth + spacing;
  let y = 0;
  let width = defaults.defaultWidth;
  let height = defaults.defaultHeight;

  if (type === 'casualty_tray') {
    // Position below parent map
    x = 0;
    y = parentHeight + spacing;
    width = Math.min(parentWidth, 1200);
    height = 250;
  } else if (type === 'staging_area') {
    // Position above parent map
    x = 0;
    y = -(250 + spacing);
    width = Math.min(parentWidth, 1200);
    height = 250;
  } else if (type === 'deployment_zone') {
    // Inset or side banner
    x = 0;
    y = existingCount === 0 ? 0 : parentHeight - 250;
    width = parentWidth;
    height = 250;
  } else if (type === 'building_floor' || type === 'connected_dungeon') {
    // Position side-by-side
    const submapsOnSide = (parentMap.submaps || []).filter(
      (s) => s.x >= parentWidth
    );
    const totalHeightUsed = submapsOnSide.reduce((acc, s) => acc + s.height + spacing, 0);
    x = parentWidth + spacing;
    y = totalHeightUsed;
    width = Math.min(parentWidth, 1200);
    height = Math.min(parentHeight, 1000);
  }

  return {
    id,
    name,
    type,
    x,
    y,
    width,
    height,
    backgroundColor: defaults.bgColor,
    borderColor: colorCode || defaults.borderColor,
    colorCode: colorCode || defaults.colorCode,
    gridSize: parentMap.gridSize || 50,
    gridType: parentMap.gridType || 'square',
    showGrid: true,
    label: name,
  };
}

/**
 * Duplicates a scene as a Template, copying all secondary submaps, staging areas,
 * casualty trays, grid settings, and custom statuses while swapping the primary map.
 */
export function duplicateSceneAsTemplate(
  sourceScene: GameMap,
  newName: string,
  newImageUrl?: string
): GameMap {
  const clonedSubmaps: SubmapConfig[] = (sourceScene.submaps || []).map((sub) => ({
    ...sub,
    id: `submap_${sub.type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  }));

  return {
    ...sourceScene,
    id: `scene_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: newName || `${sourceScene.name} (Template Copy)`,
    imageUrl: newImageUrl || sourceScene.imageUrl,
    submaps: clonedSubmaps,
    isTemplate: true,
  };
}

/**
 * Renders an individual submap including its background, grid, border, and identification badge.
 */
export function renderSubmap(
  ctx: CanvasRenderingContext2D,
  submap: SubmapConfig,
  parentMap: GameMap,
  viewportScale: number,
  getCachedImage?: (url: string) => HTMLImageElement | null
) {
  ctx.save();

  // 1. Draw submap background image or fill
  let drewImage = false;
  if (submap.imageUrl && getCachedImage) {
    const img = getCachedImage(submap.imageUrl);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, submap.x, submap.y, submap.width, submap.height);
      drewImage = true;
    }
  }

  if (!drewImage) {
    ctx.fillStyle = submap.backgroundColor || '#1e293b';
    ctx.fillRect(submap.x, submap.y, submap.width, submap.height);
  }

  // 2. Render submap grid if enabled
  if (submap.showGrid !== false) {
    const gridSize = submap.gridSize || parentMap.gridSize || 50;
    if (gridSize > 0) {
      ctx.save();
      ctx.strokeStyle = parentMap.gridColor || 'rgba(255, 255, 255, 0.2)';
      ctx.globalAlpha = Math.min(parentMap.gridOpacity ?? 0.3, 0.4);
      ctx.lineWidth = Math.max(1 / viewportScale, 1);
      ctx.beginPath();

      // Vertical lines
      for (let x = submap.x; x <= submap.x + submap.width; x += gridSize) {
        ctx.moveTo(x, submap.y);
        ctx.lineTo(x, submap.y + submap.height);
      }
      // Horizontal lines
      for (let y = submap.y; y <= submap.y + submap.height; y += gridSize) {
        ctx.moveTo(submap.x, y);
        ctx.lineTo(submap.x + submap.width, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // 3. Render boundary outline (dashed for deployment / casualty / staging)
  const isDashed =
    submap.type === 'deployment_zone' ||
    submap.type === 'casualty_tray' ||
    submap.type === 'staging_area';

  ctx.strokeStyle = submap.borderColor || submap.colorCode || '#38bdf8';
  ctx.lineWidth = Math.max(2 / viewportScale, 2);
  if (isDashed) {
    ctx.setLineDash([10 / viewportScale, 6 / viewportScale]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.strokeRect(submap.x, submap.y, submap.width, submap.height);

  // 4. Render Identification Header Badge
  const labelText = submap.label || submap.name;
  if (labelText) {
    renderSubmapBadge(
      ctx,
      labelText,
      submap.x + 12,
      submap.y + 12,
      submap.colorCode || submap.borderColor || '#38bdf8',
      viewportScale
    );
  }

  ctx.restore();
}

function renderSubmapBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  viewportScale: number
) {
  ctx.save();
  const fontSize = Math.max(12, Math.round(13 / viewportScale));
  ctx.font = `700 ${fontSize}px Inter, sans-serif`;
  const metrics = ctx.measureText(text);
  const paddingX = Math.round(10 / viewportScale);
  const paddingY = Math.round(5 / viewportScale);
  const width = metrics.width + paddingX * 2 + Math.round(12 / viewportScale);
  const height = fontSize + paddingY * 2;

  // Background pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5 / viewportScale, 1.5);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, Math.round(5 / viewportScale));
  ctx.fill();
  ctx.stroke();

  // Indicator dot
  const dotRadius = Math.max(3.5 / viewportScale, 3);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + paddingX + dotRadius, y + height / 2, dotRadius, 0, Math.PI * 2);
  ctx.fill();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + paddingX + dotRadius * 2 + Math.round(6 / viewportScale), y + height / 2);

  ctx.restore();
}
