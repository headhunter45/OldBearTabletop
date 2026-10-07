import { ProgressClock, ScreenMarker } from '@oldbear/shared';
import {
  Check,
  Minus,
  Palette,
  PieChart,
  Plus,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { COLOR_VALUES } from '../config/colors.js';
import { getClockTotalSteps } from './ClockWidget.js';
import { DraggableWindow, DraggableWindowTitleBar } from './DraggableWindow.js';

export interface ProgressClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  clocks?: ProgressClock[];
  onAddClock?: (clock: ProgressClock) => void;
  onUpdateClock?: (id: string, updates: Partial<ProgressClock>) => void;
  onDeleteClock?: (id: string) => void;
  isGm?: boolean;
  onPlaceOnCanvas?: (clock: ProgressClock) => void;
  canvasMarkers?: ScreenMarker[];
  onUpdateMarker?: (id: string, updates: Partial<ScreenMarker>) => void;
  onDeleteMarker?: (id: string) => void;
}

const STORAGE_KEY = 'obb_progress_clocks';

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
  clocks: propClocks,
  onAddClock: propOnAddClock,
  onUpdateClock: propOnUpdateClock,
  onDeleteClock: propOnDeleteClock,
  isGm = true,
  onPlaceOnCanvas,
  canvasMarkers = [],
  onUpdateMarker,
  onDeleteMarker,
}) => {
  // Local fallback state if live shared instance not passed
  const [localClocks, setLocalClocks] = useState<ProgressClock[]>(() => {
    const saved = getSavedProgressClocks();
    if (saved.length > 0) return saved;
    return [
      {
        id: 'clock-default-1',
        name: 'Guards on Alert',
        steps: 6,
        segments: 6,
        filled: 2,
        color: '#ef4444',
      },
      {
        id: 'clock-default-2',
        name: 'Ritual of Summoning',
        steps: 8,
        segments: 8,
        filled: 5,
        color: '#8b5cf6',
      },
    ];
  });

  const [isMinimized, setIsMinimized] = useState(false);
  const [newClockName, setNewClockName] = useState('');
  const [newClockSteps, setNewClockSteps] = useState(8);
  const [newClockColor, setNewClockColor] = useState('#3b82f6');
  const [showColorPickerForId, setShowColorPickerForId] = useState<string | null>(null);
  const [showNewColorPicker, setShowNewColorPicker] = useState(false);

  // Active clocks source (prop if passed, else local state)
  const clocks = propClocks || localClocks;

  // Save changes to localStorage if using local fallback
  useEffect(() => {
    if (!propClocks) {
      saveProgressClocks(localClocks);
    }
  }, [localClocks, propClocks]);

  if (!isOpen) return null;

  const handleAddClock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGm) return;
    const name = newClockName.trim() || `Clock ${clocks.length + 1}`;
    const newClock: ProgressClock = {
      id: crypto.randomUUID(),
      name,
      steps: newClockSteps,
      segments: newClockSteps,
      filled: 0,
      color: newClockColor,
    };

    if (propOnAddClock) {
      propOnAddClock(newClock);
    } else {
      setLocalClocks((prev) => [...prev, newClock]);
    }
    setNewClockName('');
  };

  const handleUpdateClock = (id: string, updates: Partial<ProgressClock>) => {
    if (!isGm) return;
    if (propOnUpdateClock) {
      propOnUpdateClock(id, updates);
    } else {
      setLocalClocks((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const totalSteps = updates.steps ?? updates.segments ?? c.steps ?? c.segments ?? 8;
          let filled = updates.filled ?? c.filled;
          if (filled > totalSteps) filled = totalSteps;
          if (filled < 0) filled = 0;
          return {
            ...c,
            ...updates,
            steps: totalSteps,
            segments: totalSteps,
            filled,
          };
        })
      );
    }

    // If marker exists on canvas with this id or label, sync it
    const matchingMarker = canvasMarkers.find((m) => m.id === id || m.label === id);
    if (matchingMarker && onUpdateMarker) {
      onUpdateMarker(matchingMarker.id, {
        segments: updates.steps ?? updates.segments,
        filled: updates.filled,
        color: updates.color,
        label: updates.name,
      });
    }
  };

  const handleDeleteClock = (id: string) => {
    if (!isGm) return;
    if (propOnDeleteClock) {
      propOnDeleteClock(id);
    } else {
      setLocalClocks((prev) => prev.filter((c) => c.id !== id));
    }
    const matchingMarker = canvasMarkers.find((m) => m.id === id);
    if (matchingMarker && onDeleteMarker) {
      onDeleteMarker(matchingMarker.id);
    }
  };

  // Helper to render interactive SVG Pie Wedge Clock
  const renderSvgClock = (clock: ProgressClock, size = 95) => {
    const totalSteps = getClockTotalSteps(clock);
    const filled = Math.max(0, Math.min(totalSteps, clock.filled ?? 0));
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
          onClick={() => {
            if (!isGm) return;
            const newFilled = i < filled && i === filled - 1 ? i : i + 1;
            handleUpdateClock(clock.id, { filled: newFilled });
          }}
        />
      );
    }

    const hubRadius = radius * 0.32;

    return (
      <svg width={size} height={size} className="drop-shadow-md">
        <circle cx={center} cy={center} r={radius} fill="#0f172a" />
        {slices}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="2"
        />
        <circle
          cx={center}
          cy={center}
          r={hubRadius}
          fill="#0f172a"
          stroke={clock.color}
          strokeWidth="2"
        />
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

  return (
    <DraggableWindow
      isOpen={isOpen}
      onClose={onClose}
      isMinimized={isMinimized}
      title="Progress Clocks"
      storageKey="obb_progress_clocks_pos"
      initialX={typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 380) : 400}
      initialY={90}
      width="360px"
      header={
        <DraggableWindowTitleBar
          title="Progress Clocks"
          icon={<PieChart size={17} className="text-indigo-400" />}
          badge={`${clocks.length}`}
          isMinimized={isMinimized}
          onToggleMinimize={() => setIsMinimized((v) => !v)}
          onClose={onClose}
        />
      }
    >
      <div className="flex flex-col max-h-[75vh]">
        {/* Clocks List */}
        <div className="overflow-y-auto p-3 space-y-3 flex-1" style={{ maxHeight: '48vh' }}>
          {clocks.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No progress clocks created yet. Add one below!
            </div>
          ) : (
            clocks.map((clock) => {
              const totalSteps = getClockTotalSteps(clock);
              const filled = Math.max(0, Math.min(totalSteps, clock.filled ?? 0));

              return (
                <div
                  key={clock.id}
                  className="p-3 rounded-xl border border-slate-700/60 bg-slate-800/50 flex flex-col gap-2.5 shadow-sm"
                >
                  {/* Top Row: Name, Color Swatch & Delete */}
                  <div className="flex items-center justify-between gap-2">
                    {isGm ? (
                      <input
                        type="text"
                        value={clock.name}
                        onChange={(e) => handleUpdateClock(clock.id, { name: e.target.value })}
                        className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-indigo-400 focus:outline-none text-sm font-semibold text-slate-100 flex-1 truncate px-1 py-0.5"
                        title="Click to rename clock"
                        placeholder="Clock Name"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-100 flex-1 truncate px-1 py-0.5">
                        {clock.name}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {/* Direct Color Picker (OB-173) */}
                      {isGm && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowColorPickerForId(
                                showColorPickerForId === clock.id ? null : clock.id
                              )
                            }
                            style={{ backgroundColor: clock.color }}
                            className="w-5 h-5 rounded-full border border-white/40 shadow-sm transition-transform hover:scale-105"
                            title="Change clock color"
                          />
                          {showColorPickerForId === clock.id && (
                            <div className="absolute right-0 top-6 z-50 p-2 glass-panel rounded-lg shadow-xl grid grid-cols-5 gap-1.5 border border-slate-700 bg-slate-900 min-w-[150px]">
                              {COLOR_VALUES.map((c) => (
                                <button
                                  key={c}
                                  style={{ backgroundColor: c }}
                                  className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform flex items-center justify-center"
                                  onClick={() => {
                                    handleUpdateClock(clock.id, { color: c });
                                    setShowColorPickerForId(null);
                                  }}
                                  title={c}
                                >
                                  {clock.color === c && <Check size={12} color="#fff" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Delete Clock */}
                      {isGm && (
                        <button
                          onClick={() => handleDeleteClock(clock.id)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors rounded"
                          title="Delete Clock"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Clock SVG + Stepper Controls (OB-173) */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center">
                      {renderSvgClock(clock, 95)}
                    </div>

                    <div className="flex flex-col gap-2 flex-1">
                      {/* Filled Steps Stepper (+ / -) */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-slate-300">Filled Steps</span>
                        <div className="flex items-center gap-1.5">
                          {isGm && (
                            <button
                              onClick={() => handleUpdateClock(clock.id, { filled: filled - 1 })}
                              disabled={filled <= 0}
                              className="btn btn-secondary flex-1 py-1 flex items-center justify-center font-bold text-slate-200"
                              title="Decrement filled step (-)"
                            >
                              <Minus size={13} />
                            </button>
                          )}
                          <span className="text-xs font-mono font-bold text-center px-2 py-0.5 bg-slate-900/60 rounded border border-slate-700/50 min-w-[50px]">
                            {filled}/{totalSteps}
                          </span>
                          {isGm && (
                            <button
                              onClick={() => handleUpdateClock(clock.id, { filled: filled + 1 })}
                              disabled={filled >= totalSteps}
                              className="btn btn-primary flex-1 py-1 flex items-center justify-center font-bold text-white"
                              title="Increment filled step (+)"
                            >
                              <Plus size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Total Steps Stepper (+ / -) */}
                      {isGm && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-slate-300">Total Steps</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const next = Math.max(2, totalSteps - 1);
                                handleUpdateClock(clock.id, {
                                  steps: next,
                                  segments: next,
                                  filled: Math.min(next, filled),
                                });
                              }}
                              disabled={totalSteps <= 2}
                              className="btn btn-secondary flex-1 py-1 flex items-center justify-center font-bold text-slate-200"
                              title="Decrease total steps (-1)"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="text-xs font-mono font-bold text-center px-2 py-0.5 bg-slate-900/60 rounded border border-slate-700/50 min-w-[50px]">
                              {totalSteps} steps
                            </span>
                            <button
                              onClick={() => {
                                const next = Math.min(24, totalSteps + 1);
                                handleUpdateClock(clock.id, {
                                  steps: next,
                                  segments: next,
                                });
                              }}
                              disabled={totalSteps >= 24}
                              className="btn btn-secondary flex-1 py-1 flex items-center justify-center font-bold text-slate-200"
                              title="Increase total steps (+1)"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* GM-Only: Create New Clock Footer Form */}
        {isGm && (
          <form
            onSubmit={handleAddClock}
            className="p-3 border-t border-slate-700/60 bg-slate-800/40 flex flex-col gap-2.5"
          >
            <div className="text-xs font-semibold text-slate-300">Add New Progress Clock</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Clock Name (e.g. Ritual Countdown)"
                value={newClockName}
                onChange={(e) => setNewClockName(e.target.value)}
                className="input text-xs flex-1"
                style={{ padding: '0.35rem 0.6rem' }}
              />

              {/* Direct Color Picker Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNewColorPicker(!showNewColorPicker)}
                  style={{ backgroundColor: newClockColor }}
                  className="w-7 h-7 rounded-lg border border-white/30 shadow-sm flex items-center justify-center"
                  title="Choose clock color"
                >
                  <Palette size={13} color="#fff" />
                </button>
                {showNewColorPicker && (
                  <div className="absolute right-0 bottom-8 z-50 p-2 glass-panel rounded-lg shadow-xl grid grid-cols-5 gap-1.5 border border-slate-700 bg-slate-900 min-w-[150px]">
                    {COLOR_VALUES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        style={{ backgroundColor: c }}
                        className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform flex items-center justify-center"
                        onClick={() => {
                          setNewClockColor(c);
                          setShowNewColorPicker(false);
                        }}
                        title={c}
                      >
                        {newClockColor === c && <Check size={12} color="#fff" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stepper for New Clock Steps & Submit Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Steps:</span>
                <button
                  type="button"
                  onClick={() => setNewClockSteps((s) => Math.max(2, s - 1))}
                  disabled={newClockSteps <= 2}
                  className="btn btn-secondary px-2 py-0.5 text-xs"
                >
                  <Minus size={12} />
                </button>
                <span className="text-xs font-mono font-bold w-6 text-center">{newClockSteps}</span>
                <button
                  type="button"
                  onClick={() => setNewClockSteps((s) => Math.min(24, s + 1))}
                  disabled={newClockSteps >= 24}
                  className="btn btn-secondary px-2 py-0.5 text-xs"
                >
                  <Plus size={12} />
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Create Clock</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </DraggableWindow>
  );
};
