import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Bell } from 'lucide-react';
import { useDraggableWindow } from '../hooks/useDraggableWindow.js';
import { formatTimer, playTimerChime } from '../timer/timerUtils.js';
import { DraggableWindow, DraggableWindowTitleBar } from './DraggableWindow.js';

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
  const [isMinimized, setIsMinimized] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { windowRef, position, zIndex, isDragging, handleMouseDown, bringToFront } = useDraggableWindow({
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
    <DraggableWindow
      windowRef={windowRef}
      position={position}
      zIndex={zIndex ?? 60}
      isDragging={isDragging}
      isMinimized={isMinimized}
      width="280px"
      minWidth="240px"
      maxWidth="320px"
      onMouseDownCapture={bringToFront}
      style={{
        border: isFinished
          ? '1px solid #ef4444'
          : isUrgent
          ? '1px solid #f59e0b'
          : '1px solid var(--border-subtle)',
      }}
    >
      {/* Unified Draggable Title Bar (OB-178) */}
      <DraggableWindowTitleBar
        onMouseDown={handleMouseDown}
        isDragging={isDragging}
        icon={
          isFinished ? (
            <Bell size={16} color="#ef4444" className="animate-bounce" />
          ) : (
            <Clock size={16} color={isRunning ? 'var(--accent-primary, #6366f1)' : 'var(--text-muted, #94a3b8)'} />
          )
        }
        title={label}
        subtitle={
          <span
            style={{
              fontFamily: 'monospace',
              fontWeight: 700,
              color: isFinished ? '#ef4444' : isUrgent ? '#f59e0b' : 'var(--accent-primary, #6366f1)',
              marginLeft: '0.25rem',
            }}
          >
            [{formatTimer(remaining)}]
          </span>
        }
        actions={
          <button
            type="button"
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              if (isFinished) {
                setRemaining(totalSeconds);
                setIsFinished(false);
                setIsRunning(true);
              } else {
                setIsRunning(!isRunning);
              }
            }}
            title={isRunning ? 'Pause Timer' : isFinished ? 'Restart' : 'Resume'}
            style={{ width: '24px', height: '24px' }}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
          </button>
        }
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized((v) => !v)}
        onClose={onClose}
      />

      {/* Timer Body (hidden when minimized) */}
      {!isMinimized && (
        <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {/* Large Countdown Display */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'monospace, Inter, sans-serif',
                fontSize: '2.25rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                lineHeight: 1.1,
                color: isFinished ? '#ef4444' : isUrgent ? '#f59e0b' : 'var(--text-main, #f8fafc)',
                textShadow: isFinished ? '0 0 12px rgba(239, 68, 68, 0.6)' : 'none',
              }}
            >
              {formatTimer(remaining)}
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '5px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '999px',
                overflow: 'hidden',
                marginTop: '0.5rem',
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
                    : 'var(--accent-primary, #6366f1)',
                  transition: 'width 1s linear, background-color 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.2rem',
            }}
          >
            <button
              type="button"
              className={`btn ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
              style={{
                padding: '0.35rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                borderRadius: '0.375rem',
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
              type="button"
              className="btn btn-secondary"
              style={{
                padding: '0.35rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                borderRadius: '0.375rem',
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
      )}
    </DraggableWindow>
  );
};
