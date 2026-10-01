import { GameMap, SubmapConfig, Token } from '@oldbear/shared';
import { isPointInSubmap } from '../../common/engine/SubmapManager.js';

export type DeploymentPresetType = 'dawn_of_war' | 'hammer_and_anvil' | 'search_and_destroy' | 'crucible_of_battle';

export interface DeploymentPresetInfo {
  id: DeploymentPresetType;
  name: string;
  description: string;
  p1Label: string;
  p2Label: string;
}

export const DEPLOYMENT_PRESETS: Record<DeploymentPresetType, DeploymentPresetInfo> = {
  dawn_of_war: {
    id: 'dawn_of_war',
    name: 'Dawn of War',
    description: 'Long table edge deployment (12" from North and South boundaries).',
    p1Label: 'Player 1 (North 12")',
    p2Label: 'Player 2 (South 12")',
  },
  hammer_and_anvil: {
    id: 'hammer_and_anvil',
    name: 'Hammer and Anvil',
    description: 'Short table edge deployment (24" from West and East boundaries).',
    p1Label: 'Player 1 (West 24")',
    p2Label: 'Player 2 (East 24")',
  },
  search_and_destroy: {
    id: 'search_and_destroy',
    name: 'Search and Destroy',
    description: 'Quarter table deployment with a 9" exclusion bubble around the center.',
    p1Label: 'Player 1 (NW Quarter)',
    p2Label: 'Player 2 (SE Quarter)',
  },
  crucible_of_battle: {
    id: 'crucible_of_battle',
    name: 'Crucible of Battle',
    description: 'Diagonal wedge deployment leaving an 18" no-man\'s-land corridor.',
    p1Label: 'Player 1 (North Wedge)',
    p2Label: 'Player 2 (South Wedge)',
  },
};

/**
 * Computes deployment zone submaps based on standard wargaming tournament mission pack presets.
 */
export function getDeploymentZoneSubmaps(
  parentMap: GameMap,
  preset: DeploymentPresetType,
  pxPerInch = 50
): SubmapConfig[] {
  const mapWidth = parentMap.width || 3000;
  const mapHeight = parentMap.height || 2200;

  const p1Color = '#38bdf8';
  const p1Bg = 'rgba(56, 189, 248, 0.12)';
  const p2Color = '#f43f5e';
  const p2Bg = 'rgba(244, 63, 94, 0.12)';

  if (preset === 'hammer_and_anvil') {
    // 24" from East and West boundaries
    const depthPx = Math.min(24 * pxPerInch, mapWidth * 0.4);

    const p1Zone: SubmapConfig = {
      id: `dep_hammer_p1_${Date.now()}`,
      name: 'Player 1 Deployment (West 24")',
      type: 'deployment_zone',
      x: 0,
      y: 0,
      width: depthPx,
      height: mapHeight,
      backgroundColor: p1Bg,
      borderColor: p1Color,
      colorCode: p1Color,
      showGrid: true,
      label: 'Player 1 Deployment Zone (West)',
    };

    const p2Zone: SubmapConfig = {
      id: `dep_hammer_p2_${Date.now()}`,
      name: 'Player 2 Deployment (East 24")',
      type: 'deployment_zone',
      x: mapWidth - depthPx,
      y: 0,
      width: depthPx,
      height: mapHeight,
      backgroundColor: p2Bg,
      borderColor: p2Color,
      colorCode: p2Color,
      showGrid: true,
      label: 'Player 2 Deployment Zone (East)',
    };

    return [p1Zone, p2Zone];
  }

  if (preset === 'search_and_destroy') {
    // NW and SE table quarters
    const halfW = mapWidth / 2;
    const halfH = mapHeight / 2;

    const p1Zone: SubmapConfig = {
      id: `dep_search_p1_${Date.now()}`,
      name: 'Player 1 Deployment (NW Quarter)',
      type: 'deployment_zone',
      x: 0,
      y: 0,
      width: halfW - 200,
      height: halfH - 200,
      backgroundColor: p1Bg,
      borderColor: p1Color,
      colorCode: p1Color,
      showGrid: true,
      label: 'Player 1 Deployment Zone (NW Quarter)',
    };

    const p2Zone: SubmapConfig = {
      id: `dep_search_p2_${Date.now()}`,
      name: 'Player 2 Deployment (SE Quarter)',
      type: 'deployment_zone',
      x: halfW + 200,
      y: halfH + 200,
      width: halfW - 200,
      height: halfH - 200,
      backgroundColor: p2Bg,
      borderColor: p2Color,
      colorCode: p2Color,
      showGrid: true,
      label: 'Player 2 Deployment Zone (SE Quarter)',
    };

    return [p1Zone, p2Zone];
  }

  if (preset === 'crucible_of_battle') {
    // Crucible of battle: wedge zones
    const depthH = Math.min(18 * pxPerInch, mapHeight * 0.35);

    const p1Zone: SubmapConfig = {
      id: `dep_crucible_p1_${Date.now()}`,
      name: 'Player 1 Deployment (North Wedge)',
      type: 'deployment_zone',
      x: 150,
      y: 0,
      width: mapWidth - 300,
      height: depthH,
      backgroundColor: p1Bg,
      borderColor: p1Color,
      colorCode: p1Color,
      showGrid: true,
      label: 'Player 1 Deployment Zone (North Wedge)',
    };

    const p2Zone: SubmapConfig = {
      id: `dep_crucible_p2_${Date.now()}`,
      name: 'Player 2 Deployment (South Wedge)',
      type: 'deployment_zone',
      x: 150,
      y: mapHeight - depthH,
      width: mapWidth - 300,
      height: depthH,
      backgroundColor: p2Bg,
      borderColor: p2Color,
      colorCode: p2Color,
      showGrid: true,
      label: 'Player 2 Deployment Zone (South Wedge)',
    };

    return [p1Zone, p2Zone];
  }

  // Default: Dawn of War (Long edges, 12" depth)
  const depthPx = Math.min(12 * pxPerInch, mapHeight * 0.35);

  const p1Zone: SubmapConfig = {
    id: `dep_dawn_p1_${Date.now()}`,
    name: 'Player 1 Deployment (North 12")',
    type: 'deployment_zone',
    x: 0,
    y: 0,
    width: mapWidth,
    height: depthPx,
    backgroundColor: p1Bg,
    borderColor: p1Color,
    colorCode: p1Color,
    showGrid: true,
    label: 'Player 1 Deployment Zone (North 12")',
  };

  const p2Zone: SubmapConfig = {
    id: `dep_dawn_p2_${Date.now()}`,
    name: 'Player 2 Deployment (South 12")',
    type: 'deployment_zone',
    x: 0,
    y: mapHeight - depthPx,
    width: mapWidth,
    height: depthPx,
    backgroundColor: p2Bg,
    borderColor: p2Color,
    colorCode: p2Color,
    showGrid: true,
    label: 'Player 2 Deployment Zone (South 12")',
  };

  return [p1Zone, p2Zone];
}

