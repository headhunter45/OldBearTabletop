export type Role = 'gm' | 'player';

export interface Player {
  id: string;
  name: string;
  role: Role;
  color: string;
  connected: boolean;
  assignedTokenIds: string[];
  dndBeyondCharacterId?: string;
  dndBeyondCharacter?: DnDCharacter;
  isMuted?: boolean;
  isSpeaking?: boolean;
  isDeafened?: boolean;
  isForceMuted?: boolean;
  isAudioStreaming?: boolean;
}

export type GridType = 'square' | 'hex' | 'none';

export type SubmapType =
  | 'building_floor'    // Multi-floor buildings (Floor 1, Floor 2, Basement side-by-side)
  | 'connected_dungeon' // Connected portal dungeons (Tavern + Cavern)
  | 'deployment_zone'   // Wargaming Deployment Zones (color-coded and labeled)
  | 'casualty_tray'     // Casualty Tray / Graveyard (off-table area for slain models)
  | 'staging_area'      // Off-Table Staging Area (Strategic Reserves, Deep Strike, Embarked)
  | 'custom';

export interface SubmapConfig {
  id: string;
  name: string;
  type: SubmapType;
  x: number; // canvas x offset in world coordinates
  y: number; // canvas y offset in world coordinates
  width: number; // width in pixels
  height: number; // height in pixels
  imageUrl?: string; // optional image for the submap / floor plan
  backgroundColor?: string; // optional background fill
  borderColor?: string; // border outline color
  gridSize?: number; // independent grid cell size (defaults to parent map's gridSize)
  gridType?: GridType;
  showGrid?: boolean;
  label?: string; // visible badge / label on map
  colorCode?: string; // color badge for deployment zones / casualty trays
}

export interface GameMap {
  id: string;
  name: string;
  imageUrl: string; // URL, data URL, or IndexedDB asset ID
  gridSize: number; // pixels per grid cell (default e.g. 50)
  gridType: GridType;
  gridColor: string;
  gridOpacity: number;
  width: number;
  height: number;
  scaleFtPerCell: number; // default 5 (5ft per cell)
  showGrid?: boolean;
  gridOffsetX?: number;
  gridOffsetY?: number;
  tilesX?: number;
  tilesY?: number;
  backgroundColor?: string;
  baseMapId?: string; // ID of the underlying map asset/image when used across multiple scenes
  baseMapName?: string; // Display name of base map asset
  customStatuses?: Record<string, CustomStatusDefinition>; // Per-scene status overrides (OB-131)
  submaps?: SubmapConfig[]; // Logical submaps, floors, staging areas, casualty trays (OB-130)
  isTemplate?: boolean; // Scene template flag for duplicating layout with fresh maps (OB-130)
}

export interface Scene extends GameMap {
  baseMapId?: string;
  baseMapName?: string;
}

export interface MapAsset {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  gridSize: number;
  gridType: GridType;
  gridColor: string;
  gridOpacity: number;
  scaleFtPerCell: number;
  backgroundColor?: string;
  tilesX?: number;
  tilesY?: number;
}

export interface Token {
  id: string;
  mapId: string;
  name: string;
  imageUrl?: string;
  x: number;
  y: number;
  size: number; // grid units, 1 = medium (1x1), 2 = large (2x2), etc.
  rotation: number; // degrees
  ringColor: string; // border ring color
  fillColor: string; // background color for clipped token
  clipCircle: boolean;
  clipShape?: 'circle' | 'square' | 'rounded' | 'hexagon' | 'octagon';
  clipZoom?: number; // 0.5 to 3.0 (default 1.0)
  clipPanX?: number; // -100 to 100 percentage offset
  clipPanY?: number; // -100 to 100 percentage offset
  borderWidth?: number; // pixel width
  isPlayerToken?: boolean; // marks token as an assignable/claimable player token
  currentHp: number;
  maxHp: number;
  tempHp: number;
  speed: number; // speed in feet, e.g. 30
  ownerId?: string; // Player ID who has control, or undefined for GM-only
  conditions: string[]; // e.g. 'Blinded', 'Charmed', 'Poisoned', 'Stunned', etc.
  isProp: boolean; // props are decorative items on map
  layer: 'map' | 'token' | 'prop';
  elevation?: number; // e.g. flying +10ft
  initiativeBonus?: number;
  character?: DnDCharacter;
  propWidth?: number; // custom decimal width in grid units (e.g. 1.5)
  propHeight?: number; // custom decimal height in grid units (e.g. 3.24)
  locked?: boolean; // locked tokens/props can be selected but not moved
  statusCounters?: Record<string, number>; // current numeric counters for conditions (OB-131)
}

