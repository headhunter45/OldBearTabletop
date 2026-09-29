import { ScreenMarker, Token } from '@oldbear/shared';

export function renderMarkers(
  ctx: CanvasRenderingContext2D,
  markers: ScreenMarker[],
  now: number,
  gridSize: number = 50,
  scaleFtPerCell: number = 5,
  selectedMarkerId: string | null = null,
  tokens: Record<string, Token> = {}
): ScreenMarker[] {
  // Return non-expired or persistent markers
  const activeMarkers: ScreenMarker[] = [];

  for (const marker of markers) {
    const elapsed = now - marker.createdAt;
    const isPersist = Boolean(marker.persist);

    if (!isPersist && elapsed > marker.durationMs) {
      continue;
    }
    activeMarkers.push(marker);

    const progress = elapsed / (marker.durationMs || 1);
    const alpha = isPersist ? 1 : Math.max(0, 1 - progress);
    const isSelected = selectedMarkerId === marker.id;

    ctx.save();
    ctx.globalAlpha = alpha;

    switch (marker.type) {
      case 'laser':
        renderLaser(ctx, marker);
        break;
      case 'arrow':
        renderArrow(ctx, marker, isSelected);
        break;
      case 'crosshair':
        renderCrosshair(ctx, marker, elapsed, gridSize, scaleFtPerCell, isSelected, tokens);
        break;
      case 'circle':
        renderCircle(ctx, marker, gridSize, scaleFtPerCell, isSelected, tokens);
        break;
      case 'rectangle':
        renderRectangle(ctx, marker, gridSize, scaleFtPerCell, isSelected, tokens);
        break;
      case 'cone':
        renderCone(ctx, marker, gridSize, scaleFtPerCell, isSelected, tokens);
        break;
      case 'tether':
        renderTether(ctx, marker, tokens, gridSize, scaleFtPerCell, isSelected);
        break;
      case 'clock':
        renderClock(ctx, marker, isSelected);
        break;
      case 'spray':
        renderSpray(ctx, marker, isSelected, tokens, gridSize, scaleFtPerCell);
        break;
    }

    ctx.restore();
  }

  return activeMarkers;
}

