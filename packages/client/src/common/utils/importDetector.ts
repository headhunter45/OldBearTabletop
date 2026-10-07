import {DnDCharacter, GameMap, Token} from '@oldbear/shared';

import {BinderData, CARD_SCHEMA_ID, isBinderData, MonsterCard} from '../storage/BinderPipeline.js';

export const CONFIRMATION_SIZE_THRESHOLD_BYTES = 250 * 1024;  // 250 KB (OB-140)

export type ImportCategory =
    |'binder'|'backup'|'dndbeyond'|'pathbuilder'|'tetracube'|'card'|
    'multi-character'|'audio'|'image'|'generic-json'|'unknown';

export interface ImportContentsBreakdown {
  npcs: number;
  characters: number;
  maps: number;
  audio: number;
  props: number;
  total: number;
}

export interface ImportInspectionResult {
  category: ImportCategory;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  requiresConfirmation: boolean;
  title: string;
  summary: string;
  breakdown: ImportContentsBreakdown;
  parsedData?: any;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Checks if a parsed JSON object represents a standalone MonsterCard (OB-174,
 * docs/schema/card.json).
 */
export function isMonsterCard(data: unknown): data is MonsterCard {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, any>;
  if (candidate.$schema && candidate.$schema.includes('card.json')) {
    return true;
  }
  return Boolean(
      candidate.schemaVersion === 1 && candidate.name &&
      (candidate.strengthScore !== undefined ||
       candidate.hitDice !== undefined || Array.isArray(candidate.actions) ||
       Array.isArray(candidate.abilities)));
}

/**
 * Converts a MonsterCard into a battlemap Token and DnDCharacter.
 */
export function createTokenFromMonsterCard(
    card: MonsterCard, activeMapId: string, x: number, y: number): Token {
  const sizeRaw = (card.size || 'Medium').toLowerCase();
  let size = 1;
  if (sizeRaw.includes('tiny') || sizeRaw.includes('small') ||
      sizeRaw.includes('medium'))
    size = 1;
  else if (sizeRaw.includes('large'))
    size = 2;
  else if (sizeRaw.includes('huge'))
    size = 3;
  else if (sizeRaw.includes('gargantuan'))
    size = 4;

  const hitDice = card.hitDice || 4;
  const conMod = Math.floor(((card.constitutionScore || 10) - 10) / 2);
  const hp = Math.max(1, hitDice * 8 + conMod * hitDice);

  const character: DnDCharacter = {
    id: card.id || crypto.randomUUID(),
    name: card.name,
    classes:
        `${card.type || 'Monster'} ${card.subtype ? `(${card.subtype})` : ''}`
            .trim(),
    race: card.type || 'Creature',
    level: hitDice,
    stats: {
      str: card.strengthScore || 10,
      dex: card.dexterityScore || 10,
      con: card.constitutionScore || 10,
      int: card.intelligenceScore || 10,
      wis: card.wisdomScore || 10,
      cha: card.charismaScore || 10,
    },
    currentHp: hp,
    maxHp: hp,
    tempHp: 0,
    armorClass: 10 + Math.floor(((card.dexterityScore || 10) - 10) / 2),
    speed: card.walkSpeed || 30,
    proficiencyBonus: Math.floor((hitDice - 1) / 4) + 2,
    passivePerception: 10 + Math.floor(((card.wisdomScore || 10) - 10) / 2),
    initiativeBonus: Math.floor(((card.dexterityScore || 10) - 10) / 2),
    actions:
        (card.actions || []).map((a: any) => ({
                                   name: a.name || 'Action',
                                   type: 'melee',
                                   activationType: 'action',
                                   description: a.description || a.desc || '',
                                 })),
    spells: [],
    avatarUrl: card.imageUrl,
  };

  return {
    id: `token-${crypto.randomUUID()}`,
    name: card.name,
    mapId: activeMapId,
    x,
    y,
    size,
    rotation: 0,
    imageUrl: card.imageUrl || '',
    ringColor: '#ef4444',
    fillColor: '#7f1d1d',
    clipCircle: true,
    clipShape: 'circle',
    currentHp: hp,
    maxHp: hp,
    tempHp: 0,
    conditions: [],
    speed: card.walkSpeed || 30,
    elevation: 0,
    isProp: false,
    layer: 'token',
    character,
  };
}

/**
 * Inspects a dropped file and content, identifying format and breakdown
 * (OB-140).
 */
export function inspectImportFile(
    file: {name: string; size: number; type?: string},
    content: string): ImportInspectionResult {
  const fileName = file.name;
  const fileSize = file.size;
  const fileSizeFormatted = formatFileSize(fileSize);

  // Audio files
  if (file.type?.startsWith('audio/') ||
      fileName.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
    return {
      category: 'audio',
      fileName,
      fileSize,
      fileSizeFormatted,
      requiresConfirmation: false,
      title: 'Soundboard Audio',
      summary: `Audio file (${fileSizeFormatted})`,
      breakdown:
          {npcs: 0, characters: 0, maps: 0, audio: 1, props: 0, total: 1},
    };
  }

  // Image files
  if (file.type?.startsWith('image/') ||
      fileName.match(/\.(png|jpe?g|webp|gif|svg)$/i)) {
    return {
      category: 'image',
      fileName,
      fileSize,
      fileSizeFormatted,
      requiresConfirmation: false,
      title: 'Image Asset',
      summary: `Image file (${fileSizeFormatted})`,
      breakdown:
          {npcs: 0, characters: 0, maps: 1, audio: 0, props: 0, total: 1},
    };
  }

  // Attempt JSON parsing
  let json: any = null;
  try {
    json = JSON.parse(content);
  } catch {
    return {
      category: 'unknown',
      fileName,
      fileSize,
      fileSizeFormatted,
      requiresConfirmation: false,
      title: 'Unknown File',
      summary: `Unrecognized file format (${fileSizeFormatted})`,
      breakdown:
          {npcs: 0, characters: 0, maps: 0, audio: 0, props: 0, total: 0},
    };
  }

  // 1. .binder universal packages
  if (isBinderData(json) || fileName.toLowerCase().endsWith('.binder')) {
    let npcs = 0;
    let characters = 0;
    let maps = 0;
    let audio = 0;
    let props = 0;

    // Collections cards
    if (Array.isArray(json.collections)) {
      for (const col of json.collections) {
        if (Array.isArray(col.cards)) {
          for (const card of col.cards) {
            if (card.type === 'character')
              characters++;
            else
              npcs++;
          }
        }
      }
    }

    // Native _oldbear vtt module
    if (json._oldbear?.vtt) {
      const vtt = json._oldbear.vtt;
      if (Array.isArray(vtt.assets)) {
        for (const a of vtt.assets) {
          if (a.type === 'map')
            maps++;
          else if (a.type === 'audio')
            audio++;
          else if (a.type === 'prop')
            props++;
          else if (a.character)
            characters++;
          else
            npcs++;
        }
      }
      if (Array.isArray(vtt.characters)) {
        characters += vtt.characters.length;
      }
    }

    const total = npcs + characters + maps + audio + props;
    const isLarge = fileSize > CONFIRMATION_SIZE_THRESHOLD_BYTES || total > 1;

    return {
      category: 'binder',
      fileName,
      fileSize,
      fileSizeFormatted,
      requiresConfirmation: isLarge,
      title: 'Import Confirmation',
      summary: `Universal .binder package (${fileSizeFormatted})`,
      breakdown: {npcs, characters, maps, audio, props, total},
      parsedData: json,
    };
  }

  // 2. OldBear Backup Archive
  if (json.app === 'OldBearBattles' && Array.isArray(json.assets)) {
    let npcs = 0;
    let characters = 0;
    let maps = 0;
    let audio = 0;
    let props = 0;

    for (const a of json.assets) {
      if (a.type === 'map')
        maps++;
      else if (a.type === 'audio')
        audio++;
      else if (a.type === 'prop')
        props++;
      else if (a.character)
        characters++;
      else
        npcs++;
    }

    // Count characters in localStorage
    if (json.localStorage && typeof json.localStorage === 'object') {
      for (const [k, v] of Object.entries(json.localStorage)) {
        if (k.includes('character')) {
          try {
            const parsed = JSON.parse(v as string);
            if (Array.isArray(parsed)) characters += parsed.length;
          } catch {
          }
        }
      }
    }

    const total = npcs + characters + maps + audio + props;
    const isLarge = fileSize > CONFIRMATION_SIZE_THRESHOLD_BYTES || total > 1;

    return {
      category: 'backup',
      fileName,
      fileSize,
      fileSizeFormatted,
      requiresConfirmation: isLarge,
      title: 'Import Confirmation',
      summary: `OldBear Backup Archive (${fileSizeFormatted})`,
      breakdown: {npcs, characters, maps, audio, props, total},
      parsedData: json,
    };
  }

  // 3. Multi-character JSON
  if (Array.isArray(json) && json.length > 1 &&
      json.every(
          (item) => item && typeof item === 'object' &&
              (item.classes || item.stats || item.name))) {
    return {
      category: 'multi-character',
      fileName,
      fileSize,
      fileSizeFormatted,
      requiresConfirmation: true,
      title: 'Import Confirmation',
      summary: `Multi-character archive (${json.length} characters, ${
          fileSizeFormatted})`,
      breakdown: {
        npcs: 0,
        characters: json.length,
        maps: 0,
        audio: 0,
        props: 0,
        total: json.length
      },
      parsedData: json,
    };
  }

  // Check if file is large (>250KB) generic bundle
  const isLargeGeneral = fileSize > CONFIRMATION_SIZE_THRESHOLD_BYTES;

  // 4. TetraCube Monster JSON / .monster
  const isTetra = Boolean(
      fileName.toLowerCase().endsWith('.monster') ||
      (json &&
       (json.monsterName ||
        (json.name &&
         (json.hpText || json.challenge !== undefined ||
          json.strPoints !== undefined || json.hitDice !== undefined)))));
  if (isTetra) {
    return {
      category: 'tetracube',
      fileName,
      fileSize,
      fileSizeFormatted,
      requiresConfirmation: isLargeGeneral,
      title: isLargeGeneral ? 'Import Confirmation' : 'TetraCube Monster',
      summary: `TetraCube Monster (${fileSizeFormatted})`,
      breakdown:
          {npcs: 1, characters: 0, maps: 0, audio: 0, props: 0, total: 1},
      parsedData: json,
    };
  }

  // 5. Pathbuilder 2e JSON
  const isPathbuilder = Boolean(
      json && (json.build || (json.success && json.build)) &&
      (json.build?.name || json.name));
  if (isPathbuilder) {
    return {
      category: 'pathbuilder',
      fileName,
      fileSize,
      fileSizeFormatted,
      requiresConfirmation: isLargeGeneral,
      title: isLargeGeneral ? 'Import Confirmation' :
                              'Pathbuilder 2e Character',
      summary: `Pathbuilder 2e Character (${fileSizeFormatted})`,
      breakdown:
          {npcs: 0, characters: 1, maps: 0, audio: 0, props: 0, total: 1},
      parsedData: json,
    };
  }

  // 6. D&D Beyond Character
  const dndData = json.data && typeof json.data === 'object' ? json.data : json;
  const isDnDBeyond = Boolean(
      dndData && (dndData.name || dndData.id) &&
      (Array.isArray(dndData.classes) || Array.isArray(dndData.stats) ||
       (dndData.modifiers && typeof dndData.modifiers === 'object')));
  if (isDnDBeyond) {
    return {
      category: 'dndbeyond',
      fileName,
      fileSize,
      fileSizeFormatted,
      requiresConfirmation: isLargeGeneral,
      title: isLargeGeneral ? 'Import Confirmation' : 'D&D Beyond Character',
      summary: `D&D Beyond Character (${fileSizeFormatted})`,
      breakdown:
          {npcs: 0, characters: 1, maps: 0, audio: 0, props: 0, total: 1},
      parsedData: json,
    };
  }

  // 7. Single MonsterCard (.card or JSON)
  if (isMonsterCard(json)) {
    return {
      category: 'card',
      fileName,
      fileSize,
      fileSizeFormatted,
      requiresConfirmation: isLargeGeneral,
      title: isLargeGeneral ? 'Import Confirmation' : 'MonsterCard',
      summary: `MonsterCard (${fileSizeFormatted})`,
      breakdown:
          {npcs: 1, characters: 0, maps: 0, audio: 0, props: 0, total: 1},
      parsedData: json,
    };
  }

  // 8. Generic JSON
  return {
    category: 'generic-json',
    fileName,
    fileSize,
    fileSizeFormatted,
    requiresConfirmation: isLargeGeneral,
    title: isLargeGeneral ? 'Import Confirmation' : 'Generic JSON',
    summary: `Generic JSON file (${fileSizeFormatted})`,
    breakdown: {npcs: 0, characters: 0, maps: 0, audio: 0, props: 0, total: 1},
    parsedData: json,
  };
}
