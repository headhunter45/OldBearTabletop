import React, { useState } from 'react';
import { Shield, X, Plus, Trash2, Swords, Crosshair, Users, ChevronDown, ChevronUp, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useDraggableWindow } from '../../common/hooks/useDraggableWindow.js';
import { WargameArmy, WargameUnit } from '../types/brawl.js';
import { disambiguateArmy } from '../domain/armyManager.js';
import { parseRosterFile } from '../domain/rosterParser.js';

interface ArmyRosterFlyoutProps {
  onClose: () => void;
  onDeployUnit?: (unit: WargameUnit, army: WargameArmy) => void;
}

export const ArmyRosterFlyout: React.FC<ArmyRosterFlyoutProps> = ({ onClose, onDeployUnit }) => {
  const { position, isDragging, handleMouseDown, windowRef, zIndex } = useDraggableWindow({
    initialX: typeof window !== 'undefined' ? window.innerWidth - 380 : 500,
    initialY: 70,
    defaultZIndex: 50,
  });

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let content: string | ArrayBuffer;
      if (file.name.toLowerCase().endsWith('.rosz')) {
        content = await file.arrayBuffer();
      } else {
        content = await file.text();
      }
      const result = await parseRosterFile(file.name, content);
      setRawArmy(result.army);
      setImportStatus(`Imported ${result.army.name} (${result.army.units.length} units)`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse roster file');
      setTimeout(() => setImportError(null), 5000);
    } finally {
      e.target.value = '';
    }
  };

  const [rawArmy, setRawArmy] = useState<WargameArmy>({
    id: 'army_1',
    name: 'Strike Force Alpha',
    faction: 'Space Marines',
    pointsLimit: 2000,
    units: [
      {
        id: 'unit_1',
        name: 'Intercessor Squad',
        armyId: 'army_1',
        points: 80,
        coherencyDistanceInches: 2.0,
        models: [
          { id: 'm1', name: '', unitId: 'unit_1', x: 0, y: 0, baseShape: { type: 'circle', widthMm: 32 } },
          { id: 'm2', name: '', unitId: 'unit_1', x: 0, y: 0, baseShape: { type: 'circle', widthMm: 32 } },
          { id: 'm3', name: '', unitId: 'unit_1', x: 0, y: 0, baseShape: { type: 'circle', widthMm: 32 } },
          { id: 'm4', name: '', unitId: 'unit_1', x: 0, y: 0, baseShape: { type: 'circle', widthMm: 32 } },
          { id: 'm5', name: '', unitId: 'unit_1', x: 0, y: 0, baseShape: { type: 'circle', widthMm: 32 } },
        ],
        baseActions: [
          { id: 'a1', name: 'Bolt Rifle', type: 'ranged', rangeInches: 24, attacks: 2, skill: '3+', strength: 4, ap: -1, damage: 1 },
          { id: 'a2', name: 'Close Combat Weapon', type: 'melee', attacks: 3, skill: '3+', strength: 4, ap: 0, damage: 1 },
        ],
        datasheet: {
          movementInches: 6,
          toughness: 4,
          armorSave: '3+',
          woundsPerModel: 2,
          leadership: '6+',
          objectiveControl: 2,
        },
      },
    ],
  });

  const activeArmy = disambiguateArmy(rawArmy);

  const [expandedUnitId, setExpandedUnitId] = useState<string | null>('unit_1');

  const totalPoints = activeArmy.units.reduce((sum, u) => sum + u.points, 0);

  return (
    <div
      ref={windowRef}
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : 'calc(100vw - 380px)',
        top: position ? `${position.y}px` : '70px',
        width: '360px',
        maxHeight: 'calc(100vh - 100px)',
        background: 'var(--bg-surface-elevated, #1e293b)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: zIndex ?? 50,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          padding: '0.75rem 1rem',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={16} style={{ color: '#f59e0b' }} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f59e0b' }}>
            Army Roster ({totalPoints} / {activeArmy.pointsLimit} pts)
          </span>
        </div>
        <button className="btn-icon" onClick={onClose} style={{ width: '24px', height: '24px' }}>
          <X size={14} />
        </button>
      </div>

      {/* Army Meta & Import Controls */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{activeArmy.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Faction: {activeArmy.faction}</div>
          </div>
          <label
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              borderRadius: '4px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#f59e0b',
            }}
          >
            <Upload size={13} />
            <span>Import</span>
            <input
              type="file"
              accept=".json,.ros,.rosz"
              style={{ display: 'none' }}
              onChange={handleFileImport}
            />
          </label>
        </div>

        {importStatus && (
          <div
            style={{
              marginTop: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#4ade80',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CheckCircle size={12} /> {importStatus}
          </div>
        )}

        {importError && (
          <div
            style={{
              marginTop: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <AlertCircle size={12} /> {importError}
          </div>
        )}
      </div>

      {/* Units List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {activeArmy.units.map((unit) => {
          const isExpanded = expandedUnitId === unit.id;
          return (
            <div
              key={unit.id}
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                onClick={() => setExpandedUnitId(isExpanded ? null : unit.id)}
                style={{
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  {unit.name}{' '}
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>
                    ({unit.points} pts)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {unit.models.length} models
                  </span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.75rem' }}>
                  {unit.datasheet && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem', opacity: 0.85 }}>
                      <span>M: <strong>{unit.datasheet.movementInches}&quot;</strong></span>
                      <span>T: <strong>{unit.datasheet.toughness}</strong></span>
                      <span>Sv: <strong>{unit.datasheet.armorSave}</strong></span>
                      <span>W: <strong>{unit.datasheet.woundsPerModel}</strong></span>
                      <span>Ld: <strong>{unit.datasheet.leadership}</strong></span>
                      <span>OC: <strong>{unit.datasheet.objectiveControl}</strong></span>
                    </div>
                  )}

                  <div style={{ fontWeight: 600, marginTop: '0.3rem', marginBottom: '0.2rem' }}>Weapons:</div>
                  {unit.baseActions.map((act) => (
                    <div key={act.id} style={{ opacity: 0.8, marginLeft: '4px' }}>
                      • {act.name} {act.rangeInches ? `(${act.rangeInches}")` : '(Melee)'}: A{act.attacks} S{act.strength} AP{act.ap} D{act.damage}
                    </div>
                  ))}

                  {onDeployUnit && (
                    <button
                      className="btn-primary"
                      style={{
                        marginTop: '0.6rem',
                        width: '100%',
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        background: '#38bdf8',
                        color: '#000',
                        fontWeight: 700,
                      }}
                      onClick={() => onDeployUnit(unit, activeArmy)}
                    >
                      <Plus size={12} /> Deploy Unit to Battlemap
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
