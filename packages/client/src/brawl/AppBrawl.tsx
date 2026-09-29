import React, { useEffect, useRef, useState } from 'react';
import {
  GameMap,
  GameSession,
  Player,
  Token,
  DiceRollResult,
  ScreenMarker,
  ChatMessage,
  generateRandomName,
} from '@oldbear/shared';
import { CanvasEngine, ActiveTool } from '../common/engine/CanvasEngine.js';
import { NetworkClient } from '../common/network/NetworkClient.js';
import { ToolBar } from '../common/components/ToolBar.js';
import { TokenControls } from '../common/components/TokenControls.js';
import { TokenEditorModal } from '../common/components/TokenEditorModal.js';
import { DiceRoller } from '../common/components/DiceRoller.js';
import { MapManagerModal } from '../common/components/MapManagerModal.js';
import { SoundboardModal } from '../common/components/SoundboardModal.js';
import { MobileDrawer } from '../common/components/MobileDrawer.js';
import { VoiceManager, VoiceState } from '../common/network/VoiceManager.js';
import { VoiceSettingsModal } from '../common/components/VoiceSettingsModal.js';
import { DataBackupModal } from '../common/components/DataBackupModal.js';
import { GlobalDropOverlay } from '../common/components/GlobalDropOverlay.js';
import { TokenPickerModal } from '../common/components/TokenPickerModal.js';
import { BatchTokenTransferModal } from '../common/components/BatchTokenTransferModal.js';
import { PlayerTokenPickerModal } from '../common/components/PlayerTokenPickerModal.js';
import { RollAnnouncementBanner } from '../common/components/RollAnnouncementBanner.js';
import { TurnAnnouncementBanner } from '../common/components/TurnAnnouncementBanner.js';
import { ChatPanel } from '../common/components/ChatPanel.js';
import { MarkerControls } from '../common/components/MarkerControls.js';
import { TOAST_DURATION_MS } from '../common/config/toast.js';
import { BrawlTopBar } from './components/BrawlTopBar.js';
import { ArmyRosterFlyout } from './components/ArmyRosterFlyout.js';
import { WargamePhase, WargameUnit } from './types/brawl.js';
import { Mic, Radio, Compass, Check, AlertTriangle, RefreshCw } from 'lucide-react';

const PHASES: WargamePhase[] = ['Command', 'Movement', 'Shooting', 'Charge', 'Fight', 'Morale'];

