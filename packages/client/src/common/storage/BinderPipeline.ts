import { GameSession } from '@oldbear/shared';
import { getDB, StoredAsset } from './db.js';

export const BINDER_SCHEMA_ID = 'https://schemas.ttrpgwith.me/v1/binder.json';
export const BINDER_JSON_SCHEMA = 'https://json-schema.org/draft/2020-12/schema';
export const BINDER_SCHEMA_VERSION = 1;

export interface BinderCollectionCard {
  id?: string;
  name: string;
  type?: string;
  description?: string;
  imageUrl?: string;
  data?: any;
  [key: string]: any;
}

export interface BinderCollection {
  name: string;
  cards: BinderCollectionCard[];
  [key: string]: any;
}

export interface OldBearVttModuleData {
  session?: GameSession | null;
  assets?: StoredAsset[];
  characters?: any[];
  customStatuses?: any[];
  localStorage?: Record<string, string>;
  exportedAt?: number;
  [key: string]: any;
}

export interface OldBearBrawlModuleData {
  rosters?: any[];
  units?: any[];
  points?: number;
  coherencySettings?: any;
  battleRounds?: number;
  objectives?: any[];
  localStorage?: Record<string, string>;
  [key: string]: any;
}

export interface BinderData {
  $schema?: string;
  $id?: string;
  schemaVersion: number;
  collections?: BinderCollection[];
  dashboard?: any[];
  _oldbear?: {
    vtt?: OldBearVttModuleData;
    brawl?: OldBearBrawlModuleData;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface BinderExportOptions {
  session?: GameSession | null;
  includeAssets?: boolean;
  includeLocalStorage?: boolean;
  brawlData?: OldBearBrawlModuleData;
  customCollections?: BinderCollection[];
}

export interface BinderImportResult {
  schemaVersion: number;
  assetCount: number;
  charCount: number;
  session?: GameSession | null;
  brawlRosterCount: number;
  collectionsCount: number;
  rawBinder: BinderData;
}

/**
 * Validates whether an unknown object adheres to the .binder schema specifications.
 */
export function isBinderData(data: unknown): data is BinderData {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, any>;
  if (typeof candidate.schemaVersion !== 'number' || candidate.schemaVersion < 1) {
    return false;
  }
  // Must have either _oldbear, collections, or dashboard
  return Boolean(
    candidate._oldbear ||
    Array.isArray(candidate.collections) ||
    Array.isArray(candidate.dashboard)
  );
}

/**
 * Constructs a fully compliant .binder document according to docs/schema/binder.json
 */
export async function createBinderPayload(
  options: BinderExportOptions = {}
): Promise<BinderData> {
  const { session = null, includeAssets = true, includeLocalStorage = true, brawlData, customCollections } = options;

  let assets: StoredAsset[] = [];
  if (includeAssets) {
    try {
      const db = await getDB();
      assets = await db.getAll('assets');
    } catch (e) {
      console.warn('Could not read IndexedDB assets for .binder export:', e);
    }
  }

  const vttLocalStorage: Record<string, string> = {};
  const brawlLocalStorage: Record<string, string> = {};

  if (includeLocalStorage && typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key);
      if (val === null) continue;

      if (key.startsWith('obr_brawl') || key.startsWith('oldbear_brawl')) {
        brawlLocalStorage[key] = val;
      } else if (key.startsWith('oldbear_') || key.startsWith('obr_')) {
        vttLocalStorage[key] = val;
      }
    }
  }

  // Generate external app compatible collections (e.g. MonsterCards cards format)
  const collections: BinderCollection[] = customCollections ? [...customCollections] : [];

  // Convert saved characters/monsters into compatible cards so third-party card apps can read them
  const cards: BinderCollectionCard[] = [];
  for (const asset of assets) {
    if (asset.type === 'token' || asset.monsterData || asset.character) {
      cards.push({
        id: asset.id,
        name: asset.name,
        type: asset.monsterData ? 'monster' : asset.character ? 'character' : 'token',
        imageUrl: asset.dataUrl,
        data: asset.monsterData || asset.character || {},
      });
    }
  }
  if (cards.length > 0 && !collections.some((c) => c.name === 'Tokens & Creatures')) {
    collections.push({
      name: 'Tokens & Creatures',
      cards,
    });
  }

  const vttModule: OldBearVttModuleData = {
    session,
    assets,
    localStorage: vttLocalStorage,
    exportedAt: Date.now(),
  };

  const brawlModule: OldBearBrawlModuleData = brawlData || {
    localStorage: brawlLocalStorage,
  };

  const binderDoc: BinderData = {
    $schema: BINDER_JSON_SCHEMA,
    $id: BINDER_SCHEMA_ID,
    schemaVersion: BINDER_SCHEMA_VERSION,
    collections,
    dashboard: [],
    _oldbear: {
      vtt: vttModule,
      brawl: brawlModule,
    },
  };

