import React from 'react';
import { Target, X, Check, ShieldAlert, Sparkles, Plus, Trash2, Award } from 'lucide-react';
import {
  ObjectiveMarker,
  ObjectiveEvaluation,
  MatchObjectivesEvaluation,
} from '../domain/objectiveEngine.js';

interface ObjectivesModalProps {
  objectives: ObjectiveMarker[];
  evaluation: MatchObjectivesEvaluation;
  p1Name: string;
  p2Name: string;
  onDeployStandardObjectives: () => void;
  onScoreObjectives: () => void;
  onRemoveObjective: (id: string) => void;
  onClose: () => void;
}

export const ObjectivesModal: React.FC<ObjectivesModalProps> = ({
  objectives,
  evaluation,
  p1Name,
  p2Name,
  onDeployStandardObjectives,
  onScoreObjectives,
  onRemoveObjective,
  onClose,
}) => {
  const getStatusBadge = (ev: ObjectiveEvaluation) => {
    switch (ev.status) {
      case 1:
        return (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
            }}
          >
            {p1Name} Control
          </span>
        );
      case 2:
        return (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(236, 72, 153, 0.2)',
              color: '#ec4899',
              border: '1px solid rgba(236, 72, 153, 0.4)',
            }}
          >
            {p2Name} Control
          </span>
        );
      case 'contested':
        return (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.4)',
            }}
          >
            Contested
          </span>
        );
      default:
        return (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(148, 163, 184, 0.15)',
              color: '#94a3b8',
            }}
          >
            Uncontested
          </span>
        );
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '680px',
          maxWidth: '95vw',
          maxHeight: '88vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={20} color="#f59e0b" />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f8fafc', letterSpacing: '0.5px' }}>
              OBJECTIVE CONTROL & AUTO-SCORING
            </span>
          </div>

          <button className="btn-icon" onClick={onClose} title="Close Objectives Manager">
            <X size={18} />
          </button>
        </div>

        {/* Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <button
            className="btn-glass"
            onClick={onDeployStandardObjectives}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: '#38bdf8',
            }}
          >
            <Sparkles size={14} /> Deploy Standard 5 Objectives
          </button>

          <button
            className="btn-primary"
            onClick={onScoreObjectives}
            disabled={objectives.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              padding: '6px 14px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderColor: '#b45309',
            }}
            title="Score VP for all currently controlled objectives"
          >
            <Award size={14} /> Score Objectives Now
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {objectives.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <Target size={36} color="rgba(255,255,255,0.2)" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                No Objective Markers On Table
              </div>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                Click "Deploy Standard 5 Objectives" above to deploy 40mm markers with 3″ control auras.
              </p>
            </div>
          ) : (
            evaluation.evaluations.map((ev) => (
              <div
                key={ev.marker.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={16} color="#f59e0b" />
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#f8fafc' }}>
                      {ev.marker.label}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      (40mm base • 3″ aura • {ev.marker.vpValue} VP)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', marginTop: '2px' }}>
                    <span style={{ color: '#38bdf8' }}>
                      {p1Name}: <strong>{ev.p1OcTotal} OC</strong> ({ev.p1ModelsInZone} models)
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
                    <span style={{ color: '#ec4899' }}>
                      {p2Name}: <strong>{ev.p2OcTotal} OC</strong> ({ev.p2ModelsInZone} models)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {getStatusBadge(ev)}

                  <button
                    className="btn-icon"
                    onClick={() => onRemoveObjective(ev.marker.id)}
                    style={{ width: '26px', height: '26px', color: 'var(--text-secondary)' }}
                    title="Remove Objective"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {evaluation.auditSummary.replace(/\*\*/g, '')}
          </div>

          <button className="btn-primary" onClick={onClose} style={{ fontSize: '0.78rem', padding: '5px 14px' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
