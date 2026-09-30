import {
  EntityStatBlock,
  EntityAction,
  parseActionCost,
  ActionCostType,
} from '@oldbear/shared';

// In-memory cache for fast retrieval and offline resilience
const memoryCache = new Map<string, EntityStatBlock>();

const FOUNDRY_PF2E_RAW_BASE =
  'https://raw.githubusercontent.com/foundryvtt/pf2e/master/packs';

/**
 * Normalizes any GitHub URL (blob, tree, or raw) into a direct raw.githubusercontent.com URL.
 */
export function normalizeFoundryUrl(url: string): string {
  let clean = url.trim().replace(/^["']|["']$/g, '');
  if (!clean) return '';

  // Convert github.com/.../blob/... to raw.githubusercontent.com/...
  if (clean.includes('github.com/')) {
    clean = clean
      .replace('github.com/', 'raw.githubusercontent.com/')
      .replace('/blob/', '/')
      .replace('/tree/', '/');
  }

  return clean;
}

/**
 * Strips HTML formatting and converts Foundry-specific UUID references into clean Markdown.
 */
export function formatPf2eDescription(rawText?: string): string {
  if (!rawText) return '';

  let text = rawText;

  // Replace @UUID[Compendium.pf2e.xxx.Item.Name]{Display Name} with **Display Name**
  text = text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, '**$1**');

  // Replace @UUID[Compendium.pf2e.xxx.Item.Effect: Name] with **Name**
  text = text.replace(/@UUID\[Compendium\.[^\]]*\.(?:Item|Effect|Action):?\s*([^\]]+)\]/g, '**$1**');
  text = text.replace(/@UUID\[[^\]]+\]/g, '');

  // Replace @Damage[...] or @Check[...] foundry rolls with inline text
  text = text.replace(/@(Damage|Check)\[([^\]]+)\]/g, '[$2]');

  // Replace HTML break/paragraph tags
  text = text
    .replace(/<hr\s*\/?>/gi, '\n\n---\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?p>/gi, '\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<li>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<[^>]+>/g, '');

  // Normalize excessive newlines and spaces
  return text
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Formats a trait slug or kebab-case name into Title Case (e.g. "versatile-p" -> "Versatile P")
 */
