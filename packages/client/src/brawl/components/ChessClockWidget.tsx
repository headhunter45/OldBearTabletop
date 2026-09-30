import React, { useState } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Minimize2,
  Maximize2,
  Settings,
  Volume2,
  VolumeX,
  X,
  ArrowRightLeft,
} from 'lucide-react';
import { useDraggableWindow } from '../../common/hooks/useDraggableWindow.js';
import {
  formatChessClock,
  getClockWarningStatus,
  CLOCK_PRESETS,
  playClockSwitchSound,
} from '../domain/chessClock.js';

interface ChessClockWidgetProps {
  p1Seconds: number;
  p2Seconds: number;
  activePlayer: 1 | 2;
  isRunning: boolean;
  p1Name?: string;
  p2Name?: string;
  onToggleRunning: () => void;
  onSwitchPlayer: () => void;
  onResetClock: (timeLimitSeconds: number) => void;
  onClose?: () => void;
}

export const ChessClockWidget: React.FC<ChessClockWidgetProps> = ({
  p1Seconds,
  p2Seconds,
  activePlayer,
  isRunning,
  p1Name = 'Player 1',
  p2Name = 'Player 2',
  onToggleRunning,
  onSwitchPlayer,
  onResetClock,
  onClose,
}) => {
  const [minimized, setMinimized] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { position, isDragging, windowRef, handleMouseDown } = useDraggableWindow({
    storageKey: 'brawl_chess_clock_position',
    initialX: 350,
    initialY: 90,
  });

  const p1Time = formatChessClock(p1Seconds);
  const p2Time = formatChessClock(p2Seconds);
  const p1Status = getClockWarningStatus(p1Seconds);
  const p2Status = getClockWarningStatus(p2Seconds);

  const handleClockSwitch = () => {
    if (soundEnabled) playClockSwitchSound();
    onSwitchPlayer();
  };

  const getStatusColor = (status: ReturnType<typeof getClockWarningStatus>, defaultColor: string) => {
    switch (status) {
      case 'overtime':
        return '#ef4444';
      case 'danger':
        return '#ea580c';
      case 'warning':
        return '#f59e0b';
      default:
        return defaultColor;
    }
  };

  const p1Color = getStatusColor(p1Status, '#38bdf8');
  const p2Color = getStatusColor(p2Status, '#ec4899');

  if (minimized) {
    const activeTime = activePlayer === 1 ? p1Time : p2Time;
    const activeColor = activePlayer === 1 ? p1Color : p2Color;
    const activeName = activePlayer === 1 ? p1Name : p2Name;

    return (
      <div
        ref={windowRef}
        style={{
          position: 'fixed',
          left: `${position?.x ?? 350}px`,
          top: `${position?.y ?? 90}px`,
          zIndex: 80,
          background: 'rgba(15, 23, 42, 0.92)',
          border: `1.5px solid ${isRunning ? activeColor : 'rgba(255, 255, 255, 0.15)'}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          borderRadius: '24px',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(10px)',
          userSelect: 'none',
        }}
      >
        <div
          onMouseDown={handleMouseDown}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          <Timer size={14} color={activeColor} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: activeColor }}>
            P{activePlayer} ({activeName}):
          </span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.95rem',
              fontWeight: 800,
              color: activeTime.isOvertime ? '#ef4444' : '#f8fafc',
            }}
          >
            {activeTime.formatted}
          </span>
          {activeTime.isOvertime && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.2)',
                padding: '1px 4px',
                borderRadius: '4px',
              }}
            >
              OT
            </span>
          )}
        </div>

        <button
          className="btn-icon"
          onClick={handleClockSwitch}
          style={{ width: '22px', height: '22px', padding: 0 }}
          title="Pass Turn to Opponent"
        >
          <ArrowRightLeft size={12} />
        </button>

        <button
          className="btn-icon"
          onClick={onToggleRunning}
          style={{ width: '22px', height: '22px', padding: 0 }}
          title={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? <Pause size={12} /> : <Play size={12} />}
        </button>

        <button
          className="btn-icon"
          onClick={() => setMinimized(false)}
          style={{ width: '22px', height: '22px', padding: 0 }}
          title="Expand Chess Clock"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      style={{
        position: 'fixed',
        left: `${position?.x ?? 350}px`,
        top: `${position?.y ?? 90}px`,
        zIndex: 80,
        width: '380px',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.65)',
        borderRadius: '12px',
        backdropFilter: 'blur(12px)',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          cursor: isDragging ? 'grabbing' : 'grab',
          background: 'rgba(0, 0, 0, 0.25)',
          borderTopLeftRadius: '11px',
          borderTopRightRadius: '11px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Timer size={16} color="#f59e0b" />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>
            MATCH CHESS CLOCK
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '4px',
              background: isRunning ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
              color: isRunning ? '#10b981' : '#94a3b8',
            }}
          >
            {isRunning ? 'RUNNING' : 'PAUSED'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className="btn-icon"
            onClick={() => setSoundEnabled((prev) => !prev)}
            style={{ width: '24px', height: '24px' }}
            title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} color="#94a3b8" />}
          </button>
          <button
            className="btn-icon"
            onClick={() => setShowConfig((prev) => !prev)}
            style={{ width: '24px', height: '24px' }}
            title="Clock Presets & Settings"
          >
            <Settings size={13} />
          </button>
          <button
            className="btn-icon"
            onClick={() => setMinimized(true)}
            style={{ width: '24px', height: '24px' }}
            title="Minimize to Floating Bar"
          >
            <Minimize2 size={13} />
          </button>
          {onClose && (
            <button
              className="btn-icon"
              onClick={onClose}
              style={{ width: '24px', height: '24px' }}
              title="Close Clock"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Preset Config Flydown */}
      {showConfig && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            RESET MATCH TIME PER PLAYER:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {CLOCK_PRESETS.map((preset) => (
              <button
                key={preset.label}
                className="btn-glass"
                onClick={() => {
                  onResetClock(preset.seconds);
                  setShowConfig(false);
                }}
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dual Clock Faces */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px' }}>
        {/* Player 1 Clock */}
        <div
          onClick={() => {
            if (activePlayer === 1) handleClockSwitch();
          }}
          style={{
            padding: '12px 10px',
            borderRadius: '8px',
            background: activePlayer === 1 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0, 0, 0, 0.25)',
            border: `2px solid ${activePlayer === 1 ? p1Color : 'rgba(255, 255, 255, 0.06)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: activePlayer === 1 ? 'pointer' : 'default',
            boxShadow: activePlayer === 1 ? `0 0 16px ${p1Color}33` : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: activePlayer === 1 ? p1Color : 'var(--text-secondary)',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {p1Name}
            </span>
            {p1Time.isOvertime && (
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.2)',
                  padding: '0 4px',
                  borderRadius: '3px',
                }}
              >
                OT
              </span>
            )}
          </div>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: p1Time.isOvertime ? '#ef4444' : p1Color,
              letterSpacing: '1px',
            }}
          >
            {p1Time.formatted}
          </span>
          {activePlayer === 1 && (
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: p1Color, marginTop: '2px' }}>
              ACTIVE (Click to Pass)
            </span>
          )}
        </div>

        {/* Player 2 Clock */}
        <div
          onClick={() => {
            if (activePlayer === 2) handleClockSwitch();
          }}
          style={{
            padding: '12px 10px',
            borderRadius: '8px',
            background: activePlayer === 2 ? 'rgba(236, 72, 153, 0.12)' : 'rgba(0, 0, 0, 0.25)',
            border: `2px solid ${activePlayer === 2 ? p2Color : 'rgba(255, 255, 255, 0.06)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: activePlayer === 2 ? 'pointer' : 'default',
            boxShadow: activePlayer === 2 ? `0 0 16px ${p2Color}33` : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: activePlayer === 2 ? p2Color : 'var(--text-secondary)',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {p2Name}
            </span>
            {p2Time.isOvertime && (
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.2)',
                  padding: '0 4px',
                  borderRadius: '3px',
                }}
              >
                OT
              </span>
            )}
          </div>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: p2Time.isOvertime ? '#ef4444' : p2Color,
              letterSpacing: '1px',
            }}
          >
            {p2Time.formatted}
          </span>
          {activePlayer === 2 && (
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: p2Color, marginTop: '2px' }}>
              ACTIVE (Click to Pass)
            </span>
          )}
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px 10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <button
          className="btn-primary"
          onClick={handleClockSwitch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 800,
            padding: '6px 14px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderColor: '#b45309',
          }}
          title="Pass turn & swap active clock"
        >
          <ArrowRightLeft size={14} /> Pass Turn
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn-glass"
            onClick={onToggleRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '6px 10px',
              color: isRunning ? '#ef4444' : '#10b981',
            }}
            title={isRunning ? 'Pause Clocks' : 'Start Clocks'}
          >
            {isRunning ? (
              <>
                <Pause size={13} /> Pause
              </>
            ) : (
              <>
                <Play size={13} /> Start
              </>
            )}
          </button>

          <button
            className="btn-icon"
            onClick={() => onResetClock(5400)}
            style={{ width: '28px', height: '28px' }}
            title="Reset Clocks to 90 Minutes"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