  return binderDoc;
}

/**
 * Serializes and exports current state into a downloadable .binder file blob.
 */
export async function exportToBinderBlob(options: BinderExportOptions = {}): Promise<Blob> {
  const payload = await createBinderPayload(options);
  const json = JSON.stringify(payload, null, 2);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Triggers a client-side file save/download for a .binder file.
 * Uses window.showSaveFilePicker when available to allow native OS destination selection
 * and prevent Chromium/Brave unknown-extension "Keep" download warnings (OB-166).
 */
export async function downloadBinderFile(blob: Blob, customName?: string): Promise<boolean> {
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = customName || `oldbear-collection-${dateStr}.binder`;

  // Use File System Access API if supported (Brave, Chrome, Edge)
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Universal .binder Collection (*.binder)',
            accept: {
              'application/json': ['.binder', '.json'],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return false;
      }
      // Fall through to link click fallback
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Imports a .binder document, restoring VTT and Brawl modules while preserving third-party data.
 */
export async function importBinderData(jsonStringOrObject: string | object): Promise<BinderImportResult> {
  let binder: any;
  if (typeof jsonStringOrObject === 'string') {
    try {
      binder = JSON.parse(jsonStringOrObject);
    } catch (err: any) {
      throw new Error(`Failed to parse .binder file: ${err.message}`);
    }
  } else {
    binder = jsonStringOrObject;
  }

  if (!isBinderData(binder)) {
    throw new Error('Invalid .binder file: missing schemaVersion or standard binder properties.');
  }

  let assetCount = 0;
  let charCount = 0;
  let brawlRosterCount = 0;
  let restoredSession: GameSession | null = null;

  // 1. Process _oldbear.vtt module
  if (binder._oldbear?.vtt) {
    const vtt = binder._oldbear.vtt;

    // Restore assets into IndexedDB
    if (typeof indexedDB !== 'undefined' && Array.isArray(vtt.assets) && vtt.assets.length > 0) {
      try {
        const db = await getDB();
        const tx = db.transaction('assets', 'readwrite');
        for (const asset of vtt.assets) {
          if (asset && asset.id) {
            await tx.store.put(asset);
            assetCount++;
          }
        }
        await tx.done;
      } catch (e) {
        console.warn('Failed restoring IndexedDB assets from .binder:', e);
      }
    }

    // Restore localStorage entries
    if (vtt.localStorage && typeof vtt.localStorage === 'object' && typeof localStorage !== 'undefined') {
      for (const [key, value] of Object.entries(vtt.localStorage)) {
        try {
          localStorage.setItem(key, value as string);
          if (key.includes('character')) {
            const parsed = JSON.parse(value as string);
            if (Array.isArray(parsed)) charCount += parsed.length;
          }
        } catch (e) {
          console.warn(`Failed restoring localStorage key ${key} from .binder:`, e);
        }
      }
    }

    if (vtt.session) {
      restoredSession = vtt.session;
    }
  }

  // 2. Process _oldbear.brawl module
  if (binder._oldbear?.brawl) {
    const brawl = binder._oldbear.brawl;
    if (brawl.localStorage && typeof brawl.localStorage === 'object' && typeof localStorage !== 'undefined') {
      for (const [key, value] of Object.entries(brawl.localStorage)) {
        try {
          localStorage.setItem(key, value as string);
        } catch (e) {
          console.warn(`Failed restoring brawl key ${key}:`, e);
        }
      }
    }
    if (Array.isArray(brawl.rosters)) {
      brawlRosterCount = brawl.rosters.length;
    }
  }

  // 3. Fallback: If no _oldbear but collections exist (external app .binder file)
  if (!binder._oldbear && Array.isArray(binder.collections) && typeof indexedDB !== 'undefined') {
    // Check if there are cards we can convert into assets
    try {
      const db = await getDB();
      const tx = db.transaction('assets', 'readwrite');
      for (const col of binder.collections) {
        if (Array.isArray(col.cards)) {
          for (const card of col.cards) {
            if (card && card.name) {
              const asset: StoredAsset = {
                id: card.id || `binder-card-${crypto.randomUUID()}`,
                name: card.name,
                type: 'token',
                dataUrl: card.imageUrl || '',
                character: card.data,
                createdAt: Date.now(),
              };
              await tx.store.put(asset);
              assetCount++;
            }
          }
        }
      }
      await tx.done;
    } catch (e) {
      console.warn('Failed importing external cards into assets:', e);
    }
  }

  return {
    schemaVersion: binder.schemaVersion,
    assetCount,
    charCount,
    session: restoredSession,
    brawlRosterCount,
    collectionsCount: Array.isArray(binder.collections) ? binder.collections.length : 0,
    rawBinder: binder,
  };
}