/**
 * Creates a Casualty Tray / Graveyard submap off the battlefield table.
 */
export function createCasualtyTraySubmap(parentMap: GameMap): SubmapConfig {
  const mapHeight = parentMap.height || 2200;
  return {
    id: `submap_casualty_${Date.now()}`,
    name: 'Casualty Tray / Graveyard',
    type: 'casualty_tray',
    x: 0,
    y: mapHeight + 80,
    width: Math.min(parentMap.width || 3000, 1400),
    height: 320,
    backgroundColor: 'rgba(30, 10, 15, 0.95)',
    borderColor: '#ef4444',
    colorCode: '#ef4444',
    showGrid: true,
    label: '💀 Casualty Tray / Graveyard',
  };
}

/**
 * Creates a Strategic Reserves & Deep Strike staging submap off the battlefield.
 */
export function createStrategicReservesSubmap(parentMap: GameMap): SubmapConfig {
  return {
    id: `submap_reserves_${Date.now()}`,
    name: 'Strategic Reserves & Deep Strike',
    type: 'staging_area',
    x: 0,
    y: -(320 + 80),
    width: Math.min(parentMap.width || 3000, 1400),
    height: 320,
    backgroundColor: 'rgba(30, 27, 75, 0.95)',
    borderColor: '#818cf8',
    colorCode: '#818cf8',
    showGrid: true,
    label: '🚀 Strategic Reserves & Deep Strike',
  };
}

/**
 * Creates an Embarked Transports Staging submap.
 */
export function createEmbarkedTransportsSubmap(parentMap: GameMap): SubmapConfig {
  const mapWidth = parentMap.width || 3000;
  return {
    id: `submap_embarked_${Date.now()}`,
    name: 'Embarked Transports Staging',
    type: 'staging_area',
    x: mapWidth + 80,
    y: 0,
    width: 600,
    height: 400,
    backgroundColor: 'rgba(45, 30, 10, 0.95)',
    borderColor: '#f59e0b',
    colorCode: '#f59e0b',
    showGrid: true,
    label: '🛡️ Embarked Transports Staging',
  };
}

/**
 * Sets up a complete tournament wargaming table with deployment zones and staging submaps.
 */
export function setupTournamentBattlefield(
  parentMap: GameMap,
  options: {
    deployment: DeploymentPresetType;
    includeCasualtyTray?: boolean;
    includeReserves?: boolean;
    includeTransports?: boolean;
  }
): GameMap {
  // Filter out existing deployment zones and staging areas if re-configuring
  const retainedSubmaps = (parentMap.submaps || []).filter(
    (s) => s.type !== 'deployment_zone' && s.type !== 'casualty_tray' && s.type !== 'staging_area'
  );

  const deploymentZones = getDeploymentZoneSubmaps(parentMap, options.deployment);
  const newSubmaps: SubmapConfig[] = [...retainedSubmaps, ...deploymentZones];

  if (options.includeCasualtyTray !== false) {
    newSubmaps.push(createCasualtyTraySubmap(parentMap));
  }

  if (options.includeReserves !== false) {
    newSubmaps.push(createStrategicReservesSubmap(parentMap));
  }

  if (options.includeTransports) {
    newSubmaps.push(createEmbarkedTransportsSubmap(parentMap));
  }

  return {
    ...parentMap,
    submaps: newSubmaps,
  };
}

