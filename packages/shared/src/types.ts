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

export type MarkerType = 'laser' | 'arrow' | 'crosshair' | 'circle' | 'rectangle' | 'cone' | 'tether' | 'clock';

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
  radius?: number; // for circle, cone, or clock
  width?: number; // for rectangle
  height?: number;
  angle?: number; // for cone / directional angle
  spreadAngle?: number; // for cone spread angle in degrees
  segments?: number; // for clock: number of pie wedges (default 8)
  filled?: number; // for clock: number of active/filled wedges
  persist?: boolean; // stays on map until deleted
  locked?: boolean; // locked from accidental movement
  mapId?: string; // associated map
  durationMs: number; // how long it stays on screen (if not persist)
  createdAt: number; // epoch ms
}

export interface ProgressClock {
  id: string;
  name: string;
  segments: number; // e.g. 4, 6, 8, 12
  filled: number; // 0 to segments
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
}
