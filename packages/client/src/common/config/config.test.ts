import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AVAILABLE_COLORS, COLOR_VALUES } from './colors.js';
import { APP_VERSION, FULL_VERSION_STRING } from './version.js';
import { TOAST_DURATION_MS } from './toast.js';
import { helpText } from './helpText.js';

describe('Common Configuration & Theming (src/common/config)', () => {
  it('defines valid hex colors with unique values in AVAILABLE_COLORS', () => {
    assert.ok(AVAILABLE_COLORS.length >= 8, 'Expected at least 8 color options');
    const hexPattern = /^#[0-9a-fA-F]{6}$/;

    const uniqueValues = new Set<string>();
    for (const color of AVAILABLE_COLORS) {
      assert.ok(color.name && color.name.trim().length > 0, 'Color must have a name');
      assert.match(color.value, hexPattern, `Color ${color.name} must be a valid 6-char hex code`);
      uniqueValues.add(color.value.toLowerCase());
    }

    assert.strictEqual(
      uniqueValues.size,
      AVAILABLE_COLORS.length,
      'All color options must have unique hex values'
    );
    assert.deepStrictEqual(COLOR_VALUES, AVAILABLE_COLORS.map((c) => c.value));
  });

  it('formats full version string with "v" prefix and semantic version', () => {
    assert.ok(APP_VERSION && APP_VERSION.length > 0, 'APP_VERSION must be defined');
    assert.ok(FULL_VERSION_STRING.startsWith('v'), 'FULL_VERSION_STRING must start with "v"');
    assert.ok(FULL_VERSION_STRING.includes(APP_VERSION), 'FULL_VERSION_STRING must contain APP_VERSION');
  });

  it('defines positive toast duration constant', () => {
    assert.ok(typeof TOAST_DURATION_MS === 'number', 'TOAST_DURATION_MS must be a number');
    assert.ok(TOAST_DURATION_MS >= 1000 && TOAST_DURATION_MS <= 10000, 'Toast duration should be between 1s and 10s');
  });

  it('provides structured help text categories and tooltips', () => {
    assert.ok(helpText, 'helpText object must be loaded');
    assert.ok(typeof helpText === 'object', 'helpText must be an object');
  });
});