function formatTrait(trait: string): string {
  return trait
    .split('-')
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

/**
 * Extracts action cost from Foundry PF2e data.
 */
export function extractPf2eActionCost(system: any): ActionCostType | undefined {
  if (!system) return undefined;

  // 1. Spells: system.time.value (e.g. "1", "2", "3", "reaction", "free")
  if (system.time?.value) {
    const parsed = parseActionCost(String(system.time.value), 'pf2e');
    if (parsed) return parsed;
  }

  // 2. Actions & Feats: system.actions.value or system.actionType.value
  const actionsVal = system.actions?.value;
  if (actionsVal !== undefined && actionsVal !== null) {
    const parsed = parseActionCost(String(actionsVal), 'pf2e');
    if (parsed) return parsed;
  }

  const actionTypeVal = system.actionType?.value;
  if (actionTypeVal) {
    const parsed = parseActionCost(String(actionTypeVal), 'pf2e');
    if (parsed) return parsed;
  }

  return undefined;
}

/**
 * Parses raw Foundry PF2e compendium pack JSON into a system-agnostic EntityStatBlock.
 */
export function parseFoundryPF2eJson(data: any, sourceUrl?: string): EntityStatBlock {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid Foundry PF2e data: root object expected.');
  }

  const name: string = data.name || 'Unknown PF2e Entity';
  const system = data.system || {};
  const type: string = data.type || 'item';
  const description = formatPf2eDescription(system.description?.value);

  // Extract Traits & Rarity
  const rawTraits: string[] = Array.isArray(system.traits?.value) ? system.traits.value : [];
  const traits: string[] = [];

  // Rarity first if uncommon/rare/unique
  const rarity = system.traits?.rarity;
  if (rarity && rarity.toLowerCase() !== 'common') {
    traits.push(formatTrait(rarity));
  }

  // Add traits
  for (const t of rawTraits) {
    const formatted = formatTrait(t);
    if (!traits.includes(formatted)) {
      traits.push(formatted);
    }
  }

  // Action Cost
  const cost = extractPf2eActionCost(system);

  // Entity Level / Rank
  const level: number | undefined =
    typeof system.level?.value === 'number'
      ? system.level.value
      : typeof system.details?.level?.value === 'number'
      ? system.details.level.value
      : undefined;

  // Spell-specific fields
  if (type === 'spell') {
    const traditions = Array.isArray(system.traits?.traditions)
      ? system.traits.traditions.map(formatTrait).join(', ')
      : '';
    const subtitle = level === 0 ? `Cantrip (${traditions || 'Spell'})` : `Rank ${level ?? 1} Spell (${traditions || 'Spell'})`;

    let damageFormula: string | undefined;
    let damageType: string | undefined;
    if (system.damage && typeof system.damage === 'object') {
      const firstKey = Object.keys(system.damage)[0];
      if (firstKey && system.damage[firstKey]) {
        damageFormula = system.damage[firstKey].formula;
        damageType = system.damage[firstKey].type;
      }
    }

    const saveStat = system.defense?.save?.statistic || system.save?.statistic;
    const saveBasic = system.defense?.save?.basic ? 'Basic ' : '';
    const savingThrow = saveStat ? `${saveBasic}${formatTrait(saveStat)}` : undefined;

    return {
      id: data._id ? `pf2e-${data._id}` : `pf2e-${crypto.randomUUID()}`,
      name,
      type: 'spell',
      description,
      cost: cost || '2_actions', // Default spell casting in PF2e is 2 actions
      traits,
      range: system.range?.value || (system.area?.value ? `${system.area.value}ft ${system.area.type}` : undefined),
      target: system.target?.value || undefined,
      duration: system.duration?.value || undefined,
      savingThrow,
      damageFormula,
      damageType,
      level,
      subtitle,
      sourceUrl,
      sourceSystem: 'pf2e',
    };
  }

  // Weapon / Item / Equipment / Consumable
  if (['weapon', 'armor', 'equipment', 'consumable', 'treasure', 'backpack'].includes(type)) {
    let damageFormula: string | undefined;
    let damageType: string | undefined;

    if (type === 'weapon' && system.damage) {
      const dice = system.damage.dice ?? 1;
      const die = system.damage.die ?? 'd6';
      damageFormula = `${dice}${die}`;
      damageType = system.damage.damageType;
    }

    const categoryStr = system.category ? formatTrait(system.category) : '';
    const subtitle = [
      level !== undefined ? `Level ${level}` : null,
      categoryStr,
      formatTrait(type),
    ]
      .filter(Boolean)
      .join(' ');

    return {
      id: data._id ? `pf2e-${data._id}` : `pf2e-${crypto.randomUUID()}`,
      name,
      type: 'item',
      description,
      cost,
      traits,
      damageFormula,
      damageType,
      level,
      subtitle: subtitle || 'Equipment',
      sourceUrl,
      sourceSystem: 'pf2e',
    };
  }

  // Action or Feat
  if (type === 'action' || type === 'feat') {
    const category = system.actionCategory?.value ? formatTrait(system.actionCategory.value) : '';
    const subtitle = [
      level !== undefined ? `Level ${level}` : null,
      category,
      formatTrait(type),
    ]
      .filter(Boolean)
      .join(' ');

    return {
      id: data._id ? `pf2e-${data._id}` : `pf2e-${crypto.randomUUID()}`,
      name,
      type: type === 'feat' ? 'feat' : 'ability',
      description,
      cost,
      traits,
      level,
      subtitle: subtitle || formatTrait(type),
      sourceUrl,
      sourceSystem: 'pf2e',
    };
  }

  // Bestiary NPC / Creature
  if (type === 'npc') {
    const hpVal = system.attributes?.hp?.value ?? 20;
    const hpMax = system.attributes?.hp?.max ?? hpVal;
    const ac = system.attributes?.ac?.value ?? 15;
    const speed = system.attributes?.speed?.value ? `${system.attributes.speed.value} ft.` : '25 ft.';
    const alignment = system.details?.alignment?.value || '';
    const size = system.traits?.size?.value ? formatTrait(system.traits.size.value) : 'Medium';
    const subtitle = [size, alignment, `Creature ${level ?? 1}`].filter(Boolean).join(', ');

    // Convert ability modifiers to standard scores: score = 10 + (mod * 2)
    const stats = {
      str: 10 + (system.abilities?.str?.mod ?? 0) * 2,
      dex: 10 + (system.abilities?.dex?.mod ?? 0) * 2,
      con: 10 + (system.abilities?.con?.mod ?? 0) * 2,
      int: 10 + (system.abilities?.int?.mod ?? 0) * 2,
      wis: 10 + (system.abilities?.wis?.mod ?? 0) * 2,
      cha: 10 + (system.abilities?.cha?.mod ?? 0) * 2,
    };

    // Actions & Strikes
    const actions: EntityAction[] = [];
    const specialAbilities: EntityAction[] = [];

    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        const itemType = item.type;
        const itemSys = item.system || {};

        if (itemType === 'melee' || itemType === 'ranged') {
          let strikeDmg: string | undefined;
          let strikeDmgType: string | undefined;

          if (itemSys.damageRolls && typeof itemSys.damageRolls === 'object') {
            const firstRoll = Object.values(itemSys.damageRolls)[0] as any;
            if (firstRoll) {
              strikeDmg = firstRoll.damage;
              strikeDmgType = firstRoll.damageType;
            }
          }

          const bonus = itemSys.bonus?.value ?? 5;
          const strikeTraits = Array.isArray(itemSys.traits?.value)
            ? itemSys.traits.value.map(formatTrait)
            : [];

          actions.push({
            id: item._id ? `pf2e-act-${item._id}` : crypto.randomUUID(),
            name: `${item.name}${itemType === 'ranged' ? ' (Ranged)' : ''}`,
            type: 'attack',
            description: formatPf2eDescription(itemSys.description?.value),
            cost: '1_action',
            traits: strikeTraits,
            rollFormula: `1d20+${bonus}`,
            damageFormula: strikeDmg,
            damageType: strikeDmgType,
            sourceSystem: 'pf2e',
          });
        } else if (itemType === 'action') {
          const itemCost = extractPf2eActionCost(itemSys) || '1_action';
          specialAbilities.push({
            id: item._id ? `pf2e-act-${item._id}` : crypto.randomUUID(),
            name: item.name,
            type: 'ability',
            description: formatPf2eDescription(itemSys.description?.value),
            cost: itemCost,
            traits: Array.isArray(itemSys.traits?.value) ? itemSys.traits.value.map(formatTrait) : [],
            sourceSystem: 'pf2e',
          });
        }
      }
    }

    return {
      id: data._id ? `pf2e-${data._id}` : `pf2e-${crypto.randomUUID()}`,
      name,
      type: 'monster',
      description: description || subtitle,
      subtitle,
      armorClass: ac,
      hp: `${hpVal}/${hpMax}`,
      speed,
      challenge: level !== undefined ? `Level ${level}` : undefined,
      stats,
      traits,
      actions,
      specialAbilities,
      sourceUrl,
      sourceSystem: 'pf2e',
    };
  }

  // Fallback for general or unknown PF2e entity
  return {
    id: data._id ? `pf2e-${data._id}` : `pf2e-${crypto.randomUUID()}`,
    name,
    type: 'item',
    description,
    cost,
    traits,
    level,
    subtitle: formatTrait(type),
    sourceUrl,
    sourceSystem: 'pf2e',
  };
}

