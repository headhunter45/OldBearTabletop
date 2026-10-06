import JSZip from 'jszip';
import { GameMap, SubmapConfig, Token } from '@oldbear/shared';
import { renderGrid } from '../engine/GridRenderer.js';
import { renderToken, getCachedImage, setCachedImage } from '../engine/TokenRenderer.js';
import { sortTokensByZIndex } from '../engine/PointerSystem.js';
import { Viewport } from '../engine/Viewport.js';
import { getAsset } from '../storage/db.js';

export function sanitizeFilename(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'scene'
  );
}

/**
 * Resolves an image URL or IndexedDB asset ID to a valid image source (data URL, HTTP URL, or blob URL).
 */
export async function resolveImageSource(urlOrId?: string): Promise<string | null> {
  if (!urlOrId) return null;
  const isDirectUrl =
    urlOrId.startsWith('data:') ||
    urlOrId.startsWith('http:') ||
    urlOrId.startsWith('https:') ||
    urlOrId.startsWith('blob:') ||
    urlOrId.startsWith('/');

  if (isDirectUrl) {
    return urlOrId;
  }

  try {
    const asset = await getAsset(urlOrId);
    if (asset?.dataUrl) {
      return asset.dataUrl;
    }
  } catch (err) {
    console.warn('[SceneExporter] Failed to load asset from database:', urlOrId, err);
  }

  return urlOrId;
}

/**
 * Preloads an image and registers it into TokenRenderer's imageCache so synchronous render calls succeed.
 */
export async function preloadAndCacheImage(urlOrId?: string): Promise<HTMLImageElement | null> {
  if (!urlOrId) return null;

  // Check if already in cache
  const cached = getCachedImage(urlOrId);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }

  const src = await resolveImageSource(urlOrId);
  if (!src) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setCachedImage(urlOrId, img);
      if (src !== urlOrId) {
        setCachedImage(src, img);
      }
      resolve(img);
    };
    img.onerror = () => {
      console.warn('[SceneExporter] Failed to preload image:', src.slice(0, 80));
      resolve(null);
    };
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to render canvas to PNG image blob.'));
      }
    }, 'image/png');
  });
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export interface ExportSceneOptions {
  map: GameMap;
  tokens?: Record<string, Token> | Token[];
  onProgress?: (message: string) => void;
}

/**
 * Exports a scene rendered at native resolution into a ZIP archive:
 * - Each grid cell is the tile size (gridSize) in pixels.
 * - Submaps use the submap resolution and are exported separately.
 * - Exports both with-gridlines and no-gridlines versions for the scene and all submaps.
 * - Renders all terrain and props (combining all modular map tiles into the single image).
 * - Excludes player/monster/character tokens and other token-like entities (rulers, lasers, markers, halos).
 * - Excludes Fog of War.
 * - Bundles all files into a ZIP archive named after scene and map names.
 */