export interface StatusCounterConfig {
  start: number;
  update: number; // delta per trigger (+1 or -1)
  max?: number;
  min?: number;
}

export type StatusTurnTrigger = 'beginning_of_turn' | 'end_of_turn' | 'never';

export interface CustomStatusDefinition {
  id?: string;
  label: string;
  description?: string;
  color: string;
  counter?: StatusCounterConfig;
  showOnToken?: boolean;
  clearWhen?: StatusTurnTrigger;
  updates?: StatusTurnTrigger;
}

export interface FogPoint {
  x: number;
  y: number;
}

export interface FogShape {
  id: string;
  mode: 'reveal' | 'hide';
  type: 'brush' | 'polygon' | 'rect';
  points: FogPoint[];
  radius?: number; // for brush strokes
}

export interface FogState {
  mapId: string;
  globalCovered: boolean; // default true for unexplored
  shapes: FogShape[];
}

export type MarkerType = 'laser' | 'arrow' | 'crosshair' | 'circle' | 'rectangle' | 'cone' | 'tether' | 'clock' | 'spray';

export interface ScreenMarker {
  id: string;
  type: MarkerType;
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
  label?: string; // Custom name / label (e.g. "Spirit Guardians", "Threat Range", "Clock Name")
  opacity?: number; // 0.05 to 1.0
  anchor?: 'center' | 'edge'; // Measure aura from token center vs base edge perimeter
  attachedTokenId?: string; // ID of token this aura/indicator is attached to
  tetherTargetId?: string; // ID of target token or prop tethered to
  tetherStyle?: 'straight' | 'wiggly'; // connecting line style
  tetherFrequency?: number; // frequency of sine wave (e.g. 10 to 50, default 24)
  tetherAmplitude?: number; // amplitude in pixels (e.g. 5 to 25, default 10)
  strokeWidth?: number; // stroke width (default 2.5)
  // Dynamic parameters depending on type
  points?: FogPoint[]; // for laser trails
  targetX?: number; // for arrow / tether
  targetY?: number;
  radius?: number; // for circle, cone, clock, or spray
  width?: number; // for rectangle
  height?: number;
  angle?: number; // for cone / directional angle
  spreadAngle?: number; // for cone spread angle in degrees
  segments?: number; // for clock: number of pie wedges (default 8)
  filled?: number; // for clock: number of active/filled wedges
  imageUrl?: string; // for spray: custom image decal, hazard overlay, or objective marker asset (OB-134)
  sprayShape?: 'circle' | 'square'; // for spray: circle vs square decal shape (OB-169)
  rotation?: number; // for spray: rotation angle in degrees (OB-134)
  persist?: boolean; // stays on map until deleted
  locked?: boolean; // locked from accidental movement
  mapId?: string; // associated map
  durationMs: number; // how long it stays on screen (if not persist)
  createdAt: number; // epoch ms
}

export interface ProgressClock {
  id: string;
  name: string;
  steps: number; // e.g. 4, 6, 8, 12 (OB-173: standardized on steps)
  segments?: number; // legacy alias for steps
  filled: number; // 0 to steps
  color: string;
  placedOnCanvas?: boolean;
  x?: number;
  y?: number;
  radius?: number;
}

export interface TimerState {
  id: string;
  totalDurationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  label?: string;
  lastUpdated?: number;
}

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceRollResult {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  diceType: DieType;
  count: number;
  modifier: number;
  rolls: number[];
  total: number;
  advantageMode?: 'normal' | 'advantage' | 'disadvantage';
  keptRoll?: number;
  timestamp: number;
}

export interface InitiativeItem {
  id: string;
  tokenId?: string;
  name: string;
  initiative: number;
  hp?: number;
  maxHp?: number;
  color?: string;
  isCurrentTurn?: boolean;
}

