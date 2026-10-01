import React, { useEffect, useRef, useState, useMemo } from 'react';
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
import { PhaseAnnouncementBanner } from './components/PhaseAnnouncementBanner.js';
import { ChessClockWidget } from './components/ChessClockWidget.js';
import { ScoreboardModal } from './components/ScoreboardModal.js';
import { ObjectivesModal } from './components/ObjectivesModal.js';
import { DeploymentStagingModal } from './components/DeploymentStagingModal.js';
import { WargamePhase, WargameUnit } from './types/brawl.js';
import { modelToToken } from './domain/armyManager.js';
import { updateTokensCoherency } from './domain/coherencyEngine.js';
import {
  ObjectiveMarker,
  createStandardObjectives,
  evaluateAllObjectives,
} from './domain/objectiveEngine.js';
import { advanceWargamePhase, WARGAME_PHASES, PhaseTransitionEvent } from './domain/phaseEngine.js';
import { playLowTimeWarningSound, playOvertimeAlarmSound, playClockSwitchSound } from './domain/chessClock.js';
import {
  ScoreboardState,
  ScoreAuditEntry,
  ResourceType,
  createInitialScoreboard,
  updatePlayerResource,
} from './domain/scoreboardEngine.js';
import { Mic, Radio, Compass, Check, AlertTriangle, RefreshCw } from 'lucide-react';