export const AppBrawl: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const networkRef = useRef<NetworkClient | null>(null);
  const voiceManagerRef = useRef<VoiceManager | null>(null);

  // Connection & Room
  const [roomId, setRoomId] = useState<string>('');
  const [roomUrl, setRoomUrl] = useState<string>('');
  const [session, setSession] = useState<GameSession | null>(null);
  const sessionRef = useRef<GameSession | null>(null);
  sessionRef.current = session;
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string, durationMs: number = TOAST_DURATION_MS) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, durationMs);
  };

  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<ScreenMarker | null>(null);

  // Brawl Specific State (Round, Phases, Chess Clocks)
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [activePlayerIndex, setActivePlayerIndex] = useState<1 | 2>(1);
  const [p1ClockSeconds, setP1ClockSeconds] = useState(5400); // 90 min default
  const [p2ClockSeconds, setP2ClockSeconds] = useState(5400);
  const [isClockRunning, setIsClockRunning] = useState(false);

  // Modals & Flyouts
  const [showArmyRoster, setShowArmyRoster] = useState(false);
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [showMapManager, setShowMapManager] = useState(false);
  const [showSoundboard, setShowSoundboard] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showTokenPickerModal, setShowTokenPickerModal] = useState(false);
  const [showBatchTransferModal, setShowBatchTransferModal] = useState(false);
  const [showPlayerTokenPickerModal, setShowPlayerTokenPickerModal] = useState(false);
  const [tokenToEdit, setTokenToEdit] = useState<Token | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isInitialized: false,
    isMuted: true,
    isForceMuted: false,
    isDeafened: false,
    isSpeaking: false,
    isPttActive: false,
    transmissionMode: 'open',
    pttKey: 'KeyV',
    pttKeyDisplay: 'V',
    selectedInputId: 'default',
    selectedOutputId: 'default',
    isAudioStreaming: false,
    micVolume: 1.0,
    desktopVolume: 0.8,
    localLevel: 0,
  });

  const currentMap = session?.maps.find((m) => m.id === (session.activeMapId || '')) || session?.maps[0];

  // Chess Clock Tick Effect
  useEffect(() => {
    if (!isClockRunning) return;
    const interval = setInterval(() => {
      if (activePlayerIndex === 1) {
        setP1ClockSeconds((prev) => Math.max(0, prev - 1));
      } else {
        setP2ClockSeconds((prev) => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isClockRunning, activePlayerIndex]);

  // Phase Stepper
  const handleNextPhase = () => {
    const nextIdx = (currentPhaseIndex + 1) % PHASES.length;
    setCurrentPhaseIndex(nextIdx);
    if (nextIdx === 0) {
      setCurrentRound((prev) => prev + 1);
      showToast(`Battle Round ${currentRound + 1} Begins!`);
    } else {
      showToast(`Phase: ${PHASES[nextIdx]}`);
    }
  };

  const handleSwitchActivePlayer = () => {
    const nextPlayer = activePlayerIndex === 1 ? 2 : 1;
    setActivePlayerIndex(nextPlayer);
    showToast(`Turn passed to Player ${nextPlayer}!`);
  };

  // Keep engine in sync with session, player and tools
  useEffect(() => {
    if (!engineRef.current) return;
    if (session) {
      engineRef.current.setSession(session);
      const mapIdToView = session.activeMapId || session.maps[0]?.id || '';
      if (mapIdToView && engineRef.current.currentMapId !== mapIdToView) {
        engineRef.current.setActiveMap(mapIdToView);
      }
    }
    if (localPlayer) {
      engineRef.current.setLocalPlayer(localPlayer);
    }
    engineRef.current.activeTool = activeTool;
    engineRef.current.snapEnabled = snapEnabled;
  }, [session, localPlayer, activeTool, snapEnabled]);

  // Initialize CanvasEngine & Network
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new CanvasEngine(canvasRef.current);
    engineRef.current = engine;

    engine.callbacks = {
      onTokenSelect: (token) => {
        setSelectedTokens(token ? [token] : []);
      },
      onMarkerSelect: (marker) => {
        setSelectedMarker(marker);
      },
    };

    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    const currentRoomId = path || 'brawl-table';
    setRoomId(currentRoomId);
    setRoomUrl(window.location.href);

    const network = new NetworkClient();
    networkRef.current = network;

    const initialPlayerName = generateRandomName('random');

    network.onMessage((msg) => {
      if (msg.type === 'join-ack') {
        setLocalPlayer(msg.player);
        setSession(msg.session);
        setIsOrganizer(msg.isGm);
        if (msg.session.maps.length > 0 && !engine.currentMapId) {
          engine.setActiveMap(msg.session.activeMapId || msg.session.maps[0].id);
        }
      } else if (msg.type === 'sync-session') {
        setSession(msg.session);
        engine.setSession(msg.session);
        if (msg.session.maps.length > 0 && !engine.currentMapId) {
          engine.setActiveMap(msg.session.activeMapId || msg.session.maps[0].id);
        }
      }
    });

    network.connect(currentRoomId, initialPlayerName, '#f59e0b', '');

    return () => {
      engine.destroy();
      network.disconnect();
    };
  }, []);

  return (
    <div className="app-root" style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', background: '#0f172a' }} />

      {/* Brawl Top Bar */}
      <BrawlTopBar
        roomName={session?.name || roomId}
        activeMapName={currentMap?.name || 'Default Table'}
        isOrganizer={isOrganizer}
        players={session ? Object.values(session.players) : []}
        localPlayer={localPlayer}
        activePlayerIndex={activePlayerIndex}
        currentRound={currentRound}
        currentPhase={PHASES[currentPhaseIndex]}
        p1ClockSeconds={p1ClockSeconds}
        p2ClockSeconds={p2ClockSeconds}
        isClockRunning={isClockRunning}
        onToggleClock={() => setIsClockRunning((prev) => !prev)}
        onNextPhase={handleNextPhase}
        onSwitchActivePlayer={handleSwitchActivePlayer}
        onOpenArmyRoster={() => setShowArmyRoster(true)}
        onOpenDice={() => setShowDiceRoller((prev) => !prev)}
        onOpenMaps={() => setShowMapManager(true)}
        onOpenSoundboard={() => setShowSoundboard(true)}
        onOpenBackup={() => setShowBackupModal(true)}
        onAddNewModel={() => setShowTokenPickerModal(true)}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(true)}
        voiceState={voiceState}
      />

      {/* Main Left Toolbar */}
      <ToolBar
        activeTool={activeTool}
        onSelectTool={(tool) => {
          setActiveTool(tool);
          if (engineRef.current) {
            engineRef.current.activeTool = tool;
          }
        }}
        isGm={isOrganizer}
        snapEnabled={snapEnabled}
        onToggleSnap={() => {
          setSnapEnabled(!snapEnabled);
          if (engineRef.current) {
            engineRef.current.snapEnabled = !snapEnabled;
          }
        }}
        userColor={localPlayer?.color || '#f59e0b'}
        onChangeColor={(c) => {
          if (localPlayer) {
            setLocalPlayer({ ...localPlayer, color: c });
          }
        }}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onClearAllFog={() => {}}
        onCoverAllFog={() => {}}
      />

      {/* Army Roster Flyout */}
      {showArmyRoster && (
        <ArmyRosterFlyout
          onClose={() => setShowArmyRoster(false)}
          onDeployUnit={(unit) => {
            showToast(`Deploying ${unit.name} (${unit.models.length} models) to battlefield!`);
          }}
        />
      )}

      {/* Chat & Dice Roller */}
      {showDiceRoller && (
        <DiceRoller
          userName={localPlayer?.name || 'Player'}
          userColor={localPlayer?.color || '#f59e0b'}
          userId={localPlayer?.id || 'p1'}
          rollHistory={[]}
          onClose={() => setShowDiceRoller(false)}
          onRoll={(roll) => {
            networkRef.current?.send({ type: 'dice-roll', roll });
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #f59e0b',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            zIndex: 100,
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
