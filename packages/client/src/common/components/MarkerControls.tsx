import React, { useState } from 'react';
import { ScreenMarker, Token } from '@oldbear/shared';
import {
  Lock,
  Unlock,
  Trash2,
  X,
  Circle,
  Square,
  ArrowUpRight,
  Crosshair,
  Sparkles,
  Triangle,
  Link,
  Palette,
  Anchor,
  Unlink,
  PieChart,
} from 'lucide-react';
import { RotationCompass } from './TokenControls.js';
import { AVAILABLE_COLORS } from '../config/colors.js';

interface MarkerControlsProps {
  marker: ScreenMarker;
  onDelete: (id: string) => void;
  onToggleLock: (id: string, locked: boolean) => void;
  onUpdate?: (id: string, updates: Partial<ScreenMarker>) => void;
  onClose: () => void;
  canControl: boolean;
  tokens?: Record<string, Token>;
  selectedTokenId?: string | null;
  gridSize?: number;
  scaleFtPerCell?: number;
}

export const MarkerControls: React.FC<MarkerControlsProps> = ({
  marker,
  onDelete,
  onToggleLock,
  onUpdate,
  onClose,
  canControl,
  tokens = {},
  selectedTokenId,
  gridSize = 50,
  scaleFtPerCell = 5,
}) => {
  if (!canControl) return null;

  const [showColorPicker, setShowColorPicker] = useState(false);

  const typeLabel =
    marker.type === 'circle'
      ? 'Circle Area'
      : marker.type === 'rectangle'
      ? 'Rectangle Zone'
      : marker.type === 'arrow'
      ? 'Arrow Marker'
      : marker.type === 'cone'
      ? 'Cone Template'
      : marker.type === 'crosshair'
      ? 'Target Ping'
      : marker.type === 'tether'
      ? 'Token Tether'
      : marker.type === 'clock'
      ? 'Progress Clock'
      : 'Drawing Shape';

  const renderIcon = () => {
    switch (marker.type) {
      case 'circle':
        return <Circle size={16} color={marker.color} />;
      case 'rectangle':
        return <Square size={16} color={marker.color} />;
      case 'cone':
        return <Triangle size={16} color={marker.color} />;
      case 'arrow':
        return <ArrowUpRight size={16} color={marker.color} />;
      case 'crosshair':
        return <Crosshair size={16} color={marker.color} />;
      case 'tether':
        return <Link size={16} color={marker.color} />;
      case 'clock':
        return <PieChart size={16} color={marker.color} />;
      default:
        return <Sparkles size={16} color={marker.color} />;
    }
  };

  const attachedToken = marker.attachedTokenId ? tokens[marker.attachedTokenId] : null;
  const currentRadiusFt = Math.round(((marker.radius ?? 50) / gridSize) * scaleFtPerCell);

  const setRadiusFt = (ft: number) => {
    const clampedFt = Math.max(1, ft);
    const px = (clampedFt / scaleFtPerCell) * gridSize;
    onUpdate?.(marker.id, { radius: px });
  };

  return (
    <div
      className="floating-hud glass-panel animate-fade-in"
      style={{
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '0.6rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        maxWidth: '94vw',
        zIndex: 50,
        flexWrap: 'wrap',
      }}
    >
      {/* Icon & Name / Label Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {renderIcon()}
        <input
          type="text"
          className="input"
          value={marker.label ?? ''}
          placeholder={typeLabel}
          onChange={(e) => onUpdate?.(marker.id, { label: e.target.value })}
          title="Custom Indicator Label (e.g. Spirit Guardians, Captain 6&quot; Aura)"
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            width: '160px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
          }}
        />
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />

      {/* Colors Dropdown / Chips */}
      <div style={{ position: 'relative' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setShowColorPicker((v) => !v)}
          title="Indicator Color & Opacity"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.5rem',
            fontSize: '0.8rem',
          }}
        >
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: marker.color,
              border: '1px solid rgba(255,255,255,0.4)',
            }}
          />
          <Palette size={14} />
        </button>

        {showColorPicker && (
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: 0,
              padding: '0.6rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              zIndex: 100,
              minWidth: '200px',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Colors:</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    onUpdate?.(marker.id, { color: c.value });
                    setShowColorPicker(false);
                  }}
                  title={c.name}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: c.value,
                    border: marker.color === c.value ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>

            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Fill Opacity: {Math.round((marker.opacity ?? 0.22) * 100)}%
            </span>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={marker.opacity ?? 0.22}
              onChange={(e) => onUpdate?.(marker.id, { opacity: parseFloat(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>

      {/* Radius Controls (for Circle, Cone, Crosshair) */}
      {(marker.type === 'circle' || marker.type === 'cone' || marker.type === 'crosshair') && onUpdate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Radius:</span>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
            onClick={() => setRadiusFt(currentRadiusFt - 5)}
            title="Decrease radius by 5ft"
          >
            -5'
          </button>
          <input
            type="number"
            min="1"
            max="500"
            value={currentRadiusFt}
            onChange={(e) => setRadiusFt(parseInt(e.target.value, 10) || 5)}
            style={{
              width: '48px',
              padding: '0.2rem 0.35rem',
              fontSize: '0.8rem',
              textAlign: 'center',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ft</span>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
            onClick={() => setRadiusFt(currentRadiusFt + 5)}
            title="Increase radius by 5ft"
          >
            +5'
          </button>
        </div>
      )}

      {/* Clock Controls: Fill/Dim Wedges and Segments (OB-132) */}
      {marker.type === 'clock' && onUpdate && (
        <>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.55rem', fontWeight: 'bold' }}
              onClick={() => {
                const cur = marker.filled ?? 0;
                onUpdate(marker.id, { filled: Math.max(0, cur - 1) });
              }}
              title="Dim clockwise wedge (-)"
            >
              -
            </button>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: marker.color,
                minWidth: '42px',
                textAlign: 'center',
              }}
            >
              {marker.filled ?? 0} / {marker.segments ?? 8}
            </span>
            <button
              className="btn btn-primary"
              style={{ padding: '0.2rem 0.55rem', fontWeight: 'bold' }}
              onClick={() => {
                const seg = marker.segments ?? 8;
                const cur = marker.filled ?? 0;
                onUpdate(marker.id, { filled: Math.min(seg, cur + 1) });
              }}
              title="Light up next clockwise wedge (+)"
            >
              +
            </button>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wedges:</span>
            {[4, 6, 8, 10, 12].map((s) => {
              const isActive = (marker.segments ?? 8) === s;
              return (
                <button
                  key={s}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', fontWeight: isActive ? 600 : 400 }}
                  onClick={() => onUpdate(marker.id, { segments: s, filled: Math.min(s, marker.filled ?? 0) })}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Anchor Toggle: Center vs Base Edge (OB-129) */}
      {(marker.type === 'circle' || marker.type === 'cone') && onUpdate && (
        <>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
          <button
            className={`btn ${marker.anchor === 'edge' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onUpdate(marker.id, { anchor: marker.anchor === 'edge' ? 'center' : 'edge' })}
            title={
              marker.anchor === 'edge'
                ? 'Measured from Token Base Perimeter Edge'
                : 'Measured from Token Center Point'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.55rem',
              fontSize: '0.75rem',
            }}
          >
            <Anchor size={14} />
            <span>{marker.anchor === 'edge' ? 'Base Edge' : 'Center'}</span>
          </button>
        </>
      )}

      {/* Cone Spread Angle & Rotation Controls */}
      {marker.type === 'cone' && onUpdate && (
        <>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Angle:</span>
            {[53, 60, 90, 120, 180].map((deg) => {
              const isActive = Math.round(marker.spreadAngle ?? 60) === deg;
              return (
                <button
                  key={deg}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '0.2rem 0.45rem',
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onClick={() => onUpdate(marker.id, { spreadAngle: deg })}
                  title={`Set cone spread angle to ${deg}°`}
                >
                  {deg}°
                </button>
              );
            })}
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RotationCompass
              rotation={marker.angle ?? 0}
              onChange={(deg) => onUpdate(marker.id, { angle: deg })}
            />
            <button
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
              onClick={() => onUpdate(marker.id, { angle: ((marker.angle ?? 0) - 15 + 360) % 360 })}
              title="Rotate Left 15°"
            >
              ↺ -15°
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
              onClick={() => onUpdate(marker.id, { angle: ((marker.angle ?? 0) + 15) % 360 })}
              title="Rotate Right 15°"
            >
              ↻ +15°
            </button>
          </div>
        </>
      )}

      {/* Tether Specific Controls (OB-129) */}
      {marker.type === 'tether' && onUpdate && (
        <>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              className={`btn ${marker.tetherStyle !== 'wiggly' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => onUpdate(marker.id, { tetherStyle: 'straight' })}
              title="Straight connecting line"
            >
              Straight
            </button>
            <button
              className={`btn ${marker.tetherStyle === 'wiggly' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => onUpdate(marker.id, { tetherStyle: 'wiggly' })}
              title="Wiggly sine wave connecting line"
            >
              Wiggly ~
            </button>

            {marker.tetherStyle === 'wiggly' && (
              <>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>Wave:</span>
                <input
                  type="range"
                  min="4"
                  max="25"
                  value={marker.tetherAmplitude ?? 10}
                  onChange={(e) => onUpdate(marker.id, { tetherAmplitude: parseInt(e.target.value, 10) })}
                  title={`Wave Amplitude: ${marker.tetherAmplitude ?? 10}px`}
                  style={{ width: '60px' }}
                />
              </>
            )}
          </div>
        </>
      )}

      {/* Attached Token Status / Attach Button (OB-129) */}
      {onUpdate && (
        <>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
          {attachedToken ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attached:</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {attachedToken.name}
              </span>
              <button
                className="btn-icon"
                onClick={() => onUpdate(marker.id, { attachedTokenId: undefined })}
                title="Detach from Token"
                style={{ padding: '0.2rem' }}
              >
                <Unlink size={13} />
              </button>
            </div>
          ) : selectedTokenId && tokens[selectedTokenId] ? (
            <button
              className="btn btn-secondary"
              onClick={() => onUpdate(marker.id, { attachedTokenId: selectedTokenId })}
              title={`Attach indicator to selected token "${tokens[selectedTokenId].name}"`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
              }}
            >
              <Link size={13} />
              <span>Attach to {tokens[selectedTokenId].name}</span>
            </button>
          ) : null}
        </>
      )}

      <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />

      {/* Lock / Unlock Toggle */}
      <button
        className={`btn btn-secondary ${marker.locked ? 'active' : ''}`}
        onClick={() => onToggleLock(marker.id, !marker.locked)}
        title={marker.locked ? 'Unlock Shape (Allow moving)' : 'Lock Shape (Prevent accidental movement)'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.6rem',
          fontSize: '0.8rem',
        }}
      >
        {marker.locked ? <Lock size={15} color="#f59e0b" /> : <Unlock size={15} />}
        <span>{marker.locked ? 'Locked' : 'Unlocked'}</span>
      </button>

      {/* Delete Shape */}
      <button
        className="btn btn-danger"
        onClick={() => onDelete(marker.id)}
        title="Delete Shape (Delete / Backspace)"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.6rem',
          fontSize: '0.8rem',
        }}
      >
        <Trash2 size={15} />
        <span>Delete</span>
      </button>

      {/* Deselect / Close */}
      <button
        className="btn-icon"
        onClick={onClose}
        title="Deselect (Escape)"
        style={{ padding: '0.3rem' }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

