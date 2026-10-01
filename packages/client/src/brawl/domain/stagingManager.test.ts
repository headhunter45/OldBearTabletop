import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GameMap, Token } from '@oldbear/shared';
import {
  getDeploymentZoneSubmaps,
  createCasualtyTraySubmap,
  createStrategicReservesSubmap,
  createEmbarkedTransportsSubmap,
  setupTournamentBattlefield,
  sendTokensToCasualtyTray,
  sendTokensToStrategicReserves,
  reviveTokensToBattlefield,
} from './stagingManager.js';
import { isPointInSubmap } from '../../common/engine/SubmapManager.js';

function mockMap(overrides?: Partial<GameMap>): GameMap {
  return {
    id: 'map_1',
    name: 'Wargaming Table',
    width: 3000,
    height: 2200,
    gridSize: 50,
    gridType: 'square',
    submaps: [],
    ...overrides,
  };
}

function mockToken(id: string, x = 1000, y = 1000, overrides?: Partial<Token>): Token {
  return {
    id,
    mapId: 'map_1',
    name: `Model ${id}`,
    x,
    y,
    size: 1,
    rotation: 0,
    ringColor: '#38bdf8',
    fillColor: '#000000',
    clipCircle: true,
    currentHp: 2,
    maxHp: 2,
    tempHp: 0,
    speed: 30,
    conditions: [],
    isProp: false,
    layer: 'token',
    ...overrides,
  };
}

describe('Deployment Zones, Casualty Trays & Staging Submaps (OB-162)', () => {
  describe('Deployment Presets', () => {
    it('generates Dawn of War deployment zones (North and South 12" long edges)', () => {
      const map = mockMap({ width: 3000, height: 2200 });
      const zones = getDeploymentZoneSubmaps(map, 'dawn_of_war', 50);

      assert.strictEqual(zones.length, 2);
      const [p1, p2] = zones;

      // North zone
      assert.strictEqual(p1.type, 'deployment_zone');
      assert.strictEqual(p1.x, 0);
      assert.strictEqual(p1.y, 0);
      assert.strictEqual(p1.width, 3000);
      assert.strictEqual(p1.height, 600); // 12" * 50px
      assert.strictEqual(p1.borderColor, '#38bdf8'); // Player 1 Blue

      // South zone
      assert.strictEqual(p2.type, 'deployment_zone');
      assert.strictEqual(p2.x, 0);
      assert.strictEqual(p2.y, 2200 - 600);
      assert.strictEqual(p2.width, 3000);
      assert.strictEqual(p2.height, 600);
      assert.strictEqual(p2.borderColor, '#f43f5e'); // Player 2 Pink
    });

    it('generates Hammer and Anvil deployment zones (West and East 24" short edges)', () => {
      const map = mockMap({ width: 3000, height: 2200 });
      const zones = getDeploymentZoneSubmaps(map, 'hammer_and_anvil', 50);

      assert.strictEqual(zones.length, 2);
      const [west, east] = zones;

      // West zone
      assert.strictEqual(west.x, 0);
      assert.strictEqual(west.y, 0);
      assert.strictEqual(west.width, 1200); // 24" * 50px
      assert.strictEqual(west.height, 2200);

      // East zone
      assert.strictEqual(east.x, 3000 - 1200);
      assert.strictEqual(east.y, 0);
      assert.strictEqual(east.width, 1200);
      assert.strictEqual(east.height, 2200);
    });

    it('generates Search and Destroy deployment zones (NW and SE quarters)', () => {
      const map = mockMap({ width: 3000, height: 2200 });
      const zones = getDeploymentZoneSubmaps(map, 'search_and_destroy', 50);

      assert.strictEqual(zones.length, 2);
      const [nw, se] = zones;

      assert.strictEqual(nw.x, 0);
      assert.strictEqual(nw.y, 0);
      assert.strictEqual(se.x, 1500 + 200);
      assert.strictEqual(se.y, 1100 + 200);
    });
  });

  describe('Staging Submap Creation & Table Setup', () => {
    it('creates casualty tray positioned below the table', () => {
      const map = mockMap({ height: 2000 });
      const tray = createCasualtyTraySubmap(map);

      assert.strictEqual(tray.type, 'casualty_tray');
      assert.strictEqual(tray.y, 2080);
      assert.strictEqual(tray.borderColor, '#ef4444');
    });

    it('creates strategic reserves positioned above the table', () => {
      const map = mockMap({ height: 2000 });
      const reserves = createStrategicReservesSubmap(map);

      assert.strictEqual(reserves.type, 'staging_area');
      assert.strictEqual(reserves.y, -400);
      assert.strictEqual(reserves.borderColor, '#818cf8');
    });

    it('sets up a full tournament battlefield with deployment zones and staging trays', () => {
      const map = mockMap();
      const configured = setupTournamentBattlefield(map, {
        deployment: 'dawn_of_war',
        includeCasualtyTray: true,
        includeReserves: true,
        includeTransports: true,
      });

      assert.strictEqual(configured.submaps?.length, 5); // 2 deployment zones + 1 casualty + 1 reserves + 1 transports
      const types = configured.submaps?.map((s) => s.type);
      assert(types?.includes('deployment_zone'));
      assert(types?.includes('casualty_tray'));
      assert(types?.includes('staging_area'));
    });
  });

  describe('One-Click Model Transfers', () => {
    it('sends dead models to casualty tray and marks them Slain with 0 HP', () => {
      const map = mockMap();
      const token1 = mockToken('t1', 500, 500);
      const token2 = mockToken('t2', 600, 500);
      const allTokens = [token1, token2];

      const result = sendTokensToCasualtyTray(['t1'], map, allTokens);

      assert.strictEqual(result.slainCount, 1);
      const moved = result.updatedTokens.find((t) => t.id === 't1')!;
      const unmoved = result.updatedTokens.find((t) => t.id === 't2')!;

      // Unmoved stays in place
      assert.strictEqual(unmoved.x, 600);
      assert.strictEqual(unmoved.y, 500);

      // Moved is placed inside the casualty tray
      assert(isPointInSubmap(result.tray, moved.x, moved.y));
      assert.strictEqual(moved.currentHp, 0);
      assert(moved.conditions.includes('Slain'));
    });

    it('sends models to strategic reserves submap', () => {
      const map = mockMap();
      const token1 = mockToken('t1', 500, 500);
      const allTokens = [token1];

      const result = sendTokensToStrategicReserves(['t1'], map, allTokens);

      assert.strictEqual(result.count, 1);
      const moved = result.updatedTokens.find((t) => t.id === 't1')!;
      assert(isPointInSubmap(result.reserves, moved.x, moved.y));
    });

    it('revives or deploys models back to the battlefield with restored HP', () => {
      const deadToken = mockToken('t1', 100, 3000, {
        currentHp: 0,
        maxHp: 3,
        conditions: ['Slain', 'Poisoned'],
      });
      const allTokens = [deadToken];

      const targetPos = { x: 750, y: 800 };
      const revived = reviveTokensToBattlefield(['t1'], targetPos, allTokens);

      const t1 = revived.find((t) => t.id === 't1')!;
      assert.strictEqual(t1.x, 750);
      assert.strictEqual(t1.y, 800);
      assert.strictEqual(t1.currentHp, 3); // Restored to maxHp
      assert(!t1.conditions.includes('Slain')); // Slain condition removed
      assert(t1.conditions.includes('Poisoned')); // Other conditions preserved
    });
  });
});
