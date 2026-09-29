import { DnDCharacter, CharacterSkill, DnDAction, DnDSpell, Token } from '@oldbear/shared';

const SKILL_DEFINITIONS: Array<{
  name: string;
  key: string;
  stat: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
}> = [
  { name: 'Acrobatics', key: 'acrobatics', stat: 'dex' },
  { name: 'Animal Handling', key: 'animal-handling', stat: 'wis' },
  { name: 'Arcana', key: 'arcana', stat: 'int' },
  { name: 'Athletics', key: 'athletics', stat: 'str' },
  { name: 'Deception', key: 'deception', stat: 'cha' },
  { name: 'History', key: 'history', stat: 'int' },
  { name: 'Insight', key: 'insight', stat: 'wis' },
  { name: 'Intimidation', key: 'intimidation', stat: 'cha' },
  { name: 'Investigation', key: 'investigation', stat: 'int' },
  { name: 'Medicine', key: 'medicine', stat: 'wis' },
  { name: 'Nature', key: 'nature', stat: 'int' },
  { name: 'Perception', key: 'perception', stat: 'wis' },
  { name: 'Performance', key: 'performance', stat: 'cha' },
  { name: 'Persuasion', key: 'persuasion', stat: 'cha' },
  { name: 'Religion', key: 'religion', stat: 'int' },
  { name: 'Sleight of Hand', key: 'sleight-of-hand', stat: 'dex' },
  { name: 'Stealth', key: 'stealth', stat: 'dex' },
  { name: 'Survival', key: 'survival', stat: 'wis' },
];

/**
 * Checks whether an unknown object or string is a D&D Beyond character export.
 */
export function isDnDBeyondExport(content: unknown): boolean {
  if (!content) return false;
  let data: any = content;
  if (typeof content === 'string') {
    try {
      data = JSON.parse(content);
    } catch {
      return false;
    }
  }
  if (!data || typeof data !== 'object') return false;

  // Wrapped format: { data: { classes: [...], stats: [...] } }
  if (data.data && typeof data.data === 'object') {
    data = data.data;
  }

  return Boolean(
    (data.name || data.id) &&
      (Array.isArray(data.classes) ||
        Array.isArray(data.stats) ||
        (data.modifiers && typeof data.modifiers === 'object'))
  );
}

/**
 * Client-side parser for pre-exported D&D Beyond character JSON (OB-140).
 */
