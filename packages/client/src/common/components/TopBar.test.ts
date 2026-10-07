import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TopBar } from './TopBar.js';

describe('TopBar Active Scene Settings (OB-209)', () => {
  it('renders Scene label and settings button for GM in TopBar', () => {
    let settingsOpened = false;
    const markup = renderToStaticMarkup(
      React.createElement(TopBar, {
        roomName: 'Test Room',
        activeMapName: 'Dungeon Level 1',
        isGm: true,
        players: [],
        localPlayer: null,
        onOpenDice: () => {},
        onOpenInitiative: () => {},
        onOpenCharacter: () => {},
        onOpenMaps: () => {},
        onOpenSceneSettings: () => {
          settingsOpened = true;
        },
        onOpenSoundboard: () => {},
        onAddNewToken: () => {},
        onToggleMobileDrawer: () => {},
      })
    );

    assert.ok(markup.includes('Scene:'), 'Displays Scene label');
    assert.ok(markup.includes('Dungeon Level 1'), 'Displays active scene name');
    assert.ok(markup.includes('title="Scene Settings"'), 'Renders Scene Settings button with title');
    assert.ok(markup.includes('aria-label="Scene Settings"'), 'Renders accessible aria-label');
  });

  it('does not render settings button for non-GM player in TopBar', () => {
    const markup = renderToStaticMarkup(
      React.createElement(TopBar, {
        roomName: 'Test Room',
        activeMapName: 'Dungeon Level 1',
        isGm: false,
        players: [],
        localPlayer: null,
        onOpenDice: () => {},
        onOpenInitiative: () => {},
        onOpenCharacter: () => {},
        onOpenMaps: () => {},
        onOpenSceneSettings: () => {},
        onOpenSoundboard: () => {},
        onAddNewToken: () => {},
        onToggleMobileDrawer: () => {},
      })
    );

    assert.ok(markup.includes('Scene:'), 'Displays Scene label');
    assert.ok(markup.includes('Dungeon Level 1'), 'Displays active scene name');
    assert.ok(!markup.includes('title="Scene Settings"'), 'Does not render settings button for non-GM');
  });
});