export interface InitiativeState {
  round: number;
  currentTurnIndex: number;
  items: InitiativeItem[];
}

export interface DnDSpell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  description: string;
  dndBeyondUrl: string;
}

export interface CharacterSkill {
  name: string;
  stat: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  modifier: number;
  proficiency: 'none' | 'proficient' | 'expertise';
}

export interface DnDAction {
  name: string;
  type?: string;
  activationType?: 'action' | 'bonus' | 'reaction' | string;
  toHitModifier?: number;
  damageDice?: string;
  reach?: string;
  range?: string;
  damage?: string;
  description?: string;
  diceMacro?: string; // Custom dice macro expression tied directly to action button (OB-133)
}

export function getActivationCategory(item?: {
  activationType?: string;
  type?: string;
  castingTime?: string;
  description?: string;
  name?: string;
}): 'action' | 'bonus' | 'reaction' | 'other' {
  if (!item) return 'other';
  const act = (item.activationType || '').toLowerCase();
  const t = (item.type || '').toLowerCase();
  const cast = (item.castingTime || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();

  if (act === 'bonus' || act.includes('bonus') || t.includes('bonus') || /\bbonus\b/i.test(cast) || /\bbonus action\b/i.test(desc)) {
    return 'bonus';
  }
  if (act === 'reaction' || act.includes('reaction') || t.includes('reaction') || /\breaction\b/i.test(cast) || /\breaction\b/i.test(desc)) {
    return 'reaction';
  }
  if (act === 'action' || t === 'action' || /\b1 action\b/i.test(cast)) {
    return 'action';
  }
  return 'other';
}

export interface DnDItem {
  id?: string;
  name: string;
  description?: string;
  quantity?: number;
  dndBeyondUrl?: string;
}

export interface DnDCharacter {
  id: string;
  name: string;
  avatarUrl?: string;
  level: number;
  classes: string;
  race: string;
  currentHp: number;
  maxHp: number;
  tempHp: number;
  speed: number;
  armorClass: number;
  passivePerception: number;
  initiativeBonus?: number;
  savingThrows?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    proficiencies?: string[];
  };
  passives?: {
    perception: number;
    investigation: number;
    insight: number;
  };
  currencies?: {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
  };
  proficiencyBonus?: number;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  skills?: CharacterSkill[];
  spells: DnDSpell[];
  actions?: DnDAction[];
  items?: DnDItem[];
}

export interface SoundTrack {
  id: string;
  name: string;
  url: string; // or local asset id
  volume: number; // 0 to 1
  isLooping: boolean;
  isPlaying: boolean;
  isBroadcast: boolean; // play for players as well or GM-only
  category: 'music' | 'ambience' | 'sfx';
}

export interface GameSession {
  id: string;
  name: string;
  createdAt: number;
  gmId: string;
  activeMapId: string; // The map players currently see
  maps: GameMap[];
  tokens: Record<string, Token>; // key is token ID
  fog: Record<string, FogState>; // key is map ID
  players: Record<string, Player>;
  initiative: InitiativeState;
  markers: ScreenMarker[];
  diceHistory: DiceRollResult[];
  soundtracks: SoundTrack[];
  discordWebhookUrl?: string;
  clocks?: ProgressClock[];
}

export type ActionType =
  | 'attack'
  | 'spell'
  | 'item'
  | 'ability'
  | 'trait'
  | 'feat'
  | 'monster';

export type ActionCostType =
  // D&D 5e / Generic
  | 'action'
  | 'bonus_action'
  | 'reaction'
  | 'free'
  | 'minute'
  | 'hour'
  // PF2e / SF2e Action Economy
  | '1_action' // [◆] or [1A]
  | '2_actions' // [◆◆] or [2A]
  | '3_actions' // [◆◆◆] or [3A]
  | 'reaction_pf2e' // [↺] or [R]
  | 'free_pf2e'; // [◇] or [FA]

