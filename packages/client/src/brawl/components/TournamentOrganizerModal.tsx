import React, { useState } from 'react';
import {
  Gavel,
  X,
  Eye,
  UserCheck,
  Clock,
  Trophy,
  ShieldAlert,
  FileText,
  Download,
  Copy,
  Check,
  Send,
  Lock,
} from 'lucide-react';
import { ScoreboardState, ScoreAuditEntry } from '../domain/scoreboardEngine.js';
import {
  BrawlUserRole,
  OfficialRuling,
  MatchPrivacySettings,
  applyScoreOverride,
  adjustClockTime,
  generateMatchReport,
  formatMatchReportAsText,
} from '../domain/toManager.js';

interface TournamentOrganizerModalProps {
  currentRole: BrawlUserRole;
  scoreboard: ScoreboardState;
  battleRound: number;
  p1ClockSeconds: number;
  p2ClockSeconds: number;
  isClockRunning: boolean;
  scoreAuditTrail: ScoreAuditEntry[];
  rulings: OfficialRuling[];
  privacySettings: MatchPrivacySettings;
  onRoleChange: (role: BrawlUserRole) => void;
  onUpdateScoreboard: (newScoreboard: ScoreboardState, audit: ScoreAuditEntry) => void;
  onAdjustClock: (player: 1 | 2, deltaSeconds: number) => void;
  onToggleClockRunning: () => void;
  onIssueRuling: (ruling: OfficialRuling) => void;
  onUpdatePrivacy: (settings: MatchPrivacySettings) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const TournamentOrganizerModal: React.FC<TournamentOrganizerModalProps> = ({
  currentRole,
  scoreboard,
  battleRound,
  p1ClockSeconds,
  p2ClockSeconds,
  isClockRunning,
  scoreAuditTrail,
  rulings,
  privacySettings,
  onRoleChange,
  onUpdateScoreboard,
  onAdjustClock,
  onToggleClockRunning,
  onIssueRuling,
  onUpdatePrivacy,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'rulings' | 'privacy' | 'export'>('admin');
  const [toName, setToName] = useState('Head Judge');

  // Official Ruling Form
  const [rulingContext, setRulingContext] = useState('');
  const [rulingText, setRulingText] = useState('');

  // Score Override Form
  const [overridePlayer, setOverridePlayer] = useState<1 | 2>(1);
  const [overridePrimaryVp, setOverridePrimaryVp] = useState(scoreboard.p1.primaryVp);
  const [overrideSecondaryVp, setOverrideSecondaryVp] = useState(scoreboard.p1.secondaryVp);
  const [overrideCp, setOverrideCp] = useState(scoreboard.p1.commandPoints);
  const [overrideCasualties, setOverrideCasualties] = useState(scoreboard.p1.casualties);
  const [overrideReason, setOverrideReason] = useState('');

  // Report Export
  const [copiedReport, setCopiedReport] = useState(false);

  const handlePlayerSelect = (p: 1 | 2) => {
    setOverridePlayer(p);
    const target = p === 1 ? scoreboard.p1 : scoreboard.p2;
    setOverridePrimaryVp(target.primaryVp);
    setOverrideSecondaryVp(target.secondaryVp);
    setOverrideCp(target.commandPoints);
    setOverrideCasualties(target.casualties);
  };

  const handleApplyScoreOverride = () => {
    const { updatedScoreboard, auditEntry } = applyScoreOverride(
      scoreboard,
      overridePlayer,
      {
        primaryVp: overridePrimaryVp,
        secondaryVp: overrideSecondaryVp,
        commandPoints: overrideCp,
        casualties: overrideCasualties,
      },
      overrideReason || 'Administrative TO adjustment',
      toName
    );

    onUpdateScoreboard(updatedScoreboard, auditEntry);
    onShowToast(`Applied score override for ${overridePlayer === 1 ? scoreboard.p1Name : scoreboard.p2Name}`);
  };

  const handleSubmitRuling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rulingText.trim()) return;

    const ruling: OfficialRuling = {
      id: `ruling_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      toName,
      context: rulingContext.trim() || undefined,
      ruling: rulingText.trim(),
    };

    onIssueRuling(ruling);
    setRulingContext('');
    setRulingText('');
    onShowToast('Official TO ruling broadcast to table chat');
  };

  const currentReport = generateMatchReport({
    matchId: `match_${Date.now().toString(36)}`,
    title: 'Old Bear Brawl Tournament Match',
    battleRound,
    scoreboard,
    p1ClockSeconds,
    p2ClockSeconds,
    auditTrail: scoreAuditTrail,
    rulings,
  });

  const reportText = formatMatchReportAsText(currentReport);

  const handleDownloadReportJson = () => {
    const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match_report_round${battleRound}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Downloaded match report JSON');
  };

  const handleCopyReportText = () => {
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
    onShowToast('Copied match report card to clipboard');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '680px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          background: 'var(--bg-surface-elevated, #1e293b)',
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Gavel size={20} style={{ color: '#f59e0b' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f8fafc' }}>
                Tournament Organizer (TO) & Spectator Controls
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Official referee rulings, administrative score overrides, match privacy & report export
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ width: '28px', height: '28px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Role Selector Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 1.25rem',
            background: 'rgba(0, 0, 0, 0.35)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Current Role:</span>
            <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              {(['player', 'to', 'spectator'] as BrawlUserRole[]).map((r) => {
                const isCurrent = currentRole === r;
                const labels: Record<BrawlUserRole, string> = {
                  player: '⚔️ Player',
                  to: '⚖️ TO (Referee)',
                  spectator: '👁️ Spectator',
                };
                return (
                  <button
                    key={r}
                    onClick={() => {
                      onRoleChange(r);
                      onShowToast(`Switched active role to: ${labels[r]}`);
                    }}
                    style={{
                      padding: '4px 10px',
                      background: isCurrent ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                      color: isCurrent ? '#f59e0b' : 'var(--text-secondary)',
                      fontWeight: isCurrent ? 700 : 500,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    {labels[r]}
                  </button>
                );
              })}
            </div>
          </div>

          {currentRole === 'to' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TO Handle:</span>
              <input
                type="text"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                style={{
                  padding: '2px 6px',
                  fontSize: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '4px',
                  color: '#fff',
                  width: '110px',
                }}
              />
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(0, 0, 0, 0.2)' }}>
          <button
            onClick={() => setActiveTab('admin')}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: activeTab === 'admin' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === 'admin' ? '#f59e0b' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'admin' ? '2px solid #f59e0b' : 'none',
              cursor: 'pointer',
            }}
          >
            Scores & Clock Admin
          </button>
          <button
            onClick={() => setActiveTab('rulings')}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: activeTab === 'rulings' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === 'rulings' ? '#f59e0b' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'rulings' ? '2px solid #f59e0b' : 'none',
              cursor: 'pointer',
            }}
          >
            Official Rulings ({rulings.length})
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: activeTab === 'privacy' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === 'privacy' ? '#f59e0b' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'privacy' ? '2px solid #f59e0b' : 'none',
              cursor: 'pointer',
            }}
          >
            Match Privacy
          </button>
          <button
            onClick={() => setActiveTab('export')}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: activeTab === 'export' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === 'export' ? '#f59e0b' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'export' ? '2px solid #f59e0b' : 'none',
              cursor: 'pointer',
            }}
          >
            Export Match Report
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* TAB 1: Scores & Clocks */}
          {activeTab === 'admin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Score Overrides */}
              <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trophy size={15} style={{ color: '#f59e0b' }} /> Score & Resource Overrides
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '0.75rem' }}>
                  <button
                    className="btn-secondary"
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: overridePlayer === 1 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: overridePlayer === 1 ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                      color: overridePlayer === 1 ? '#38bdf8' : '#fff',
                    }}
                    onClick={() => handlePlayerSelect(1)}
                  >
                    Player 1: {scoreboard.p1Name} (Total: {scoreboard.p1.totalVp} VP)
                  </button>
                  <button
                    className="btn-secondary"
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: overridePlayer === 2 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: overridePlayer === 2 ? '#f43f5e' : 'rgba(255, 255, 255, 0.1)',
                      color: overridePlayer === 2 ? '#f43f5e' : '#fff',
                    }}
                    onClick={() => handlePlayerSelect(2)}
                  >
                    Player 2: {scoreboard.p2Name} (Total: {scoreboard.p2.totalVp} VP)
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Primary VP</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={overridePrimaryVp}
                      onChange={(e) => setOverridePrimaryVp(parseInt(e.target.value, 10) || 0)}
                      style={{ width: '100%', padding: '4px 6px', fontSize: '0.85rem', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Secondary VP</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={overrideSecondaryVp}
                      onChange={(e) => setOverrideSecondaryVp(parseInt(e.target.value, 10) || 0)}
                      style={{ width: '100%', padding: '4px 6px', fontSize: '0.85rem', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Command Points</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={overrideCp}
                      onChange={(e) => setOverrideCp(parseInt(e.target.value, 10) || 0)}
                      style={{ width: '100%', padding: '4px 6px', fontSize: '0.85rem', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Casualties</label>
                    <input
                      type="number"
                      min={0}
                      value={overrideCasualties}
                      onChange={(e) => setOverrideCasualties(parseInt(e.target.value, 10) || 0)}
                      style={{ width: '100%', padding: '4px 6px', fontSize: '0.85rem', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Adjustment Reason / Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Corrected miscalculated tactical secondary"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    style={{ width: '100%', padding: '4px 8px', fontSize: '0.8rem', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', color: '#fff' }}
                  />
                </div>

                <button
                  className="btn-primary"
                  style={{ width: '100%', padding: '6px', fontSize: '0.8rem', fontWeight: 700 }}
                  onClick={handleApplyScoreOverride}
                >
                  Apply Administrative Score Override
                </button>
              </div>

              {/* Clock Overrides */}
              <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={15} style={{ color: '#38bdf8' }} /> Chess Clock Overrides
                  </div>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                    onClick={onToggleClockRunning}
                  >
                    {isClockRunning ? '⏸️ Pause Match Clocks' : '▶️ Resume Match Clocks'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {/* P1 Adjust */}
                  <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                      Player 1: {scoreboard.p1Name}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '3px' }} onClick={() => onAdjustClock(1, 300)}>+5m</button>
                      <button className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '3px' }} onClick={() => onAdjustClock(1, 60)}>+1m</button>
                      <button className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '3px' }} onClick={() => onAdjustClock(1, -60)}>-1m</button>
                      <button className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '3px' }} onClick={() => onAdjustClock(1, -300)}>-5m</button>
                    </div>
                  </div>

                  {/* P2 Adjust */}
                  <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f43f5e', marginBottom: '4px' }}>
                      Player 2: {scoreboard.p2Name}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '3px' }} onClick={() => onAdjustClock(2, 300)}>+5m</button>
                      <button className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '3px' }} onClick={() => onAdjustClock(2, 60)}>+1m</button>
                      <button className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '3px' }} onClick={() => onAdjustClock(2, -60)}>-1m</button>
                      <button className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '3px' }} onClick={() => onAdjustClock(2, -300)}>-5m</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Official Rulings */}
          {activeTab === 'rulings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <form onSubmit={handleSubmitRuling} style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Gavel size={15} style={{ color: '#f59e0b' }} /> Log Official Tournament Ruling
                </div>

                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Rule Dispute / Query Context (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Can unit advance and perform tactical action?"
                    value={rulingContext}
                    onChange={(e) => setRulingContext(e.target.value)}
                    style={{ width: '100%', padding: '4px 8px', fontSize: '0.8rem', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', color: '#fff' }}
                  />
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Official Ruling Text</label>
                  <textarea
                    rows={3}
                    placeholder="Specify the referee's official determination and ruling..."
                    value={rulingText}
                    onChange={(e) => setRulingText(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', color: '#fff', resize: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '6px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Send size={13} /> Broadcast Official Ruling to Table Chat
                </button>
              </form>

              {/* Rulings History */}
              <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Ruling History ({rulings.length})
                </div>
                {rulings.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No official rulings recorded for this match yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {rulings.map((r) => (
                      <div key={r.id} style={{ padding: '6px 8px', background: 'rgba(245, 158, 11, 0.08)', borderLeft: '3px solid #f59e0b', borderRadius: '4px', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', fontWeight: 700 }}>
                          <span>TO: {r.toName}</span>
                          <span>{new Date(r.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {r.context && <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>Query: {r.context}</div>}
                        <div style={{ marginTop: '2px', fontWeight: 600 }}>{r.ruling}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Match Privacy */}
          {activeTab === 'privacy' && (
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={15} style={{ color: '#38bdf8' }} /> Match Privacy & Spectator Restrictions
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={privacySettings.allowSpectators}
                  onChange={(e) => onUpdatePrivacy({ ...privacySettings, allowSpectators: e.target.checked })}
                />
                <span>Allow Spectators to join room in read-only mode</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={privacySettings.hideSecretObjectives}
                  onChange={(e) => onUpdatePrivacy({ ...privacySettings, hideSecretObjectives: e.target.checked })}
                />
                <span>Hide secret secondary objective cards from spectators</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={privacySettings.hideReservesFromSpectators}
                  onChange={(e) => onUpdatePrivacy({ ...privacySettings, hideReservesFromSpectators: e.target.checked })}
                />
                <span>Hide off-table Strategic Reserves from spectators</span>
              </label>
            </div>
          )}

          {/* TAB 4: Export Match Report */}
          {activeTab === 'export' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, padding: '8px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={handleDownloadReportJson}
                >
                  <Download size={14} /> Download Match Report (JSON)
                </button>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, padding: '8px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={handleCopyReportText}
                >
                  {copiedReport ? <Check size={14} /> : <Copy size={14} />} {copiedReport ? 'Copied!' : 'Copy Printable Match Card'}
                </button>
              </div>

              <textarea
                readOnly
                rows={12}
                value={reportText}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  resize: 'none',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