export function parseDnDBeyondCharacter(rawJson: unknown): DnDCharacter {
  let root: any = rawJson;
  if (typeof rawJson === 'string') {
    root = JSON.parse(rawJson);
  }
  const data = root.data && typeof root.data === 'object' ? root.data : root;

  const characterId = String(data.id || root.id || crypto.randomUUID());
  const name = (data.name || root.name || 'Hero').trim();

  // 1. Modifiers
  const allMods: any[] = [];
  if (data.modifiers && typeof data.modifiers === 'object') {
    for (const group of Object.values(data.modifiers)) {
      if (Array.isArray(group)) {
        allMods.push(...group);
      }
    }
  }

  // Level & Proficiency Bonus
  const level =
    (data.classes || []).reduce((sum: number, c: any) => sum + (c.level || 0), 0) || 1;
  const proficiencyBonus = Math.floor((level - 1) / 4) + 2;

  // Stats (1: STR, 2: DEX, 3: CON, 4: INT, 5: WIS, 6: CHA)
  const statNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  const getStat = (id: number) => {
    const raw = (data.stats || []).find((s: any) => s.id === id)?.value || 10;
    const bonus = (data.bonusStats || []).find((s: any) => s.id === id)?.value || 0;
    const override = (data.overrideStats || []).find((s: any) => s.id === id)?.value;

    const statName = statNames[id - 1];
    let modBonus = 0;
    let modOverride: number | undefined = undefined;

    for (const mod of allMods) {
      const sub = String(mod.subType || '').toLowerCase();
      if (sub === `${statName}-score`) {
        if (mod.type === 'bonus' && typeof mod.value === 'number') {
          modBonus += mod.value;
        } else if (mod.type === 'set' && typeof mod.value === 'number') {
          modOverride = Math.max(modOverride ?? 0, mod.value);
        }
      }
    }

    if (override !== undefined && override !== null) return override;
    if (modOverride !== undefined) return Math.max(modOverride, raw + bonus + modBonus);
    return raw + bonus + modBonus;
  };

  const stats = {
    str: getStat(1),
    dex: getStat(2),
    con: getStat(3),
    int: getStat(4),
    wis: getStat(5),
    cha: getStat(6),
  };

  // HP
  const baseHp = Number(data.baseHitPoints || 10);
  const removedHp = Number(data.removedHitPoints || 0);
  const tempHp = Number(data.temporaryHitPoints || 0);
  const bonusHp = Number(data.bonusHitPoints || 0);

  const conMod = Math.floor((stats.con - 10) / 2);
  const totalMaxHp = Math.max(1, baseHp + bonusHp + conMod * level);
  const currentHp = Math.max(0, totalMaxHp - removedHp);

  // Classes & Race
  const classNames =
    (data.classes || [])
      .map((c: any) => `${c.definition?.name || 'Adventurer'} ${c.level || 1}`)
      .join(' / ') || 'Hero';
  const race = data.race?.fullName || 'Unknown';

  // Skills
  const skillProficiencies = new Map<string, 'none' | 'proficient' | 'expertise'>();
  for (const mod of allMods) {
    const sub = String(mod.subType || '').toLowerCase().replace(/_/g, '-');
    const type = String(mod.type || '').toLowerCase();
    for (const s of SKILL_DEFINITIONS) {
      if (sub === s.key || sub === s.name.toLowerCase() || sub.includes(s.key)) {
        if (type === 'expertise' || sub.includes('expertise')) {
          skillProficiencies.set(s.key, 'expertise');
        } else if (type === 'proficiency' && skillProficiencies.get(s.key) !== 'expertise') {
          skillProficiencies.set(s.key, 'proficient');
        }
      }
    }
  }

  const skills: CharacterSkill[] = SKILL_DEFINITIONS.map((s) => {
    const prof = skillProficiencies.get(s.key) || 'none';
    const abilityScore = stats[s.stat] || 10;
    const abilityMod = Math.floor((abilityScore - 10) / 2);
    let modifier = abilityMod;
    if (prof === 'proficient') {
      modifier += proficiencyBonus;
    } else if (prof === 'expertise') {
      modifier += proficiencyBonus * 2;
    }
    return {
      name: s.name,
      stat: s.stat,
      modifier,
      proficiency: prof,
    };
  });

  // Speed
  let speed = 30;
  if (data.weightSpeeds?.normal?.walk) {
    speed = data.weightSpeeds.normal.walk;
  } else if (data.race?.weightSpeeds?.normal?.walk) {
    speed = data.race.weightSpeeds.normal.walk;
  } else if (data.customSpeeds) {
    const walkCustom = data.customSpeeds.find((s: any) => s.movementId === 1);
    if (walkCustom) speed = walkCustom.distance;
  }

  // Spells
  const rawSpells = [
    ...(data.spells?.class || []),
    ...(data.spells?.race || []),
    ...(data.spells?.feat || []),
    ...(data.spells?.item || []),
  ];

  const spells: DnDSpell[] = [];
  const seenSpellNames = new Set<string>();

  for (const s of rawSpells) {
    const def = s.definition;
    if (!def || seenSpellNames.has(def.name)) continue;
    seenSpellNames.add(def.name);

    spells.push({
      id: String(def.id || def.name),
      name: def.name,
      level: def.level ?? 0,
      school: def.school || 'Evocation',
      castingTime: def.activation?.activationTime
        ? `${def.activation.activationTime} ${
            def.activation.activationType === 1
              ? 'Action'
              : def.activation.activationType === 3
              ? 'Bonus Action'
              : 'Reaction'
          }`
        : '1 Action',
      range: def.range?.rangeValue ? `${def.range.rangeValue} ft` : def.range?.origin || 'Self',
      duration: def.duration?.durationInterval
        ? `${def.duration.durationInterval} ${def.duration.durationUnit || 'minutes'}`
        : 'Instantaneous',
      description: (def.snippet || def.description || '').replace(/<[^>]*>/g, '').slice(0, 300) + '...',
      dndBeyondUrl: `https://www.dndbeyond.com/spells/${encodeURIComponent(
        def.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      )}`,
    });
  }

  // Actions
  const actions: DnDAction[] = [];
  const strMod = Math.floor((stats.str - 10) / 2);
  const dexMod = Math.floor((stats.dex - 10) / 2);

  const inventoryItems = data.inventory || [];
  const equippedWeapons = inventoryItems.filter(
    (item: any) =>
      item.definition?.filterType === 'Weapon' &&
      (item.equipped || item.definition?.name?.toLowerCase().includes('greataxe'))
  );

  const seenActionNames = new Set<string>();

  for (const item of equippedWeapons) {
    const def = item.definition;
    if (!def) continue;

    const rawName = def.name || 'Weapon';
    const cleanName = rawName.replace(/,\s*\+/g, ' +').trim();
    if (seenActionNames.has(cleanName)) continue;
    seenActionNames.add(cleanName);

    const isThrown = (def.properties || []).some((p: any) => p.name === 'Thrown');
    const isRanged = def.attackType === 2;
    let reach: string | undefined;
    let range: string | undefined;

    if (isRanged || isThrown || (def.range && def.range > 5)) {
      if (def.longRange && def.longRange > def.range) {
        range = `range ${def.range} ft. (${def.longRange} ft.)`;
      } else {
        range = `range ${def.range || 30} ft.`;
      }
    } else {
      reach = `${def.range || 5} ft. reach`;
    }

    const diceString =
      def.damage?.diceString ||
      (def.damage?.diceCount ? `${def.damage.diceCount}d${def.damage.diceValue}` : '1d6');

    const bonusFromTitleMatch = cleanName.match(/\+(\d+)/);
    const bonusFromTitle = bonusFromTitleMatch ? parseInt(bonusFromTitleMatch[1], 10) : 0;
    const magicBonus =
      bonusFromTitle ||
      def.grantedModifiers?.find(
        (m: any) => m.type === 'bonus' && (m.subType === 'magic' || m.subType === 'weapon-attacks')
      )?.value || 0;

    const isFinesse = (def.properties || []).some((p: any) => p.name === 'Finesse');
    const attackStatMod =
      isRanged && !isThrown
        ? isFinesse && strMod > dexMod
          ? strMod
          : dexMod
        : isFinesse && dexMod > strMod
        ? dexMod
        : strMod;

    const toHit = attackStatMod + proficiencyBonus + magicBonus;
    const totalDamageBonus = attackStatMod + magicBonus;
    const damageExpr =
      totalDamageBonus !== 0
        ? `${diceString}${totalDamageBonus > 0 ? `+${totalDamageBonus}` : totalDamageBonus}`
        : diceString;

    actions.push({
      name: cleanName,
      type: isRanged || isThrown ? 'ranged' : 'melee',
      activationType: 'action',
      reach,
      range,
      toHitModifier: toHit,
      damageDice: damageExpr,
      damage: `${damageExpr} damage`,
      description: def.description ? def.description.replace(/<[^>]*>/g, '').trim() : undefined,
    });
  }

  // Ensure Unarmed Strike
  if (!seenActionNames.has('Unarmed Strike')) {
    const unarmedDamage = 1 + strMod;
    actions.push({
      name: 'Unarmed Strike',
      type: 'melee',
      activationType: 'action',
      reach: '5ft. reach',
      toHitModifier: strMod + proficiencyBonus,
      damageDice: `${unarmedDamage}`,
      damage: `${unarmedDamage} damage`,
      description: 'Melee attack using punch, kick, or forceful blow.',
    });
    seenActionNames.add('Unarmed Strike');
  }

  // Add features / special actions
  const featureActions = [
    ...(data.actions?.race || []),
    ...(data.actions?.class || []),
    ...(data.actions?.feat || []),
    ...(data.actions?.bonus || []),
    ...(data.actions?.reaction || []),
    ...(data.actions?.action || []),
    ...(data.customActions || []),
  ];

  for (const act of featureActions) {
    if (!act || !act.name || seenActionNames.has(act.name)) continue;
    seenActionNames.add(act.name);

    const desc = (act.snippet || act.description || '').replace(/<[^>]*>/g, '').trim();
    const actTypeRaw = act.activation?.activationType;
    let activationType: 'action' | 'bonus' | 'reaction' = 'action';

    if (actTypeRaw === 3 || act.activationType === 'bonus' || /\bbonus action\b/i.test(desc) || /\bbonus action\b/i.test(act.name)) {
      activationType = 'bonus';
    } else if (actTypeRaw === 4 || act.activationType === 'reaction' || /\breaction\b/i.test(desc) || /\breaction\b/i.test(act.name)) {
      activationType = 'reaction';
    }

    actions.push({
      name: act.name,
      type: activationType,
      activationType,
      description: desc,
    });
  }

  // Saving Throws
  const statKeys: Array<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'> = [
    'str',
    'dex',
    'con',
    'int',
    'wis',
    'cha',
  ];
  const fullStatNames = {
    str: 'strength',
    dex: 'dexterity',
    con: 'constitution',
    int: 'intelligence',
    wis: 'wisdom',
    cha: 'charisma',
  };
  const saveProficiencies: string[] = [];

  const savingThrows: any = {
    str: Math.floor((stats.str - 10) / 2),
    dex: Math.floor((stats.dex - 10) / 2),
    con: Math.floor((stats.con - 10) / 2),
    int: Math.floor((stats.int - 10) / 2),
    wis: Math.floor((stats.wis - 10) / 2),
    cha: Math.floor((stats.cha - 10) / 2),
    proficiencies: saveProficiencies,
  };

  for (const k of statKeys) {
    const fullName = fullStatNames[k];
    const isProf = allMods.some(
      (m) =>
        m.type === 'proficiency' &&
        (m.subType === `${fullName}-saving-throws` || m.subType === `${k}-saving-throws`)
    );
    if (isProf) {
      saveProficiencies.push(k);
      savingThrows[k] += proficiencyBonus;
    }
  }

  // Passive perception
  const wisMod = Math.floor((stats.wis - 10) / 2);
  const perceptionSkill = skills.find((s) => s.name === 'Perception');
  const passivePerception = 10 + (perceptionSkill ? perceptionSkill.modifier : wisMod);

  // Avatar URL
  const avatarUrl =
    data.avatarUrl ||
    data.decorations?.avatarUrl ||
    data.avatar?.avatarUrl ||
    data.race?.portraitAvatarUrl ||
    data.classes?.[0]?.definition?.portraitAvatarUrl ||
    undefined;

  // Armor Class calculation
  let armorClass = 10 + dexMod;
  const equippedArmor = inventoryItems.find(
    (item: any) => item.definition?.filterType === 'Armor' && item.equipped
  );
  if (equippedArmor?.definition) {
    const baseAc = equippedArmor.definition.armorClass || 11;
    const armorType = equippedArmor.definition.type;
    if (armorType === 'Heavy Armor') {
      armorClass = baseAc;
    } else if (armorType === 'Medium Armor') {
      armorClass = baseAc + Math.min(2, Math.max(0, dexMod));
    } else {
      armorClass = baseAc + dexMod;
    }
  }
  const equippedShield = inventoryItems.find(
    (item: any) => item.definition?.filterType === 'Shield' && item.equipped
  );
  if (equippedShield) {
    armorClass += equippedShield.definition?.armorClass || 2;
  }

  // Items
  const items = inventoryItems.map((item: any) => ({
    name: item.definition?.name || 'Item',
    quantity: item.quantity || 1,
    weight: item.definition?.weight || 0,
    equipped: Boolean(item.equipped),
    description: item.definition?.description
      ? item.definition.description.replace(/<[^>]*>/g, '').trim()
      : undefined,
  }));

  return {
    id: characterId,
    name,
    classes: classNames,
    race,
    level,
    stats,
    currentHp,
    maxHp: totalMaxHp,
    tempHp,
    armorClass,
    speed,
    proficiencyBonus,
    passivePerception,
    initiativeBonus: dexMod,
    skills,
    actions,
    spells,
    items,
    savingThrows,
    avatarUrl,
  };
}

/**
 * Creates a battlemap Token from a parsed D&D Beyond character (OB-140).
 */
export function createDnDBeyondToken(
  char: DnDCharacter,
  activeMapId: string,
  x: number,
  y: number
): Token {
  return {
    id: `token-${crypto.randomUUID()}`,
    name: char.name,
    mapId: activeMapId,
    x,
    y,
    size: 1,
    rotation: 0,
    imageUrl: char.avatarUrl || '',
    ringColor: '#6366f1',
    fillColor: '#1e293b',
    clipCircle: true,
    currentHp: char.currentHp ?? char.maxHp ?? 10,
    maxHp: char.maxHp ?? 10,
    tempHp: char.tempHp ?? 0,
    speed: char.speed || 30,
    conditions: [],
    elevation: 0,
    isProp: false,
    layer: 'token',
    character: char,
  };
}
