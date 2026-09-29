import { DnDCharacter, DnDSpell, CharacterSkill, DnDAction, DnDItem, Token } from '@oldbear/shared';

export interface PathbuilderExport {
  success?: boolean;
  build: PathbuilderBuild;
}

export interface PathbuilderBuild {
  name: string;
  class: string;
  dualClass?: string | null;
  level: number;
  ancestry?: string;
  heritage?: string;
  background?: string;
  alignment?: string;
  gender?: string;
  age?: string;
  deity?: string;
  size?: number; // 1=Tiny, 2=Small/Medium, 3=Large, etc.
  keyability?: string;
  languages?: string[];
  attributes?: {
    ancestryhp?: number;
    classhp?: number;
    bonushp?: number;
    bonushpPerLevel?: number;
    speed?: number;
    speedBonus?: number;
  };
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    breakdown?: Record<string, any>;
  };
  proficiencies?: {
    classDC?: number;
    perception?: number;
    fortitude?: number;
    reflex?: number;
    will?: number;
    heavy?: number;
    medium?: number;
    light?: number;
    unarmored?: number;
    martial?: number;
    simple?: number;
    advanced?: number;
    unarmed?: number;
    castingArcane?: number;
    castingDivine?: number;
    castingOccult?: number;
    castingPrimal?: number;
    acrobatics?: number;
    arcana?: number;
    athletics?: number;
    crafting?: number;
    deception?: number;
    diplomacy?: number;
    intimidation?: number;
    medicine?: number;
    nature?: number;
    occultism?: number;
    performance?: number;
    religion?: number;
    society?: number;
    stealth?: number;
    survival?: number;
    thievery?: number;
    [key: string]: number | undefined;
  };
  mods?: Record<string, any>;
  feats?: Array<[string, string | null, string, number]>;
  specials?: string[];
  lores?: Array<[string, number]>;
  equipment?: Array<[string, number]>;
  weapons?: any[];
  armor?: any[];
  spellCasters?: Array<{
    name: string;
    magicTradition?: string;
    spellcastingType?: string;
    ability?: string;
    spells: Array<{
      spellLevel: number;
      list: string[];
    }>;
  }>;
  focus?: any;
  formula?: any[];
  pets?: any[];
}

export const PF2E_CORE_SKILLS: Array<{
  name: string;
  key: string;
  stat: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
}> = [
  { name: 'Acrobatics', key: 'acrobatics', stat: 'dex' },
  { name: 'Arcana', key: 'arcana', stat: 'int' },
  { name: 'Athletics', key: 'athletics', stat: 'str' },
  { name: 'Crafting', key: 'crafting', stat: 'int' },
  { name: 'Deception', key: 'deception', stat: 'cha' },
  { name: 'Diplomacy', key: 'diplomacy', stat: 'cha' },
  { name: 'Intimidation', key: 'intimidation', stat: 'cha' },
  { name: 'Medicine', key: 'medicine', stat: 'wis' },
  { name: 'Nature', key: 'nature', stat: 'wis' },
  { name: 'Occultism', key: 'occultism', stat: 'int' },
  { name: 'Performance', key: 'performance', stat: 'cha' },
  { name: 'Religion', key: 'religion', stat: 'wis' },
  { name: 'Society', key: 'society', stat: 'int' },
  { name: 'Stealth', key: 'stealth', stat: 'dex' },
  { name: 'Survival', key: 'survival', stat: 'wis' },
  { name: 'Thievery', key: 'thievery', stat: 'dex' },
];

/**
 * Validates whether a given JSON string or parsed object is a Pathbuilder 2e character export.
 */
export function isPathbuilderExport(data: any): boolean {
  if (!data) return false;
  let obj = data;
  if (typeof data === 'string') {
    try {
      obj = JSON.parse(data);
    } catch {
      return false;
    }
  }

  const build = obj?.build || (obj?.success === true && obj?.build);
  if (!build || typeof build !== 'object') return false;

  return (
    typeof build.name === 'string' &&
    typeof build.class === 'string' &&
    typeof build.level === 'number' &&
    typeof build.abilities === 'object' &&
    typeof build.abilities.str === 'number'
  );
}

/**
 * Calculates ability modifier from ability score (e.g. 18 -> +4, 10 -> 0, 8 -> -1).
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Calculates PF2e proficiency bonus based on rank and character level:
 * - 0 = Untrained: +0
 * - 2 = Trained: 2 + level
 * - 4 = Expert: 4 + level
 * - 6 = Master: 6 + level
 * - 8 = Legendary: 8 + level
 */
