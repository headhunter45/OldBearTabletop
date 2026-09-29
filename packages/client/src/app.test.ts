import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectGameMode } from './App.js';

describe('Application Game Mode Dispatcher (OB-136)', () => {
  it('detects brawl mode from ?mode=brawl URL query', () => {
    const mode = detectGameMode('?mode=brawl');
    assert.strictEqual(mode, 'brawl');
  });

  it('detects brawl mode from ?gamemode=brawl URL query', () => {
    const mode = detectGameMode('?gamemode=brawl');
    assert.strictEqual(mode, 'brawl');
  });

  it('detects vtt mode explicitly from ?mode=vtt URL query', () => {
    const mode = detectGameMode('?mode=vtt');
    assert.strictEqual(mode, 'vtt');
  });

  it('falls back to localStorage preference if no URL parameter is provided', () => {
    const brawlMode = detectGameMode('', 'brawl');
    assert.strictEqual(brawlMode, 'brawl');

    const vttMode = detectGameMode('', 'vtt');
    assert.strictEqual(vttMode, 'vtt');
  });

  it('falls back to VITE_GAME_MODE environment variable', () => {
    const mode = detectGameMode('', null, 'brawl');
    assert.strictEqual(mode, 'brawl');
  });

  it('defaults to vtt mode when no parameters or preferences are found', () => {
    const mode = detectGameMode('', null, undefined);
    assert.strictEqual(mode, 'vtt');
  });
});