/**
 * Moves specified tokens neatly inside a target submap in a grid formation.
 */
export function moveTokensToSubmap(
  tokensToMove: Token[],
  targetSubmap: SubmapConfig,
  allTokens: Token[]
): Token[] {
  const moveIds = new Set(tokensToMove.map((t) => t.id));
  const existingInSubmap = allTokens.filter(
    (t) => !moveIds.has(t.id) && isPointInSubmap(targetSubmap, t.x, t.y)
  );

  const cols = Math.max(1, Math.floor((targetSubmap.width - 80) / 70));
  const spacingX = 70;
  const spacingY = 70;

  let slotOffset = existingInSubmap.length;

  return allTokens.map((token) => {
    if (!moveIds.has(token.id)) return token;

    const col = slotOffset % cols;
    const row = Math.floor(slotOffset / cols);
    slotOffset++;

    const newX = targetSubmap.x + 40 + col * spacingX;
    const newY = targetSubmap.y + 50 + row * spacingY;

    return {
      ...token,
      x: newX,
      y: newY,
    };
  });
}

/**
 * One-click helper: Sends slain models to the Casualty Tray.
 * Ensures Casualty Tray exists on the map, updates token positions, and marks them as Slain.
 */
export function sendTokensToCasualtyTray(
  tokenIds: string[],
  map: GameMap,
  allTokens: Token[]
): {
  updatedMap: GameMap;
  updatedTokens: Token[];
  tray: SubmapConfig;
  slainCount: number;
} {
  const idsSet = new Set(tokenIds);
  const targetTokens = allTokens.filter((t) => idsSet.has(t.id));
  let tray = (map.submaps || []).find((s) => s.type === 'casualty_tray');
  let updatedMap = map;

  if (!tray) {
    tray = createCasualtyTraySubmap(map);
    updatedMap = {
      ...map,
      submaps: [...(map.submaps || []), tray],
    };
  }

  if (targetTokens.length === 0) {
    return { updatedMap, updatedTokens: allTokens, tray, slainCount: 0 };
  }

  const relocatedTokens = moveTokensToSubmap(targetTokens, tray, allTokens);

  const finalTokens = relocatedTokens.map((t) => {
    if (idsSet.has(t.id)) {
      const existingConds = t.conditions || [];
      return {
        ...t,
        currentHp: 0,
        conditions: existingConds.includes('Slain') ? existingConds : [...existingConds, 'Slain'],
      };
    }
    return t;
  });

  return {
    updatedMap,
    updatedTokens: finalTokens,
    tray,
    slainCount: targetTokens.length,
  };
}

/**
 * One-click helper: Sends models into Strategic Reserves / Deep Strike.
 */
export function sendTokensToStrategicReserves(
  tokenIds: string[],
  map: GameMap,
  allTokens: Token[]
): {
  updatedMap: GameMap;
  updatedTokens: Token[];
  reserves: SubmapConfig;
  count: number;
} {
  const idsSet = new Set(tokenIds);
  const targetTokens = allTokens.filter((t) => idsSet.has(t.id));
  let reserves = (map.submaps || []).find(
    (s) => s.type === 'staging_area' && s.name.toLowerCase().includes('reserves')
  );
  let updatedMap = map;

  if (!reserves) {
    reserves = createStrategicReservesSubmap(map);
    updatedMap = {
      ...map,
      submaps: [...(map.submaps || []), reserves],
    };
  }

  if (targetTokens.length === 0) {
    return { updatedMap, updatedTokens: allTokens, reserves, count: 0 };
  }

  const relocatedTokens = moveTokensToSubmap(targetTokens, reserves, allTokens);

  return {
    updatedMap,
    updatedTokens: relocatedTokens,
    reserves,
    count: targetTokens.length,
  };
}

/**
 * One-click helper: Revives or returns slain/reserved models back to active battlefield.
 */
export function reviveTokensToBattlefield(
  tokenIds: string[],
  targetCoordinates: { x: number; y: number },
  allTokens: Token[]
): Token[] {
  const idsSet = new Set(tokenIds);
  const spacing = 60;
  let idx = 0;

  return allTokens.map((t) => {
    if (!idsSet.has(t.id)) return t;

    const posX = targetCoordinates.x + (idx % 5) * spacing;
    const posY = targetCoordinates.y + Math.floor(idx / 5) * spacing;
    idx++;

    const cleanedConds = (t.conditions || []).filter((c) => c !== 'Slain');

    return {
      ...t,
      x: posX,
      y: posY,
      currentHp: t.maxHp > 0 ? t.maxHp : 1,
      conditions: cleanedConds,
    };
  });
}
