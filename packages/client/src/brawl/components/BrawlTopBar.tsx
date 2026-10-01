import React, { useState } from 'react';
import {
  Share2,
  Menu,
  Check,
  Swords,
  Timer,
  Play,
  Pause,
  ChevronRight,
  Shield,
  MessageSquareHeart,
  ExternalLink,
  Trophy,
  Target,
  Compass,
  Gavel,
  Eye,
} from 'lucide-react';
import { BrawlUserRole } from '../domain/toManager.js';
import { Player } from '@oldbear/shared';
import { VoiceState } from '../../common/network/VoiceManager.js';
import { FULL_VERSION_STRING } from '../../common/config/version.js';
import { WargamePhase } from '../types/brawl.js';
import { switchGameMode, isSingleGameModeEnforced } from '../../App.js';
import { formatChessClock, getClockWarningStatus } from '../domain/chessClock.js';

interface BrawlTopBarProps {
  roomName: string;
  activeMapName: string;
  isOrganizer: boolean;
  players: Player[];
  localPlayer: Player | null;
  activePlayerIndex: 1 | 2;
  currentRound: number;
  currentPhase: WargamePhase;
  p1ClockSeconds: number;
  p2ClockSeconds: number;
  isClockRunning: boolean;
  p1TotalVp?: number;
  p2TotalVp?: number;
  onToggleClock: () => void;
  onNextPhase: () => void;
  onSwitchActivePlayer: () => void;
  onOpenScoreboard?: () => void;
  onOpenObjectives?: () => void;
  onOpenStaging?: () => void;
  onOpenToModal?: () => void;
  currentRole?: BrawlUserRole;
  onOpenArmyRoster: () => void;
  onOpenDice: () => void;
  onOpenMaps: () => void;
  onOpenSoundboard: () => void;
  onOpenBackup: () => void;
  onAddNewModel: () => void;
  onToggleMobileDrawer: () => void;
  onToggleChessClockHUD?: () => void;
  voiceState?: VoiceState;
}

const PHASES: WargamePhase[] = ['Command', 'Movement', 'Shooting', 'Charge', 'Fight', 'Morale'];