export async function exportSceneToZip(options: ExportSceneOptions): Promise<void> {
  const { map, tokens = [], onProgress } = options;

  onProgress?.('Preparing scene assets...');

  // 1. Gather all tokens belonging to this map that are modular tiles, terrain, or props
  const allTokens: Token[] = Array.isArray(tokens) ? tokens : Object.values(tokens);
  const mapTokens = allTokens.filter((t) => t.mapId === map.id);

  const scenePropsAndTiles = mapTokens.filter(
    (t) => t.layer === 'map' || t.layer === 'prop' || Boolean(t.isProp)
  );

  // 2. Preload all necessary images (map background, submaps, props/tiles)
  const imageSourcesToPreload = new Set<string>();
  if (map.imageUrl) imageSourcesToPreload.add(map.imageUrl);

  if (Array.isArray(map.submaps)) {
    for (const sub of map.submaps) {
      if (sub.imageUrl) imageSourcesToPreload.add(sub.imageUrl);
    }
  }

  for (const item of scenePropsAndTiles) {
    if (item.imageUrl) imageSourcesToPreload.add(item.imageUrl);
  }

  onProgress?.(`Preloading ${imageSourcesToPreload.size} image asset(s)...`);
  await Promise.all(Array.from(imageSourcesToPreload).map((src) => preloadAndCacheImage(src)));

  const zip = new JSZip();

  // 3. Determine base file naming
  const sceneName = sanitizeFilename(map.name);
  const baseMapName = sanitizeFilename(map.baseMapName || map.name);
  const basePrefix = sceneName === baseMapName ? sceneName : `${sceneName}_${baseMapName}`;

  // 4. Render Main Map (Native Resolution: map.width x map.height)
  onProgress?.('Rendering main map (without grid)...');

  const mainCanvas = document.createElement('canvas');
  mainCanvas.width = map.width;
  mainCanvas.height = map.height;
  const mainCtx = mainCanvas.getContext('2d');
  if (!mainCtx) throw new Error('Could not get 2D canvas context for export.');

  // 4A. Draw Main Map Background
  const mapImg = getCachedImage(map.imageUrl);
  if (mapImg) {
    mainCtx.drawImage(mapImg, 0, 0, map.width, map.height);
  } else {
    mainCtx.fillStyle = map.backgroundColor || '#1e293b';
    mainCtx.fillRect(0, 0, map.width, map.height);
  }

  // 4B. Draw Modular Tiles & Props (sorted: tiles rank 0, props/terrain rank 1)
  const sortedTokens = sortTokensByZIndex(scenePropsAndTiles, []);
  for (const token of sortedTokens) {
    const isModularTile = token.layer === 'map';
    const exportToken: Token = {
      ...token,
      isProp: true,
      // Seamlessly combine modular map tiles without border stroke outlines
      ringColor: isModularTile ? 'transparent' : token.ringColor,
    };
    renderToken(mainCtx, exportToken, map.gridSize, false, false, false);
  }

  // 4C. Export Main Map Without Gridlines
  const mainNoGridBlob = await canvasToBlob(mainCanvas);
  const mainNoGridFilename = `${basePrefix}_terrain-props_no-gridlines.png`;
  zip.file(mainNoGridFilename, mainNoGridBlob);

  // 4D. Render Gridlines onto Main Map
  onProgress?.('Rendering main map (with gridlines)...');
  const mapWithGrid: GameMap = {
    ...map,
    showGrid: true,
    gridType: map.gridType || 'square',
    gridSize: map.gridSize || 50,
    gridColor: map.gridColor || 'rgba(255, 255, 255, 0.4)',
    gridOpacity: map.gridOpacity ?? 0.4,
  };
  renderGrid(mainCtx, mapWithGrid, new Viewport(0, 0, 1.0), map.width, map.height);

  const mainWithGridBlob = await canvasToBlob(mainCanvas);
  const mainWithGridFilename = `${basePrefix}_terrain-props_with-gridlines.png`;
  zip.file(mainWithGridFilename, mainWithGridBlob);

  // Free main canvas
  mainCanvas.width = 0;
  mainCanvas.height = 0;

  // 5. Render Each Submap Separately at Submap Native Resolution
  if (Array.isArray(map.submaps) && map.submaps.length > 0) {
    const usedSubmapFilenames = new Set<string>();

    for (let i = 0; i < map.submaps.length; i++) {
      const submap = map.submaps[i];
      const rawSubmapName = sanitizeFilename(submap.name || submap.label || submap.type || `submap_${i + 1}`);
      let submapSlug = rawSubmapName;
      if (usedSubmapFilenames.has(submapSlug)) {
        submapSlug = `${rawSubmapName}_${i + 1}`;
      }
      usedSubmapFilenames.add(submapSlug);

      onProgress?.(`Rendering submap "${submap.name || submapSlug}"...`);

      const subCanvas = document.createElement('canvas');
      subCanvas.width = submap.width;
      subCanvas.height = submap.height;
      const subCtx = subCanvas.getContext('2d');
      if (!subCtx) continue;

      // 5A. Draw Submap Background
      let drewSubmapImage = false;
      if (submap.imageUrl) {
        const subImg = getCachedImage(submap.imageUrl);
        if (subImg) {
          subCtx.drawImage(subImg, 0, 0, submap.width, submap.height);
          drewSubmapImage = true;
        }
      }
      if (!drewSubmapImage) {
        subCtx.fillStyle = submap.backgroundColor || map.backgroundColor || '#1e293b';
        subCtx.fillRect(0, 0, submap.width, submap.height);
      }

      // 5B. Draw Props/Tiles that overlap the submap (translated into submap space)
      const submapGridSize = submap.gridSize || map.gridSize || 50;
      for (const token of sortedTokens) {
        const tokW = (token.propWidth !== undefined ? token.propWidth : token.size) * (map.gridSize || 50);
        const tokH = (token.propHeight !== undefined ? token.propHeight : token.size) * (map.gridSize || 50);

        const overlapsSubmap =
          token.x + tokW > submap.x &&
          token.x < submap.x + submap.width &&
          token.y + tokH > submap.y &&
          token.y < submap.y + submap.height;

        if (overlapsSubmap) {
          const isModularTile = token.layer === 'map';
          const subToken: Token = {
            ...token,
            x: token.x - submap.x,
            y: token.y - submap.y,
            isProp: true,
            ringColor: isModularTile ? 'transparent' : token.ringColor,
          };
          renderToken(subCtx, subToken, submapGridSize, false, false, false);
        }
      }

      // 5C. Export Submap Without Gridlines
      const subNoGridBlob = await canvasToBlob(subCanvas);
      const subNoGridFilename = `${basePrefix}_submap-${submapSlug}_terrain-props_no-gridlines.png`;
      zip.file(subNoGridFilename, subNoGridBlob);

      // 5D. Render Gridlines onto Submap
      const submapAsMap: GameMap = {
        ...map,
        width: submap.width,
        height: submap.height,
        gridSize: submapGridSize,
        gridType: submap.gridType || map.gridType || 'square',
        showGrid: true,
        gridColor: map.gridColor || 'rgba(255, 255, 255, 0.4)',
        gridOpacity: map.gridOpacity ?? 0.4,
        gridOffsetX: 0,
        gridOffsetY: 0,
      };
      renderGrid(subCtx, submapAsMap, new Viewport(0, 0, 1.0), submap.width, submap.height);

      const subWithGridBlob = await canvasToBlob(subCanvas);
      const subWithGridFilename = `${basePrefix}_submap-${submapSlug}_terrain-props_with-gridlines.png`;
      zip.file(subWithGridFilename, subWithGridBlob);

      // Free submap canvas
      subCanvas.width = 0;
      subCanvas.height = 0;
    }
  }

  // 6. Generate and Download ZIP Archive
  onProgress?.('Generating ZIP archive...');
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipFilename = `${basePrefix}_native-resolution_export.zip`;
  triggerDownload(zipBlob, zipFilename);
  onProgress?.('Export complete!');
}
