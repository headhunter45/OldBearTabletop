import React, { useState, useEffect } from 'react';
import { ProgressClock, ScreenMarker } from '@oldbear/shared';
import {
  X,
  Plus,
  Minus,
  Trash2,
  MapPin,
  PieChart,
  Palette,
  Check,
} from 'lucide-react';
import { useDraggableWindow } from '../hooks/useDraggableWindow.js';
import { COLOR_VALUES } from '../config/colors.js';

export interface ProgressClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceOnCanvas?: (clock: ProgressClock) => void;
  canvasMarkers?: ScreenMarker[];
  onUpdateMarker?: (id: string, updates: Partial<ScreenMarker>) => void;
  onDeleteMarker?: (id: string) => void;
}

const STORAGE_KEY = 'obr_progress_clocks';

export function getSavedProgressClocks(): ProgressClock[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveProgressClocks(clocks: ProgressClock[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clocks));
  } catch {}
}

export const ProgressClockModal: React.FC<ProgressClockModalProps> = ({
  isOpen,
  onClose,
  onPlaceOnCanvas,
  canvasMarkers = [],
  onUpdateMarker,
  onDeleteMarker,
}) => {
  const [clocks, setClocks] = useState<ProgressClock[]>(() => {
    const saved = getSavedProgressClocks();
    if (saved.length > 0) return saved;
    return [
      {
        id: 'clock-default-1',
        name: 'Guards on Alert',
        segments: 6,
        filled: 2,
        color: '#ef4444',
      },
      {
        id: 'clock-default-2',
        name: 'Ritual of Summoning',
        segments: 8,
        filled: 5,
        color: '#8b5cf6',
      },
    ];
  });

  const [newClockName, setNewClockName] = useState('');
  const [newClockSegments, setNewClockSegments] = useState(8);
  const [newClockColor, setNewClockColor] = useState('#3b82f6');
  const [showColorPickerForId, setShowColorPickerForId] = useState<string | null>(null);

  const { windowRef, position, zIndex, handleMouseDown, bringToFront } = useDraggableWindow({
    initialX: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 380) : 400,
    initialY: 90,
    storageKey: 'obr_progress_clocks_pos',
  });

  // Save changes to localStorage
  useEffect(() => {
    saveProgressClocks(clocks);
  }, [clocks]);

  if (!isOpen) return null;

  const handleAddClock = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newClockName.trim() || `Clock ${clocks.length + 1}`;
    const newClock: ProgressClock = {
      id: crypto.randomUUID(),
      name,
      segments: newClockSegments,
      filled: 0,
      color: newClockColor,
    };
    setClocks((prev) => [...prev, newClock]);
    setNewClockName('');
  };

  const handleUpdateClock = (id: string, updates: Partial<ProgressClock>) => {
    setClocks((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...updates };
        if (updated.filled > updated.segments) updated.filled = updated.segments;
        if (updated.filled < 0) updated.filled = 0;
        return updated;
      })
    );

    // If marker exists on canvas with this id or label, sync it
    const matchingMarker = canvasMarkers.find((m) => m.id === id || m.label === id);
    if (matchingMarker && onUpdateMarker) {
      onUpdateMarker(matchingMarker.id, {
        segments: updates.segments,
        filled: updates.filled,
        color: updates.color,
        label: updates.name,
      });
    }
  };

  const handleDeleteClock = (id: string) => {
    setClocks((prev) => prev.filter((c) => c.id !== id));
    const matchingMarker = canvasMarkers.find((m) => m.id === id);
    if (matchingMarker && onDeleteMarker) {
      onDeleteMarker(matchingMarker.id);
    }
  };

  // Helper to render interactive SVG Pie Wedge Clock
  const renderSvgClock = (clock: ProgressClock, size = 110) => {
    const radius = size / 2 - 6;
    const center = size / 2;
    const step = (Math.PI * 2) / clock.segments;
    const startAngle = -Math.PI / 2; // 12 o'clock

    const slices = [];
    for (let i = 0; i < clock.segments; i++) {
      const a1 = startAngle + i * step;
      const a2 = startAngle + (i + 1) * step;

      const x1 = center + radius * Math.cos(a1);
      const y1 = center + radius * Math.sin(a1);
      const x2 = center + radius * Math.cos(a2);
      const y2 = center + radius * Math.sin(a2);

      const isLargeArc = step > Math.PI ? 1 : 0;
      const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${isLargeArc} 1 ${x2} ${y2} Z`;
      const isFilled = i < clock.filled;

      slices.push(
        <path
          key={i}
          d={pathData}
          fill={isFilled ? clock.color : 'rgba(255, 255, 255, 0.05)'}
          fillOpacity={isFilled ? 0.9 : 0.2}
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="1.5"
          className="cursor-pointer transition-all hover:opacity-80"
          onClick={() => {
            // Clicking a slice toggles up to that slice index
            const newFilled = i < clock.filled && i === clock.filled - 1 ? i : i + 1;
            handleUpdateClock(clock.id, { filled: newFilled });
          }}
        />
      );
    }

    const hubRadius = radius * 0.32;

    return (
      <svg width={size} height={size} className="drop-shadow-md">
        {/* Background circle */}
        <circle cx={center} cy={center} r={radius} fill="#0f172a" />
        {/* Slices */}
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
          {clock.filled}/{clock.segments}
        </text>
      </svg>
    );
  };

  return (
    <div
      ref={windowRef}
      onMouseDown={bringToFront}
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : 'calc(100vw - 380px)',
        top: position ? `${position.y}px` : '90px',
        zIndex,
        width: '350px',
        maxHeight: '85vh',
        userSelect: 'none',
      }}
      className="glass-panel animate-fade-in shadow-2xl rounded-2xl flex flex-col border border-slate-700/80 bg-slate-900/90 overflow-hidden"
    >
      {/* Draggable Modal Header */}
      <div
        onMouseDown={handleMouseDown}
        style={{ cursor: 'grab' }}
        className="flex items-center justify-between p-3.5 border-b border-slate-700/60 bg-slate-800/40"
      >
        <div className="flex items-center gap-2">
          <PieChart size={18} className="text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-100">Progress Clocks</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
            {clocks.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md"
        >
          <X size={16} />
        </button>
      </div>

      {/* Clocks List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: '55vh' }}>
        {clocks.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No progress clocks created yet. Add one below!
          </div>
        ) : (
          clocks.map((clock) => (
            <div
              key={clock.id}
              className="p-3 rounded-xl border border-slate-700/60 bg-slate-800/50 flex flex-col gap-2.5"
            >
              {/* Top Row: Name, Color Picker & Delete */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={clock.name}
                  onChange={(e) => handleUpdateClock(clock.id, { name: e.target.value })}
                  className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-indigo-400 focus:outline-none text-sm font-semibold text-slate-100 flex-1 truncate px-1 py-0.5"
                  title="Click to rename clock"
                />

                <div className="flex items-center gap-1.5">
                  {/* Color swatch */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowColorPickerForId(
                          showColorPickerForId === clock.id ? null : clock.id
                        )
                      }
                      style={{ backgroundColor: clock.color }}
                      className="w-5 h-5 rounded-full border border-white/40 shadow-sm"
                      title="Change clock color"
                    />
                    {showColorPickerForId === clock.id && (
                      <div className="absolute right-0 top-6 z-50 p-2 glass-panel rounded-lg shadow-xl grid grid-cols-5 gap-1.5 border border-slate-700 bg-slate-900">
                        {COLOR_VALUES.map((c) => (
                          <button
                            key={c}
                            style={{ backgroundColor: c }}
                            className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform flex items-center justify-center"
                            onClick={() => {
                              handleUpdateClock(clock.id, { color: c });
                              setShowColorPickerForId(null);
                            }}
                          >
                            {clock.color === c && <Check size={12} color="#fff" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Place on Canvas Button */}
                  {onPlaceOnCanvas && (
                    <button
                      onClick={() => onPlaceOnCanvas(clock)}
                      className="p-1 text-slate-400 hover:text-indigo-300 transition-colors rounded"
                      title="Place on Canvas Map"
                    >
                      <MapPin size={15} />
                    </button>
                  )}

                  {/* Delete Clock */}
                  <button
                    onClick={() => handleDeleteClock(clock.id)}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors rounded"
                    title="Delete Clock"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Middle Row: Clock SVG + Quick Wedge Controls */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-shrink-0 flex items-center justify-center">
                  {renderSvgClock(clock, 95)}
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  {/* Plus / Minus Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateClock(clock.id, { filled: clock.filled - 1 })}
                      className="btn btn-secondary flex-1 py-1.5 flex items-center justify-center font-bold text-slate-200"
                      title="Dim wedge (-)"
                    >
                      <Minus size={15} />
                    </button>
                    <button
                      onClick={() => handleUpdateClock(clock.id, { filled: clock.filled + 1 })}
                      className="btn btn-primary flex-1 py-1.5 flex items-center justify-center font-bold text-white"
                      title="Light up next clockwise wedge (+)"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* Segments Preset Selector */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Slices:</span>
                    {[4, 6, 8, 12].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleUpdateClock(clock.id, { segments: s })}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          clock.segments === s
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Clock Creation Form */}
      <form
        onSubmit={handleAddClock}
        className="p-3 border-t border-slate-700/60 bg-slate-800/30 flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="New Clock Name..."
            value={newClockName}
            onChange={(e) => setNewClockName(e.target.value)}
            className="input flex-1 py-1.5 px-2.5 text-xs rounded-lg"
          />
          <button
            type="submit"
            className="btn btn-primary py-1.5 px-3 text-xs flex items-center gap-1 font-semibold rounded-lg"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Wedges:</span>
            {[4, 6, 8, 12].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setNewClockSegments(s)}
                className={`px-2 py-0.5 rounded text-xs ${
                  newClockSegments === s
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map((col) => (
              <button
                type="button"
                key={col}
                onClick={() => setNewClockColor(col)}
                style={{ backgroundColor: col }}
                className={`w-4 h-4 rounded-full border ${
                  newClockColor === col ? 'border-white scale-110' : 'border-transparent'
                }`}
              />
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
