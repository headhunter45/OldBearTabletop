import React, { useState } from 'react';
import {
  Compass,
  X,
  Skull,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Trash2,
  Maximize2,
} from 'lucide-react';
import { GameMap, SubmapConfig, Token } from '@oldbear/shared';
import {
  DeploymentPresetType,
  DEPLOYMENT_PRESETS,
  setupTournamentBattlefield,
  createCasualtyTraySubmap,
  createStrategicReservesSubmap,
  createEmbarkedTransportsSubmap,
  sendTokensToCasualtyTray,
  sendTokensToStrategicReserves,
  reviveTokensToBattlefield,
} from '../domain/stagingManager.js';

interface DeploymentStagingModalProps {
  map: GameMap;
  tokens: Token[];
  selectedTokenIds: string[];
  onClose: () => void;
  onUpdateMap: (updatedMap: GameMap) => void;
  onUpdateTokens: (updatedTokens: Token[]) => void;
  onRecordCasualties?: (player: 1 | 2, count: number, reason: string) => void;
  onShowToast: (message: string) => void;
}

export const DeploymentStagingModal: React.FC<DeploymentStagingModalProps> = ({
  map,
  tokens,
  selectedTokenIds,
  onClose,
  onUpdateMap,
  onUpdateTokens,
  onRecordCasualties,
  onShowToast,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<DeploymentPresetType>('dawn_of_war');
  const [includeCasualty, setIncludeCasualty] = useState(true);
  const [includeReserves, setIncludeReserves] = useState(true);
  const [includeTransports, setIncludeTransports] = useState(false);

  const selectedTokens = tokens.filter((t) => selectedTokenIds.includes(t.id));
  const activeSubmaps = map.submaps || [];

  const handleApplyPreset = () => {
    const updatedMap = setupTournamentBattlefield(map, {
      deployment: selectedPreset,
      includeCasualtyTray: includeCasualty,
      includeReserves: includeReserves,
      includeTransports: includeTransports,
    });
    onUpdateMap(updatedMap);
    onShowToast(`Applied ${DEPLOYMENT_PRESETS[selectedPreset].name} tournament deployment layout`);
  };

  const handleAddSubmap = (creator: (m: GameMap) => SubmapConfig) => {
    const sub = creator(map);
    const updatedMap = {
      ...map,
      submaps: [...(map.submaps || []), sub],
    };
    onUpdateMap(updatedMap);
    onShowToast(`Added staging submap: ${sub.name}`);
  };

  const handleRemoveSubmap = (id: string) => {
    const updatedMap = {
      ...map,
      submaps: (map.submaps || []).filter((s) => s.id !== id),
    };
    onUpdateMap(updatedMap);
    onShowToast('Removed submap');
  };

  const handleSendToCasualty = () => {
    if (selectedTokenIds.length === 0) return;
    const { updatedMap, updatedTokens, slainCount } = sendTokensToCasualtyTray(
      selectedTokenIds,
      map,
      tokens
    );
    onUpdateMap(updatedMap);
    onUpdateTokens(updatedTokens);

    if (onRecordCasualties && slainCount > 0) {
      // Determine player from first token ringColor or default 1
      const isP2 = selectedTokens[0]?.ringColor?.includes('f43f5e') || selectedTokens[0]?.ringColor?.includes('ec4899');
      onRecordCasualties(isP2 ? 2 : 1, slainCount, 'Moved to Casualty Tray');
    }

    onShowToast(`Moved ${slainCount} model(s) to Casualty Tray / Graveyard`);
  };

  const handleSendToReserves = () => {
    if (selectedTokenIds.length === 0) return;
    const { updatedMap, updatedTokens, count } = sendTokensToStrategicReserves(
      selectedTokenIds,
      map,
      tokens
    );
    onUpdateMap(updatedMap);
    onUpdateTokens(updatedTokens);
    onShowToast(`Moved ${count} model(s) to Strategic Reserves`);
  };

  const handleReviveToBattlefield = () => {
    if (selectedTokenIds.length === 0) return;
    const targetCoords = {
      x: (map.width || 3000) / 2 - 100,
      y: (map.height || 2200) / 2 - 100,
    };
    const updated = reviveTokensToBattlefield(selectedTokenIds, targetCoords, tokens);
    onUpdateTokens(updated);
    onShowToast(`Revived and deployed ${selectedTokenIds.length} model(s) onto battlefield`);
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
          width: '640px',
          maxWidth: '94vw',
          maxHeight: '90vh',
          background: 'var(--bg-surface-elevated, #1e293b)',
          borderRadius: '12px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
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
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(14, 165, 233, 0.05))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Compass size={20} style={{ color: '#38bdf8' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f8fafc' }}>
                Deployment Zones & Staging Submaps
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Mission pack deployment presets, casualty trays, and reserves staging
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ width: '28px', height: '28px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section 1: Tournament Presets */}
          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} style={{ color: '#38bdf8' }} /> Tournament Mission Deployment
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '0.75rem' }}>
              {(Object.keys(DEPLOYMENT_PRESETS) as DeploymentPresetType[]).map((key) => {
                const info = DEPLOYMENT_PRESETS[key];
                const isSelected = selectedPreset === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPreset(key)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                      {info.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {info.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeCasualty}
                  onChange={(e) => setIncludeCasualty(e.target.checked)}
                />
                <span>Include Casualty Tray / Graveyard</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeReserves}
                  onChange={(e) => setIncludeReserves(e.target.checked)}
                />
                <span>Include Strategic Reserves</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeTransports}
                  onChange={(e) => setIncludeTransports(e.target.checked)}
                />
                <span>Include Embarked Transports</span>
              </label>
            </div>

            <button
              className="btn-primary"
              style={{
                width: '100%',
                padding: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              onClick={handleApplyPreset}
            >
              <CheckCircle size={15} /> Apply Tournament Deployment Setup
            </button>
          </div>

          {/* Section 2: One-Click Model Transfers */}
          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowRight size={15} style={{ color: '#f59e0b' }} /> One-Click Model Transfers
            </div>

            {selectedTokens.length > 0 ? (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#93c5fd', marginBottom: '0.6rem' }}>
                  Selected: <strong>{selectedTokens.map((t) => t.name).join(', ')}</strong> ({selectedTokens.length} model{selectedTokens.length > 1 ? 's' : ''})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    className="btn-secondary"
                    style={{
                      padding: '8px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                    onClick={handleSendToCasualty}
                  >
                    <Skull size={14} /> Send to Casualty Tray
                  </button>

                  <button
                    className="btn-secondary"
                    style={{
                      padding: '8px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'rgba(129, 140, 248, 0.15)',
                      border: '1px solid rgba(129, 140, 248, 0.3)',
                      color: '#a5b4fc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                    onClick={handleSendToReserves}
                  >
                    <Shield size={14} /> Send to Reserves
                  </button>

                  <button
                    className="btn-secondary"
                    style={{
                      padding: '8px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: '#4ade80',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                    onClick={handleReviveToBattlefield}
                  >
                    <Sparkles size={14} /> Revive to Table
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Select one or more models on the battlemap to instantly send them to the Casualty Tray, Reserves, or revive them onto the battlefield.
              </div>
            )}
          </div>

          {/* Section 3: Active Submaps List */}
          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Active Submaps & Areas ({activeSubmaps.length})</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '3px 6px' }}
                  onClick={() => handleAddSubmap(createCasualtyTraySubmap)}
                >
                  + Casualty Tray
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '3px 6px' }}
                  onClick={() => handleAddSubmap(createStrategicReservesSubmap)}
                >
                  + Reserves
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '3px 6px' }}
                  onClick={() => handleAddSubmap(createEmbarkedTransportsSubmap)}
                >
                  + Transports
                </button>
              </div>
            </div>

            {activeSubmaps.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeSubmaps.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${sub.borderColor || sub.colorCode || '#38bdf8'}`,
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{sub.label || sub.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Type: {sub.type} | Size: {sub.width} × {sub.height}px
                      </div>
                    </div>
                    <button
                      className="btn-icon"
                      style={{ width: '22px', height: '22px', color: '#f87171' }}
                      onClick={() => handleRemoveSubmap(sub.id)}
                      title="Delete Submap"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                No active submaps configured. Use presets or quick add buttons above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
