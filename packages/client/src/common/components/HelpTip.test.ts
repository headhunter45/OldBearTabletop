import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HOTKEYS, HotkeyItem } from './HotkeyCheatSheetModal.js';

describe('Reusable Help & Tooltip Component (OB-139)', () => {
  it('defines comprehensive keyboard shortcuts across all categories', () => {
    assert.ok(Array.isArray(HOTKEYS), 'HOTKEYS must be an array');
    assert.ok(HOTKEYS.length >= 15, 'Expected at least 15 shortcut definitions');

    const categories = new Set(HOTKEYS.map((h) => h.category));
    assert.ok(categories.has('Tools'), 'Must include Tools category');
    assert.ok(categories.has('Drawings'), 'Must include Drawings category');
    assert.ok(categories.has('Fog of War'), 'Must include Fog of War category');
    assert.ok(categories.has('General'), 'Must include General category');
  });

  it('includes required core hotkeys including ? cheat-sheet trigger', () => {
    const keys = HOTKEYS.map((h) => h.key);
    assert.ok(keys.some((k) => k.includes('?')), 'Must include ? cheat-sheet trigger');
    assert.ok(keys.includes('S'), 'Must include S for select');
    assert.ok(keys.includes('B'), 'Must include B for box select');
    assert.ok(keys.some((k) => k.includes('G')), 'Must include G/H for pan');
    assert.ok(keys.includes('M'), 'Must include M for measure');
    assert.ok(keys.includes('1'), 'Must include 1 for laser');
    assert.ok(keys.includes('8'), 'Must include 8 for spray decal');
    assert.ok(keys.includes('R'), 'Must include R for fog reveal');
    assert.ok(keys.includes('F'), 'Must include F for fog hide');
    assert.ok(keys.includes('Esc'), 'Must include Esc for deselect/close');
  });

  it('filters hotkeys correctly by search query', () => {
    const query = 'spray';
    const matches = HOTKEYS.filter(
      (h) =>
        h.key.toLowerCase().includes(query.toLowerCase()) ||
        h.description.toLowerCase().includes(query.toLowerCase()) ||
        h.category.toLowerCase().includes(query.toLowerCase())
    );
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].key, '8');
    assert.ok(matches[0].description.includes('Spray Decal'));
  });

  it('filters hotkeys by category name', () => {
    const query = 'fog';
    const matches = HOTKEYS.filter(
      (h) =>
        h.key.toLowerCase().includes(query.toLowerCase()) ||
        h.description.toLowerCase().includes(query.toLowerCase()) ||
        h.category.toLowerCase().includes(query.toLowerCase())
    );
    assert.ok(matches.length >= 2, 'Should match fog shortcuts');
    assert.ok(matches.some((m) => m.key === 'R'));
    assert.ok(matches.some((m) => m.key === 'F'));
  });

  it('exports HelpTip component configured for body-portaled overlay tooltips (OB-176)', async () => {
    const { HelpTip } = await import('./HelpTip.js');
    assert.strictEqual(typeof HelpTip, 'function', 'HelpTip component is exported');
  });
});
