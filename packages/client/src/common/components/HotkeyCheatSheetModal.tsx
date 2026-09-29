import React, { useState, useEffect } from 'react';
import { Keyboard, X, Search } from 'lucide-react';

export interface HotkeyItem {
  key: string;
  description: string;
  category: 'Tools' | 'Drawings' | 'Fog of War' | 'General';
}

export const HOTKEYS: HotkeyItem[] = [
  // Tools
  { key: 'S', description: 'Arrow Select Tool', category: 'Tools' },
  { key: 'B', description: 'Multi-Token Box Select Tool', category: 'Tools' },
  { key: 'G / H', description: 'Pan / Hand Navigation Tool', category: 'Tools' },
  { key: 'M', description: 'Interactive Measuring Tape Tool', category: 'Tools' },
  { key: 'D', description: 'Duplicate Selected Token', category: 'Tools' },

  // Drawings
  { key: '1', description: 'Laser Pointer', category: 'Drawings' },
  { key: '2', description: 'Arrow Marker', category: 'Drawings' },
  { key: '3', description: 'Crosshair Ping', category: 'Drawings' },
  { key: '4', description: 'Circle Radius Area', category: 'Drawings' },
  { key: '5', description: 'Rectangle Zone', category: 'Drawings' },
  { key: '6', description: 'Cone / Arc Spell Template', category: 'Drawings' },
  { key: '7', description: 'Token Tether Line', category: 'Drawings' },
  { key: '8', description: 'Custom Image Spray Decal', category: 'Drawings' },
  { key: 'Shift + Drag', description: 'Invert Persistent / Quick Ping Drawing Mode', category: 'Drawings' },

  // Fog of War
  { key: 'R', description: 'Reveal Fog of War', category: 'Fog of War' },
  { key: 'F', description: 'Hide / Cover Fog of War', category: 'Fog of War' },

  // General
  { key: '? / Shift + /', description: 'Open Keyboard Shortcuts Cheat Sheet', category: 'General' },
  { key: 'Esc', description: 'Deselect Token/Marker or Close Modal', category: 'General' },
  { key: 'Del / Backspace', description: 'Delete Selected Token or Persistent Marker', category: 'General' },
  { key: 'Ctrl + Scroll', description: 'Zoom In / Out at Cursor Position', category: 'General' },
];

export interface HotkeyCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeyCheatSheetModal: React.FC<HotkeyCheatSheetModalProps> = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredHotkeys = HOTKEYS.filter(
    (h) =>
      h.key.toLowerCase().includes(filter.toLowerCase()) ||
      h.description.toLowerCase().includes(filter.toLowerCase()) ||
      h.category.toLowerCase().includes(filter.toLowerCase())
  );

  const categories: Array<'Tools' | 'Drawings' | 'Fog of War' | 'General'> = [
    'Tools',
    'Drawings',
    'Fog of War',
    'General',
  ];

  return (
    <div
      className="modal-backdrop animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Keyboard size={20} color="var(--primary, #38bdf8)" />
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Keyboard Shortcuts</h2>
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            style={{ padding: '0.3rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Input */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted, #94a3b8)',
            }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search shortcuts..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              paddingLeft: '2.25rem',
              fontSize: '0.85rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '6px',
            }}
          />
        </div>

        {/* Shortcuts List */}
        <div
          style={{
            overflowY: 'auto',
            paddingRight: '0.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {categories.map((cat) => {
            const items = filteredHotkeys.filter((h) => h.category === cat);
            if (items.length === 0) return null;

            return (
              <div key={cat}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted, #94a3b8)',
                    marginBottom: '0.4rem',
                  }}
                >
                  {cat}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  {items.map((item) => (
                    <div
                      key={item.key + item.description}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.4rem 0.6rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main, #f8fafc)' }}>
                        {item.description}
                      </span>
                      <kbd
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '4px',
                          padding: '0.2rem 0.5rem',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--primary, #38bdf8)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredHotkeys.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                color: 'var(--text-muted, #94a3b8)',
                fontSize: '0.85rem',
              }}
            >
              No shortcuts found matching &quot;{filter}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-muted, #94a3b8)',
          }}
        >
          <span>Press <kbd style={{ padding: '1px 4px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>?</kbd> anytime to open</span>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.25rem 0.75rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotkeyCheatSheetModal;
