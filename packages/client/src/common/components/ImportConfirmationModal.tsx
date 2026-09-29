import React from 'react';
import { Package, Skull, User, Map as MapIcon, Music, Box, X, Check, FileJson } from 'lucide-react';
import { ImportInspectionResult } from '../utils/importDetector.js';

export interface ImportConfirmationModalProps {
  inspection: ImportInspectionResult;
  isImporting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ImportConfirmationModal: React.FC<ImportConfirmationModalProps> = ({
  inspection,
  isImporting = false,
  onConfirm,
  onCancel,
}) => {
  const { summary, fileName, breakdown } = inspection;
  const { npcs, characters, maps, audio, props, total } = breakdown;

  return (
    <div
      className="modal-backdrop animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isImporting) onCancel();
      }}
    >
      <div
        className="glass-panel-elevated animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: 'var(--radius-lg, 1rem)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#f8fafc',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                Import Confirmation
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                {fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isImporting}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              padding: '0.35rem',
              borderRadius: '6px',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Summary Box */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileJson size={18} color="#818cf8" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>
                {summary}
              </span>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.25)',
                color: '#c7d2fe',
                fontWeight: 600,
              }}
            >
              {total} item{total !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Breakdown List */}
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#64748b',
                marginBottom: '0.6rem',
              }}
            >
              Contents Breakdown
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {npcs > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Skull size={16} color="#f87171" />
                    <span style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
                      NPC / Monster Cards
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fca5a5' }}>
                    {npcs}
                  </span>
                </div>
              )}

              {characters > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <User size={16} color="#818cf8" />
                    <span style={{ fontSize: '0.85rem', color: '#c7d2fe' }}>
                      Player Characters
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c7d2fe' }}>
                    {characters}
                  </span>
                </div>
              )}

              {maps > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <MapIcon size={16} color="#34d399" />
                    <span style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>
                      Map Assets
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a7f3d0' }}>
                    {maps}
                  </span>
                </div>
              )}

              {audio > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Music size={16} color="#fbbf24" />
                    <span style={{ fontSize: '0.85rem', color: '#fde68a' }}>
                      Audio Tracks
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fde68a' }}>
                    {audio}
                  </span>
                </div>
              )}

              {props > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(148, 163, 184, 0.08)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Box size={16} color="#94a3b8" />
                    <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                      Prop / Object Assets
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>
                    {props}
                  </span>
                </div>
              )}

              {total === 0 && (
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                  }}
                >
                  Standard package contents
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            background: 'rgba(15, 23, 42, 0.8)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isImporting}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isImporting}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#6366f1',
              color: '#ffffff',
            }}
          >
            {isImporting ? (
              'Importing...'
            ) : (
              <>
                <Check size={16} />
                {total > 1 ? `Import All (${total} items)` : 'Import Item'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