export function getProficiencyBonus(rank: number = 0, level: number = 1): number {
  return rank > 0 ? rank + level : 0;
}

/**
 * Parses a Pathbuilder 2e export object or JSON string into an OldBear standard DnDCharacter.
 */
export function parsePathbuilderExport(input: PathbuilderExport | string): DnDCharacter {
  const data: PathbuilderExport = typeof input === 'string' ? JSON.parse(input) : input;
  const build = data.build;

  const level = Number(build.level) || 1;
  const str = Number(build.abilities?.str) || 10;
  const dex = Number(build.abilities?.dex) || 10;
  const con = Number(build.abilities?.con) || 10;
  const int = Number(build.abilities?.int) || 10;
  const wis = Number(build.abilities?.wis) || 10;
  const cha = Number(build.abilities?.cha) || 10;

  const strMod = getAbilityModifier(str);
  const dexMod = getAbilityModifier(dex);
  const conMod = getAbilityModifier(con);
  const intMod = getAbilityModifier(int);
  const wisMod = getAbilityModifier(wis);
  const chaMod = getAbilityModifier(cha);

  const prof = build.proficiencies || {};

  // Saves
  const fortRank = prof.fortitude || 0;
  const refRank = prof.reflex || 0;
  const willRank = prof.will || 0;

  const fortSave = conMod + getProficiencyBonus(fortRank, level);
  const refSave = dexMod + getProficiencyBonus(refRank, level);
  const willSave = wisMod + getProficiencyBonus(willRank, level);

  // Perception
  const perceptionRank = prof.perception || 0;
  const perceptionBonus = wisMod + getProficiencyBonus(perceptionRank, level);
  const passivePerception = 10 + perceptionBonus;

  // Hit Points Calculation
  const ancestryHp = Number(build.attributes?.ancestryhp) || 8;
  const classHp = Number(build.attributes?.classhp) || 8;
  const bonusHpPerLevel = Number(build.attributes?.bonushpPerLevel) || 0;
  const bonusHp = Number(build.attributes?.bonushp) || 0;
  const maxHp = ancestryHp + (classHp + conMod + bonusHpPerLevel) * level + bonusHp;

  // Speed
  const speed = (Number(build.attributes?.speed) || 25) + (Number(build.attributes?.speedBonus) || 0);

  // Armor Class Calculation
  // In PF2e: 10 + dexMod (capped if heavy/medium armor item equipped) + proficiency bonus (trained = 2 + level)
  const maxArmorRank = Math.max(
    prof.heavy || 0,
    prof.medium || 0,
    prof.light || 0,
    prof.unarmored || 0
  );
  const armorProfBonus = getProficiencyBonus(maxArmorRank, level);
  // Base AC without item modifiers
  const armorClass = 10 + dexMod + armorProfBonus;

  // Skills
  const skills: CharacterSkill[] = [];
  const statMods = { str: strMod, dex: dexMod, con: conMod, int: intMod, wis: wisMod, cha: chaMod };

  for (const s of PF2E_CORE_SKILLS) {
    const rank = prof[s.key] || 0;
    const statMod = statMods[s.stat];
    const modifier = statMod + getProficiencyBonus(rank, level);
    const proficiency = rank >= 4 ? 'expertise' : rank >= 2 ? 'proficient' : 'none';
    skills.push({
      name: s.name,
      stat: s.stat,
      modifier,
      proficiency,
    });
  }

  // Lore skills from build.lores (tuples of [name, rank])
  if (Array.isArray(build.lores)) {
    for (const [loreName, loreRank] of build.lores) {
      if (!loreName) continue;
      const rank = Number(loreRank) || 0;
      const modifier = intMod + getProficiencyBonus(rank, level);
      const proficiency = rank >= 4 ? 'expertise' : rank >= 2 ? 'proficient' : 'none';
      skills.push({
        name: loreName,
        stat: 'int',
        modifier,
        proficiency,
      });
    }
  }

  // Spells
  const spells: DnDSpell[] = [];
  if (Array.isArray(build.spellCasters)) {
    for (const caster of build.spellCasters) {
      const tradition = caster.magicTradition || 'Spell';
      const casterName = caster.name || 'Spells';
      if (Array.isArray(caster.spells)) {
        for (const entry of caster.spells) {
          const spellLevel = Number(entry.spellLevel) || 0;
          if (Array.isArray(entry.list)) {
            for (const spellName of entry.list) {
              spells.push({
                id: `pf2e_spell_${spellName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${spellLevel}`,
                name: spellName,
                level: spellLevel,
                school: tradition,
                castingTime: '1 to 2 actions',
                range: '30 ft',
                duration: 'Instantaneous',
                description: `${casterName} (${tradition} ${caster.spellcastingType || ''})`,
                dndBeyondUrl: '',
              });
            }
          }
        }
      }
    }
  }

  // Actions & Strikes
  const actions: DnDAction[] = [];

  // Martial / Simple weapon strikes
  const meleeProfRank = Math.max(prof.martial || 0, prof.simple || 0, prof.unarmed || 0);
  const meleeAtkBonus = strMod + getProficiencyBonus(meleeProfRank, level);

  // Standard Unarmed Strike
  actions.push({
    name: 'Fist (Unarmed Strike)',
    type: 'action',
    description: `Melee Strike: +${meleeAtkBonus} to hit, 1d4${strMod >= 0 ? `+${strMod}` : strMod} bludgeoning (Agile, Finesse, Nonlethal, Unarmed)`,
  });

  // Add equipment weapons as strikes if present
  if (Array.isArray(build.equipment)) {
    for (const [eqName, _qty] of build.equipment) {
      const lower = eqName.toLowerCase();
      if (
        lower.includes('sword') ||
        lower.includes('axe') ||
        lower.includes('bow') ||
        lower.includes('dagger') ||
        lower.includes('hammer') ||
        lower.includes('spear') ||
        lower.includes('mace') ||
        lower.includes('shield')
      ) {
        actions.push({
          name: `${eqName} Strike`,
          type: 'action',
          description: `Strike with ${eqName}: +${meleeAtkBonus} to hit`,
        });
      }
    }
  }

  // Feats as actions / features
  if (Array.isArray(build.feats)) {
    for (const [featName, extra, type, featLevel] of build.feats) {
      actions.push({
        name: extra ? `${featName} (${extra})` : featName,
        type: 'action',
        description: `${type || 'Feat'} (Level ${featLevel})`,
      });
    }
  }

  // Specials (granted class features)
  if (Array.isArray(build.specials)) {
    for (const special of build.specials) {
      actions.push({
        name: special,
        type: 'special',
        description: 'PF2e Class / Ancestry Feature',
      });
    }
  }

  // Equipment Items
  const items: DnDItem[] = [];
  if (Array.isArray(build.equipment)) {
    for (const [name, quantity] of build.equipment) {
      items.push({
        name,
        quantity: Number(quantity) || 1,
        description: 'Pathbuilder 2e Equipment',
      });
    }
  }

  const race = [build.heritage, build.ancestry].filter(Boolean).join(' ') || 'Pathfinder 2e Character';
  const classes = build.dualClass ? `${build.class} / ${build.dualClass}` : build.class;
  const cleanId = `pf2e_${build.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

  return {
    id: cleanId,
    name: build.name || 'Pathfinder Adventurer',
    level,
    classes,
    race,
    currentHp: maxHp,
    maxHp,
    tempHp: 0,
    speed,
    armorClass,
    passivePerception,
    initiativeBonus: perceptionBonus,
    proficiencyBonus: getProficiencyBonus(2, level), // default trained baseline for reference
    savingThrows: {
      str: strMod,
      dex: refSave,
      con: fortSave,
      int: intMod,
      wis: willSave,
      cha: chaMod,
      proficiencies: [
        ...(fortRank > 0 ? ['Fortitude'] : []),
        ...(refRank > 0 ? ['Reflex'] : []),
        ...(willRank > 0 ? ['Will'] : []),
      ],
    },
    passives: {
      perception: passivePerception,
      investigation: 10 + intMod + getProficiencyBonus(prof.society || 0, level),
      insight: 10 + wisMod + getProficiencyBonus(prof.perception || 0, level),
    },
    stats: {
      str,
      dex,
      con,
      int,
      wis,
      cha,
    },
    skills,
    spells,
    actions,
    items,
  };
}

/**
 * Creates a ready-to-use battlemap Token configured from a PF2e character.
 */
export function createPathbuilderToken(
  char: DnDCharacter,
  mapId: string,
  x: number = 400,
  y: number = 400
): Token {
  return {
    id: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    mapId,
    name: char.name,
    imageUrl: char.avatarUrl || '',
    x,
    y,
    size: 1, // Standard medium grid unit
    rotation: 0,
    ringColor: '#6366f1',
    fillColor: '#1e1b4b',
    clipCircle: true,
    clipShape: 'circle',
    isPlayerToken: true,
    currentHp: char.currentHp,
    maxHp: char.maxHp,
    tempHp: char.tempHp || 0,
    speed: char.speed || 25,
    conditions: [],
    isProp: false,
    layer: 'token',
    initiativeBonus: char.initiativeBonus || 0,
    character: char,
  };
}

/**
 * Extracts numeric build ID from a Pathbuilder 2e URL or ID string.
 */
export function extractPathbuilderId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/json\.php\?id=(\d+)/i) || trimmed.match(/pathbuilder2e\.com\/.*?id=(\d+)/i);
  if (urlMatch) return urlMatch[1];
  if (/^\d+$/.test(trimmed)) return trimmed;
  return null;
}

/**
 * Fetches a character build from Pathbuilder 2e by ID or URL.
 * Attempts server-side proxy route first to avoid browser CORS restrictions,
 * with direct client-side fetch fallback.
 */
export async function fetchPathbuilderBuild(idOrUrl: string): Promise<PathbuilderExport> {
  const buildId = extractPathbuilderId(idOrUrl);
  if (!buildId) {
    throw new Error('Invalid Pathbuilder 2e ID or URL. Expected a numeric build ID or https://pathbuilder2e.com/json.php?id=<id>');
  }

  // Try proxy first
  try {
    const proxyRes = await fetch(`/api/pathbuilder/${encodeURIComponent(buildId)}`);
    if (proxyRes.ok) {
      const json = await proxyRes.json();
      if (json.success === false) {
        throw new Error(json.message || 'Build not found on Pathbuilder 2e');
      }
      return json;
    }
  } catch {
    // Proxy not available or failed, try direct fetch
  }

  // Direct fetch fallback
  const directRes = await fetch(`https://pathbuilder2e.com/json.php?id=${encodeURIComponent(buildId)}`);
  if (!directRes.ok) {
    throw new Error(`Failed to fetch build from Pathbuilder 2e (status: ${directRes.status})`);
  }
  const directJson = await directRes.json();
  if (directJson.success === false) {
    throw new Error(directJson.message || 'Build not found on Pathbuilder 2e');
  }
  return directJson;
}

