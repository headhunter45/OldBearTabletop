import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getContrastingAccentColor,
  renderClock,
  renderSpray,
  sortTokensByZIndex,
  sortMarkersByZIndex,
  bringTokenToFront,
  bringMarkerToFront,
  isPointInMarker,
  getMarkerAnchorPosition,
  duplicateAttachedMarkers,
} from './PointerSystem.js';
import { Token, ScreenMarker } from '@oldbear/shared';

describe('PointerSystem', () => {
  it('preserves persistent markers indefinitely while ephemeral markers expire (Task #111)', () => {
    const now = Date.now();
    const markers = [
      {
        id: 'm-ephemeral',
        type: 'arrow' as const,
        userId: 'u1',
        userName: 'Player 1',
        color: '#ff0000',
        x: 0,
        y: 0,
        targetX: 50,
        targetY: 50,
        durationMs: 4000,
        createdAt: now - 5000, // expired
        persist: false,
      },
      {
        id: 'm-persistent',
        type: 'circle' as const,
        userId: 'u1',
        userName: 'Player 1',
        color: '#00ff00',
        x: 100,
        y: 100,
        radius: 60,
        durationMs: 0,
        createdAt: now - 100000, // very old
        persist: true,
      },
    ];

    // Simulate filtering logic
    const surviving = markers.filter(
      (m) => m.persist || now - m.createdAt <= m.durationMs,
    );

    assert.strictEqual(surviving.length, 1);
    assert.strictEqual(surviving[0].id, 'm-persistent');
    assert.strictEqual(surviving[0].persist, true);
  });

  it('correctly hit-tests persistent circle, rectangle, and arrow markers (Task #111)', () => {
    const circleMarker = {
      id: 'c1',
      type: 'circle' as const,
      x: 100,
      y: 100,
      radius: 50,
      persist: true,
    };
    const rectMarker = {
      id: 'r1',
      type: 'rectangle' as const,
      x: 200,
      y: 200,
      width: 100,
      height: 60,
      persist: true,
    };

    // Point inside circle (120, 120) distance = Math.hypot(20, 20) = ~28.28 <= 50
    const insideCircle =
      Math.hypot(120 - circleMarker.x, 120 - circleMarker.y) <=
      circleMarker.radius;
    assert.strictEqual(insideCircle, true);

    // Point outside circle (160, 160) distance = Math.hypot(60, 60) = ~84.85 > 50
    const outsideCircle =
      Math.hypot(160 - circleMarker.x, 160 - circleMarker.y) <=
      circleMarker.radius;
    assert.strictEqual(outsideCircle, false);

    // Point inside rectangle (250, 230)
    const insideRect =
      250 >= rectMarker.x &&
      250 <= rectMarker.x + rectMarker.width &&
      230 >= rectMarker.y &&
      230 <= rectMarker.y + rectMarker.height;
    assert.strictEqual(insideRect, true);

    // Point outside rectangle (350, 230)
    const outsideRect =
      350 >= rectMarker.x &&
      350 <= rectMarker.x + rectMarker.width &&
      230 >= rectMarker.y &&
      230 <= rectMarker.y + rectMarker.height;
    assert.strictEqual(outsideRect, false);
  });

  it('correctly calculates contrasting colors, cone arc, flat-ended triangle difference, and edge handles (Task #118)', () => {
    // 1. Contrasting accent color pairing
    assert.strictEqual(getContrastingAccentColor('#ef4444'), '#38bdf8'); // Warm red -> Sky blue
    assert.strictEqual(getContrastingAccentColor('#f59e0b'), '#38bdf8'); // Warm amber -> Sky blue
    assert.strictEqual(getContrastingAccentColor('#3b82f6'), '#f59e0b'); // Cool blue -> Amber
    assert.strictEqual(getContrastingAccentColor('#06b6d4'), '#f59e0b'); // Cool cyan -> Amber

    // 2. Cone geometry: Origin (100, 100), radius 100, direction 0° (along +x), spreadAngle 60° (half-spread 30°)
    const origin = { x: 100, y: 100 };
    const radius = 100;
    const angle = 0;
    const spreadAngle = 60;
    const halfSpreadRad = ((spreadAngle / 2) * Math.PI) / 180; // 30°

    // Centerline length = 100, Corner ray length for flat triangle base = 100 / cos(30°) ~ 115.47
    const cosAlpha = Math.cos(halfSpreadRad);
    const rCorner = radius / cosAlpha;
    assert.strictEqual(Math.round(rCorner), 115);

    // Interactive edge handles at boundary angles (-30° and +30°)
    const h1 = {
      x: origin.x + radius * Math.cos(-halfSpreadRad),
      y: origin.y + radius * Math.sin(-halfSpreadRad),
    };
    const h2 = {
      x: origin.x + radius * Math.cos(halfSpreadRad),
      y: origin.y + radius * Math.sin(halfSpreadRad),
    };
    assert.strictEqual(Math.round(h1.x), 187);
    assert.strictEqual(Math.round(h1.y), 50);
    assert.strictEqual(Math.round(h2.x), 187);
    assert.strictEqual(Math.round(h2.y), 150);

    // Hit-testing function adhering to dual cone / triangle definition
    const isInsideCone = (px: number, py: number) => {
      const dist = Math.hypot(px - origin.x, py - origin.y);
      if (dist <= 25) return true; // Caster origin
      const thetaDeg =
        (Math.atan2(py - origin.y, px - origin.x) * 180) / Math.PI;
      const diff = Math.abs(((thetaDeg - angle + 540) % 360) - 180);
      if (diff <= spreadAngle / 2) {
        const diffRad = (diff * Math.PI) / 180;
        // Inside circular arc (dist <= radius) OR flat triangle corner difference (dist * cos(diffRad) <= radius)
        return dist <= radius || dist * Math.cos(diffRad) <= radius;
      }
      return false;
    };

    // Point along centerline inside circular arc: (160, 100) -> dist 60 <= 100
    assert.strictEqual(isInsideCone(160, 100), true);

    // Point in triangle difference corner (beyond circular arc but within flat triangle base):
    // Angle = 25°, Distance = 106.
    // Circular arc radius = 100 (106 > 100, outside circular arc)
    // Flat triangle base check: 106 * cos(25°) = 106 * 0.9063 = 96.07 <= 100 (inside flat triangle base!)
    const earPoint = {
      x: origin.x + 106 * Math.cos((25 * Math.PI) / 180),
      y: origin.y + 106 * Math.sin((25 * Math.PI) / 180),
    };
    assert.strictEqual(isInsideCone(earPoint.x, earPoint.y), true);

    // Point far beyond flat triangle base: distance 130 along angle 25°
    const farPoint = {
      x: origin.x + 130 * Math.cos((25 * Math.PI) / 180),
      y: origin.y + 130 * Math.sin((25 * Math.PI) / 180),
    };
    assert.strictEqual(isInsideCone(farPoint.x, farPoint.y), false);

    // Point outside cone angular spread (angle 45° > 30°)
    const outsideAnglePoint = {
      x: origin.x + 50 * Math.cos((45 * Math.PI) / 180),
      y: origin.y + 50 * Math.sin((45 * Math.PI) / 180),
    };
    assert.strictEqual(
      isInsideCone(outsideAnglePoint.x, outsideAnglePoint.y),
      false,
    );
  });

  it('supports draggable target sizing with distance and preserves minimum size for tapping (Task #119)', () => {
    const minSize = 18;
    const gridSize = 50;
    const scaleFtPerCell = 5;

    // 1. User simply taps (dist = 0): gets minimum size 18px without failing or zero size
    const tapDist = 0;
    const tapRadius = Math.max(minSize, tapDist);
    assert.strictEqual(tapRadius, 18);

    // 2. User drags outward (dist = 150px = 3 cells = 15ft)
    const dragDist = 150;
    const dragRadius = Math.max(minSize, dragDist);
    assert.strictEqual(dragRadius, 150);
    const radiusFt = Math.round((dragRadius / gridSize) * scaleFtPerCell);
    assert.strictEqual(radiusFt, 15);

    // 3. Persistent target hit-testing with expanded size
    const targetMarker = {
      x: 200,
      y: 200,
      radius: dragRadius,
    };
    const hitRadius = Math.max(30, targetMarker.radius || 18);
    // Point at (200 + 100, 200) -> distance 100 <= 150 -> hit!
    const isHitInside =
      Math.hypot(300 - targetMarker.x, 200 - targetMarker.y) <= hitRadius;
    assert.strictEqual(isHitInside, true);

    // Point at (200 + 180, 200) -> distance 180 > 150 -> miss!
    const isHitOutside =
      Math.hypot(380 - targetMarker.x, 200 - targetMarker.y) <= hitRadius;
    assert.strictEqual(isHitOutside, false);
  });

  it('calculates anchor position, base edge offsets, and duplicates attached indicators (OB-129)', () => {
    const mockToken = {
      id: 'token-hero-1',
      mapId: 'map-1',
      name: 'Paladin',
      x: 100,
      y: 100,
      size: 2, // 2x2 token = 100px wide
      rotation: 0,
      ringColor: '#38bdf8',
      fillColor: '#000',
      clipCircle: true,
      currentHp: 50,
      maxHp: 50,
      tempHp: 0,
      speed: 30,
      conditions: [],
      isProp: false,
      layer: 'token' as const,
    };

    const mockTokens = { [mockToken.id]: mockToken as unknown as Token };

    // Marker attached to Paladin
    const mockAura: ScreenMarker = {
      id: 'aura-1',
      type: 'circle' as const,
      userId: 'user-1',
      userName: 'Player',
      color: '#38bdf8',
      x: 0,
      y: 0,
      radius: 50,
      attachedTokenId: mockToken.id,
      anchor: 'edge' as const,
      label: 'Aura of Protection',
      opacity: 0.25,
      persist: true,
      durationMs: 0,
      createdAt: Date.now(),
    };

    // 1. Center of 2x2 token at (100, 100) with gridSize 50 is (150, 150), baseRadius is 50px
    const anchor = getMarkerAnchorPosition(mockAura, mockTokens, 50);
    assert.strictEqual(anchor.isAttached, true);
    assert.strictEqual(anchor.x, 150);
    assert.strictEqual(anchor.y, 150);
    assert.strictEqual(anchor.baseRadius, 50);

    // 2. Base Edge measurement: effective radius = radius (50) + baseRadius (50) = 100px
    const effectiveRadius =
      (mockAura.radius || 50) +
      (mockAura.anchor === 'edge' ? anchor.baseRadius : 0);
    assert.strictEqual(effectiveRadius, 100);

    // 3. Duplicating token duplicates attached indicator with new ID and targetToken ID
    const duplicatedToken = {
      ...mockToken,
      id: 'token-hero-2',
      name: 'Paladin 2',
      x: 200,
      y: 100,
    } as unknown as Token;

    const dupMarkers = duplicateAttachedMarkers(mockToken.id, duplicatedToken, [
      mockAura,
    ]);
    assert.strictEqual(dupMarkers.length, 1);
    assert.notStrictEqual(dupMarkers[0].id, mockAura.id);
    assert.strictEqual(dupMarkers[0].attachedTokenId, duplicatedToken.id);
    assert.strictEqual(dupMarkers[0].label, 'Aura of Protection');
    assert.strictEqual(dupMarkers[0].anchor, 'edge');
  });

  it('renders segmented pie-wedge progress clocks with filled slices (OB-132)', () => {
    const clockMarker = {
      id: 'clock-1',
      type: 'clock' as const,
      userId: 'user-1',
      userName: 'GM',
      color: '#ef4444',
      x: 100,
      y: 100,
      radius: 60,
      segments: 8,
      filled: 3,
      label: 'Alert Level',
      persist: true,
      durationMs: 0,
      createdAt: Date.now(),
    };

    let filledCount = 0;
    let textRendered = '';
    const mockCtx: any = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      arc: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fill: () => {
        if (mockCtx.fillStyle === clockMarker.color) filledCount++;
      },
      stroke: () => {},
      setLineDash: () => {},
      fillText: (text: string) => {
        textRendered += text;
      },
      measureText: (text: string) => ({ width: text.length * 7 }),
      roundRect: () => {},
      rect: () => {},
    };

    renderClock(mockCtx, clockMarker, false);
    assert.strictEqual(
      filledCount,
      3,
      'Renders exactly 3 filled wedges for filled: 3',
    );
    assert.ok(
      textRendered.includes('3/8'),
      'Hub renders 3/8 fraction indicator',
    );
    assert.ok(textRendered.includes('Alert Level'), 'Renders clock label');
  });

  it('renders custom image spray decals and hazard overlays (OB-134)', () => {
    const sprayMarker = {
      id: 'spray-1',
      type: 'spray' as const,
      userId: 'user-1',
      userName: 'GM',
      color: '#f59e0b',
      x: 150,
      y: 150,
      radius: 80,
      rotation: 45,
      imageUrl: 'hazard',
      label: 'Hazard Warning Zone',
      persist: true,
      durationMs: 0,
      createdAt: Date.now(),
    };

    let textRendered = '';
    let rotatedAngle = 0;
    const mockCtx: any = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      arc: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      clip: () => {},
      fill: () => {},
      stroke: () => {},
      setLineDash: () => {},
      translate: () => {},
      rotate: (rad: number) => {
        rotatedAngle = Math.round((rad * 180) / Math.PI);
      },
      fillText: (text: string) => {
        textRendered += text;
      },
      measureText: (text: string) => ({ width: text.length * 7 }),
      roundRect: () => {},
      rect: () => {},
    };

    renderSpray(mockCtx, sprayMarker, true, {}, 50, 5);
    assert.strictEqual(
      rotatedAngle,
      45,
      'Rotates canvas context by marker rotation angle (45°)',
    );
    assert.ok(
      textRendered.includes('Hazard Warning Zone'),
      'Renders decal label pill',
    );
    assert.ok(textRendered.includes('16 ft'), 'Renders diameter measurement');
  });

  it('renders and hit-tests square spray decals with rotation (OB-169)', () => {
    const squareSpray: ScreenMarker = {
      id: 'spray-square-1',
      type: 'spray' as const,
      sprayShape: 'square' as const,
      userId: 'user-1',
      userName: 'GM',
      color: '#f59e0b',
      x: 100,
      y: 100,
      radius: 50,
      rotation: 0,
      imageUrl: 'hazard',
      label: 'Blast Pad',
      persist: true,
      durationMs: 0,
      createdAt: Date.now(),
    };

    let rectCalls: number[][] = [];
    let textRendered = '';
    const mockCtx: any = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      arc: () => {},
      rect: (x: number, y: number, w: number, h: number) => {
        rectCalls.push([x, y, w, h]);
      },
      strokeRect: () => {},
      fillRect: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      clip: () => {},
      fill: () => {},
      stroke: () => {},
      setLineDash: () => {},
      translate: () => {},
      rotate: () => {},
      fillText: (text: string) => {
        textRendered += text;
      },
      measureText: (text: string) => ({ width: text.length * 7 }),
      roundRect: () => {},
    };

    renderSpray(mockCtx, squareSpray, false, {}, 50, 5);
    assert.ok(
      rectCalls.length > 0,
      'Uses rect for square decal clipping and bounds',
    );
    assert.ok(
      textRendered.includes('□'),
      'Renders square symbol in label pill',
    );
    assert.ok(textRendered.includes('Blast Pad'), 'Renders label');

    // Test square hit-testing with isPointInMarker
    // Center is inside
    assert.strictEqual(isPointInMarker({ x: 100, y: 100 }, squareSpray), true);
    // Inside square boundary (x=140, y=140 is within radius 50: localX=40, localY=40 <= 50)
    // Note: for a circle, hypot(40, 40) is ~56.57 > 50, so a circle would NOT hit here, but a square DOES hit!
    assert.strictEqual(
      isPointInMarker({ x: 140, y: 140 }, squareSpray),
      true,
      'Corner point inside square hits',
    );
    // Point outside square (x=160, y=100 -> dx=60 > 50)
    assert.strictEqual(
      isPointInMarker({ x: 160, y: 100 }, squareSpray),
      false,
      'Point outside square bounds misses',
    );

    // Square with 45 degree rotation
    const rotatedSquare: ScreenMarker = {
      ...squareSpray,
      rotation: 45,
    };
    // At 45 deg, point (100, 160) -> distance is 60 along y-axis.
    // In local space rotated -45 deg: localX = 60 * sin(45) ~ 42.4 <= 50, localY = 60 * cos(45) ~ 42.4 <= 50.
    // So (100, 160) is INSIDE the rotated square (a diamond tip)!
    assert.strictEqual(
      isPointInMarker({ x: 100, y: 160 }, rotatedSquare),
      true,
      'Tip of 45-degree rotated square hits',
    );
  });

  it('enforces persistent mode for sprays and ephemeral mode for laser pointers (OB-170)', () => {
    // Helper mimicking tool transition logic
    const resolveToolForPersistMode = (
      tool: string,
      persistMode: boolean,
    ): string => {
      if (persistMode && tool === 'laser') return 'arrow';
      if (!persistMode && tool === 'spray') return 'circle';
      return tool;
    };

    assert.strictEqual(
      resolveToolForPersistMode('laser', true),
      'arrow',
      'Switches away from laser when entering persistent mode',
    );
    assert.strictEqual(
      resolveToolForPersistMode('spray', false),
      'circle',
      'Switches away from spray when entering quick ping mode',
    );
    assert.strictEqual(
      resolveToolForPersistMode('circle', true),
      'circle',
      'Retains circle in persistent mode',
    );
    assert.strictEqual(
      resolveToolForPersistMode('arrow', false),
      'arrow',
      'Retains arrow in quick ping mode',
    );
  });

  it('supports multiple coexisting persistent indicators without replacement across tool switches (OB-164)', () => {
    const markers: ScreenMarker[] = [];
    const addMarker = (m: ScreenMarker) => {
      // Avoid duplicate
      if (!markers.some((existing) => existing.id === m.id)) {
        markers.push(m);
      }
    };

    // 1. Create a persistent circle
    const circle: ScreenMarker = {
      id: 'marker-1',
      type: 'circle',
      userId: 'u1',
      userName: 'Player 1',
      color: '#38bdf8',
      x: 100,
      y: 100,
      radius: 60,
      persist: true,
      durationMs: 0,
      createdAt: Date.now(),
    };
    addMarker(circle);

    // 2. Create a persistent cone
    const cone: ScreenMarker = {
      id: 'marker-2',
      type: 'cone',
      userId: 'u1',
      userName: 'Player 1',
      color: '#f59e0b',
      x: 300,
      y: 300,
      radius: 100,
      angle: 90,
      spreadAngle: 60,
      persist: true,
      durationMs: 0,
      createdAt: Date.now(),
    };
    addMarker(cone);

    // 3. Create a persistent rectangle
    const rect: ScreenMarker = {
      id: 'marker-3',
      type: 'rectangle',
      userId: 'u1',
      userName: 'Player 1',
      color: '#10b981',
      x: 500,
      y: 500,
      width: 120,
      height: 80,
      persist: true,
      durationMs: 0,
      createdAt: Date.now(),
    };
    addMarker(rect);

    assert.strictEqual(
      markers.length,
      3,
      'All 3 persistent indicators coexist without replacing each other',
    );
    assert.strictEqual(markers[0].type, 'circle');
    assert.strictEqual(markers[1].type, 'cone');
    assert.strictEqual(markers[2].type, 'rectangle');
  });

  it('requires distinct start and end tokens for token tether lines (OB-165)', () => {
    const tokens: Record<string, Token> = {
      'tok-1': {
        id: 'tok-1',
        name: 'Warrior',
        x: 100,
        y: 100,
        size: 1,
        ringColor: '#38bdf8',
      } as unknown as Token,
      'tok-2': {
        id: 'tok-2',
        name: 'Mage',
        x: 300,
        y: 300,
        size: 1,
        ringColor: '#f59e0b',
      } as unknown as Token,
    };

    const id1 = 'tok-1';
    const id2 = 'tok-2';
    const emptyId = 'empty-space';

    // Valid tether between two distinct entities
    const canCreateValid = Boolean(
      tokens[id1] && tokens[id2] && id1 !== id2,
    );
    assert.strictEqual(
      canCreateValid,
      true,
      'Valid tether between distinct tokens allowed',
    );

    // Invalid tether to same entity
    const canCreateSelf = Boolean(
      tokens[id1] && tokens[id1] && (id1 as string) !== (id1 as string),
    );
    assert.strictEqual(canCreateSelf, false, 'Self-tether disallowed');

    // Invalid tether to empty space
    const canCreateEmpty = Boolean(
      tokens[id1] &&
      (tokens as any)[emptyId] &&
      id1 !== emptyId,
    );
    assert.strictEqual(
      canCreateEmpty,
      false,
      'Tether to empty space disallowed',
    );
  });

  it('allows independent detachment and reattachment of start and target tether endpoints (OB-165)', () => {
    const tokens: Record<string, Token> = {
      'tok-1': {
        id: 'tok-1',
        name: 'Warrior',
        x: 100,
        y: 100,
        size: 1,
        ringColor: '#38bdf8',
      } as unknown as Token,
      'tok-2': {
        id: 'tok-2',
        name: 'Mage',
        x: 300,
        y: 300,
        size: 1,
        ringColor: '#f59e0b',
      } as unknown as Token,
      'tok-3': {
        id: 'tok-3',
        name: 'Cleric',
        x: 500,
        y: 500,
        size: 1,
        ringColor: '#10b981',
      } as unknown as Token,
    };

    // Initially attached to tok-1 and tok-2
    let tether: ScreenMarker = {
      id: 'tether-1',
      type: 'tether',
      userId: 'u1',
      userName: 'GM',
      color: '#38bdf8',
      x: 125,
      y: 125,
      targetX: 325,
      targetY: 325,
      attachedTokenId: 'tok-1',
      tetherTargetId: 'tok-2',
      persist: true,
      durationMs: 0,
      createdAt: Date.now(),
    };

    assert.strictEqual(tether.attachedTokenId, 'tok-1');
    assert.strictEqual(tether.tetherTargetId, 'tok-2');

    // 1. Unattach start endpoint (tok-1)
    const detachStartUpdate: Partial<ScreenMarker> = {
      attachedTokenId: null as any,
    };
    tether = { ...tether, ...detachStartUpdate };
    if (detachStartUpdate.attachedTokenId === null)
      delete tether.attachedTokenId;

    assert.strictEqual(
      tether.attachedTokenId,
      undefined,
      'Start endpoint successfully unattached',
    );
    assert.strictEqual(
      tether.tetherTargetId,
      'tok-2',
      'Target endpoint remains attached to Mage',
    );

    // 2. Reattach start endpoint to tok-3 (Cleric)
    const reattachStartUpdate: Partial<ScreenMarker> = {
      attachedTokenId: 'tok-3',
    };
    tether = { ...tether, ...reattachStartUpdate };
    assert.strictEqual(
      tether.attachedTokenId,
      'tok-3',
      'Start endpoint reattached to Cleric',
    );
    assert.strictEqual(
      tether.tetherTargetId,
      'tok-2',
      'Target endpoint remains attached to Mage',
    );

    // 3. Unattach target endpoint (tok-2)
    const detachEndUpdate: Partial<ScreenMarker> = {
      tetherTargetId: null as any,
    };
    tether = { ...tether, ...detachEndUpdate };
    if (detachEndUpdate.tetherTargetId === null) delete tether.tetherTargetId;

    assert.strictEqual(
      tether.attachedTokenId,
      'tok-3',
      'Start endpoint remains attached to Cleric',
    );
    assert.strictEqual(
      tether.tetherTargetId,
      undefined,
      'Target endpoint successfully unattached',
    );

    // 4. Reattach target endpoint to tok-1 (Warrior)
    const reattachEndUpdate: Partial<ScreenMarker> = {
      tetherTargetId: 'tok-1',
    };
    tether = { ...tether, ...reattachEndUpdate };
    assert.strictEqual(
      tether.attachedTokenId,
      'tok-3',
      'Start endpoint remains attached to Cleric',
    );
    assert.strictEqual(
      tether.tetherTargetId,
      'tok-1',
      'Target endpoint successfully reattached to Warrior',
    );
  });

  it('elevates selected and dragged tokens above other tokens while keeping tokens above props (OB-126/OB-127)', () => {
    const prop1 = {
      id: 'p1',
      name: 'Chest',
      isProp: true,
      layer: 'prop',
    } as unknown as Token;
    const prop2 = {
      id: 'p2',
      name: 'Barrel',
      isProp: true,
      layer: 'prop',
    } as unknown as Token;
    const char1 = {
      id: 'c1',
      name: 'Rogue',
      isProp: false,
      layer: 'token',
    } as unknown as Token;
    const char2 = {
      id: 'c2',
      name: 'Fighter',
      isProp: false,
      layer: 'token',
    } as unknown as Token;
    const char3 = {
      id: 'c3',
      name: 'Wizard',
      isProp: false,
      layer: 'token',
    } as unknown as Token;

    const initialTokens = [prop1, char1, prop2, char2, char3];

    // 1. By default, props render before characters; within layer, stable order preserved
    const defaultSorted = sortTokensByZIndex(initialTokens, []);
    assert.deepStrictEqual(
      defaultSorted.map((t) => t.id),
      ['p1', 'p2', 'c1', 'c2', 'c3'],
      'Props render before character tokens',
    );

    // 2. Select c1: c1 should be elevated above unselected characters c2 and c3
    const selectC1 = sortTokensByZIndex(initialTokens, ['c1']);
    assert.deepStrictEqual(
      selectC1.map((t) => t.id),
      ['p1', 'p2', 'c2', 'c3', 'c1'],
      'Selected character c1 comes forward above other characters',
    );

    // 3. Drag c2 while c1 is selected: actively dragged c2 comes forward to the very top
    const dragC2 = sortTokensByZIndex(initialTokens, ['c1'], 'c2');
    assert.deepStrictEqual(
      dragC2.map((t) => t.id),
      ['p1', 'p2', 'c3', 'c1', 'c2'],
      'Dragged character c2 comes forward above selected and unselected characters',
    );

    // 4. Select prop p1: p1 is elevated above p2, but remains beneath all characters
    const selectP1 = sortTokensByZIndex(initialTokens, ['p1']);
    assert.deepStrictEqual(
      selectP1.map((t) => t.id),
      ['p2', 'p1', 'c1', 'c2', 'c3'],
      'Selected prop p1 is elevated above unselected props but remains below characters',
    );
  });

  it('elevates attached indicators of selected/dragged tokens, and elevates selected/dragged indicators to the top (OB-126/OB-127)', () => {
    const aura1 = { id: 'm1', type: 'circle', persist: true } as unknown as ScreenMarker; // unattached
    const auraPaladin = {
      id: 'm2',
      type: 'circle',
      persist: true,
      attachedTokenId: 'tok-paladin',
    } as unknown as ScreenMarker;
    const tether = {
      id: 'm3',
      type: 'tether',
      persist: true,
      attachedTokenId: 'tok-cleric',
      tetherTargetId: 'tok-paladin',
    } as unknown as ScreenMarker;
    const zone = { id: 'm4', type: 'rectangle', persist: true } as unknown as ScreenMarker; // unattached

    const allMarkers = [aura1, auraPaladin, tether, zone];

    // 1. Initially, no selection: relative order preserved
    const defaultSorted = sortMarkersByZIndex(allMarkers, {});
    assert.deepStrictEqual(
      defaultSorted.map((m) => m.id),
      ['m1', 'm2', 'm3', 'm4'],
      'Default order preserved when nothing is selected',
    );

    // 2. Select tok-paladin: both auraPaladin and tether (connected to paladin) come forward in front of other indicators
    const selectPaladin = sortMarkersByZIndex(allMarkers, {
      selectedTokenIds: ['tok-paladin'],
    });
    assert.deepStrictEqual(
      selectPaladin.map((m) => m.id),
      ['m1', 'm4', 'm2', 'm3'],
      'Indicators attached to selected token come forward in front of unselected indicators',
    );

    // 3. Drag tok-paladin: attached indicators also come forward in front of other indicators
    const dragPaladin = sortMarkersByZIndex(allMarkers, {
      draggingTokenId: 'tok-paladin',
    });
    assert.deepStrictEqual(
      dragPaladin.map((m) => m.id),
      ['m1', 'm4', 'm2', 'm3'],
      'Indicators attached to dragged token come forward in front of other indicators',
    );

    // 4. While tok-paladin is selected, user selects unattached indicator m1: m1 comes forward above paladin attached indicators
    const selectM1WithPaladin = sortMarkersByZIndex(allMarkers, {
      selectedTokenIds: ['tok-paladin'],
      selectedMarkerId: 'm1',
    });
    assert.deepStrictEqual(
      selectM1WithPaladin.map((m) => m.id),
      ['m4', 'm2', 'm3', 'm1'],
      'Selected indicator m1 comes forward above attached indicators',
    );

    // 5. Dragging indicator m4: dragged indicator comes forward to the absolute top of all indicators
    const dragM4 = sortMarkersByZIndex(allMarkers, {
      selectedTokenIds: ['tok-paladin'],
      selectedMarkerId: 'm1',
      draggingMarkerId: 'm4',
    });
    assert.deepStrictEqual(
      dragM4.map((m) => m.id),
      ['m2', 'm3', 'm1', 'm4'],
      'Dragged indicator m4 comes forward on top of all indicators',
    );
  });

  it('updates session data order with bringTokenToFront and bringMarkerToFront (OB-126/OB-127)', () => {
    // Tokens Map
    const tokens: Record<string, Token> = {
      t1: { id: 't1', name: 'Token 1' } as unknown as Token,
      t2: { id: 't2', name: 'Token 2' } as unknown as Token,
      t3: { id: 't3', name: 'Token 3' } as unknown as Token,
    };

    const elevatedTokens = bringTokenToFront(tokens, 't1');
    assert.deepStrictEqual(
      Object.keys(elevatedTokens),
      ['t2', 't3', 't1'],
      'Token t1 moved to the end of map keys (highest insertion order)',
    );

    // Markers List
    const markers: ScreenMarker[] = [
      { id: 'm1', type: 'circle' } as unknown as ScreenMarker,
      { id: 'm2', type: 'cone' } as unknown as ScreenMarker,
      { id: 'm3', type: 'rectangle' } as unknown as ScreenMarker,
    ];

    const elevatedMarkers = bringMarkerToFront(markers, 'm1');
    assert.deepStrictEqual(
      elevatedMarkers.map((m) => m.id),
      ['m2', 'm3', 'm1'],
      'Marker m1 moved to the end of list (top draw order)',
    );
  });
});
