import { GameSession } from '@oldbear/shared';
import { getDB, StoredAsset } from './db.js';

export const BINDER_SCHEMA_ID = 'https://schemas.ttrpgwith.me/v1/binder.json';
export const BINDER_JSON_SCHEMA = 'https://json-schema.org/draft/2020-12/schema';
export const BINDER_SCHEMA_VERSION = 1;
export const CARD_SCHEMA_ID = 'https://schemas.ttrpgwith.me/v1/card.json';

/**
 * Standard MonsterCard conforming to docs/schema/card.json (OB-174).
 */
export interface MonsterCard {
  $schema?: string;
  schemaVersion: number;
  id: string;
  name: string;
  size?: string;
  type?: string;
  subtype?: string;
  alignment?: string;
  strengthScore?: number;
  dexterityScore?: number;
  constitutionScore?: number;
  intelligenceScore?: number;
  wisdomScore?: number;
  charismaScore?: number;
  hitDice?: number;
  walkSpeed?: number;
  burrowSpeed?: number;
  climbSpeed?: number;
  flySpeed?: number;
  swimSpeed?: number;
  abilities?: Array<{ name: string; description: string; [key: string]: any }>;
  actions?: Array<{ name: string; description: string; [key: string]: any }>;
  reactions?: Array<{ name: string; description: string; [key: string]: any }>;
  legendaryActions?: Array<{ name: string; description: string; [key: string]: any }>;
  imageUrl?: string;
  [key: string]: any;
}

export type BinderCollectionCard = MonsterCard;