export const BrawlTopBar: React.FC<BrawlTopBarProps> = ({
  roomName,
  activeMapName,
  isOrganizer,
  players,
  localPlayer,
  activePlayerIndex,
  currentRound,
  currentPhase,
  p1ClockSeconds,
  p2ClockSeconds,
  isClockRunning,
  p1TotalVp = 0,
  p2TotalVp = 0,
  onToggleClock,
  onNextPhase,
  onSwitchActivePlayer,
  onOpenScoreboard,
  onOpenObjectives,
  onOpenStaging,
  onOpenToModal,
  currentRole = 'player',
  onOpenArmyRoster,
  onOpenDice,
  onOpenMaps,
  onOpenSoundboard,
  onOpenBackup,
  onAddNewModel,
  onToggleMobileDrawer,
  onToggleChessClockHUD,
  voiceState,
}) => {
  const [copied, setCopied] = useState(false);

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <button
          className="btn-icon"
          onClick={onToggleMobileDrawer}
          title="Open Menu"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>

        <div className="room-info" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="room-name" style={{ fontWeight: 800, color: '#f59e0b', letterSpacing: '0.5px' }}>
              Old Bear Brawl
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                padding: '1px 5px',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              Wargame
            </span>
          </div>
          <span style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '-2px' }}>
            {FULL_VERSION_STRING}
          </span>
        </div>

        {!isSingleGameModeEnforced() && (
          <button
            className="btn-glass"
            onClick={() => switchGameMode('vtt')}
            title="Switch to Tabletop RPG Mode (VTT)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              background: 'rgba(56, 189, 248, 0.12)',
              padding: '3px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <span>🐻 VTT</span>
          </button>
        )}

        {/* Round & Phase Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Round {currentRound}
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
          <button
            onClick={onNextPhase}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 4px',
              borderRadius: '4px',
            }}
            title="Click to advance to next phase"
          >
            {currentPhase} <ChevronRight size={14} />
          </button>
        </div>

        {/* Chess Clock Indicator (OB-158) */}
        {(() => {
          const p1Fmt = formatChessClock(p1ClockSeconds);
          const p2Fmt = formatChessClock(p2ClockSeconds);
          const p1Warn = getClockWarningStatus(p1ClockSeconds);
          const p2Warn = getClockWarningStatus(p2ClockSeconds);

          const getTextColor = (warn: string, isCurrent: boolean, defaultColor: string) => {
            if (warn === 'overtime') return '#ef4444';
            if (warn === 'danger') return '#ea580c';
            if (warn === 'warning') return '#f59e0b';
            return isCurrent ? defaultColor : 'var(--text-secondary)';
          };

          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: isClockRunning ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 0, 0, 0.25)',
                border: `1px solid ${isClockRunning ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              <Timer size={13} style={{ color: isClockRunning ? '#10b981' : 'var(--text-secondary)' }} />
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: getTextColor(p1Warn, activePlayerIndex === 1, '#38bdf8'),
                }}
              >
                P1: {p1Fmt.formatted} {p1Fmt.isOvertime ? 'OT' : ''}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>/</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: getTextColor(p2Warn, activePlayerIndex === 2, '#ec4899'),
                }}
              >
                P2: {p2Fmt.formatted} {p2Fmt.isOvertime ? 'OT' : ''}
              </span>
              <button
                className="btn-icon"
                style={{ width: '22px', height: '22px' }}
                onClick={onToggleClock}
                title={isClockRunning ? 'Pause Clock' : 'Start Clock'}
              >
                {isClockRunning ? <Pause size={11} /> : <Play size={11} />}
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '0 2px',
                }}
                onClick={onSwitchActivePlayer}
                title="Pass turn to opponent"
              >
                Pass Turn
              </button>
              {onToggleChessClockHUD && (
                <button
                  className="btn-icon"
                  style={{ width: '20px', height: '20px', padding: 0 }}
                  onClick={onToggleChessClockHUD}
                  title="Pop out Floating Chess Clock HUD"
                >
                  <ExternalLink size={11} />
                </button>
              )}
            </div>
          );
        })()}
      </div>

      <div className="top-bar-right">
        {/* Scoreboard Button (OB-159) */}
        {onOpenScoreboard && (
          <button
            className="btn-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              background: 'rgba(245, 158, 11, 0.12)',
              padding: '3px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            onClick={onOpenScoreboard}
            title="Open Match Scoreboard (VP, CP, Casualties)"
          >
            <Trophy size={13} />
            <span>VP: {p1TotalVp} - {p2TotalVp}</span>
          </button>
        )}

        {/* Objectives Button (OB-160) */}
        {onOpenObjectives && (
          <button
            className="btn-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              background: 'rgba(56, 189, 248, 0.12)',
              padding: '3px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            onClick={onOpenObjectives}
            title="Open Objective Markers & Control Zones"
          >
            <Target size={13} />
            <span>Objectives</span>
          </button>
        )}

        {/* Deployment & Staging Button (OB-162) */}
        {onOpenStaging && (
          <button
            className="btn-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#a78bfa',
              border: '1px solid rgba(167, 139, 250, 0.35)',
              background: 'rgba(167, 139, 250, 0.12)',
              padding: '3px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            onClick={onOpenStaging}
            title="Open Deployment Zones & Staging Submaps"
          >
            <Compass size={13} />
            <span>Deployment</span>
          </button>
        )}

        {/* TO & Spectator Button (OB-163) */}
        {onOpenToModal && (
          <button
            className="btn-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: currentRole === 'to' ? '#f59e0b' : currentRole === 'spectator' ? '#38bdf8' : 'var(--text-secondary)',
              border: `1px solid ${currentRole === 'to' ? 'rgba(245, 158, 11, 0.4)' : currentRole === 'spectator' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
              background: currentRole === 'to' ? 'rgba(245, 158, 11, 0.15)' : currentRole === 'spectator' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 0, 0, 0.25)',
              padding: '3px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            onClick={onOpenToModal}
            title="Tournament Organizer & Spectator Settings"
          >
            {currentRole === 'spectator' ? <Eye size={13} /> : <Gavel size={13} />}
            <span>{currentRole === 'to' ? 'TO Mode' : currentRole === 'spectator' ? 'Spectator' : 'TO / Admin'}</span>
          </button>
        )}

        {/* Army Roster Button */}
        <button
          className="btn-primary"
          style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderColor: '#b45309',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          onClick={onOpenArmyRoster}
          title="Open Army Roster"
        >
          <Shield size={14} /> Army
        </button>

        {/* Share Room Button */}
        <button
          className="btn-icon"
          onClick={copyInviteLink}
          title={copied ? 'Link Copied!' : 'Copy Room Invite Link'}
          aria-label="Copy Room Invite Link"
          style={{ color: copied ? '#10b981' : undefined }}
        >
          {copied ? <Check size={18} /> : <Share2 size={18} />}
        </button>

        {/* Feedback Link */}
        <a
          href="https://forms.gle/zD9Rmqj4c3Dffpw39"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-icon"
          title="Send Feedback"
          aria-label="Send Feedback"
          style={{ textDecoration: 'none' }}
        >
          <MessageSquareHeart size={18} />
        </a>

        {/* Connected Players */}
        <div className="player-avatars" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {players.map((p) => {
            const isSelf = p.id === localPlayer?.id;
            return (
              <div
                key={p.id}
                title={`${p.name}${isSelf ? ' (You)' : ''}`}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: p.color || '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  color: '#fff',
                  border: isSelf ? '2px solid #fff' : '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};
