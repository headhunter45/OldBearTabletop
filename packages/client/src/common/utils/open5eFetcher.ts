import { EntityStatBlock, EntityAction, parseActionCost } from '@oldbear/shared';

// In-memory cache for fast retrieval and offline resilience
const memoryCache = new Map<string, EntityStatBlock>();

const OPEN5E_API_BASE = 'https://api.open5e.com/v1';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Reads from in-memory cache or localStorage
 */
function getCached(cacheKey: string): EntityStatBlock | null {
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(`oldbear_open5e_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored) as EntityStatBlock;
        memoryCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors in test or sandbox environments
  }
  return null;
}

/**
 * Stores in memory cache and localStorage
 */
function setCache(cacheKey: string, block: EntityStatBlock): void {
  memoryCache.set(cacheKey, block);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`oldbear_open5e_${cacheKey}`, JSON.stringify(block));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Fetches a 5e spell by name, slug, or search query from Open5e API.
 */
export async function fetchOpen5eSpell(query: string): Promise<EntityStatBlock | null> {
  const clean = query.trim();
  if (!clean) return null;
  const slug = slugify(clean);
  const cacheKey = `spell:${slug}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // 1. Try direct slug fetch
    let res = await fetch(`${OPEN5E_API_BASE}/spells/${slug}/`);
    let data: any = null;

    if (res.ok) {
      data = await res.json();
    } else {
      // 2. Fall back to search query
      const searchRes = await fetch(`${OPEN5E_API_BASE}/spells/?search=${encodeURIComponent(clean)}&limit=5`);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          // Find best match (exact slug or exact name, or first)
          data =
            searchData.results.find(
              (s: any) =>
                s.slug === slug ||
                s.name.toLowerCase() === clean.toLowerCase()
            ) || searchData.results[0];
        }
      }
    }

    if (!data || !data.name) return null;

    const levelInt =
      typeof data.level_int === 'number'
        ? data.level_int
        : data.level === 'Cantrip'
        ? 0
        : parseInt(data.level, 10) || 0;

    const traits: string[] = [];
    if (data.school) traits.push(data.school);
    if (data.requires_concentration || data.concentration === 'yes') traits.push('Concentration');
    if (data.can_be_cast_as_ritual || data.ritual === 'yes') traits.push('Ritual');

    const desc = data.higher_level
      ? `${data.desc}\n\n**At Higher Levels:** ${data.higher_level}`
      : data.desc || '';

    const block: EntityStatBlock = {
      id: `open5e-spell-${data.slug || slug}`,
      name: data.name,
      type: 'spell',
      description: desc,
      cost: parseActionCost(data.casting_time, '5e') || 'action',
      traits,
      range: data.range,
      duration: data.duration,
      level: levelInt,
      school: data.school,
      castingTime: data.casting_time,
      subtitle: levelInt === 0 ? `Cantrip (${data.school || 'Magic'})` : `Level ${levelInt} (${data.school || 'Magic'})`,
      sourceUrl: `https://open5e.com/spells/${data.slug || slug}`,
      sourceSystem: '5e',
    };

    setCache(cacheKey, block);
    return block;
  } catch (err) {
    console.warn(`[Open5e] Failed to fetch spell "${query}":`, err);
    return null;
  }
}

/**
 * Fetches a 5e monster / creature statblock by name, slug, or search query from Open5e API.
 */
export async function fetchOpen5eMonster(query: string): Promise<EntityStatBlock | null> {
  const clean = query.trim();
  if (!clean) return null;
  const slug = slugify(clean);
  const cacheKey = `monster:${slug}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // 1. Try direct slug fetch
    let res = await fetch(`${OPEN5E_API_BASE}/monsters/${slug}/`);
    let data: any = null;

    if (res.ok) {
      data = await res.json();
    } else {
      // 2. Search monsters
      const searchRes = await fetch(`${OPEN5E_API_BASE}/monsters/?search=${encodeURIComponent(clean)}&limit=5`);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          data =
            searchData.results.find(
              (m: any) =>
                m.slug === slug ||
                m.name.toLowerCase() === clean.toLowerCase()
            ) || searchData.results[0];
        }
      }
    }

    if (!data || !data.name) return null;

    // Subtitle: e.g. "Small humanoid (goblinoid), neutral evil"
    const subParts: string[] = [];
    if (data.size) subParts.push(data.size);
    if (data.type) subParts.push(data.type);
    if (data.subtype) subParts.push(`(${data.subtype})`);
    const alignment = data.alignment ? `, ${data.alignment}` : '';
    const subtitle = `${subParts.join(' ')}${alignment}`.trim() || 'Creature';

    // Speed formatting
    let speedStr = '';
    if (data.speed && typeof data.speed === 'object') {
      speedStr = Object.entries(data.speed)
        .map(([k, v]) => (k === 'walk' ? `${v} ft.` : `${k} ${v} ft.`))
        .join(', ');
    } else if (data.speed) {
      speedStr = String(data.speed);
    }

    // Actions
    const actions: EntityAction[] = Array.isArray(data.actions)
      ? data.actions.map((act: any) => ({
          id: crypto.randomUUID(),
          name: act.name,
          type: 'attack',
          description: act.desc || '',
          cost: 'action',
          sourceSystem: '5e',
        }))
      : [];

    // Reactions
    const reactions: EntityAction[] = Array.isArray(data.reactions)
      ? data.reactions.map((act: any) => ({
          id: crypto.randomUUID(),
          name: act.name,
          type: 'ability',
          description: act.desc || '',
          cost: 'reaction',
          sourceSystem: '5e',
        }))
      : [];

    // Special abilities
    const specialAbilities: EntityAction[] = Array.isArray(data.special_abilities)
      ? data.special_abilities.map((act: any) => ({
          id: crypto.randomUUID(),
          name: act.name,
          type: 'ability',
          description: act.desc || '',
          sourceSystem: '5e',
        }))
      : [];

    const block: EntityStatBlock = {
      id: `open5e-monster-${data.slug || slug}`,
      name: data.name,
      type: 'monster',
      description: data.desc || subtitle,
      subtitle,
      armorClass: data.armor_class,
      hp: `${data.hit_points}${data.hit_dice ? ` (${data.hit_dice})` : ''}`,
      speed: speedStr || '30 ft.',
      challenge: data.challenge_rating ? `CR ${data.challenge_rating}` : undefined,
      stats: {
        str: data.strength || 10,
        dex: data.dexterity || 10,
        con: data.constitution || 10,
        int: data.intelligence || 10,
        wis: data.wisdom || 10,
        cha: data.charisma || 10,
      },
      actions,
      reactions,
      specialAbilities,
      sourceUrl: `https://open5e.com/monsters/${data.slug || slug}`,
      sourceSystem: '5e',
    };

    setCache(cacheKey, block);
    return block;
  } catch (err) {
    console.warn(`[Open5e] Failed to fetch monster "${query}":`, err);
    return null;
  }
}

