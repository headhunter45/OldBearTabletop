import React, { useEffect, useState } from 'react';
import { Swords, Trophy, Zap, Crosshair, Flag, Footprints, ShieldAlert, Sparkles } from 'lucide-react';
import { PhaseTransitionEvent } from '../domain/phaseEngine.js';

interface PhaseAnnouncementBannerProps {
  announcement: PhaseTransitionEvent | null;
  onDismiss: () => void;
}

export const PhaseAnnouncementBanner: React.FC<PhaseAnnouncementBannerProps> = ({
  announcement,
  onDismiss,
}) => {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!announcement) return;
    setAnimating(true);

    const timer = setTimeout(() => {
      setAnimating(false);
      setTimeout(onDismiss, 350);
    }, 2800);

    return () => clearTimeout(timer);
  }, [announcement, onDismiss]);

  if (!announcement) return null;

  const getPhaseIcon = () => {
    if (announcement.type === 'game_over') return <Trophy size={22} color="#fbbf24" />;
    switch (announcement.newPhase) {
      case 'Command':
        return <Flag size={20} color="#38bdf8" />;
      case 'Movement':
        return <Footprints size={20} color="#10b981" />;
      case 'Shooting':
        return <Crosshair size={20} color="#f59e0b" />;
      case 'Charge':
        return <Zap size={20} color="#ec4899" />;
      case 'Fight':
        return <Swords size={20} color="#ef4444" />;
      case 'Morale':
        return <ShieldAlert size={20} color="#a855f7" />;
      default:
        return <Sparkles size={20} color="#38bdf8" />;
    }
  };

  const borderColor =
    announcement.type === 'game_over'
      ? 'rgba(251, 191, 36, 0.7)'
      : announcement.activePlayer === 1
      ? 'rgba(56, 189, 248, 0.6)'
      : 'rgba(239, 68, 68, 0.6)';

  return (
    <div
      style={{
        position: 'fixed',
        top: '4.5rem',
        left: '50%',
        transform: `translateX(-50%) translateY(${animating ? '0' : '-35px'}) scale(${animating ? '1' : '0.95'})`,
        opacity: animating ? 1 : 0,
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 9999,
        pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        border: `1.5px solid ${borderColor}`,
        boxShadow: `0 12px 36px rgba(0, 0, 0, 0.7), 0 0 20px ${borderColor}`,
        borderRadius: '10px',
        padding: '0.75rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {getPhaseIcon()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontWeight: 800,
            fontSize: '1.05rem',
            letterSpacing: '0.75px',
            color: '#f8fafc',
            textTransform: 'uppercase',
          }}
        >
          {announcement.bannerTitle}
        </span>
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#94a3b8',
          }}
        >
          {announcement.bannerSubtitle}
        </span>
      </div>
    </div>
  );
};
