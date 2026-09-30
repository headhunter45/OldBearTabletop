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

  describe('Multi-mode and Single-mode Deployment Toggles (OB-154)', () => {
    it('strictly enforces single-mode brawl when GAME_MODE=brawl regardless of URL query', () => {
      // Even if user requests ?mode=vtt, single-mode deployment locks it to brawl
      const mode = detectGameMode('?mode=vtt', 'vtt', 'brawl');
      assert.strictEqual(mode, 'brawl');
    });

    it('strictly enforces single-mode vtt when GAME_MODE=vtt regardless of URL query', () => {
      const mode = detectGameMode('?mode=brawl', 'brawl', 'vtt');
      assert.strictEqual(mode, 'vtt');
    });

    it('supports comma-separated GAME_MODES=vtt,brawl multi-mode deployment', () => {
      const brawlMode = detectGameMode('?mode=brawl', null, undefined, 'vtt,brawl');
      assert.strictEqual(brawlMode, 'brawl');

      const vttMode = detectGameMode('?mode=vtt', null, undefined, 'vtt,brawl');
      assert.strictEqual(vttMode, 'vtt');
    });

    it('rejects disallowed modes when GAME_MODES restricts available modes', () => {
      // Only brawl allowed in GAME_MODES=brawl
      const mode = detectGameMode('?mode=vtt', null, undefined, 'brawl');
      assert.strictEqual(mode, 'brawl');
    });
  });
});
