import React, { useState } from 'react';
import {
  Trophy,
  X,
  Plus,
  Minus,
  Zap,
  Target,
  Star,
  Skull,
  RotateCcw,
  History,
  Shield,
} from 'lucide-react';
import {
  ScoreboardState,
  ResourceType,
  ScoreAuditEntry,
} from '../domain/scoreboardEngine.js';

interface ScoreboardModalProps {
  scoreboard: ScoreboardState;
  onUpdateResource: (player: 1 | 2, resource: ResourceType, delta: number, reason?: string) => void;
  onResetScoreboard: () => void;
  auditTrail: ScoreAuditEntry[];
  onClose: () => void;
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  scoreboard,
  onUpdateResource,
  onResetScoreboard,
  auditTrail,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'scoreboard' | 'audit'>('scoreboard');
  const [reasonInput, setReasonInput] = useState('');

  const handleAdjust = (player: 1 | 2, resource: ResourceType, delta: number) => {
    onUpdateResource(player, resource, delta, reasonInput.trim() || undefined);
    setReasonInput('');
  };

  const renderPlayerColumn = (playerNum: 1 | 2, isP1: boolean) => {
    const data = isP1 ? scoreboard.p1 : scoreboard.p2;
    const name = isP1 ? scoreboard.p1Name : scoreboard.p2Name;
    const accentColor = isP1 ? '#38bdf8' : '#ec4899';
    const bgTint = isP1 ? 'rgba(56, 189, 248, 0.06)' : 'rgba(236, 72, 153, 0.06)';
    const borderTint = isP1 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(236, 72, 153, 0.25)';

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: bgTint,
          border: `1.5px solid ${borderTint}`,
          borderRadius: '10px',
          padding: '14px',
        }}
      >
        {/* Player Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: accentColor,
                boxShadow: `0 0 8px ${accentColor}`,
              }}
            />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc' }}>
              {name}
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Player {playerNum}
          </span>
        </div>

        {/* Big Total VP Card */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: `1px solid ${borderTint}`,
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: `0 4px 16px ${accentColor}1a`,
          }}
        >
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: accentColor, letterSpacing: '1px' }}>
            TOTAL VICTORY POINTS
          </span>
          <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f8fafc', lineHeight: 1.1 }}>
            {data.totalVp}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            (Primary {data.primaryVp} + Secondary {data.secondaryVp})
          </span>
        </div>

        {/* Primary VP Row */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={15} color="#f59e0b" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>Primary VP</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Objectives</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', minWidth: '24px', textAlign: 'center' }}>
              {data.primaryVp}
            </span>
            <button className="btn-icon" style={{ width: '22px', height: '22px' }} onClick={() => handleAdjust(playerNum, 'primaryVp', -1)}>
              <Minus size={11} />
            </button>
            <button className="btn-icon" style={{ width: '22px', height: '22px' }} onClick={() => handleAdjust(playerNum, 'primaryVp', 1)}>
              <Plus size={11} />
            </button>
            <button className="btn-glass" style={{ fontSize: '0.65rem', padding: '2px 5px' }} onClick={() => handleAdjust(playerNum, 'primaryVp', 4)}>
              +4
            </button>
          </div>
        </div>

        {/* Secondary VP Row */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Star size={15} color="#a855f7" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>Secondary VP</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Mission Cards</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a855f7', minWidth: '24px', textAlign: 'center' }}>
              {data.secondaryVp}
            </span>
            <button className="btn-icon" style={{ width: '22px', height: '22px' }} onClick={() => handleAdjust(playerNum, 'secondaryVp', -1)}>
              <Minus size={11} />
            </button>
            <button className="btn-icon" style={{ width: '22px', height: '22px' }} onClick={() => handleAdjust(playerNum, 'secondaryVp', 1)}>
              <Plus size={11} />
            </button>
            <button className="btn-glass" style={{ fontSize: '0.65rem', padding: '2px 5px' }} onClick={() => handleAdjust(playerNum, 'secondaryVp', 2)}>
              +2
            </button>
            <button className="btn-glass" style={{ fontSize: '0.65rem', padding: '2px 5px' }} onClick={() => handleAdjust(playerNum, 'secondaryVp', 5)}>
              +5
            </button>
          </div>
        </div>

        {/* Command Points Row */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={15} color="#38bdf8" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>Command Points (CP)</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Stratagems</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', minWidth: '24px', textAlign: 'center' }}>
              {data.commandPoints}
            </span>
            <button
              className="btn-glass"
              style={{ fontSize: '0.68rem', padding: '2px 6px', color: '#ef4444' }}
              onClick={() => handleAdjust(playerNum, 'commandPoints', -1)}
              title="Spend 1 CP"
            >
              -1 CP
            </button>
            <button
              className="btn-glass"
              style={{ fontSize: '0.68rem', padding: '2px 6px', color: '#10b981' }}
              onClick={() => handleAdjust(playerNum, 'commandPoints', 1)}
              title="Grant 1 CP"
            >
              +1 CP
            </button>
          </div>
        </div>

        {/* Casualties Row */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Skull size={15} color="#ef4444" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>Casualties Lost</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                {data.casualtiesPoints} pts lost
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444', minWidth: '24px', textAlign: 'center' }}>
              {data.casualtiesCount}
            </span>
            <button className="btn-icon" style={{ width: '22px', height: '22px' }} onClick={() => handleAdjust(playerNum, 'casualtiesCount', -1)}>
              <Minus size={11} />
            </button>
            <button className="btn-icon" style={{ width: '22px', height: '22px' }} onClick={() => handleAdjust(playerNum, 'casualtiesCount', 1)}>
              <Plus size={11} />
            </button>
            <button className="btn-glass" style={{ fontSize: '0.65rem', padding: '2px 5px' }} onClick={() => handleAdjust(playerNum, 'casualtiesCount', 5)}>
              +5
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '740px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={20} color="#f59e0b" />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f8fafc', letterSpacing: '0.5px' }}>
              MATCH SCOREBOARD & RESOURCE TRACKER
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '6px', padding: '2px' }}>
              <button
                className={`btn-glass ${activeTab === 'scoreboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('scoreboard')}
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 10px',
                  background: activeTab === 'scoreboard' ? 'rgba(255, 255, 255, 0.15)' : 'none',
                }}
              >
                Scoreboard
              </button>
              <button
                className={`btn-glass ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 10px',
                  background: activeTab === 'audit' ? 'rgba(255, 255, 255, 0.15)' : 'none',
                }}
              >
                Audit Log ({auditTrail.length})
              </button>
            </div>

            <button className="btn-icon" onClick={onClose} title="Close Scoreboard">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'scoreboard' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Optional Reason Input Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Audit Reason (optional):
                </span>
                <input
                  type="text"
                  placeholder="e.g., Hold 2 Objectives, Command Re-roll, Assassination"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                  }}
                />
              </div>

              {/* Dual Player Columns */}
              <div style={{ display: 'flex', gap: '14px' }}>
                {renderPlayerColumn(1, true)}
                {renderPlayerColumn(2, false)}
              </div>
            </div>
          ) : (
            /* Audit Log View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {auditTrail.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  No score adjustments logged yet in this match.
                </div>
              ) : (
                auditTrail.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      borderLeft: `3px solid ${entry.player === 1 ? '#38bdf8' : '#ec4899'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                    }}
                  >
                    <span style={{ color: '#f8fafc' }}>{entry.formattedMessage}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <button
            className="btn-glass"
            onClick={onResetScoreboard}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: '#ef4444' }}
            title="Reset All Scores to 0"
          >
            <RotateCcw size={13} /> Reset Scores
          </button>

          <button className="btn-primary" onClick={onClose} style={{ fontSize: '0.78rem', padding: '5px 14px' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