const PHASES: WargamePhase[] = WARGAME_PHASES;

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
  const [phaseAnnouncement, setPhaseAnnouncement] = useState<PhaseTransitionEvent | null>(null);
  const [p1ClockSeconds, setP1ClockSeconds] = useState(5400); // 90 min default
  const [p2ClockSeconds, setP2ClockSeconds] = useState(5400);
  const [isClockRunning, setIsClockRunning] = useState(false);

  // Modals & Flyouts
  const [scoreboard, setScoreboard] = useState<ScoreboardState>(() => createInitialScoreboard());
  const [scoreAuditTrail, setScoreAuditTrail] = useState<ScoreAuditEntry[]>([]);
  const [showScoreboardModal, setShowScoreboardModal] = useState(false);
  const [objectives, setObjectives] = useState<ObjectiveMarker[]>([]);
  const [showObjectivesModal, setShowObjectivesModal] = useState(false);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [showArmyRoster, setShowArmyRoster] = useState(false);
  const [showChessClockHUD, setShowChessClockHUD] = useState(false);
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

  // Chess Clock Tick Effect (OB-158)
  useEffect(() => {
    if (!isClockRunning) return;
    const interval = setInterval(() => {
      if (activePlayerIndex === 1) {
        setP1ClockSeconds((prev) => {
          const next = prev - 1;
          if (next === 300 || next === 60) playLowTimeWarningSound();
          if (next === 0) playOvertimeAlarmSound();
          return next;
        });
      } else {
        setP2ClockSeconds((prev) => {
          const next = prev - 1;
          if (next === 300 || next === 60) playLowTimeWarningSound();
          if (next === 0) playOvertimeAlarmSound();
          return next;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isClockRunning, activePlayerIndex]);

  // Phase Stepper (OB-157)
  const handleNextPhase = () => {
    const playersList = session ? Object.values(session.players) : [];
    const p1 = playersList[0]?.name || 'Player 1';
    const p2 = playersList[1]?.name || 'Player 2';

    const { nextState, event } = advanceWargamePhase({
      currentRound,
      maxRounds: 5,
      activePlayer: activePlayerIndex,
      currentPhaseIndex,
      player1Name: p1,
      player2Name: p2,
    });

    setCurrentRound(nextState.currentRound);
    setActivePlayerIndex(nextState.activePlayer);
    setCurrentPhaseIndex(nextState.currentPhaseIndex);
    setPhaseAnnouncement(event);
    showToast(`${event.bannerTitle}: ${event.bannerSubtitle}`);

    if (event.commandPointsGranted) {
      handleUpdateScoreResource(
        event.commandPointsGranted.player,
        'commandPoints',
        event.commandPointsGranted.amount,
        'Turn turnover CP grant'
      );
    }

    if (networkRef.current && session) {
      const auditMsg: ChatMessage = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderId: 'system',
        senderName: 'Battle Overseer',
        senderColor: '#f59e0b',
        text: event.chatAuditMessage,
        timestamp: Date.now(),
        isCommand: true,
      };
      networkRef.current.send({ type: 'chat-message', message: auditMsg });
    }
  };

  // Scoreboard Resource Adjuster (OB-159)
  const handleUpdateScoreResource = (
    player: 1 | 2,
    resource: ResourceType,
    delta: number,
    reason?: string
  ) => {
    const { nextState, audit } = updatePlayerResource(scoreboard, player, resource, delta, reason);
    setScoreboard(nextState);
    setScoreAuditTrail((prev) => [audit, ...prev]);
    showToast(audit.formattedMessage.replace(/\*\*/g, ''));

    if (networkRef.current && session) {
      const auditMsg: ChatMessage = {
        id: audit.id,
        senderId: 'system',
        senderName: 'Score Overseer',
        senderColor: player === 1 ? '#38bdf8' : '#ec4899',
        text: audit.formattedMessage,
        timestamp: audit.timestamp,
        isCommand: true,
      };
      networkRef.current.send({ type: 'chat-message', message: auditMsg });
    }
  };

  const handleResetScoreboard = () => {
    const p1 = scoreboard.p1Name;
    const p2 = scoreboard.p2Name;
    setScoreboard(createInitialScoreboard(p1, p2));
    showToast('Match scores reset to 0 VP / 1 CP');
  };

  // Objective Control Evaluation & Auto-Scoring (OB-160)
  const objectivesEvaluation = useMemo(() => {
    return evaluateAllObjectives(objectives, session?.tokens || [], {
      pixelsPerInch: 50,
      p1Name: scoreboard.p1Name,
      p2Name: scoreboard.p2Name,
    });
  }, [objectives, session?.tokens, scoreboard.p1Name, scoreboard.p2Name]);

  const handleDeployStandardObjectives = () => {
    const mapWidth = currentMap?.width || 3000;
    const mapHeight = currentMap?.height || 2200;
    const std = createStandardObjectives(mapWidth, mapHeight);
    setObjectives(std);
    showToast('Deployed standard 5 tournament objective markers with 3″ auras!');
  };

  const handleScoreObjectives = () => {
    let scored = false;
    if (objectivesEvaluation.p1VpEarned > 0) {
      handleUpdateScoreResource(
        1,
        'primaryVp',
        objectivesEvaluation.p1VpEarned,
        `Objective Control (${objectivesEvaluation.p1ControlledCount} held)`
      );
      scored = true;
    }
    if (objectivesEvaluation.p2VpEarned > 0) {
      handleUpdateScoreResource(
        2,
        'primaryVp',
        objectivesEvaluation.p2VpEarned,
        `Objective Control (${objectivesEvaluation.p2ControlledCount} held)`
      );
      scored = true;
    }
    if (!scored) {
      showToast('No Primary VP scored (no uncontested objectives held).');
    }
  };

  const handleRemoveObjective = (id: string) => {
    setObjectives((prev) => prev.filter((m) => m.id !== id));
    showToast('Objective marker removed');
  };

  const handleSwitchActivePlayer = () => {
    playClockSwitchSound();
    const nextPlayer = activePlayerIndex === 1 ? 2 : 1;
    setActivePlayerIndex(nextPlayer);
    setCurrentPhaseIndex(0); // Start at Command phase for newly active player
    const playersList = session ? Object.values(session.players) : [];
    const nextPlayerName = (nextPlayer === 1 ? playersList[0]?.name : playersList[1]?.name) || `Player ${nextPlayer}`;

    const event: PhaseTransitionEvent = {
      type: 'turn_change',
      previousPhase: WARGAME_PHASES[currentPhaseIndex],
      newPhase: 'Command',
      activePlayer: nextPlayer,
      currentRound,
      bannerTitle: `PLAYER ${nextPlayer} TURN`,
      bannerSubtitle: `Round ${currentRound} • ${nextPlayerName}'s Command Phase`,
      chatAuditMessage: `🛡️ **[Round ${currentRound}]** Turn passed to **${nextPlayerName}** (Command Phase).`,
    };

    setPhaseAnnouncement(event);
    showToast(`Turn passed to ${nextPlayerName}!`);

    if (networkRef.current && session) {
      const auditMsg: ChatMessage = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderId: 'system',
        senderName: 'Battle Overseer',
        senderColor: '#f59e0b',
        text: event.chatAuditMessage,
        timestamp: Date.now(),
        isCommand: true,
      };
      networkRef.current.send({ type: 'chat-message', message: auditMsg });
    }
  };

  // Keep engine in sync with session, player and tools
  useEffect(() => {
    if (!engineRef.current) return;
    if (session) {
      const coherentTokens = updateTokensCoherency(session.tokens);
      engineRef.current.setSession({ ...session, tokens: coherentTokens });
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
      onTokenMove: (token) => {
        setSession((prev) => {
          if (!prev) return prev;
          const nextTokens = prev.tokens.map((t) => (t.id === token.id ? { ...t, x: token.x, y: token.y } : t));
          return { ...prev, tokens: updateTokensCoherency(nextTokens) };
        });
        networkRef.current?.send({ type: 'token-update', id: token.id, updates: { x: token.x, y: token.y } });
      },
      onMarkerSelect: (marker) => {
        setSelectedMarker(marker);
      },
      onMarkerAdd: (marker) => {
        setSession((prev) => {
          if (!prev) return prev;
          if (prev.markers?.some((m) => m.id === marker.id)) return prev;
          return { ...prev, markers: [...(prev.markers || []), marker] };
        });
        if (marker.persist) {
          setSelectedMarker(marker);
          if (engineRef.current) engineRef.current.selectedMarkerId = marker.id;
        }
        networkRef.current?.send({ type: 'marker-add', marker });
      },
      onMarkerDelete: (id) => {
        networkRef.current?.send({ type: 'marker-delete', id });
        setSession((prev) => (prev ? { ...prev, markers: (prev.markers || []).filter((m) => m.id !== id) } : prev));
        setSelectedMarker((cur) => (cur?.id === id ? null : cur));
      },
      onMarkerUpdate: (id, updates) => {
        networkRef.current?.send({ type: 'marker-update', id, updates });
        setSession((prev) => (prev ? { ...prev, markers: (prev.markers || []).map((m) => (m.id === id ? { ...m, ...updates } : m)) } : prev));
        setSelectedMarker((cur) => (cur?.id === id ? { ...cur, ...updates } : cur));
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
        p1TotalVp={scoreboard.p1.totalVp}
        p2TotalVp={scoreboard.p2.totalVp}
        onToggleClock={() => setIsClockRunning((prev) => !prev)}
        onNextPhase={handleNextPhase}
        onSwitchActivePlayer={handleSwitchActivePlayer}
        onOpenScoreboard={() => setShowScoreboardModal(true)}
        onOpenObjectives={() => setShowObjectivesModal(true)}
        onOpenStaging={() => setShowDeploymentModal(true)}
        onOpenArmyRoster={() => setShowArmyRoster(true)}
        onOpenDice={() => setShowDiceRoller((prev) => !prev)}
        onOpenMaps={() => setShowMapManager(true)}
        onOpenSoundboard={() => setShowSoundboard(true)}
        onOpenBackup={() => setShowBackupModal(true)}
        onAddNewModel={() => setShowTokenPickerModal(true)}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(true)}
        onToggleChessClockHUD={() => setShowChessClockHUD((prev) => !prev)}
        voiceState={voiceState}
      />

      {/* Phase Transition Banner (OB-157) */}
      <PhaseAnnouncementBanner
        announcement={phaseAnnouncement}
        onDismiss={() => setPhaseAnnouncement(null)}
      />

      {/* Main Left Toolbar */}
      <ToolBar
        activeTool={activeTool}
        onSelectTool={(tool) => {
          setActiveTool(tool);
          if (engineRef.current) {
            engineRef.current.activeTool = tool;
            if (engineRef.current.isDrawing) {
              engineRef.current.isDrawing = false;
              engineRef.current.drawStart = null;
              engineRef.current.drawCurrent = null;
              engineRef.current.laserPoints = [];
            }
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
          onDeployUnit={(unit, army) => {
            const startX = 250;
            const startY = 250;
            const spacing = 70;
            const newTokens = unit.models.map((model, idx) => {
              const positionedModel = {
                ...model,
                x: startX + (idx % 5) * spacing,
                y: startY + Math.floor(idx / 5) * spacing,
              };
              return modelToToken(positionedModel, unit, army);
            });

            setSession((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                tokens: [...prev.tokens, ...newTokens],
              };
            });

            newTokens.forEach((tok) => {
              networkRef.current?.send({ type: 'token-add', token: tok });
            });

            showToast(`Deployed ${unit.name} (${unit.models.length} models) to battlefield!`);
          }}
        />
      )}

      {/* Selected Persistent Shape Controls (OB-129) */}
      {selectedMarker && session && (
        <MarkerControls
          marker={selectedMarker}
          onDelete={(id) => {
            setSession((prev) => (prev ? { ...prev, markers: (prev.markers || []).filter((m) => m.id !== id) } : prev));
            setSelectedMarker(null);
            if (engineRef.current) engineRef.current.selectedMarkerId = null;
            networkRef.current?.send({ type: 'marker-delete', id });
          }}
          onToggleLock={(id, locked) => {
            setSession((prev) => (prev ? { ...prev, markers: (prev.markers || []).map((m) => (m.id === id ? { ...m, locked } : m)) } : prev));
            setSelectedMarker((cur) => (cur && cur.id === id ? { ...cur, locked } : cur));
            networkRef.current?.send({ type: 'marker-update', id, updates: { locked } });
          }}
          onUpdate={(id, updates) => {
            setSession((prev) => (prev ? { ...prev, markers: (prev.markers || []).map((m) => (m.id === id ? { ...m, ...updates } : m)) } : prev));
            setSelectedMarker((cur) => (cur && cur.id === id ? { ...cur, ...updates } : cur));
            networkRef.current?.send({ type: 'marker-update', id, updates });
          }}
          onClose={() => {
            setSelectedMarker(null);
            if (engineRef.current) engineRef.current.selectedMarkerId = null;
          }}
          canControl={isOrganizer || selectedMarker.userId === localPlayer?.id}
          tokens={session.tokens}
          gridSize={session.maps[0]?.gridSize}
          scaleFtPerCell={session.maps[0]?.scaleFtPerCell}
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

      {/* Floating Chess Clock HUD Widget (OB-158) */}
      {showChessClockHUD && (
        <ChessClockWidget
          p1Seconds={p1ClockSeconds}
          p2Seconds={p2ClockSeconds}
          activePlayer={activePlayerIndex}
          isRunning={isClockRunning}
          p1Name={session ? Object.values(session.players)[0]?.name || 'Player 1' : 'Player 1'}
          p2Name={session ? Object.values(session.players)[1]?.name || 'Player 2' : 'Player 2'}
          onToggleRunning={() => setIsClockRunning((prev) => !prev)}
          onSwitchPlayer={handleSwitchActivePlayer}
          onResetClock={(secs) => {
            setP1ClockSeconds(secs);
            setP2ClockSeconds(secs);
            setIsClockRunning(false);
            showToast(`Match clocks reset to ${secs / 60} minutes`);
          }}
          onClose={() => setShowChessClockHUD(false)}
        />
      )}

      {/* Scoreboard Modal (OB-159) */}
      {showScoreboardModal && (
        <ScoreboardModal
          scoreboard={scoreboard}
          onUpdateResource={handleUpdateScoreResource}
          onResetScoreboard={handleResetScoreboard}
          auditTrail={scoreAuditTrail}
          onClose={() => setShowScoreboardModal(false)}
        />
      )}

      {/* Objectives & Control Zones Modal (OB-160) */}
      {showObjectivesModal && (
        <ObjectivesModal
          objectives={objectives}
          evaluation={objectivesEvaluation}
          p1Name={scoreboard.p1Name}
          p2Name={scoreboard.p2Name}
          onDeployStandardObjectives={handleDeployStandardObjectives}
          onScoreObjectives={handleScoreObjectives}
          onRemoveObjective={handleRemoveObjective}
          onClose={() => setShowObjectivesModal(false)}
        />
      )}

      {/* Deployment & Staging Submaps Modal (OB-162) */}
      {showDeploymentModal && currentMap && (
        <DeploymentStagingModal
          map={currentMap}
          tokens={session?.tokens || []}
          selectedTokenIds={selectedTokenId ? [selectedTokenId] : []}
          onClose={() => setShowDeploymentModal(false)}
          onUpdateMap={(updatedMap) => {
            setSession((prev) => {
              if (!prev) return prev;
              const nextMaps = prev.maps.map((m) => (m.id === updatedMap.id ? updatedMap : m));
              return { ...prev, maps: nextMaps };
            });
            if (networkRef.current && session) {
              networkRef.current.send({
                type: 'map-update',
                map: updatedMap,
              });
            }
          }}
          onUpdateTokens={(updatedTokens) => {
            setSession((prev) => (prev ? { ...prev, tokens: updatedTokens } : prev));
            updatedTokens.forEach((t) => {
              networkRef.current?.send({ type: 'token-update', token: t });
            });
          }}
          onRecordCasualties={(player, count, reason) => {
            handleUpdateScoreResource(player, 'casualties', count, reason);
          }}
          onShowToast={showToast}
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
