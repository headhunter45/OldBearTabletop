import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Clock, Bell } from 'lucide-react';
import { useDraggableWindow } from '../hooks/useDraggableWindow.js';
import { formatTimer, playTimerChime } from '../timer/timerUtils.js';

export interface TimerHUDProps {
  initialDuration: number; // in seconds
  label?: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const TimerHUD: React.FC<TimerHUDProps> = ({
  initialDuration,
  label = 'Round Timer',
  isOpen,
  onClose,
  onComplete,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialDuration);
  const [remaining, setRemaining] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { windowRef, position, zIndex, handleMouseDown, bringToFront } = useDraggableWindow({
    initialX: typeof window !== 'undefined' ? window.innerWidth / 2 - 120 : 300,
    initialY: 70,
    storageKey: 'obr_timer_hud_pos',
  });

  // Reset or update when initialDuration changes
  useEffect(() => {
    setTotalSeconds(initialDuration);
    setRemaining(initialDuration);
    setIsRunning(true);
    setIsFinished(false);
  }, [initialDuration]);

  // Countdown effect
  useEffect(() => {
    if (!isOpen || !isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsRunning(false);
          setIsFinished(true);
          playTimerChime();
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isRunning, onComplete]);

  if (!isOpen) return null;

  const progressPercent = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;
  const isUrgent = remaining <= 10 && remaining > 0;

  return (
    <div
      ref={windowRef}
      onMouseDown={bringToFront}
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : 'calc(50% - 120px)',
        top: position ? `${position.y}px` : '70px',
        zIndex,
        minWidth: '240px',
        maxWidth: '300px',
        userSelect: 'none',
      }}
      className={`glass-panel animate-fade-in shadow-2xl rounded-2xl p-3 border ${
        isFinished
          ? 'border-red-500/80 bg-red-950/70 shadow-red-500/20'
          : isUrgent
          ? 'border-amber-500/80 bg-slate-900/90 shadow-amber-500/20'
          : 'border-slate-700/60 bg-slate-900/85'
      }`}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.4rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isFinished ? (
            <Bell size={16} className="text-red-400 animate-bounce" />
          ) : (
            <Clock size={16} className={isRunning ? 'text-indigo-400' : 'text-slate-400'} />
          )}
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: isFinished ? '#f87171' : '#cbd5e1',
            }}
          >
            {label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md"
          title="Close Timer"
        >
          <X size={15} />
        </button>
      </div>

      {/* Timer Display & Circular / Bar Progress */}
      <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
        <div
          style={{
            fontFamily: 'monospace, Inter, sans-serif',
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: isFinished ? '#ef4444' : isUrgent ? '#f59e0b' : '#f8fafc',
            textShadow: isFinished ? '0 0 12px rgba(239, 68, 68, 0.6)' : 'none',
          }}
        >
          {formatTimer(remaining)}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            overflow: 'hidden',
            marginTop: '0.35rem',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: isFinished
                ? '#ef4444'
                : isUrgent
                ? '#f59e0b'
                : '#6366f1',
              transition: 'width 1s linear, background-color 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          marginTop: '0.4rem',
        }}
      >
        <button
          className={`btn ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
          style={{
            padding: '0.35rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            borderRadius: '0.5rem',
          }}
          onClick={() => {
            if (isFinished) {
              setRemaining(totalSeconds);
              setIsFinished(false);
              setIsRunning(true);
            } else {
              setIsRunning(!isRunning);
            }
          }}
        >
          {isRunning ? (
            <>
              <Pause size={14} />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span>{isFinished ? 'Restart' : 'Resume'}</span>
            </>
          )}
        </button>

        <button
          className="btn btn-secondary"
          style={{
            padding: '0.35rem 0.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            borderRadius: '0.5rem',
          }}
          onClick={() => {
            setRemaining(totalSeconds);
            setIsFinished(false);
            setIsRunning(false);
          }}
          title="Reset Timer"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
