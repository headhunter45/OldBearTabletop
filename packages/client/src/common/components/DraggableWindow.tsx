import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

export interface DraggableWindowTitleBarProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  isDragging?: boolean;
  titleBarRef?: React.Ref<HTMLDivElement>;
  className?: string;
  style?: React.CSSProperties;
}

export const DraggableWindowTitleBar: React.FC<DraggableWindowTitleBarProps> = ({
  icon,
  title,
  subtitle,
  actions,
  isMinimized,
  onToggleMinimize,
  onClose,
  onMouseDown,
  isDragging,
  titleBarRef,
  className = '',
  style,
}) => {
  return (
    <div
      ref={titleBarRef}
      onMouseDown={onMouseDown}
      className={`draggable-window-titlebar ${className}`}
      style={{
        padding: '0.75rem 1rem',
        borderBottom: isMinimized ? 'none' : '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--bg-surface)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        gap: '0.5rem',
        minHeight: '44px',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          minWidth: 0,
          flex: 1,
        }}
      >
        {icon && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>}
        <span
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: 'var(--text-main, #f8fafc)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
          title={typeof title === 'string' ? title : undefined}
        >
          {title}
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted, #94a3b8)',
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
        {actions}
        {onToggleMinimize && (
          <button
            type="button"
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize();
            }}
            title={isMinimized ? 'Expand window' : 'Minimize window'}
            style={{ width: '24px', height: '24px' }}
          >
            <ChevronDown
              size={16}
              className={`chevron-minimize ${isMinimized ? 'minimized' : ''}`}
            />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close window"
            style={{ width: '24px', height: '24px' }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export interface DraggableWindowProps {
  windowRef?: React.Ref<HTMLDivElement>;
  position?: { x: number; y: number } | null;
  defaultPositionStyle?: React.CSSProperties;
  zIndex?: number;
  isDragging?: boolean;
  isMinimized?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  height?: string | number;
  maxHeight?: string | number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onMouseDownCapture?: (e: React.MouseEvent) => void;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
  windowRef,
  position,
  defaultPositionStyle,
  zIndex = 50,
  isDragging = false,
  isMinimized = false,
  width = '360px',
  minWidth,
  maxWidth = 'calc(100vw - 1.5rem)',
  height = 'auto',
  maxHeight = 'calc(100vh - 6rem)',
  className = '',
  style,
  children,
  onMouseDownCapture,
}) => {
  const localRef = useRef<HTMLDivElement | null>(null);
  const [titleBarHeight, setTitleBarHeight] = useState<number>(46);

  // Measure title bar height dynamically so minimize animates to the exact title bar height
  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    const titleBar = el.querySelector('.draggable-window-titlebar') as HTMLElement | null;
    if (titleBar) {
      const h = titleBar.offsetHeight;
      if (h > 0 && Math.abs(h - titleBarHeight) > 1) {
        setTitleBarHeight(h);
      }
    }
  });

  const mergedRef = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof windowRef === 'function') {
      windowRef(node);
    } else if (windowRef && 'current' in windowRef) {
      (windowRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  const computedHeight = isMinimized ? `${titleBarHeight}px` : typeof height === 'number' ? `${height}px` : height;
  const computedMaxHeight = isMinimized ? `${titleBarHeight}px` : typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;

  return (
    <div
      ref={mergedRef}
      onMouseDownCapture={onMouseDownCapture}
      className={`glass-panel-elevated animate-slide-up draggable-window ${className}`}
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : defaultPositionStyle?.left ?? '1.25rem',
        top: position ? `${position.y}px` : defaultPositionStyle?.top,
        bottom: position ? undefined : defaultPositionStyle?.bottom,
        right: position ? undefined : defaultPositionStyle?.right,
        width,
        minWidth,
        maxWidth,
        height: computedHeight,
        maxHeight: computedMaxHeight,
        zIndex,
        borderRadius: 'var(--radius-lg, 12px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: isDragging ? '0 24px 48px rgba(0,0,0,0.8)' : '0 16px 36px rgba(0,0,0,0.6)',
        border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
        color: 'var(--text-main, #ffffff)',
        transition: isDragging ? 'none' : 'max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        ...defaultPositionStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
