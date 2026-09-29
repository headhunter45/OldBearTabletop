import React, { useState } from 'react';
import { ProgressClock } from '@oldbear/shared';
import {
  PieChart,
  Plus,
  Minus,
  Trash2,
  X,
  Minimize2,
  Maximize2,
  Palette,
  Check,
} from 'lucide-react';
import { COLOR_VALUES } from '../config/colors.js';
import { getClockTotalSteps } from './ClockWidget.js';

export interface ClockWidgetBarProps {
  clock: ProgressClock;
  isGm: boolean;
  isCompact: boolean;
  onToggleCompact: () => void;
  onUpdate: (id: string, updates: Partial<ProgressClock>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const ClockWidgetBar: React.FC<ClockWidgetBarProps> = ({
  clock,
  isGm,
  isCompact,
  onToggleCompact,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const totalSteps = getClockTotalSteps(clock);
  const filled = Math.max(0, Math.min(totalSteps, clock.filled ?? 0));

  const handleFilledChange = (delta: number) => {
    const nextFilled = Math.max(0, Math.min(totalSteps, filled + delta));
    onUpdate(clock.id, { filled: nextFilled });
  };

  const handleTotalStepsChange = (delta: number) => {
    const nextSteps = Math.max(2, Math.min(24, totalSteps + delta));
    const nextFilled = Math.min(nextSteps, filled);
    onUpdate(clock.id, { steps: nextSteps, segments: nextSteps, filled: nextFilled });
  };

  return (
    <div
      className="floating-hud glass-panel animate-fade-in"
      style={{
        position: 'fixed',
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
      {/* Icon & Clock Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <PieChart size={18} style={{ color: clock.color }} />
        {isGm ? (
          <input
            type="text"
            className="input"
            value={clock.name ?? ''}
            placeholder="Clock Name"
            onChange={(e) => onUpdate(clock.id, { name: e.target.value })}
            title="Clock Name (GM Editable)"
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              width: '150px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
            }}
          />
        ) : (
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {clock.name || 'Progress Clock'}
          </span>
        )}
      </div>

      {/* Progress Readout / Stepper (OB-173) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {isGm && (
          <button
            onClick={() => handleFilledChange(-1)}
            disabled={filled <= 0}
            className="btn btn-secondary"
            title="Decrement filled steps (-)"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.8rem' }}
          >
            <Minus size={13} />
          </button>
        )}

        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: '6px',
            background: 'rgba(0, 0, 0, 0.4)',
            color: 'var(--text-main)',
            whiteSpace: 'nowrap',
          }}
        >
          {filled} / {totalSteps} steps
        </span>

        {isGm && (
          <button
            onClick={() => handleFilledChange(1)}
            disabled={filled >= totalSteps}
            className="btn btn-primary"
            title="Increment filled steps (+)"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.8rem' }}
          >
            <Plus size={13} />
          </button>
        )}
      </div>

      {/* GM-Only: Total Steps Stepper */}
      {isGm && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '0.6rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total:</span>
          <button
            onClick={() => handleTotalStepsChange(-1)}
            disabled={totalSteps <= 2}
            className="btn btn-secondary"
            title="Decrease total capacity (-1 step)"
            style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
          >
            <Minus size={12} />
          </button>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '22px', textAlign: 'center' }}>
            {totalSteps}
          </span>
          <button
            onClick={() => handleTotalStepsChange(1)}
            disabled={totalSteps >= 24}
            className="btn btn-secondary"
            title="Increase total capacity (+1 step)"
            style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
          >
            <Plus size={12} />
          </button>
        </div>
      )}

      {/* GM-Only: Color Swatch Picker */}
      {isGm && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="btn btn-secondary"
            title="Change Clock Color"
            style={{
              padding: '0.3rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: clock.color,
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
                minWidth: '180px',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Colors:</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
                {COLOR_VALUES.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onUpdate(clock.id, { color: c });
                      setShowColorPicker(false);
                    }}
                    style={{
                      backgroundColor: c,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title={c}
                  >
                    {clock.color === c && <Check size={12} color="#fff" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Per-User Minimize Toggle (Radial vs Compact Horizontal Bar) (OB-173) */}
      <button
        onClick={onToggleCompact}
        className="btn btn-secondary"
        title={isCompact ? 'Expand to Radial Dial' : 'Minimize to Horizontal Progress Bar'}
        style={{
          padding: '0.3rem 0.6rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.8rem',
        }}
      >
        {isCompact ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
        <span>{isCompact ? 'Radial' : 'Compact'}</span>
      </button>

      {/* GM-Only: Delete Button */}
      {isGm && (
        <button
          onClick={() => onDelete(clock.id)}
          className="btn btn-danger"
          title="Delete Clock"
          style={{ padding: '0.3rem 0.5rem' }}
        >
          <Trash2 size={15} />
        </button>
      )}

      {/* Close / Deselect Button */}
      <button
        onClick={onClose}
        className="btn btn-secondary"
        title="Deselect Widget"
        style={{ padding: '0.3rem 0.5rem', marginLeft: 'auto' }}
      >
        <X size={15} />
      </button>
    </div>
  );
};
