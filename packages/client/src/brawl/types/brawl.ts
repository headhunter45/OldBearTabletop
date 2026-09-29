export interface BaseShape {
  type: 'circle' | 'oval' | 'rect' | 'polygon';
  widthMm: number;
  heightMm?: number;
}

export interface Collision3D {
  shape: 'cylinder' | 'box' | 'capsule';
  heightMm: number;
  verticalOffsetMm?: number;
}

export interface WargameAction {
  id: string;
  name: string;
  type: 'melee' | 'ranged' | 'ability' | 'stratagem';
  rangeInches?: number;
  attacks?: string | number;
  skill?: string; // e.g. "3+"
  strength?: number;
  ap?: number;
  damage?: string | number;
  keywords?: string[];
  rulesDescription?: string;
  diceMacro?: string; // e.g. "/roll 10(d6+2 >= 5)"
}

export interface WargameModel {
  id: string;
  name: string;
  unitId: string;
  x: number;
  y: number;
  baseShape: BaseShape;
  collision?: Collision3D;
  actionOverrides?: WargameAction[];
  isSlain?: boolean;
}

export interface WargameUnit {
  id: string;
  name: string;
  armyId: string;
  points: number;
  coherencyDistanceInches: number; // default 2.0 inches
  models: WargameModel[];
  baseActions: WargameAction[];
  datasheet?: {
    movementInches: number;
    toughness: number;
    armorSave: string; // e.g. "3+"
    woundsPerModel: number;
    leadership: string; // e.g. "6+"
    objectiveControl: number;
  };
}

export interface WargameArmy {
  id: string;
  name: string;
  faction: string;
  pointsLimit: number;
  units: WargameUnit[];
  ruleCards?: Array<{ id: string; title: string; content: string }>;
}

export type WargamePhase =
  | 'Command'
  | 'Movement'
  | 'Shooting'
  | 'Charge'
  | 'Fight'
  | 'Morale';

export interface WargameScoreBoard {
  player1: {
    name: string;
    primaryVp: number;
    secondaryVp: number;
    commandPoints: number;
    clockSecondsRemaining: number;
  };
  player2: {
    name: string;
    primaryVp: number;
    secondaryVp: number;
    commandPoints: number;
    clockSecondsRemaining: number;
  };
  currentRound: number;
  maxRounds: number;
  activePlayer: 1 | 2;
  activePhase: WargamePhase;
  isClockRunning: boolean;
}
