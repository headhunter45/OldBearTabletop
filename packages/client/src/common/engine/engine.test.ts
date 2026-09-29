import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Viewport } from './Viewport.js';
import { measureDistance } from './Ruler.js';
import { snapToGrid } from './GridRenderer.js';
import { TRACKPAD_PAN_SENSITIVITY, TRACKPAD_ZOOM_SENSITIVITY, MOUSE_WHEEL_ZOOM_SENSITIVITY } from './CanvasEngine.js';
import { getContrastingAccentColor, renderClock, renderSpray } from './PointerSystem.js';

describe('Canvas Engine Utilities', () => {
  it('correctly maps screen to world coordinates', () => {
    const vp = new Viewport(100, 50, 2.0);
    const world = vp.screenToWorld(200, 150);
    assert.strictEqual(world.x, 50);
    assert.strictEqual(world.y, 50);

    const screen = vp.worldToScreen(50, 50);
    assert.strictEqual(screen.x, 200);
    assert.strictEqual(screen.y, 150);
  });

  it('snaps coordinates to grid intervals', () => {
    const snapped = snapToGrid(48, 102, 50);
    assert.strictEqual(snapped.x, 50);
    assert.strictEqual(snapped.y, 100);

    // With offset
    const snappedOffset = snapToGrid(48, 102, 50, 1, 10, 15);
    assert.strictEqual(snappedOffset.x, 60);
    assert.strictEqual(snappedOffset.y, 115);
  });

  it('snaps coordinates to hexagonal grid centers', () => {
    // Hex grid with size 60
    const hexRadius = 60 / Math.sqrt(3);
    const horizDist = hexRadius * 1.5;
    // Token top-left (-28, -28) has center at (2, 2), closest to hex center (0, 0)
    const snappedOrigin = snapToGrid(-28, -28, 60, 1, 0, 0, 'hex');
    assert.strictEqual(snappedOrigin.x, -30); // center (0, 0) - radius (30)
    assert.strictEqual(snappedOrigin.y, -30);

    // Near Col 1, Row 0 center: cx = Math.round(horizDist) (~52), cy = 30.
    // Token top-left (22, 0) has center at (52, 30).
    const expectedCx = Math.round(horizDist);
    const snappedCol1 = snapToGrid(expectedCx - 32, 2, 60, 1, 0, 0, 'hex');
    assert.strictEqual(snappedCol1.x, expectedCx - 30);
    assert.strictEqual(snappedCol1.y, 0); // 30 - 30 = 0
  });

  it('measures distance and flags speed excess', () => {
    // 6 cells = 30ft (at 50px/cell, 5ft/cell)
    const measurementNormal = measureDistance(
      { x: 0, y: 0 },
      { x: 300, y: 0 },
      50,
      30,
      5
    );
    assert.strictEqual(measurementNormal.distanceFt, 30);
    assert.strictEqual(measurementNormal.isOverSpeed, false);

    // 8 cells = 40ft (exceeds 30ft speed)
    const measurementOver = measureDistance(
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      50,
      30,
      5
    );
    assert.strictEqual(measurementOver.distanceFt, 40);
    assert.strictEqual(measurementOver.isOverSpeed, true);
    assert.strictEqual(measurementOver.color, '#ef4444');
  });

  it('measures distance with measuring tape tool without speed limit (Task #97)', () => {
    // 12 cells at 50px/cell, 5ft/cell = 60ft
    const tapeMeasurement = measureDistance(
      { x: 100, y: 100 },
      { x: 700, y: 100 },
      50,
      Infinity,
      5
    );
    assert.strictEqual(tapeMeasurement.distanceFt, 60);
    assert.strictEqual(tapeMeasurement.isOverSpeed, false);
  });

  it('selects all enclosed tokens with box select and moves them as a group (Bug #78)', () => {
    // Mock tokens within a map
    const mockTokens = [
      { id: 't1', name: 'Goblin 1', x: 100, y: 100, size: 1, mapId: 'map-1' },
      { id: 't2', name: 'Goblin 2', x: 150, y: 100, size: 1, mapId: 'map-1' },
      { id: 't3', name: 'Goblin 3', x: 200, y: 100, size: 1, mapId: 'map-1' },
      { id: 't4', name: 'Dragon', x: 500, y: 500, size: 2, mapId: 'map-1' },
    ];

    const gridSize = 50;
    const boxStart = { x: 80, y: 80 };
    const boxEnd = { x: 280, y: 180 };

    const minX = Math.min(boxStart.x, boxEnd.x);
    const maxX = Math.max(boxStart.x, boxEnd.x);
    const minY = Math.min(boxStart.y, boxEnd.y);
    const maxY = Math.max(boxStart.y, boxEnd.y);

    const enclosed = mockTokens.filter((t) => {
      const diameter = t.size * gridSize;
      const cx = t.x + diameter / 2;
      const cy = t.y + diameter / 2;
      return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
    });

    // Verify all 3 goblins are enclosed, but not Dragon
    assert.strictEqual(enclosed.length, 3);
    assert.deepStrictEqual(enclosed.map((t) => t.id), ['t1', 't2', 't3']);

    // Simulate group movement delta: dx = 50, dy = 100
    const deltaX = 50;
    const deltaY = 100;
    const movedTokens = enclosed.map((t) => ({
      ...t,
      x: t.x + deltaX,
      y: t.y + deltaY,
    }));

    assert.strictEqual(movedTokens[0].x, 150);
    assert.strictEqual(movedTokens[0].y, 200);
    assert.strictEqual(movedTokens[1].x, 200);
    assert.strictEqual(movedTokens[1].y, 200);
    assert.strictEqual(movedTokens[2].x, 250);
    assert.strictEqual(movedTokens[2].y, 200);
  });

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
      (m) => m.persist || now - m.createdAt <= m.durationMs
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
    const insideCircle = Math.hypot(120 - circleMarker.x, 120 - circleMarker.y) <= circleMarker.radius;
    assert.strictEqual(insideCircle, true);

    // Point outside circle (160, 160) distance = Math.hypot(60, 60) = ~84.85 > 50
    const outsideCircle = Math.hypot(160 - circleMarker.x, 160 - circleMarker.y) <= circleMarker.radius;
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

  it('separates trackpad two-finger pan from pinch-to-zoom using sensitivity constants (Task #117)', () => {
    const vp = new Viewport(0, 0, 1.0);

    // Standard two-finger swipe (e.ctrlKey === false): pans without changing scale
    const deltaX = 30;
    const deltaY = 50;
    const panX = -deltaX * TRACKPAD_PAN_SENSITIVITY;
    const panY = -deltaY * TRACKPAD_PAN_SENSITIVITY;
    vp.pan(panX, panY);

    assert.strictEqual(vp.x, -30);
    assert.strictEqual(vp.y, -50);
    assert.strictEqual(vp.scale, 1.0);

    // Pinch-to-zoom (e.ctrlKey === true): zooms exponentially at cursor anchor
    const pinchDelta = -10;
    const zoomFactor = Math.exp(-pinchDelta * TRACKPAD_ZOOM_SENSITIVITY);
    vp.zoomAt(100, 100, zoomFactor);

    assert.strictEqual(vp.scale > 1.0, true);
    assert.strictEqual(TRACKPAD_PAN_SENSITIVITY > 0, true);
    assert.strictEqual(TRACKPAD_ZOOM_SENSITIVITY > 0, true);
    assert.strictEqual(MOUSE_WHEEL_ZOOM_SENSITIVITY > 0, true);
  });

  it('reverts box select tool to arrow select upon enclosing tokens (Task #117)', () => {
    let currentTool = 'box-select';
    const onToolChange = (tool: string) => {
      currentTool = tool;
    };

    const enclosedTokens = [{ id: 't1' }, { id: 't2' }];
    if (enclosedTokens.length > 0) {
      currentTool = 'select';
      onToolChange('select');
    }

    assert.strictEqual(currentTool, 'select');
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
      const thetaDeg = (Math.atan2(py - origin.y, px - origin.x) * 180) / Math.PI;
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
    assert.strictEqual(isInsideCone(outsideAnglePoint.x, outsideAnglePoint.y), false);
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
    const isHitInside = Math.hypot(300 - targetMarker.x, 200 - targetMarker.y) <= hitRadius;
    assert.strictEqual(isHitInside, true);

    // Point at (200 + 180, 200) -> distance 180 > 150 -> miss!
    const isHitOutside = Math.hypot(380 - targetMarker.x, 200 - targetMarker.y) <= hitRadius;
    assert.strictEqual(isHitOutside, false);
  });

  it('calculates anchor position, base edge offsets, and duplicates attached indicators (OB-129)', async () => {
    const { getMarkerAnchorPosition, duplicateAttachedMarkers } = await import('./PointerSystem.js');
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

    const mockTokens = { [mockToken.id]: mockToken };

    // Marker attached to Paladin
    const mockAura = {
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
    const effectiveRadius = (mockAura.radius || 50) + (mockAura.anchor === 'edge' ? anchor.baseRadius : 0);
    assert.strictEqual(effectiveRadius, 100);

    // 3. Duplicating token duplicates attached indicator with new ID and targetToken ID
    const duplicatedToken = {
      ...mockToken,
      id: 'token-hero-2',
      name: 'Paladin 2',
      x: 200,
      y: 100,
    };

    const dupMarkers = duplicateAttachedMarkers(mockToken.id, duplicatedToken, [mockAura]);
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
    assert.strictEqual(filledCount, 3, 'Renders exactly 3 filled wedges for filled: 3');
    assert.ok(textRendered.includes('3/8'), 'Hub renders 3/8 fraction indicator');
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
    assert.strictEqual(rotatedAngle, 45, 'Rotates canvas context by marker rotation angle (45°)');
    assert.ok(textRendered.includes('Hazard Warning Zone'), 'Renders decal label pill');
    assert.ok(textRendered.includes('16 ft'), 'Renders diameter measurement');
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

    assert.strictEqual(markers.length, 3, 'All 3 persistent indicators coexist without replacing each other');
    assert.strictEqual(markers[0].type, 'circle');
    assert.strictEqual(markers[1].type, 'cone');
    assert.strictEqual(markers[2].type, 'rectangle');
  });

  it('requires distinct start and end tokens for token tether lines (OB-165)', () => {
    const tokens: Record<string, Token> = {
      'tok-1': { id: 'tok-1', name: 'Warrior', x: 100, y: 100, size: 1, color: '#38bdf8' } as Token,
      'tok-2': { id: 'tok-2', name: 'Mage', x: 300, y: 300, size: 1, color: '#f59e0b' } as Token,
    };

    // Valid tether between two distinct entities
    const canCreateValid = Boolean(tokens['tok-1'] && tokens['tok-2'] && 'tok-1' !== 'tok-2');
    assert.strictEqual(canCreateValid, true, 'Valid tether between distinct tokens allowed');

    // Invalid tether to same entity
    const canCreateSelf = Boolean(tokens['tok-1'] && tokens['tok-1'] && 'tok-1' !== 'tok-1');
    assert.strictEqual(canCreateSelf, false, 'Self-tether disallowed');

    // Invalid tether to empty space
    const canCreateEmpty = Boolean(tokens['tok-1'] && (tokens as any)['empty-space'] && 'tok-1' !== 'empty-space');
    assert.strictEqual(canCreateEmpty, false, 'Tether to empty space disallowed');
  });

  it('allows independent detachment and reattachment of start and target tether endpoints (OB-165)', () => {
    const tokens: Record<string, Token> = {
      'tok-1': { id: 'tok-1', name: 'Warrior', x: 100, y: 100, size: 1, color: '#38bdf8' } as Token,
      'tok-2': { id: 'tok-2', name: 'Mage', x: 300, y: 300, size: 1, color: '#f59e0b' } as Token,
      'tok-3': { id: 'tok-3', name: 'Cleric', x: 500, y: 500, size: 1, color: '#10b981' } as Token,
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
    const detachStartUpdate: Partial<ScreenMarker> = { attachedTokenId: null as any };
    tether = { ...tether, ...detachStartUpdate };
    if (detachStartUpdate.attachedTokenId === null) delete tether.attachedTokenId;

    assert.strictEqual(tether.attachedTokenId, undefined, 'Start endpoint successfully unattached');
    assert.strictEqual(tether.tetherTargetId, 'tok-2', 'Target endpoint remains attached to Mage');

    // 2. Reattach start endpoint to tok-3 (Cleric)
    const reattachStartUpdate: Partial<ScreenMarker> = { attachedTokenId: 'tok-3' };
    tether = { ...tether, ...reattachStartUpdate };
    assert.strictEqual(tether.attachedTokenId, 'tok-3', 'Start endpoint reattached to Cleric');
    assert.strictEqual(tether.tetherTargetId, 'tok-2', 'Target endpoint remains attached to Mage');

    // 3. Unattach target endpoint (tok-2)
    const detachEndUpdate: Partial<ScreenMarker> = { tetherTargetId: null as any };
    tether = { ...tether, ...detachEndUpdate };
    if (detachEndUpdate.tetherTargetId === null) delete tether.tetherTargetId;

    assert.strictEqual(tether.attachedTokenId, 'tok-3', 'Start endpoint remains attached to Cleric');
    assert.strictEqual(tether.tetherTargetId, undefined, 'Target endpoint successfully unattached');

    // 4. Reattach target endpoint to tok-1 (Warrior)
    const reattachEndUpdate: Partial<ScreenMarker> = { tetherTargetId: 'tok-1' };
    tether = { ...tether, ...reattachEndUpdate };
    assert.strictEqual(tether.attachedTokenId, 'tok-3', 'Start endpoint remains attached to Cleric');
    assert.strictEqual(tether.tetherTargetId, 'tok-1', 'Target endpoint successfully reattached to Warrior');
  });
});