export const SAMPLE_PATHBUILDER_VALEROS: PathbuilderExport = {
  success: true,
  build: {
    name: 'Valeros',
    class: 'Fighter',
    dualClass: null,
    level: 5,
    ancestry: 'Human',
    heritage: 'Versatile Heritage',
    background: 'Guard',
    alignment: 'N',
    gender: 'Male',
    age: '28',
    deity: 'Gorum',
    size: 2,
    keyability: 'str',
    languages: ['Common', 'Orcish'],
    attributes: {
      ancestryhp: 8,
      classhp: 10,
      bonushp: 0,
      bonushpPerLevel: 0,
      speed: 25,
      speedBonus: 0,
    },
    abilities: {
      str: 18,
      dex: 14,
      con: 14,
      int: 10,
      wis: 12,
      cha: 10,
      breakdown: {},
    },
    proficiencies: {
      classDC: 2,
      perception: 4,
      fortitude: 4,
      reflex: 2,
      will: 2,
      heavy: 2,
      medium: 2,
      light: 2,
      unarmored: 2,
      martial: 4,
      simple: 4,
      advanced: 0,
      unarmed: 4,
      castingArcane: 0,
      castingDivine: 0,
      castingOccult: 0,
      castingPrimal: 0,
      acrobatics: 0,
      arcana: 0,
      athletics: 4,
      crafting: 0,
      deception: 0,
      diplomacy: 0,
      intimidation: 2,
      medicine: 0,
      nature: 0,
      occultism: 0,
      performance: 0,
      religion: 0,
      society: 0,
      stealth: 0,
      survival: 0,
      thievery: 0,
    },
    mods: {},
    feats: [
      ['Sudden Charge', null, 'Class Feat', 1],
      ['Toughness', null, 'General Feat', 3],
    ],
    specials: ['Attack of Opportunity', 'Shield Block'],
    lores: [['Warfare Lore', 2]],
    equipment: [
      ['Longsword', 1],
      ['Steel Shield', 1],
      ['Breastplate', 1],
    ],
    weapons: [],
    armor: [],
    spellCasters: [],
    focus: {},
    formula: [],
    pets: [],
  },
};

