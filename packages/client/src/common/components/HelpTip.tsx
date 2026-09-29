import React, { useState, useRef, useId } from 'react';
import { HelpCircle } from 'lucide-react';

export interface HelpTipProps {
  /** Tooltip text or rich content to display */
  text: React.ReactNode;
  /** Optional title shown in bold above the content */
  title?: string;
  /** Tooltip placement relative to the icon */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Icon size in pixels (default 14) */
  size?: number;
  /** Optional keyboard shortcut hint (e.g. "Shift + /", "S") */
  shortcut?: string;
  /** Custom aria-label for accessibility (defaults to title or "Help information") */
  ariaLabel?: string;
  /** Additional CSS class name */
  className?: string;
}

export const HelpTip: React.FC<HelpTipProps> = ({
  text,
  title,
  placement = 'top',
  size = 14,
  shortcut,
  ariaLabel,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();

  if (!text) return null;

  // Placement positioning style
  const getPlacementStyle = (): React.CSSProperties => {
    switch (placement) {
      case 'bottom':
        return {
          top: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: '50%',
          right: 'calc(100% + 8px)',
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          top: '50%',
          left: 'calc(100% + 8px)',
          transform: 'translateY(-50%)',
        };
      case 'top':
      default:
        return {
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
    }
  };

  return (
    <span
      className={`help-tip-wrapper ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'middle',
      }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        className="help-tip-trigger btn-icon"
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-label={ariaLabel || (title ? `Help: ${title}` : 'Help information')}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '2px',
          margin: '0 2px',
          color: 'var(--text-muted, #94a3b8)',
          cursor: 'help',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'color 0.15s ease, opacity 0.15s ease',
          opacity: 0.75,
        }}
      >
        <HelpCircle size={size} />
      </button>

      {isOpen && (
        <div
          id={tooltipId}
          role="tooltip"
          className="help-tip-balloon glass-panel"
          style={{
            position: 'absolute',
            ...getPlacementStyle(),
            zIndex: 1000,
            minWidth: '160px',
            maxWidth: '260px',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.45)',
            fontSize: '0.75rem',
            lineHeight: 1.4,
            color: 'var(--text-main, #f8fafc)',
            pointerEvents: 'none',
            textAlign: 'left',
            whiteSpace: 'normal',
          }}
        >
          {title && (
            <div
              style={{
                fontWeight: 700,
                color: 'var(--primary, #38bdf8)',
                marginBottom: '0.25rem',
                fontSize: '0.8rem',
              }}
            >
              {title}
            </div>
          )}
          <div>{text}</div>
          {shortcut && (
            <div
              style={{
                marginTop: '0.35rem',
                fontSize: '0.7rem',
                color: 'var(--text-muted, #94a3b8)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>Shortcut:</span>
              <kbd
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '3px',
                  padding: '1px 4px',
                  fontFamily: 'monospace',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                }}
              >
                {shortcut}
              </kbd>
            </div>
          )}
        </div>
      )}
    </span>
  );
};

export default HelpTip;