function renderLaser(ctx: CanvasRenderingContext2D, marker: ScreenMarker) {
  const points = marker.points || [{ x: marker.x, y: marker.y }];
  if (points.length < 2) {
    // Single laser point dot
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = marker.color;
    ctx.shadowColor = marker.color;
    ctx.shadowBlur = 12;
    ctx.fill();
    return;
  }

  // Draw smooth fading trail
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = marker.color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = marker.color;
  ctx.shadowBlur = 10;
  ctx.stroke();

  // Head dot
  const head = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(head.x, head.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

function renderArrow(ctx: CanvasRenderingContext2D, marker: ScreenMarker, isSelected?: boolean) {
  const targetX = marker.targetX ?? marker.x;
  const targetY = marker.targetY ?? marker.y;
  const fromX = marker.x;
  const fromY = marker.y;

  const angle = Math.atan2(targetY - fromY, targetX - fromX);
  const headLen = 16;

  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(targetX, targetY);
  ctx.strokeStyle = marker.color;
  ctx.lineWidth = 4;
  ctx.shadowColor = marker.color;
  ctx.shadowBlur = 8;
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(targetX, targetY);
  ctx.lineTo(
    targetX - headLen * Math.cos(angle - Math.PI / 6),
    targetY - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    targetX - headLen * Math.cos(angle + Math.PI / 6),
    targetY - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = marker.color;
  ctx.fill();

  // User label
  const labelPrefix = marker.locked ? '🔒 ' : marker.persist ? '📌 ' : '';
  renderUserLabel(ctx, `${labelPrefix}${marker.userName}`, fromX, fromY - 10, marker.color);
}

export function getMarkerAnchorPosition(
  marker: ScreenMarker,
  tokens: Record<string, Token> = {},
  gridSize: number = 50
): { x: number; y: number; baseRadius: number; isAttached: boolean } {
  if (marker.attachedTokenId && tokens[marker.attachedTokenId]) {
    const t = tokens[marker.attachedTokenId];
    const isProp = Boolean(t.isProp);
    const w = (isProp && t.propWidth !== undefined ? t.propWidth : t.size) * gridSize;
    const h = (isProp && t.propHeight !== undefined ? t.propHeight : t.size) * gridSize;
    return {
      x: t.x + w / 2,
      y: t.y + h / 2,
      baseRadius: Math.min(w, h) / 2,
      isAttached: true,
    };
  }
  return {
    x: marker.x,
    y: marker.y,
    baseRadius: 0,
    isAttached: false,
  };
}

export function duplicateAttachedMarkers(
  sourceTokenId: string,
  targetToken: Token,
  existingMarkers: ScreenMarker[]
): ScreenMarker[] {
  const attached = existingMarkers.filter((m) => m.attachedTokenId === sourceTokenId);
  return attached.map((m) => ({
    ...m,
    id: `marker-${crypto.randomUUID()}`,
    attachedTokenId: targetToken.id,
    x: targetToken.x,
    y: targetToken.y,
    createdAt: Date.now(),
  }));
}

export function renderTether(
  ctx: CanvasRenderingContext2D,
  marker: ScreenMarker,
  tokens: Record<string, Token> = {},
  gridSize: number = 50,
  scaleFtPerCell: number = 5,
  isSelected?: boolean
) {
  let x1 = marker.x;
  let y1 = marker.y;
  if (marker.attachedTokenId && tokens[marker.attachedTokenId]) {
    const t = tokens[marker.attachedTokenId];
    const isProp = Boolean(t.isProp);
    const w = (isProp && t.propWidth !== undefined ? t.propWidth : t.size) * gridSize;
    const h = (isProp && t.propHeight !== undefined ? t.propHeight : t.size) * gridSize;
    x1 = t.x + w / 2;
    y1 = t.y + h / 2;
  }

  let x2 = marker.targetX ?? marker.x;
  let y2 = marker.targetY ?? marker.y;
  if (marker.tetherTargetId && tokens[marker.tetherTargetId]) {
    const t2 = tokens[marker.tetherTargetId];
    const isProp2 = Boolean(t2.isProp);
    const w2 = (isProp2 && t2.propWidth !== undefined ? t2.propWidth : t2.size) * gridSize;
    const h2 = (isProp2 && t2.propHeight !== undefined ? t2.propHeight : t2.size) * gridSize;
    x2 = t2.x + w2 / 2;
    y2 = t2.y + h2 / 2;
  }

  const dist = Math.hypot(x2 - x1, y2 - y1);
  const color = marker.color || '#38bdf8';
  const strokeWidth = marker.strokeWidth ?? 2.5;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = isSelected ? strokeWidth + 2 : strokeWidth;
  ctx.shadowColor = color;
  ctx.shadowBlur = isSelected ? 12 : 6;

  if (marker.tetherStyle === 'wiggly') {
    const freq = marker.tetherFrequency ?? 24;
    const amp = marker.tetherAmplitude ?? 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const steps = Math.max(10, Math.floor(dist / 4));
    for (let i = 1; i <= steps; i++) {
      const s = (i / steps) * dist;
      const envelope = Math.sin((Math.PI * s) / Math.max(1, dist));
      const wave = Math.sin((s * 2 * Math.PI) / freq) * amp * envelope;
      const px = x1 + s * cosA - wave * sinA;
      const py = y1 + s * sinA + wave * cosA;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Endpoints dots
  ctx.beginPath();
  ctx.arc(x1, y1, 4.5, 0, Math.PI * 2);
  ctx.arc(x2, y2, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  const distFt = Math.round((dist / gridSize) * scaleFtPerCell);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const labelPrefix = marker.locked ? '🔒 ' : '';
  const label = marker.label ? `${marker.label}: ${distFt} ft` : `${distFt} ft tether`;
  renderUserLabel(ctx, `${labelPrefix}${label}`, midX, midY - 12, color);

  ctx.restore();
}

function renderCrosshair(
  ctx: CanvasRenderingContext2D,
  marker: ScreenMarker,
  elapsed: number,
  gridSize: number = 50,
  scaleFtPerCell: number = 5,
  isSelected?: boolean,
  tokens: Record<string, Token> = {}
) {
  const { x, y } = getMarkerAnchorPosition(marker, tokens, gridSize);
  const color = marker.color;
  const minSize = 18;
  const size = Math.max(minSize, marker.radius ?? minSize);
  const pulse = Math.sin(elapsed / 150) * 3;
  const radiusFt = Math.round((size / gridSize) * scaleFtPerCell);

  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, size + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (size > minSize) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(color, marker.opacity ?? 0.15);
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  // Crosshair lines
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();

  if (size >= 36) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, Math.round(size * 0.5), 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(x, y, size + 4 + pulse, 0, Math.PI * 2);
  ctx.stroke();

  const labelPrefix = marker.locked ? '🔒 ' : marker.persist ? '📌 ' : '';
  const labelText = marker.label ? `${marker.label}` : size > minSize ? `${marker.userName}: ${radiusFt} ft target` : `${marker.userName}`;
  renderUserLabel(ctx, `${labelPrefix}${labelText}`, x, y - size - 12, color);
}

function renderCircle(
  ctx: CanvasRenderingContext2D,
  marker: ScreenMarker,
  gridSize: number,
  scaleFtPerCell: number,
  isSelected?: boolean,
  tokens: Record<string, Token> = {}
) {
  const { x, y, baseRadius, isAttached } = getMarkerAnchorPosition(marker, tokens, gridSize);
  const rawRadius = marker.radius || 50;
  const effectiveRadius = marker.anchor === 'edge' && isAttached ? rawRadius + baseRadius : rawRadius;
  const radiusFt = Math.round((rawRadius / gridSize) * scaleFtPerCell);
  const color = marker.color;
  const fillAlpha = marker.opacity ?? 0.2;

  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(x, y, effectiveRadius + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Base edge guide ring when anchored to token edge
  if (marker.anchor === 'edge' && isAttached && baseRadius > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(color, 0.45);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(x, y, effectiveRadius, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(color, fillAlpha);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.stroke();

  // Center point
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Radius label
  const labelPrefix = marker.locked ? '🔒 ' : marker.persist ? '📌 ' : '';
  const labelText = marker.label ? `${marker.label} (${radiusFt} ft)` : `${marker.userName}: ${radiusFt} ft radius`;
  renderUserLabel(ctx, `${labelPrefix}${labelText}`, x, y - effectiveRadius - 10, color);
}

function renderRectangle(
  ctx: CanvasRenderingContext2D,
  marker: ScreenMarker,
  gridSize: number,
  scaleFtPerCell: number,
  isSelected?: boolean,
  tokens: Record<string, Token> = {}
) {
  let { x, y } = marker;
  if (marker.attachedTokenId && tokens[marker.attachedTokenId]) {
    const t = tokens[marker.attachedTokenId];
    const isProp = Boolean(t.isProp);
    const tw = (isProp && t.propWidth !== undefined ? t.propWidth : t.size) * gridSize;
    const th = (isProp && t.propHeight !== undefined ? t.propHeight : t.size) * gridSize;
    x = t.x + tw / 2 - (marker.width || 100) / 2;
    y = t.y + th / 2 - (marker.height || 100) / 2;
  }
  const { width = 100, height = 100, color } = marker;
  const widthFt = Math.round((Math.abs(width) / gridSize) * scaleFtPerCell);
  const heightFt = Math.round((Math.abs(height) / gridSize) * scaleFtPerCell);
  const fillAlpha = marker.opacity ?? 0.2;

  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(x - 5, y - 5, width + 10, height + 10);
    ctx.restore();
  }

  ctx.fillStyle = hexToRgba(color, fillAlpha);
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.strokeRect(x, y, width, height);

  const labelPrefix = marker.locked ? '🔒 ' : marker.persist ? '📌 ' : '';
  const labelText = marker.label ? `${marker.label} (${widthFt}ft × ${heightFt}ft)` : `${marker.userName}: ${widthFt}ft × ${heightFt}ft`;
  renderUserLabel(ctx, `${labelPrefix}${labelText}`, x + width / 2, y - 10, color);
}

function renderUserLabel(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  color: string
) {
  ctx.save();
  ctx.font = '500 11px Inter, sans-serif';
  const metrics = ctx.measureText(name);
  const pw = metrics.width + 10;
  const ph = 18;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - pw / 2, y - ph / 2, pw, ph, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x, y);
  ctx.restore();
}

export function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith('rgba')) return hex;
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getContrastingAccentColor(hex: string): string {
  const clean = hex.replace('#', '').toLowerCase();
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (r > 180 && b < 100) {
      return '#38bdf8'; // sky blue for warm hues
    }
  }
  return '#f59e0b'; // amber for cool/neutral hues
}

export function renderCone(
  ctx: CanvasRenderingContext2D,
  marker: ScreenMarker,
  gridSize: number,
  scaleFtPerCell: number,
  isSelected?: boolean,
  tokens: Record<string, Token> = {}
) {
  const { x, y, baseRadius, isAttached } = getMarkerAnchorPosition(marker, tokens, gridSize);
  const rawRadius = marker.radius || 100;
  const effectiveRadius = marker.anchor === 'edge' && isAttached ? rawRadius + baseRadius : rawRadius;
  const radius = effectiveRadius;
  const color = marker.color;
  const fillAlpha = marker.opacity ?? 0.22;
  const angleDeg = marker.angle ?? 0;
  const spreadAngle = marker.spreadAngle ?? 60;
  const thetaRad = (angleDeg * Math.PI) / 180;
  const alphaRad = ((spreadAngle / 2) * Math.PI) / 180;
  const radiusFt = Math.round((rawRadius / gridSize) * scaleFtPerCell);

  const a1x = x + radius * Math.cos(thetaRad - alphaRad);
  const a1y = y + radius * Math.sin(thetaRad - alphaRad);
  const a2x = x + radius * Math.cos(thetaRad + alphaRad);
  const a2y = y + radius * Math.sin(thetaRad + alphaRad);

  // 1. Dual Cone / Triangle visualization (Task #118):
  // Render the area where a flat-ended triangle cone covers but circular arc does not
  if (spreadAngle < 170) {
    const cosAlpha = Math.max(0.08, Math.cos(alphaRad));
    const rCorner = radius / cosAlpha;
    const p1x = x + rCorner * Math.cos(thetaRad - alphaRad);
    const p1y = y + rCorner * Math.sin(thetaRad - alphaRad);
    const p2x = x + rCorner * Math.cos(thetaRad + alphaRad);
    const p2y = y + rCorner * Math.sin(thetaRad + alphaRad);

    const accentColor = getContrastingAccentColor(color);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(a1x, a1y);
    ctx.lineTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.lineTo(a2x, a2y);
    // Arc back from positive edge to negative edge along the circular curve
    ctx.arc(x, y, radius, thetaRad + alphaRad, thetaRad - alphaRad, true);
    ctx.closePath();

    ctx.fillStyle = hexToRgba(accentColor, fillAlpha);
    ctx.fill();

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Render circular cone arc in primary highlight color
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(a1x, a1y);
    ctx.arc(x, y, radius + 5, thetaRad - alphaRad, thetaRad + alphaRad, false);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(a1x, a1y);
  ctx.arc(x, y, radius, thetaRad - alphaRad, thetaRad + alphaRad, false);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(color, fillAlpha);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.stroke();

  // Centerline guide
  ctx.save();
  ctx.strokeStyle = hexToRgba(color, 0.5);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + radius * Math.cos(thetaRad), y + radius * Math.sin(thetaRad));
  ctx.stroke();
  ctx.restore();

  // Origin caster dot
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // 3. Interactive Edge Handle Dots in Persistent Mode
  if (marker.persist) {
    // Edge handle at positive boundary (a2x, a2y)
    ctx.save();
    ctx.beginPath();
    ctx.arc(a2x, a2y, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(a2x, a2y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#38bdf8' : color;
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Edge handle at negative boundary (a1x, a1y)
    ctx.beginPath();
    ctx.arc(a1x, a1y, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(a1x, a1y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#38bdf8' : color;
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // Label
  const labelPrefix = marker.locked ? '🔒 ' : marker.persist ? '📌 ' : '';
  const labelText = marker.label ? `${marker.label} (${radiusFt} ft cone)` : `${marker.userName}: ${radiusFt} ft cone (${Math.round(spreadAngle)}°)`;
  const midLabelX = x + (radius * 0.5) * Math.cos(thetaRad);
  const midLabelY = y + (radius * 0.5) * Math.sin(thetaRad) - 12;
  renderUserLabel(ctx, `${labelPrefix}${labelText}`, midLabelX, midLabelY, color);
}

export function renderClock(
  ctx: CanvasRenderingContext2D,
  marker: ScreenMarker,
  isSelected?: boolean
) {
  const x = marker.x;
  const y = marker.y;
  const radius = marker.radius || 60;
  const segments = marker.segments && marker.segments > 1 ? marker.segments : 8;
  const filled = Math.max(0, Math.min(segments, marker.filled ?? 0));
  const color = marker.color || '#3b82f6';
  const startAngle = -Math.PI / 2; // 12 o'clock
  const step = (Math.PI * 2) / segments;

  ctx.save();

  // Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 12;

  // Background disk
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Draw slices
  for (let i = 0; i < segments; i++) {
    const a1 = startAngle + i * step;
    const a2 = startAngle + (i + 1) * step;
    const isWedgeFilled = i < filled;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, a1, a2);
    ctx.closePath();

    if (isWedgeFilled) {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
    }

    // Radial divider line
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + radius * Math.cos(a1), y + radius * Math.sin(a1));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Outer border
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = isSelected ? 3 : 2;
  if (isSelected) {
    ctx.setLineDash([4, 4]);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Center hub circle
  const hubRadius = radius * 0.28;
  ctx.beginPath();
  ctx.arc(x, y, hubRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Fraction text in hub
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.max(10, Math.round(hubRadius * 0.85))}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${filled}/${segments}`, x, y);

  // Label pill
  if (marker.label) {
    ctx.font = 'bold 12px Inter, sans-serif';
    const textWidth = ctx.measureText(marker.label).width;
    const paddingX = 10;
    const paddingY = 4;
    const pillY = y + radius + 14;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(
        x - textWidth / 2 - paddingX,
        pillY - 8 - paddingY,
        textWidth + paddingX * 2,
        16 + paddingY * 2,
        6
      );
    } else {
      ctx.rect(
        x - textWidth / 2 - paddingX,
        pillY - 8 - paddingY,
        textWidth + paddingX * 2,
        16 + paddingY * 2
      );
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(marker.label, x, pillY);
  }

  ctx.restore();
}

const sprayImageCache = new Map<string, HTMLImageElement>();

export function getSprayImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  let img = sprayImageCache.get(url);
  if (!img) {
    if (typeof Image !== 'undefined') {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      sprayImageCache.set(url, img);
    } else {
      return null;
    }
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  color: string
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function renderHazardStripesDecal(ctx: CanvasRenderingContext2D, radius: number, color: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.clip();

  // Dark caution base
  ctx.fillStyle = '#111827';
  ctx.fill();

  // Diagonal warning stripes
  const stripeWidth = Math.max(12, radius * 0.22);
  ctx.fillStyle = color || '#f59e0b';
  for (let d = -radius * 2.5; d <= radius * 2.5; d += stripeWidth * 2) {
    ctx.beginPath();
    ctx.moveTo(d, -radius);
    ctx.lineTo(d + stripeWidth, -radius);
    ctx.lineTo(d + stripeWidth + radius * 2, radius);
    ctx.lineTo(d + radius * 2, radius);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Outer warning border ring
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color || '#f59e0b';
  ctx.lineWidth = Math.max(3, radius * 0.05);
  ctx.stroke();
}

function renderRadiationDecal(ctx: CanvasRenderingContext2D, radius: number, color: string) {
  // Background disk
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2.5, radius * 0.04);
  ctx.stroke();

  // Trefoil 3 blades: 60 degrees each at -90°, 30°, 150°
  const rInner = radius * 0.28;
  const rOuter = radius * 0.82;
  const spanRad = (60 * Math.PI) / 180;
  const halfSpan = spanRad / 2;

  ctx.fillStyle = color;
  const bladeAngles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
  for (const centerA of bladeAngles) {
    ctx.beginPath();
    ctx.arc(0, 0, rOuter, centerA - halfSpan, centerA + halfSpan, false);
    ctx.arc(0, 0, rInner, centerA + halfSpan, centerA - halfSpan, true);
    ctx.closePath();
    ctx.fill();
  }

  // Center hub
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function renderBiohazardDecal(ctx: CanvasRenderingContext2D, radius: number, color: string) {
  // Background disk
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#111827';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2.5, radius * 0.04);
  ctx.stroke();

  // 3 Biohazard crescent lobes at -90°, 30°, 150°
  const lobeDist = radius * 0.36;
  const lobeOuter = radius * 0.44;
  const lobeInner = radius * 0.32;
  const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];

  ctx.fillStyle = color;
  for (const a of angles) {
    const lx = lobeDist * Math.cos(a);
    const ly = lobeDist * Math.sin(a);
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly, lobeOuter, 0, Math.PI * 2);
    ctx.arc(lx, ly, lobeInner, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();
  }

  // Center cutout & dot
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = '#111827';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function renderObjectiveDecal(ctx: CanvasRenderingContext2D, radius: number, color: string) {
  // Background disc with glass effect
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fill();

  // Outer reticle ring
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Inner dashed targeting circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.restore();

  // Crosshair ticks
  const tickIn = radius * 0.55;
  const tickOut = radius * 0.98;
  ctx.beginPath();
  ctx.moveTo(0, -tickIn); ctx.lineTo(0, -tickOut);
  ctx.moveTo(0, tickIn); ctx.lineTo(0, tickOut);
  ctx.moveTo(-tickIn, 0); ctx.lineTo(-tickOut, 0);
  ctx.moveTo(tickIn, 0); ctx.lineTo(tickOut, 0);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 5-point tactical star in center
  drawStar(ctx, 0, 0, 5, radius * 0.38, radius * 0.18, color);
}

function renderFireBlastDecal(ctx: CanvasRenderingContext2D, radius: number, color: string) {
  const points = 16;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.62;
    const a = (i * Math.PI) / points;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  const grad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.4, '#f97316');
  grad.addColorStop(0.85, color || '#dc2626');
  grad.addColorStop(1, 'rgba(153, 27, 27, 0.4)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function renderMagicCircleDecal(ctx: CanvasRenderingContext2D, radius: number, color: string) {
  ctx.save();
  // Outer circle
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Secondary ring
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Octagram squares
  const rSq = radius * 0.88;
  for (let offset = 0; offset < 2; offset++) {
    const ang = (offset * Math.PI) / 4;
    ctx.beginPath();
    for (let j = 0; j < 4; j++) {
      const a = ang + (j * Math.PI) / 2;
      const x = rSq * Math.cos(a);
      const y = rSq * Math.sin(a);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Center glowing arcane orb
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(color, 0.35);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function renderSpray(
  ctx: CanvasRenderingContext2D,
  marker: ScreenMarker,
  isSelected: boolean = false,
  tokens: Record<string, Token> = {},
  gridSize: number = 50,
  scaleFtPerCell: number = 5
) {
  const { x, y } = getMarkerAnchorPosition(marker, tokens, gridSize);
  const radius = marker.radius || 50;
  const rotationDeg = marker.rotation ?? marker.angle ?? 0;
  const color = marker.color || '#f59e0b';
  const opacity = marker.opacity ?? 0.85;
  const diameterFt = Math.round(((radius * 2) / gridSize) * scaleFtPerCell);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotationDeg * Math.PI) / 180);

  // If selected, draw outline selection ring and rotation handle dot
  if (isSelected) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.stroke();

    // Rotation handle dot on the perimeter
    ctx.beginPath();
    ctx.arc(radius, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.stroke();

    // Line from center to handle
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius, 0);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // Draw Decal Content
  const imgUrl = (marker.imageUrl?.trim()) || 'hazard';
  const isPreset = ['hazard', 'hazard-stripes', 'biohazard', 'radiation', 'objective', 'fire', 'magic'].includes(imgUrl.toLowerCase());
  const customImg = !isPreset ? getSprayImage(imgUrl) : null;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha || 1) * opacity;

  if (customImg) {
    // Custom user image: draw clipped to circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.clip();
    try {
      ctx.drawImage(customImg, -radius, -radius, radius * 2, radius * 2);
    } catch {
      // Fallback if drawImage fails
    }
    // Perimeter ring
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else if (!isPreset) {
    // Custom image URL is still loading or invalid
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = `bold ${Math.max(10, Math.round(radius * 0.2))}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🖼️ Decal Loading...', 0, 0);
  } else {
    // Built-in presets
    const preset = imgUrl.toLowerCase();
    if (preset === 'hazard' || preset === 'hazard-stripes') {
      renderHazardStripesDecal(ctx, radius, color);
    } else if (preset === 'biohazard') {
      renderBiohazardDecal(ctx, radius, color);
    } else if (preset === 'radiation') {
      renderRadiationDecal(ctx, radius, color);
    } else if (preset === 'objective') {
      renderObjectiveDecal(ctx, radius, color);
    } else if (preset === 'fire') {
      renderFireBlastDecal(ctx, radius, color);
    } else if (preset === 'magic') {
      renderMagicCircleDecal(ctx, radius, color);
    }
  }

  ctx.restore(); // restore opacity
  ctx.restore(); // restore rotation & translation

  // Label pill at bottom
  if (marker.label || marker.persist || isSelected) {
    const labelPrefix = marker.locked ? '🔒 ' : marker.persist ? '📌 ' : '';
    const labelText = marker.label
      ? `${labelPrefix}${marker.label} (⌀ ${diameterFt} ft)`
      : `${labelPrefix}Spray Decal (⌀ ${diameterFt} ft, ${Math.round((rotationDeg + 360) % 360)}°)`;

    ctx.save();
    ctx.font = 'bold 12px Inter, sans-serif';
    const textWidth = ctx.measureText(labelText).width;
    const paddingX = 10;
    const paddingY = 4;
    const pillY = y + radius + 16;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(
        x - textWidth / 2 - paddingX,
        pillY - 8 - paddingY,
        textWidth + paddingX * 2,
        16 + paddingY * 2,
        6
      );
    } else {
      ctx.rect(
        x - textWidth / 2 - paddingX,
        pillY - 8 - paddingY,
        textWidth + paddingX * 2,
        16 + paddingY * 2
      );
    }
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, x, pillY);
    ctx.restore();
  }
}