export interface EntityAction {
  id: string;
  name: string;
  type: ActionType;
  description: string;
  cost?: ActionCostType; // Display glyph / badge
  traits?: string[]; // e.g. ["Evocation", "Force", "Agile", "Finesse", "Concentration"]
  range?: string; // e.g. "120 ft.", "Touch", "Self"
  target?: string; // e.g. "1 creature", "20-foot radius sphere"
  duration?: string; // e.g. "Instantaneous", "1 minute"
  savingThrow?: {
    ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
    dc?: number;
  };
  rollFormula?: string; // e.g. "1d20+5" or "3d4+3"
  damageFormula?: string; // e.g. "1d8+3"
  damageType?: string; // e.g. "slashing", "fire", "force"
  sourceUrl?: string; // Origin reference link
  sourceSystem?: '5e' | 'pf2e' | 'generic';
}

export interface EntityStatBlock extends EntityAction {
  subtitle?: string; // e.g. "Medium humanoid, lawful good" or "1st-level evocation"
  level?: number;
  school?: string;
  castingTime?: string;
  rarity?: string;
  price?: string;
  armorClass?: number | string;
  hp?: number | string;
  speed?: string;
  stats?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  skills?: string;
  senses?: string;
  languages?: string;
  challenge?: string; // CR or creature level
  actions?: EntityAction[];
  reactions?: EntityAction[];
  specialAbilities?: EntityAction[];
  imageUrl?: string;
}

/**
 * Returns the recognizable visual display string / glyph for an action cost.
 */
export function getActionCostGlyph(cost?: ActionCostType | string): string {
  if (!cost) return '';
  switch (cost) {
    case '1_action':
      return '◆';
    case '2_actions':
      return '◆◆';
    case '3_actions':
      return '◆◆◆';
    case 'reaction_pf2e':
      return '↺';
    case 'free_pf2e':
      return '◇';
    case 'action':
      return 'Action';
    case 'bonus_action':
      return 'Bonus Action';
    case 'reaction':
      return 'Reaction';
    case 'free':
      return 'Free';
    case 'minute':
      return '1 Min';
    case 'hour':
      return '1 Hour';
    default:
      return cost;
  }
}

/**
 * Parses raw text, glyphs, or keywords into an ActionCostType.
 */
export function parseActionCost(
  raw?: string,
  system?: '5e' | 'pf2e' | 'generic'
): ActionCostType | undefined {
  if (!raw) return undefined;
  const s = raw.trim().toLowerCase();

  // Explicit PF2e system requested or PF2e-specific glyphs/brackets
  if (system === 'pf2e') {
    if (s === '◆◆◆' || s === '[3a]' || s === '3_actions' || s === '3 actions' || s === '3 action' || s === '3') {
      return '3_actions';
    }
    if (s === '◆◆' || s === '[2a]' || s === '2_actions' || s === '2 actions' || s === '2 action' || s === '2') {
      return '2_actions';
    }
    if (s === '◆' || s === '[1a]' || s === '1_action' || s === '1 action' || s === '1') {
      return '1_action';
    }
    if (s === '↺' || s === '[r]' || s === 'reaction_pf2e' || s === 'reaction') {
      return 'reaction_pf2e';
    }
    if (s === '◇' || s === '[fa]' || s === 'free_pf2e' || s === 'free' || s === 'free action') {
      return 'free_pf2e';
    }
  }

  // Visual glyphs and specific bracket notation regardless of system
  if (s === '◆◆◆' || s === '[3a]' || s === '3_actions') {
    return '3_actions';
  }
  if (s === '◆◆' || s === '[2a]' || s === '2_actions') {
    return '2_actions';
  }
  if (s === '◆' || s === '[1a]' || s === '1_action') {
    return '1_action';
  }
  if (s === '↺' || s === '[r]' || s === 'reaction_pf2e') {
    return 'reaction_pf2e';
  }
  if (s === '◇' || s === '[fa]' || s === 'free_pf2e') {
    return 'free_pf2e';
  }

  // 5e / generic
  if (s.includes('bonus') || s === 'ba' || s === 'bonus_action') {
    return 'bonus_action';
  }
  if (s.includes('reaction')) {
    return 'reaction';
  }
  if (s === 'action' || s === '1 action' || s === 'standard') {
    return 'action';
  }
  if (s === 'free' || s === 'free action') {
    return 'free';
  }
  if (s.includes('minute')) {
    return 'minute';
  }
  if (s.includes('hour')) {
    return 'hour';
  }

  // PF2e text notation fallback
  if (s === '3 actions' || s === '3 action' || s === '3') {
    return '3_actions';
  }
  if (s === '2 actions' || s === '2 action' || s === '2') {
    return '2_actions';
  }
  if (s === '1') {
    return '1_action';
  }

  return undefined;
}

