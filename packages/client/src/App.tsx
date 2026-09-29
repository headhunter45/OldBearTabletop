import React, { useMemo } from 'react';
import { AppVtt } from './vtt/AppVtt.js';
import { AppBrawl } from './brawl/AppBrawl.js';

export type GameMode = 'vtt' | 'brawl';

export function detectGameMode(
  searchString?: string,
  storedMode?: string | null,
  envMode?: string
): GameMode {
  if (searchString !== undefined) {
    const params = new URLSearchParams(searchString);
    const modeParam = params.get('mode') || params.get('gamemode');
    if (modeParam === 'brawl') return 'brawl';
    if (modeParam === 'vtt') return 'vtt';
  } else if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode') || params.get('gamemode');
    if (modeParam === 'brawl') return 'brawl';
    if (modeParam === 'vtt') return 'vtt';
  }

  const stored = storedMode !== undefined
    ? storedMode
    : (typeof window !== 'undefined' && typeof localStorage !== 'undefined' ? localStorage.getItem('oldbear_mode') : null);
  if (stored === 'brawl' || stored === 'vtt') return stored;

  const env = envMode !== undefined
    ? envMode
    : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GAME_MODE);
  if (env === 'brawl') {
    return 'brawl';
  }

  return 'vtt';
}

export const App: React.FC = () => {
  const mode = useMemo(() => detectGameMode(), []);

  if (mode === 'brawl') {
    return <AppBrawl />;
  }

  return <AppVtt />;
};