/**
 * Fetches a 5e magic item or equipment by name, slug, or search query from Open5e API.
 */
export async function fetchOpen5eItem(query: string): Promise<EntityStatBlock | null> {
  const clean = query.trim();
  if (!clean) return null;
  const slug = slugify(clean);
  const cacheKey = `item:${slug}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // 1. Try magic items direct slug
    let res = await fetch(`${OPEN5E_API_BASE}/magicitems/${slug}/`);
    let data: any = null;

    if (res.ok) {
      data = await res.json();
    } else {
      // 2. Search magic items
      const searchRes = await fetch(`${OPEN5E_API_BASE}/magicitems/?search=${encodeURIComponent(clean)}&limit=5`);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          data =
            searchData.results.find(
              (i: any) =>
                i.slug === slug ||
                i.name.toLowerCase() === clean.toLowerCase()
            ) || searchData.results[0];
        }
      }

      // 3. If not found in magic items, try weapons
      if (!data) {
        const weaponRes = await fetch(`${OPEN5E_API_BASE}/weapons/?search=${encodeURIComponent(clean)}&limit=5`);
        if (weaponRes.ok) {
          const weaponData = await weaponRes.json();
          if (weaponData.results && weaponData.results.length > 0) {
            const w = weaponData.results[0];
            data = {
              slug: w.slug,
              name: w.name,
              type: 'Weapon',
              desc: `${w.category || ''} weapon. Damage: ${w.damage_dice} ${w.damage_type || ''}. Properties: ${Array.isArray(w.properties) ? w.properties.join(', ') : ''}`,
              rarity: 'Common',
            };
          }
        }
      }

      // 4. Try armor
      if (!data) {
        const armorRes = await fetch(`${OPEN5E_API_BASE}/armor/?search=${encodeURIComponent(clean)}&limit=5`);
        if (armorRes.ok) {
          const armorData = await armorRes.json();
          if (armorData.results && armorData.results.length > 0) {
            const a = armorData.results[0];
            data = {
              slug: a.slug,
              name: a.name,
              type: 'Armor',
              desc: `${a.category || ''} armor. AC: ${a.ac_string || a.armor_class}. Strength requirement: ${a.strength_requirement || 'None'}. Stealth: ${a.stealth_disadvantage ? 'Disadvantage' : 'Normal'}.`,
              rarity: 'Common',
            };
          }
        }
      }
    }

    if (!data || !data.name) return null;

    const traits: string[] = [];
    if (data.rarity && data.rarity !== 'varies') traits.push(data.rarity);
    if (data.requires_attunement) traits.push('Attunement');

    const subtitle = `${data.rarity ? `${data.rarity} ` : ''}${data.type || 'Item'}`.trim();

    const block: EntityStatBlock = {
      id: `open5e-item-${data.slug || slug}`,
      name: data.name,
      type: 'item',
      description: data.desc || '',
      traits,
      subtitle,
      sourceUrl: `https://open5e.com/magicitems/${data.slug || slug}`,
      sourceSystem: '5e',
    };

    setCache(cacheKey, block);
    return block;
  } catch (err) {
    console.warn(`[Open5e] Failed to fetch item "${query}":`, err);
    return null;
  }
}

/**
 * Universal reference lookup dispatcher by category and query.
 */
export async function fetchOpen5eReference(
  category: 'spell' | 'item' | 'monster' | 'attack' | 'ability',
  query: string
): Promise<EntityStatBlock | null> {
  switch (category) {
    case 'spell':
      return fetchOpen5eSpell(query);
    case 'item':
      return fetchOpen5eItem(query);
    case 'monster':
      return fetchOpen5eMonster(query);
    case 'attack':
      return fetchOpen5eItem(query);
    default:
      return null;
  }
}