export interface BinderCollection {
  id?: string;
  name: string;
  description?: string;
  cards: MonsterCard[];
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
  rawBinder?: BinderData; // To preserve third-party collections/dashboard during round-trip
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
 * Maps a StoredAsset or creature data to a standard MonsterCard conforming to docs/schema/card.json (OB-174).
 */
export function mapAssetToCard(asset: StoredAsset, instanceId?: string): MonsterCard {
  const mData = asset.monsterData || {};
  const char = asset.character || {};

  // Size string mapping
  let sizeStr = mData.size || char.size;
  if (!sizeStr && typeof asset.size === 'number') {
    if (asset.size <= 0.5) sizeStr = 'Tiny';
    else if (asset.size <= 0.8) sizeStr = 'Small';
    else if (asset.size <= 1.2) sizeStr = 'Medium';
    else if (asset.size <= 2.2) sizeStr = 'Large';
    else if (asset.size <= 3.2) sizeStr = 'Huge';
    else sizeStr = 'Gargantuan';
  }

  // Speed
  const walkSpeed =
    typeof mData.speed === 'number'
      ? mData.speed
      : typeof asset.speed === 'number'
      ? asset.speed
      : typeof char.speed === 'number'
      ? char.speed
      : 30;

  // Abilities
  const rawAbilities = Array.isArray(mData.specialAbilities)
    ? mData.specialAbilities
    : Array.isArray(mData.abilities)
    ? mData.abilities
    : Array.isArray(char.abilities)
    ? char.abilities
    : [];

  const abilities = rawAbilities.map((a: any) => ({
    name: a.name || 'Ability',
    description: a.desc || a.description || '',
  }));

  // Actions
  const rawActions = Array.isArray(mData.actions)
    ? mData.actions
    : Array.isArray(char.actions)
    ? char.actions
    : [];

  const actions = rawActions.map((a: any) => ({
    name: a.name || 'Action',
    description: a.desc || a.description || '',
  }));

  // Reactions
  const rawReactions = Array.isArray(mData.reactions) ? mData.reactions : [];
  const reactions = rawReactions.map((r: any) => ({
    name: r.name || 'Reaction',
    description: r.desc || r.description || '',
  }));

  // Legendary actions
  const rawLegendary = Array.isArray(mData.legendaryActions) ? mData.legendaryActions : [];
  const legendaryActions = rawLegendary.map((l: any) => ({
    name: l.name || 'Legendary Action',
    description: l.desc || l.description || '',
  }));

  // Ability stats
  const stats = char.stats || {};
  const strengthScore = Number(mData.strPoints ?? mData.str ?? stats.str ?? 10);
  const dexterityScore = Number(mData.dexPoints ?? mData.dex ?? stats.dex ?? 10);
  const constitutionScore = Number(mData.conPoints ?? mData.con ?? stats.con ?? 10);
  const intelligenceScore = Number(mData.intPoints ?? mData.int ?? stats.int ?? 10);
  const wisdomScore = Number(mData.wisPoints ?? mData.wis ?? stats.wis ?? 10);
  const charismaScore = Number(mData.chaPoints ?? mData.cha ?? stats.cha ?? 10);

  // Hit dice
  let hitDice: number | undefined;
  if (typeof mData.hitDice === 'number') {
    hitDice = mData.hitDice;
  } else if (typeof mData.hit_dice === 'string') {
    const parsed = parseInt(mData.hit_dice, 10);
    if (!isNaN(parsed)) hitDice = parsed;
  } else if (typeof char.level === 'number') {
    hitDice = char.level;
  }

  const card: MonsterCard = {
    $schema: CARD_SCHEMA_ID,
    schemaVersion: 1,
    id: instanceId || asset.id || crypto.randomUUID(),
    name: asset.name,
    size: sizeStr || 'Medium',
    type: mData.type || (asset.monsterData ? 'monster' : asset.character ? 'character' : 'token'),
    subtype: mData.subtype || '',
    alignment: mData.alignment || char.alignment || 'any alignment',
    strengthScore,
    dexterityScore,
    constitutionScore,
    intelligenceScore,
    wisdomScore,
    charismaScore,
    hitDice,
    walkSpeed,
    burrowSpeed: mData.burrowSpeed ?? 0,
    climbSpeed: mData.climbSpeed ?? 0,
    flySpeed: mData.flySpeed ?? 0,
    swimSpeed: mData.swimSpeed ?? 0,
    abilities,
    actions,
    reactions,
    legendaryActions,
    imageUrl: asset.dataUrl || undefined,
  };

  return card;
}

/**
 * Constructs a fully compliant .binder document according to docs/schema/binder.json
 */
export async function createBinderPayload(
  options: BinderExportOptions = {}
): Promise<BinderData> {
  const { session = null, includeAssets = true, includeLocalStorage = true, brawlData, customCollections, rawBinder } = options;

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

  // Preserve third-party collections or user custom collections (OB-174)
  const collections: BinderCollection[] = [];
  if (rawBinder?.collections && Array.isArray(rawBinder.collections)) {
    collections.push(...rawBinder.collections);
  }
  if (customCollections) {
    collections.push(...customCollections);
  }

  // Convert saved assets/characters/monsters into standard MonsterCard objects conforming to docs/schema/card.json
  const cards: MonsterCard[] = [];
  for (const asset of assets) {
    if (asset.type === 'token' || asset.monsterData || asset.character) {
      // Each card instance gets a unique ID so monsters can be included multiple times in a collection
      cards.push(mapAssetToCard(asset, crypto.randomUUID()));
    }
  }

  if (cards.length > 0 && !collections.some((c) => c.name === 'Tokens & Creatures')) {
    collections.push({
      id: crypto.randomUUID(),
      name: 'Tokens & Creatures',
      description: 'Exported tokens and creatures from OldBear VTT',
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
    dashboard: rawBinder?.dashboard || [],
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
 * Note: Per OB-174, importing from collections or dashboard is disabled; OldBear imports exclusively
 * from the native _oldbear extension block while preserving third-party data in rawBinder.
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

  // 3. Fallback importing from collections / dashboard is disabled (OB-174).
  // OldBear imports exclusively from the native _oldbear extension block.

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
