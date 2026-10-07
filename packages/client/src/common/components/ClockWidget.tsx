import { ProgressClock } from '@oldbear/shared';
import React from 'react';
import { useDraggableWindow } from '../hooks/useDraggableWindow.js';

export interface ClockWidgetProps {
  clock: ProgressClock;
  index: number;
  isSelected: boolean;
  isCompact: boolean;
  onSelect: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<ProgressClock>) => void;
  isGm?: boolean;
}

export function getClockTotalSteps(clock: { steps?: number; segments?: number }): number {
  return clock.steps ?? clock.segments ?? 8;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({
  clock,
  index,
  isSelected,
  isCompact,
  onSelect,
  onUpdate,
  isGm = false,
}) => {
  const totalSteps = getClockTotalSteps(clock);
  const filled = Math.max(0, Math.min(totalSteps, clock.filled ?? 0));

  // Per-user local draggable coordinates (independent of other users)
  const defaultX = typeof window !== 'undefined' ? 24 + (index % 4) * 140 : 24;
  const defaultY = 90 + Math.floor(index / 4) * 140;

  const { windowRef, position, zIndex, handleMouseDown, bringToFront } = useDraggableWindow({
    initialX: defaultX,
    initialY: defaultY,
    storageKey: `obb_widget_clock_${clock.id}`,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    bringToFront();
    onSelect(clock.id);
  };

  // Radial Dial Rendering
  const renderRadialClock = (size = 100) => {
    const radius = size / 2 - 6;
    const center = size / 2;
    const step = (Math.PI * 2) / totalSteps;
    const startAngle = -Math.PI / 2; // 12 o'clock

    const slices = [];
    for (let i = 0; i < totalSteps; i++) {
      const a1 = startAngle + i * step;
      const a2 = startAngle + (i + 1) * step;

      const x1 = center + radius * Math.cos(a1);
      const y1 = center + radius * Math.sin(a1);
      const x2 = center + radius * Math.cos(a2);
      const y2 = center + radius * Math.sin(a2);

      const isLargeArc = step > Math.PI ? 1 : 0;
      const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${isLargeArc} 1 ${x2} ${y2} Z`;
      const isFilled = i < filled;

      slices.push(
        <path
          key={i}
          d={pathData}
          fill={isFilled ? clock.color : 'rgba(255, 255, 255, 0.05)'}
          fillOpacity={isFilled ? 0.9 : 0.2}
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="1.5"
          className={isGm ? 'cursor-pointer transition-all hover:opacity-80' : ''}
          onClick={(e) => {
            if (!isGm) return;
            e.stopPropagation();
            // Toggle up to this step index
            const nextFilled = i < filled && i === filled - 1 ? i : i + 1;
            onUpdate?.(clock.id, { filled: nextFilled });
          }}
        />
      );
    }

    const hubRadius = radius * 0.32;

    return (
      <svg width={size} height={size} className="drop-shadow-md overflow-visible">
        {/* Background circle */}
        <circle cx={center} cy={center} r={radius} fill="#0f172a" />
        {/* Step Slices */}
        {slices}
        {/* Outer border ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="2"
        />
        {/* Inner Hub */}
        <circle
          cx={center}
          cy={center}
          r={hubRadius}
          fill="#0f172a"
          stroke={clock.color}
          strokeWidth="2"
        />
        {/* Center Text */}
        <text
          x={center}
          y={center + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffff"
          fontSize={Math.round(hubRadius * 0.85)}
          fontWeight="bold"
          fontFamily="Inter, sans-serif"
        >
          {filled}/{totalSteps}
        </text>
      </svg>
    );
  };

  // Percentage for compact mode
  const pct = Math.min(100, Math.max(0, Math.round((filled / totalSteps) * 100)));

  return (
    <div
      ref={windowRef}
      onMouseDown={(e) => {
        bringToFront();
        handleMouseDown(e);
      }}
      onClick={handleClick}
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : `${defaultX}px`,
        top: position ? `${position.y}px` : `${defaultY}px`,
        zIndex,
        userSelect: 'none',
        cursor: 'grab',
      }}
      className={`group select-none transition-shadow ${
        isSelected ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/25' : 'hover:ring-1 hover:ring-white/40'
      } rounded-2xl`}
      title={clock.name ? `${clock.name} (${filled}/${totalSteps} steps)` : `Clock (${filled}/${totalSteps} steps)`}
    >
      {isCompact ? (
        /* Compact Mode: Sleek 1-2 line horizontal progress bar (OB-173) */
        <div
          className="glass-panel px-3 py-2 rounded-xl flex flex-col gap-1 border border-slate-700/80 bg-slate-900/90 shadow-xl"
          style={{ width: '160px', minHeight: clock.name?.trim() ? '48px' : '36px' }}
        >
          {clock.name?.trim() && (
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-slate-100 truncate flex-1">{clock.name}</span>
              <span className="text-[10px] font-mono text-slate-300 whitespace-nowrap">
                {filled}/{totalSteps}
              </span>
            </div>
          )}

          {/* Progress bar track */}
          <div className="w-full bg-slate-800 rounded-full h-3 relative overflow-hidden border border-slate-700/60">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${pct}%`,
                backgroundColor: clock.color,
                boxShadow: `0 0 8px ${clock.color}80`,
              }}
            />
            {!clock.name?.trim() && (
              <span
                style={{ fontSize: '9px' }}
                className="absolute inset-0 flex items-center justify-center font-bold font-mono text-white drop-shadow"
              >
                {filled} / {totalSteps} steps
              </span>
            )}
          </div>
          {clock.name?.trim() && (
            <span style={{ fontSize: '9px' }} className="text-slate-400 font-mono text-right">
              {filled} / {totalSteps} steps
            </span>
          )}
        </div>
      ) : (
        /* Radial Dial Mode (OB-173) */
        <div className="glass-panel p-2.5 rounded-2xl flex flex-col items-center gap-1.5 border border-slate-700/80 bg-slate-900/85 shadow-xl backdrop-blur-md">
          {clock.name?.trim() && (
            <span
              className="text-xs font-semibold text-slate-100 text-center truncate max-w-[110px] px-1"
              title={clock.name}
            >
              {clock.name}
            </span>
          )}
          <div className="flex items-center justify-center">{renderRadialClock(96)}</div>
        </div>
      )}
    </div>
  );
};
