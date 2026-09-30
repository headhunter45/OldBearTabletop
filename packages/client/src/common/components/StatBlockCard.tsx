import React from 'react';
import {
  EntityAction,
  EntityStatBlock,
  getActionCostGlyph,
  ActionCostType,
} from '@oldbear/shared';
import {
  Plus,
  ExternalLink,
  Dices,
  Sparkles,
  Shield,
  Heart,
  Zap,
  Sword,
  BookOpen,
  Package,
  Skull,
} from 'lucide-react';

export interface StatBlockCardProps {
  statBlock: EntityStatBlock;
  compact?: boolean;
  onAddToCharacter?: (action: EntityAction | EntityStatBlock) => void;
  onRoll?: (action: EntityAction | EntityStatBlock) => void;
  onSpawnToken?: (statBlock: EntityStatBlock) => void;
  canAddToCharacter?: boolean;
  canSpawnToken?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function calculateMod(val?: number): string {
  if (val === undefined || isNaN(val)) return '+0';
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function getCostBadgeStyle(cost?: ActionCostType): { bg: string; color: string; border: string } {
  switch (cost) {
    case '1_action':
      return { bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: 'rgba(16, 185, 129, 0.4)' };
    case '2_actions':
      return { bg: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' };
    case '3_actions':
      return { bg: 'rgba(168, 85, 247, 0.18)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.4)' };
    case 'reaction_pf2e':
    case 'reaction':
      return { bg: 'rgba(14, 165, 233, 0.18)', color: '#38bdf8', border: 'rgba(14, 165, 233, 0.4)' };
    case 'free_pf2e':
    case 'free':
      return { bg: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: 'rgba(148, 163, 184, 0.3)' };
    case 'bonus_action':
      return { bg: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' };
    case 'action':
      return { bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: 'rgba(16, 185, 129, 0.4)' };
    case 'minute':
    case 'hour':
      return { bg: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: 'rgba(99, 102, 241, 0.4)' };
    default:
      return { bg: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.2)' };
  }
}

function getTypeBadgeStyle(type?: string): { bg: string; color: string; border: string; accentColor: string } {
  switch (type) {
    case 'spell':
      return { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)', accentColor: '#a855f7' };
    case 'attack':
      return { bg: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: 'rgba(244, 63, 94, 0.3)', accentColor: '#f43f5e' };
    case 'item':
      return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)', accentColor: '#f59e0b' };
    case 'ability':
    case 'feat':
    case 'trait':
      return { bg: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', border: 'rgba(14, 165, 233, 0.3)', accentColor: '#0ea5e9' };
    case 'monster':
      return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)', accentColor: '#10b981' };
    default:
      return { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)', accentColor: '#6366f1' };
  }
}

export const StatBlockCard: React.FC<StatBlockCardProps> = ({
  statBlock,
  compact = false,
  onAddToCharacter,
  onRoll,
  onSpawnToken,
  canAddToCharacter = true,
  canSpawnToken = true,
  className = '',
  style = {},
}) => {
  const typeStyle = getTypeBadgeStyle(statBlock.type);
  const costStyle = getCostBadgeStyle(statBlock.cost);
  const glyph = getActionCostGlyph(statBlock.cost);

  const hasStats = Boolean(statBlock.stats);
  const hasMeta = Boolean(
    statBlock.range ||
    statBlock.target ||
    statBlock.duration ||
    statBlock.savingThrow ||
    statBlock.rollFormula ||
    statBlock.damageFormula ||
    statBlock.armorClass ||
    statBlock.hp ||
    statBlock.speed ||
    statBlock.challenge
  );

  return (
    <div
      className={`statblock-card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '0.4rem' : '0.65rem',
        padding: compact ? '0.6rem 0.75rem' : '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, rgba(26, 32, 48, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderLeft: `3px solid ${typeStyle.accentColor}`,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        color: '#f8fafc',
        fontSize: compact ? '0.78rem' : '0.84rem',
        lineHeight: 1.45,
        ...style,
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-display, inherit)',
                fontWeight: 700,
                fontSize: compact ? '0.92rem' : '1.05rem',
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}
            >
              {statBlock.name}
            </span>

            {/* Action Cost Badge */}
            {glyph && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: glyph.startsWith('◆') || glyph === '↺' || glyph === '◇' ? '1px 5px' : '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: costStyle.bg,
                  color: costStyle.color,
                  border: `1px solid ${costStyle.border}`,
                  fontSize: glyph.startsWith('◆') ? '0.9rem' : '0.7rem',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: '0.02em',
                }}
                title={`Action Cost: ${glyph}`}
              >
                {glyph}
              </span>
            )}
          </div>

          {/* Subtitle / Classification */}
          {statBlock.subtitle && (
            <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)', fontStyle: 'italic' }}>
              {statBlock.subtitle}
            </span>
          )}
        </div>

        {/* Badges: Type & System */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          {statBlock.sourceSystem && (
            <span
              style={{
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '0.62rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: 'rgba(255, 255, 255, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {statBlock.sourceSystem}
            </span>
          )}

          <span
            style={{
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              backgroundColor: typeStyle.bg,
              color: typeStyle.color,
              border: `1px solid ${typeStyle.border}`,
              letterSpacing: '0.04em',
            }}
          >
            {statBlock.type}
          </span>
        </div>
      </div>

      {/* Traits Pill Tags */}
      {statBlock.traits && statBlock.traits.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
          {statBlock.traits.map((trait, idx) => {
            const isRarity = ['uncommon', 'rare', 'unique'].includes(trait.toLowerCase());
            const isConcentration = trait.toLowerCase() === 'concentration';

            let pillBg = 'rgba(99, 102, 241, 0.12)';
            let pillColor = '#a5b4fc';
            let pillBorder = 'rgba(99, 102, 241, 0.25)';

            if (isRarity) {
              pillBg = 'rgba(245, 158, 11, 0.18)';
              pillColor = '#fbbf24';
              pillBorder = 'rgba(245, 158, 11, 0.4)';
            } else if (isConcentration) {
              pillBg = 'rgba(14, 165, 233, 0.18)';
              pillColor = '#38bdf8';
              pillBorder = 'rgba(14, 165, 233, 0.4)';
            }

            return (
              <span
                key={`${trait}-${idx}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.67rem',
                  fontWeight: 600,
                  backgroundColor: pillBg,
                  color: pillColor,
                  border: `1px solid ${pillBorder}`,
                }}
              >
                {trait}
              </span>
            );
          })}
        </div>
      )}

      {/* Key Metadata Grid */}
      {hasMeta && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: compact ? 'repeat(auto-fit, minmax(110px, 1fr))' : 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.35rem 0.6rem',
            padding: '0.45rem 0.6rem',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.72rem',
          }}
        >
          {statBlock.armorClass !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Shield size={12} style={{ color: '#38bdf8' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>AC:</span>
              <strong style={{ color: '#ffffff' }}>{statBlock.armorClass}</strong>
            </div>
          )}

          {statBlock.hp !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Heart size={12} style={{ color: '#f43f5e' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>HP:</span>
              <strong style={{ color: '#ffffff' }}>{statBlock.hp}</strong>
            </div>
          )}

          {statBlock.speed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Speed:</span>
              <strong style={{ color: '#ffffff' }}>{statBlock.speed}</strong>
            </div>
          )}

          {statBlock.challenge && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Skull size={12} style={{ color: '#fbbf24' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>CR/Level:</span>
              <strong style={{ color: '#ffffff' }}>{statBlock.challenge}</strong>
            </div>
          )}

          {statBlock.range && (
            <div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Range: </span>
              <strong style={{ color: '#ffffff' }}>{statBlock.range}</strong>
            </div>
          )}

          {statBlock.target && (
            <div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Target: </span>
              <strong style={{ color: '#ffffff' }}>{statBlock.target}</strong>
            </div>
          )}

          {statBlock.duration && (
            <div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Duration: </span>
              <strong style={{ color: '#ffffff' }}>{statBlock.duration}</strong>
            </div>
          )}

          {statBlock.savingThrow && (
            <div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Save: </span>
              <strong style={{ color: '#fbbf24' }}>
                {statBlock.savingThrow.ability.toUpperCase()}{' '}
                {statBlock.savingThrow.dc ? `DC ${statBlock.savingThrow.dc}` : ''}
              </strong>
            </div>
          )}

          {statBlock.rollFormula && (
            <div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Attack: </span>
              <strong style={{ color: '#34d399' }}>{statBlock.rollFormula}</strong>
            </div>
          )}

          {statBlock.damageFormula && (
            <div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Damage: </span>
              <strong style={{ color: '#f43f5e' }}>
                {statBlock.damageFormula} {statBlock.damageType || ''}
              </strong>
            </div>
          )}
        </div>
      )}

      {/* Ability Scores Grid (if creature/character) */}
      {hasStats && statBlock.stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '0.25rem',
            textAlign: 'center',
            padding: '0.35rem 0.2rem',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((stat) => {
            const val = statBlock.stats?.[stat];
            return (
              <div key={stat} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                  {stat}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>
                  {val ?? 10}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#38bdf8' }}>
                  {calculateMod(val)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Description */}
      {statBlock.description && (
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.88)',
            whiteSpace: 'pre-wrap',
            fontSize: compact ? '0.74rem' : '0.8rem',
            lineHeight: 1.45,
            maxHeight: compact ? '200px' : '360px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {statBlock.description}
        </div>
      )}

      {/* Sub-Actions (e.g. for monster statblocks) */}
      {statBlock.actions && statBlock.actions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.65)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Actions
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {statBlock.actions.map((act) => {
              const actGlyph = getActionCostGlyph(act.cost);
              return (
                <div
                  key={act.id || act.name}
                  style={{
                    padding: '0.35rem 0.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '0.74rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <strong style={{ color: '#ffffff' }}>{act.name}</strong>
                      {actGlyph && (
                        <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.75rem' }}>
                          {actGlyph}
                        </span>
                      )}
                    </div>
                    {act.damageFormula && (
                      <span style={{ color: '#f43f5e', fontWeight: 600, fontSize: '0.7rem' }}>
                        {act.damageFormula} {act.damageType || ''}
                      </span>
                    )}
                  </div>
                  {act.description && (
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem' }}>
                      {act.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons & Source Link Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.45rem',
          paddingTop: '0.45rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
          marginTop: '0.2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {/* Add to Character button */}
          {onAddToCharacter && canAddToCharacter && statBlock.type !== 'monster' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onAddToCharacter(statBlock)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.28rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
              title="Add this action or spell to your active character sheet"
            >
              <Plus size={13} />
              + Add to Sheet
            </button>
          )}

          {/* Roll / Cast button */}
          {(onRoll || statBlock.rollFormula || statBlock.damageFormula) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onRoll?.(statBlock)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.28rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
              title={statBlock.rollFormula ? `Roll ${statBlock.rollFormula}` : 'Roll / Use'}
            >
              <Dices size={13} style={{ color: '#a5b4fc' }} />
              {statBlock.type === 'spell' ? 'Cast' : statBlock.type === 'attack' ? 'Attack' : 'Roll'}
            </button>
          )}

          {/* Spawn Token button */}
          {onSpawnToken && canSpawnToken && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onSpawnToken(statBlock)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.28rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
              title="Spawn ready-to-fight token on the battlemap"
            >
              <Sparkles size={13} />
              Spawn Token
            </button>
          )}
        </div>

        {/* Source URL link */}
        {statBlock.sourceUrl && (
          <a
            href={statBlock.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.68rem',
              color: 'rgba(255, 255, 255, 0.55)',
              textDecoration: 'none',
              marginLeft: 'auto',
            }}
            title={statBlock.sourceUrl}
          >
            <span>Source</span>
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
};
