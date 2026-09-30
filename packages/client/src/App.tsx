import React, { useMemo } from 'react';
import { AppVtt } from './vtt/AppVtt.js';
import { AppBrawl } from './brawl/AppBrawl.js';

export type GameMode = 'vtt' | 'brawl';

export interface GameModeConfig {
  allowedModes: GameMode[];
  defaultMode: GameMode;
  isSingleMode: boolean;
}

export function parseAllowedModes(envAllowed?: string, envSingle?: string): GameModeConfig {
  const single = envSingle?.toLowerCase().trim();
  if (single === 'brawl' || single === 'vtt') {
    return {
      allowedModes: [single],
      defaultMode: single,
      isSingleMode: true,
    };
  }

  const raw = envAllowed?.toLowerCase().trim();
  if (raw) {
    const list = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s === 'vtt' || s === 'brawl') as GameMode[];
    if (list.length > 0) {
      return {
        allowedModes: list,
        defaultMode: list[0],
        isSingleMode: list.length === 1,
      };
    }
  }

  return {
    allowedModes: ['vtt', 'brawl'],
    defaultMode: 'vtt',
    isSingleMode: false,
  };
}

export function detectGameMode(
  searchString?: string,
  storedMode?: string | null,
  envMode?: string,
  envAllowedModes?: string
): GameMode {
  const resolvedEnvMode = envMode !== undefined
    ? envMode
    : (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GAME_MODE || import.meta.env?.GAME_MODE) : undefined);

  const resolvedEnvAllowed = envAllowedModes !== undefined
    ? envAllowedModes
    : (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GAME_MODES || import.meta.env?.GAME_MODES) : undefined);

  const config = parseAllowedModes(resolvedEnvAllowed, resolvedEnvMode);
  if (config.isSingleMode) {
    return config.defaultMode;
  }

  let requestedMode: string | null = null;
  if (searchString !== undefined) {
    const params = new URLSearchParams(searchString);
    requestedMode = params.get('mode') || params.get('gamemode');
  } else if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    requestedMode = params.get('mode') || params.get('gamemode');
  }

  if (requestedMode === 'brawl' && config.allowedModes.includes('brawl')) return 'brawl';
  if (requestedMode === 'vtt' && config.allowedModes.includes('vtt')) return 'vtt';

  const stored = storedMode !== undefined
    ? storedMode
    : (typeof window !== 'undefined' && typeof localStorage !== 'undefined' ? localStorage.getItem('oldbear_mode') : null);
  if (stored === 'brawl' && config.allowedModes.includes('brawl')) return 'brawl';
  if (stored === 'vtt' && config.allowedModes.includes('vtt')) return 'vtt';

  return config.defaultMode;
}

export function switchGameMode(targetMode: GameMode): void {
  if (typeof window !== 'undefined') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('oldbear_mode', targetMode);
    }
    const url = new URL(window.location.href);
    url.searchParams.set('mode', targetMode);
    window.location.href = url.toString();
  }
}

export function isSingleGameModeEnforced(envMode?: string, envAllowedModes?: string): boolean {
  const resolvedEnvMode = envMode !== undefined
    ? envMode
    : (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GAME_MODE || import.meta.env?.GAME_MODE) : undefined);

  const resolvedEnvAllowed = envAllowedModes !== undefined
    ? envAllowedModes
    : (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GAME_MODES || import.meta.env?.GAME_MODES) : undefined);

  return parseAllowedModes(resolvedEnvAllowed, resolvedEnvMode).isSingleMode;
}

export const App: React.FC = () => {
  const mode = useMemo(() => detectGameMode(), []);

  if (mode === 'brawl') {
    return <AppBrawl />;
  }

  return <AppVtt />;
};