/**
 * Fetches and parses a Foundry PF2e pack JSON from a direct or GitHub URL.
 */
export async function fetchPF2eFromUrl(rawUrl: string): Promise<EntityStatBlock | null> {
  const directUrl = normalizeFoundryUrl(rawUrl);
  if (!directUrl) return null;

  const cacheKey = `url:${directUrl}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(`oldbear_pf2e_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored) as EntityStatBlock;
        memoryCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignore storage issues
  }

  try {
    const res = await fetch(directUrl);
    if (!res.ok) {
      console.warn(`[PF2e] Failed to fetch URL ${directUrl}: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const statBlock = parseFoundryPF2eJson(data, directUrl);

    memoryCache.set(cacheKey, statBlock);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`oldbear_pf2e_${cacheKey}`, JSON.stringify(statBlock));
      }
    } catch {
      // Ignore storage errors
    }

    return statBlock;
  } catch (err) {
    console.warn(`[PF2e] Error fetching or parsing ${directUrl}:`, err);
    return null;
  }
}

/**
 * Universal PF2e reference lookup dispatcher: fetches either via URL or searches pack items.
 */
export async function fetchPF2eReference(
  category: 'spell' | 'item' | 'monster' | 'action' | 'feat',
  query: string
): Promise<EntityStatBlock | null> {
  const clean = query.trim();
  if (!clean) return null;

  // 1. If it's already a URL, fetch directly
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return fetchPF2eFromUrl(clean);
  }

  const slug = clean
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const cacheKey = `${category}:${slug}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // 2. Attempt fetching from standard Foundry PF2e pack directory
  const packPaths: string[] = [];

  switch (category) {
    case 'spell':
      packPaths.push(
        `${FOUNDRY_PF2E_RAW_BASE}/spells/cantrips/${slug}.json`,
        `${FOUNDRY_PF2E_RAW_BASE}/spells/1st-rank/${slug}.json`,
        `${FOUNDRY_PF2E_RAW_BASE}/spells/2nd-rank/${slug}.json`,
        `${FOUNDRY_PF2E_RAW_BASE}/spells/3rd-rank/${slug}.json`,
        `${FOUNDRY_PF2E_RAW_BASE}/spells/4th-rank/${slug}.json`,
        `${FOUNDRY_PF2E_RAW_BASE}/spells/5th-rank/${slug}.json`,
        `${FOUNDRY_PF2E_RAW_BASE}/spells/${slug}.json`
      );
      break;
    case 'item':
      packPaths.push(
        `${FOUNDRY_PF2E_RAW_BASE}/equipment/${slug}.json`,
        `${FOUNDRY_PF2E_RAW_BASE}/equipment-srd/${slug}.json`
      );
      break;
    case 'action':
      packPaths.push(
        `${FOUNDRY_PF2E_RAW_BASE}/actions/${slug}.json`
      );
      break;
    case 'feat':
      packPaths.push(
        `${FOUNDRY_PF2E_RAW_BASE}/feats/${slug}.json`
      );
      break;
    case 'monster':
      packPaths.push(
        `${FOUNDRY_PF2E_RAW_BASE}/pathfinder-bestiary/${slug}.json`,
        `${FOUNDRY_PF2E_RAW_BASE}/menace-under-otari-bestiary/${slug}.json`,
        `${FOUNDRY_PF2E_RAW_BASE}/lost-omens-bestiary/${slug}.json`
      );
      break;
  }

  for (const url of packPaths) {
    const block = await fetchPF2eFromUrl(url);
    if (block) {
      memoryCache.set(cacheKey, block);
      return block;
    }
  }

  return null;
}