/**
 * Converts a standard DnDAction into an EntityAction.
 */
export function convertDnDActionToEntityAction(
  action: DnDAction,
  sourceSystem: '5e' | 'pf2e' | 'generic' = '5e'
): EntityAction {
  const cat = getActivationCategory(action);
  let cost: ActionCostType = 'action';
  if (cat === 'bonus') cost = 'bonus_action';
  else if (cat === 'reaction') cost = 'reaction';
  else if (action.activationType) {
    const parsed = parseActionCost(action.activationType);
    if (parsed) cost = parsed;
  }

  const rollFormula =
    action.diceMacro ||
    (action.toHitModifier !== undefined
      ? `1d20${action.toHitModifier >= 0 ? `+${action.toHitModifier}` : action.toHitModifier}`
      : undefined);

  return {
    id: crypto.randomUUID(),
    name: action.name,
    type: action.type === 'spell' ? 'spell' : 'attack',
    description: action.description || '',
    cost,
    range: action.range || action.reach,
    rollFormula,
    damageFormula: action.damageDice || action.damage,
    sourceSystem,
  };
}

/**
 * Converts a DnDSpell into an EntityStatBlock.
 */
export function convertDnDSpellToEntityAction(
  spell: DnDSpell,
  sourceSystem: '5e' | 'pf2e' | 'generic' = '5e'
): EntityStatBlock {
  const cost =
    parseActionCost(spell.castingTime) ||
    (spell.castingTime?.toLowerCase().includes('bonus')
      ? 'bonus_action'
      : spell.castingTime?.toLowerCase().includes('reaction')
      ? 'reaction'
      : 'action');

  const traits: string[] = [];
  if (spell.school) traits.push(spell.school);

  return {
    id: spell.id || crypto.randomUUID(),
    name: spell.name,
    type: 'spell',
    description: spell.description,
    cost,
    traits,
    range: spell.range,
    duration: spell.duration,
    level: spell.level,
    school: spell.school,
    castingTime: spell.castingTime,
    subtitle:
      spell.level === 0
        ? `Cantrip (${spell.school || 'Magic'})`
        : `Level ${spell.level} (${spell.school || 'Magic'})`,
    sourceUrl: spell.dndBeyondUrl,
    sourceSystem,
  };
}

/**
 * Converts a DnDItem into an EntityStatBlock.
 */
export function convertDnDItemToEntityAction(
  item: DnDItem,
  sourceSystem: '5e' | 'pf2e' | 'generic' = '5e'
): EntityStatBlock {
  return {
    id: item.id || crypto.randomUUID(),
    name: item.name,
    type: 'item',
    description: item.description || '',
    sourceUrl: item.dndBeyondUrl,
    subtitle: item.quantity && item.quantity > 1 ? `Item (Qty: ${item.quantity})` : 'Item',
    sourceSystem,
  };
}

/**
 * Converts a DnDCharacter into an EntityStatBlock (e.g. for monster statblock inspection).
 */
export function convertCharacterToMonsterStatBlock(
  char: DnDCharacter,
  sourceSystem: '5e' | 'pf2e' | 'generic' = '5e'
): EntityStatBlock {
  const actions: EntityAction[] = (char.actions || []).map((a) =>
    convertDnDActionToEntityAction(a, sourceSystem)
  );

  return {
    id: char.id,
    name: char.name,
    type: 'monster',
    description: `${char.race || ''} ${char.classes || ''}`.trim() || 'Creature',
    subtitle: `${char.race || ''} ${char.classes || ''}`.trim() || 'Creature',
    armorClass: char.armorClass,
    hp: `${char.currentHp}/${char.maxHp}`,
    speed: `${char.speed} ft.`,
    stats: char.stats,
    actions,
    imageUrl: char.avatarUrl,
    sourceSystem,
  };
}
