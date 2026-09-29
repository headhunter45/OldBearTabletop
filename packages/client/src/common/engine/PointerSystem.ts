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

