import React, { useState, useRef, useEffect } from 'react';
import {
  Player,
  ChatMessage,
  DiceRollResult,
  DnDCharacter,
  DieType,
  DnDAction,
  DnDSpell,
  DnDItem,
  Token,
  getActivationCategory,
  EntityAction,
  EntityStatBlock,
  getActionCostGlyph,
  convertDnDActionToEntityAction,
  convertDnDSpellToEntityAction,
  convertDnDItemToEntityAction,
  convertCharacterToMonsterStatBlock,
} from '@oldbear/shared';
import { MessageSquare, Send, X, Dices, Sword, Sparkles, HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { useDraggableWindow } from '../hooks/useDraggableWindow.js';
import { DraggableWindowTitleBar } from './DraggableWindow.js';
import { parseTimerDuration, formatTimer } from '../timer/timerUtils.js';
import {
  isAdvancedDiceExpression,
  parseAndRollAdvanced,
  formatRollDetails,
} from '../dice/AdvancedDiceEngine.js';
import { useChatHistory } from './useChatHistory.js';
import { StatBlockCard } from './StatBlockCard.js';
import {
  fetchOpen5eSpell,
  fetchOpen5eMonster,
  fetchOpen5eItem,
} from '../utils/open5eFetcher.js';
import {
  fetchPF2eFromUrl,
  fetchPF2eReference,
  parseFoundryPF2eJson,
} from '../utils/pf2eFetcher.js';

export interface ChatPanelProps {
  player: Player;
  character?: DnDCharacter | null;
  tokens?: Token[];
  associatedToken?: Token | null;
  onSetAssociatedToken?: (token: Token | null) => void;
  selectedToken?: Token | null;
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
  onBroadcastRoll?: (roll: DiceRollResult) => void;
  onSyncToken?: (tokenId: string, updates: Partial<Token>) => void;
  onUpdatePlayerChar?: (char: DnDCharacter) => void;
  onSpawnMonsterToken?: (statBlock: EntityStatBlock) => void;
  fetchCharacterFn?: (charIdOrUrl: string) => Promise<DnDCharacter>;
  onConfigureDiscordWebhook?: (webhookUrl?: string) => void;
  onStartTimer?: (durationSeconds: number, label?: string) => void;
  onOpenClocks?: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function parseDiceExpression(expr: string, advMode?: 'normal' | 'advantage' | 'disadvantage') {
  const match = expr.match(/^(\d*)d(\d+)(?:([+-])(\d+))?$/i);
  if (!match) return null;

  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const sign = match[3] === '-' ? -1 : 1;
  const modVal = match[4] ? parseInt(match[4], 10) : 0;
  const modifier = sign * modVal;

  const rolls: number[] = [];
  let total = 0;
  let keptRoll: number | undefined;

  if (sides === 20 && count === 1 && advMode && advMode !== 'normal') {
    const r1 = Math.floor(Math.random() * 20) + 1;
    const r2 = Math.floor(Math.random() * 20) + 1;
    rolls.push(r1, r2);
    keptRoll = advMode === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);
    total = keptRoll + modifier;
  } else {
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * sides) + 1;
      rolls.push(r);
      total += r;
    }
    total += modifier;
  }

  const validDice: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
  const diceType: DieType = validDice.includes(`d${sides}` as DieType) ? (`d${sides}` as DieType) : 'd20';

  return {
    count,
    sides,
    modifier,
    rolls,
    total,
    keptRoll,
    diceType,
  };
}

export interface ProcessSlashCommandContext {
  player: Player;
  character?: DnDCharacter;
  tokens?: Token[];
  associatedToken?: Token | null;
  onSetAssociatedToken?: (token: Token | null) => void;
  onSendMessage: (msg: ChatMessage) => void;
  onBroadcastRoll?: (roll: DiceRollResult) => void;
  onSyncToken?: (tokenId: string, updates: Partial<Token>) => void;
  onUpdatePlayerChar?: (char: DnDCharacter) => void;
  onSpawnMonsterToken?: (statBlock: EntityStatBlock) => void;
  fetchCharacterFn?: (charIdOrUrl: string) => Promise<DnDCharacter>;
  onConfigureDiscordWebhook?: (webhookUrl?: string) => void;
  onStartTimer?: (durationSeconds: number, label?: string) => void;
  onOpenClocks?: () => void;
}

export function processSlashCommand(
  raw: string,
  context: ProcessSlashCommandContext
): boolean {
  const text = raw.trim();
  if (!text || !text.startsWith('/')) return false;

  const parts = text.slice(1).split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  const { player, character, tokens, associatedToken, onSetAssociatedToken, onSendMessage, onBroadcastRoll } = context;

  // Resolve effective character: if associatedToken has character or actions, use it; otherwise fall back to character
  const resolveEffectiveCharacter = (): DnDCharacter | undefined => {
    if (associatedToken?.character) {
      return associatedToken.character;
    }
    if (associatedToken) {
      const monsterData = (associatedToken as any).monsterData;
      if (monsterData) {
        const mActions: DnDAction[] = (monsterData.actions || []).map((a: any) => ({
          name: a.name,
          type: a.attack_bonus !== undefined || /attack/i.test(a.desc || '') ? 'melee' : 'action',
          toHitModifier: a.attack_bonus ?? a.toHitModifier ?? 0,
          damageDice: a.damage_dice || a.damageDice || '',
          description: a.desc || a.description || '',
          reach: a.reach,
          range: a.range,
        }));
        return {
          id: associatedToken.id,
          name: associatedToken.name,
          level: 1,
          classes: monsterData.type || 'Creature',
          race: monsterData.race || '',
          currentHp: associatedToken.currentHp,
          maxHp: associatedToken.maxHp,
          tempHp: associatedToken.tempHp || 0,
          speed: associatedToken.speed || 30,
          armorClass: monsterData.armor_class ?? 10,
          passivePerception: 10,
          initiativeBonus: associatedToken.initiativeBonus ?? 0,
          stats: {
            str: monsterData.strength ?? monsterData.str ?? 10,
            dex: monsterData.dexterity ?? monsterData.dex ?? 10,
            con: monsterData.constitution ?? monsterData.con ?? 10,
            int: monsterData.intelligence ?? monsterData.int ?? 10,
            wis: monsterData.wisdom ?? monsterData.wis ?? 10,
            cha: monsterData.charisma ?? monsterData.cha ?? 10,
          },
          spells: [],
          actions: mActions.length > 0 ? mActions : undefined,
        };
      }
      return {
        id: associatedToken.id,
        name: associatedToken.name,
        level: 1,
        classes: 'Token',
        race: '',
        currentHp: associatedToken.currentHp,
        maxHp: associatedToken.maxHp,
        tempHp: associatedToken.tempHp || 0,
        speed: associatedToken.speed || 30,
        armorClass: 10,
        passivePerception: 10,
        initiativeBonus: associatedToken.initiativeBonus ?? 0,
        stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        spells: [],
      };
    }
    return character;
  };

  const effectiveCharacter = resolveEffectiveCharacter();
  const effectiveSenderName = associatedToken ? `${player.name} (${associatedToken.name})` : player.name;

  // Helper to send client-only ephemeral messages for caller
  const sendPrivateSystemMessage = (msgText: string, title = 'VTT Guide', color = '#6366f1') => {
    onSendMessage({
      id: crypto.randomUUID(),
      senderId: 'system',
      senderName: title,
      senderColor: color,
      text: msgText,
      timestamp: Date.now(),
      isCommand: true,
      isEphemeral: true,
      recipientId: player.id,
    });
  };

  // 1. /help
  if (cmd === 'help') {
    sendPrivateSystemMessage(
      `Available commands:\n• /roll [count]d[sides][+/-mod] [adv|dis] - Roll any dice (e.g. /roll 1d20+5 adv)\n• /token [name or index or clear] - Associate a controllable token with your chat for /attack and rolls\n• /as [name or index] - Alias for /token\n• /timer <duration> - Start round timer HUD (e.g. /timer 10 min, /timer 30s)\n• /clock - Open segmented pie-wedge progress clocks\n• /attack [weapon or index] [adv|dis] - Roll to-hit & damage from sheet\n• /attack? [name or index] - Inspect attack statblock card without rolling\n• /skill [skill or index] [adv|dis] - Roll a character skill check\n• /spell [spell or index] [adv|dis] - Roll a spell attack from sheet\n• /spell? [name or index] - Inspect spell reference card (e.g. /spell? magic-missile)\n• /item [item or index] - Use item from inventory\n• /item? [name or index] - Inspect item reference card (e.g. /item? potion of healing)\n• /ability? [name] - Inspect class ability or trait\n• /monster? [name] - Inspect creature statblock (e.g. /monster? goblin)\n• /import [category] <url> - Import spell, item, or monster reference card from URL\n• /sync [url or id] [token index] - Sync character sheet and token with D&D Beyond\n• /tokens - List all tokens and their index number available to sync\n• /discord webhook <url> - Configure Discord one-way sync (GM only)\n• /discord webhook none - Disable Discord sync (GM only)`
    );
    return true;
  }

  // 1a. /timer
  if (cmd === 'timer') {
    const durationStr = args.join(' ').trim();
    if (!durationStr) {
      sendPrivateSystemMessage(
        'Usage: `/timer <duration>`\nExamples:\n• `/timer 10 min`\n• `/timer 30s`\n• `/timer 2.5m`\n• `/timer 1m 30s`',
        'Round Timer',
        '#6366f1'
      );
      return true;
    }

    const seconds = parseTimerDuration(durationStr);
    if (!seconds) {
      sendPrivateSystemMessage(
        `⚠️ Invalid timer duration "${durationStr}". Examples: \`/timer 5m\`, \`/timer 30s\`, \`/timer 2.5m\`.`,
        'Round Timer',
        '#f43f5e'
      );
      return true;
    }

    context.onStartTimer?.(seconds, `Timer (${durationStr})`);
    sendPrivateSystemMessage(
      `⏱️ Round timer started for **${formatTimer(seconds)}** (${durationStr}).`,
      'Round Timer',
      '#10b981'
    );
    return true;
  }

  // 1b. /clock or /clocks
  if (cmd === 'clock' || cmd === 'clocks') {
    context.onOpenClocks?.();
    sendPrivateSystemMessage(
      '🕒 Opened Progress Clocks manager.',
      'Progress Clocks',
      '#8b5cf6'
    );
    return true;
  }

  // 1c. /discord
  if (cmd === 'discord') {
    if (player.role !== 'gm') {
      sendPrivateSystemMessage(
        '⚠️ Only the Game Master (GM) can configure Discord webhook settings.',
        'Discord Sync',
        '#f43f5e'
      );
      return true;
    }

    const sub = args[0]?.toLowerCase();
    if (sub === 'webhook') {
      const urlArg = args[1]?.trim();
      if (!urlArg) {
        sendPrivateSystemMessage(
          'Usage: `/discord webhook <webhook_url>` or `/discord webhook none` to disable.',
          'Discord Sync',
          '#f59e0b'
        );
        return true;
      }

      if (urlArg.toLowerCase() === 'none') {
        context.onConfigureDiscordWebhook?.(undefined);
        sendPrivateSystemMessage(
          '✅ Discord webhook sync has been disabled.',
          'Discord Sync',
          '#10b981'
        );
        return true;
      }

      if (!urlArg.startsWith('http://') && !urlArg.startsWith('https://')) {
        sendPrivateSystemMessage(
          '⚠️ Invalid webhook URL. URL must start with https://discord.com/api/webhooks/...',
          'Discord Sync',
          '#f43f5e'
        );
        return true;
      }

      context.onConfigureDiscordWebhook?.(urlArg);
      sendPrivateSystemMessage(
        `✅ Discord webhook configured successfully! Chat messages and dice rolls will now sync to Discord.\n• Target: \`${urlArg.slice(0, 45)}...\``,
        'Discord Sync',
        '#10b981'
      );
      return true;
    }

    // Default or no params: show instructions
    sendPrivateSystemMessage(
      `**Discord Integration Commands (GM Only):**\n• \`/discord webhook <webhook_url>\` - Configure one-way sync to a Discord text channel\n• \`/discord webhook none\` - Disable Discord webhook sync\n\nWhen enabled, all public chat messages and dice rolls will automatically post to your Discord channel.`,
      'Discord Sync',
      '#5865F2'
    );
    return true;
  }

      // 2. /roll [expr] [adv|dis]
      if (cmd === 'roll') {
        let expr = args[0] || '1d20';
        if (expr.toLowerCase() === 'init' || expr.toLowerCase() === 'initiative') {
          const bonus = effectiveCharacter?.initiativeBonus ?? associatedToken?.initiativeBonus ?? 0;
          expr = `1d20${bonus >= 0 ? `+${bonus}` : bonus}`;
        }
        const advArg = args[1]?.toLowerCase();
        const advMode = advArg === 'adv' || advArg === 'advantage' ? 'advantage' : advArg === 'dis' || advArg === 'disadvantage' ? 'disadvantage' : 'normal';

        // Advanced dice expression: e.g. 40(d6+3), 10(d6+2 >= 5) (OB-133, OB-171)
        if (isAdvancedDiceExpression(expr)) {
          const advResult = parseAndRollAdvanced(expr);
          if (!advResult) {
            sendPrivateSystemMessage(
              `Invalid advanced roll syntax: "${expr}". Examples:\n• \`/roll 40(d6+3)\`\n• \`/roll 10(d6+2 >= 5)\``,
              'System',
              '#f43f5e'
            );
            return true;
          }

          const detailsPreview = formatRollDetails(advResult);
          const rollResult: DiceRollResult = {
            id: crypto.randomUUID(),
            userId: player.id,
            userName: effectiveSenderName,
            userColor: player.color,
            diceType: 'd6',
            count: advResult.count,
            modifier: advResult.modifier,
            rolls: advResult.details.map((d) => d.rawTotal),
            total: advResult.totalModified,
            timestamp: Date.now(),
          };

          onBroadcastRoll?.(rollResult);
          onSendMessage({
            id: crypto.randomUUID(),
            senderId: player.id,
            senderName: effectiveSenderName,
            senderColor: player.color,
            text: `rolled **${expr}**\n${advResult.summaryText}\n${detailsPreview}`,
            timestamp: Date.now(),
            roll: rollResult,
            tokenId: associatedToken?.id,
            tokenName: associatedToken?.name,
            tokenImageUrl: associatedToken?.imageUrl,
          });
          return true;
        }

        const parsed = parseDiceExpression(expr, advMode);
        if (!parsed) {
          sendPrivateSystemMessage(
            `Invalid roll syntax: "${expr}". Use /roll 1d20+4 or /roll 2d6+2 adv`,
            'System',
            '#f43f5e'
          );
          return true;
        }

        const rollResult: DiceRollResult = {
          id: crypto.randomUUID(),
          userId: player.id,
          userName: effectiveSenderName,
          userColor: player.color,
          diceType: parsed.diceType,
          count: parsed.count,
          modifier: parsed.modifier,
          rolls: parsed.rolls,
          total: parsed.total,
          advantageMode: advMode,
          keptRoll: parsed.keptRoll,
          timestamp: Date.now(),
        };

        onBroadcastRoll?.(rollResult);
        onSendMessage({
          id: crypto.randomUUID(),
          senderId: player.id,
          senderName: effectiveSenderName,
          senderColor: player.color,
          text: `rolled ${expr}${advMode !== 'normal' ? ` (${advMode})` : ''} = ${parsed.total} [${parsed.rolls.join(', ')}]`,
          timestamp: Date.now(),
          roll: rollResult,
          tokenId: associatedToken?.id,
          tokenName: associatedToken?.name,
          tokenImageUrl: associatedToken?.imageUrl,
        });
        return true;
      }

      // 3a. /attack? [name or index] - Inspection mode (OB-180, OB-181)
      if (cmd === 'attack?' || (cmd === 'attack' && args[0] === '?')) {
        const queryArgs = cmd === 'attack?' ? args : args.slice(1);
        const attackQuery = queryArgs.join(' ').trim();

        const availableAttacks: DnDAction[] = (effectiveCharacter?.actions && effectiveCharacter.actions.length > 0)
          ? effectiveCharacter.actions
          : [
              { name: 'Melee Attack', type: 'melee', toHitModifier: 5, damageDice: '1d8+3' },
              { name: 'Ranged Attack', type: 'ranged', toHitModifier: 5, damageDice: '1d6+3' },
              { name: 'Unarmed Strike', type: 'melee', toHitModifier: 5, damageDice: '4' },
            ];

        if (!attackQuery) {
          const listText = availableAttacks
            .map((a, idx) => {
              const cat = getActivationCategory(a);
              const badge = cat === 'bonus' ? ' [Bonus Action]' : cat === 'reaction' ? ' [Reaction]' : '';
              return `${idx + 1}. ${a.name}${badge}${a.reach ? ` (${a.reach})` : a.range ? ` (${a.range})` : ''}`;
            })
            .join('\n');
          sendPrivateSystemMessage(
            `No attack specified. Available attacks${effectiveCharacter ? ` for ${effectiveCharacter.name}` : ''}:\n${listText}\n\nUsage: /attack? [name or index]`
          );
          return true;
        }

        let found: DnDAction | undefined;
        const numIdx = parseInt(attackQuery, 10);
        if (!isNaN(numIdx) && String(numIdx) === attackQuery && numIdx >= 1 && numIdx <= availableAttacks.length) {
          found = availableAttacks[numIdx - 1];
        } else {
          found = availableAttacks.find((a) =>
            a.name.toLowerCase().includes(attackQuery.toLowerCase())
          );
        }

        if (!found) {
          sendPrivateSystemMessage(
            `Could not find attack matching "${attackQuery}".`,
            'System',
            '#f43f5e'
          );
          return true;
        }

        const statBlock = convertDnDActionToEntityAction(found, '5e');
        onSendMessage({
          id: crypto.randomUUID(),
          senderId: player.id,
          senderName: effectiveSenderName,
          senderColor: player.color,
          text: `inspects attack: **${found.name}**`,
          timestamp: Date.now(),
          statBlock,
          tokenId: associatedToken?.id,
          tokenName: associatedToken?.name,
          tokenImageUrl: associatedToken?.imageUrl,
        });
        return true;
      }

      // 3. /attack [name] [adv|dis]
      if (cmd === 'attack') {
        const lastArg = args[args.length - 1]?.toLowerCase();
        let advMode: 'normal' | 'advantage' | 'disadvantage' = 'normal';
        let attackQuery = args.join(' ').trim();

        if (lastArg === 'adv' || lastArg === 'advantage') {
          advMode = 'advantage';
          attackQuery = args.slice(0, -1).join(' ').trim();
        } else if (lastArg === 'dis' || lastArg === 'disadvantage') {
          advMode = 'disadvantage';
          attackQuery = args.slice(0, -1).join(' ').trim();
        }

        const availableAttacks: DnDAction[] = (effectiveCharacter?.actions && effectiveCharacter.actions.length > 0)
          ? effectiveCharacter.actions
          : [
              { name: 'Melee Attack', type: 'melee', toHitModifier: 5, damageDice: '1d8+3' },
              { name: 'Ranged Attack', type: 'ranged', toHitModifier: 5, damageDice: '1d6+3' },
              { name: 'Unarmed Strike', type: 'melee', toHitModifier: 5, damageDice: '4' },
            ];

        // Bug #54 & #71: No name provided -> list options, do not roll
        if (!attackQuery) {
          const listText = availableAttacks
            .map((a, idx) => {
              const cat = getActivationCategory(a);
              const badge = cat === 'bonus' ? ' [Bonus Action]' : cat === 'reaction' ? ' [Reaction]' : '';
              return `${idx + 1}. ${a.name}${badge}${a.reach ? ` (${a.reach})` : a.range ? ` (${a.range})` : ''} [${a.toHitModifier !== undefined ? (a.toHitModifier >= 0 ? `+${a.toHitModifier}` : a.toHitModifier) + ' to hit' : ''}${a.damage ? `, ${a.damage}` : a.damageDice ? `, ${a.damageDice}` : ''}]`;
            })
            .join('\n');
          sendPrivateSystemMessage(
            `No attack specified. Available attacks${effectiveCharacter ? ` for ${effectiveCharacter.name}` : ''}:\n${listText}\n\nUsage: /attack [name or index] [adv|dis]`
          );
          return true;
        }

        // Search matching attack by 1-based index or name
        let found: DnDAction | undefined;
        const numIdx = parseInt(attackQuery, 10);
        if (!isNaN(numIdx) && String(numIdx) === attackQuery && numIdx >= 1 && numIdx <= availableAttacks.length) {
          found = availableAttacks[numIdx - 1];
        } else {
          found = availableAttacks.find((a) =>
            a.name.toLowerCase().includes(attackQuery.toLowerCase())
          );
        }

        if (!found) {
          const listText = availableAttacks
            .map((a, idx) => {
              const cat = getActivationCategory(a);
              const badge = cat === 'bonus' ? ' [Bonus Action]' : cat === 'reaction' ? ' [Reaction]' : '';
              return `${idx + 1}. ${a.name}${badge}`;
            })
            .join('\n');
          sendPrivateSystemMessage(
            `Could not find attack matching "${attackQuery}". Available options:\n${listText}`,
            'System',
            '#f43f5e'
          );
          return true;
        }

        // Roll to hit (d20 + toHitModifier)
        const toHitMod = found.toHitModifier ?? 5;
        const hitRoll = parseDiceExpression('1d20', advMode)!;
        const hitTotal = (hitRoll.keptRoll ?? hitRoll.rolls[0]) + toHitMod;

        // Roll damage
        const dmgExpr = found.damageDice || '1d8+3';
        const dmgParsed = parseDiceExpression(dmgExpr) || { total: 5, rolls: [5] };

        const rollResult: DiceRollResult = {
          id: crypto.randomUUID(),
          userId: player.id,
          userName: effectiveSenderName,
          userColor: player.color,
          diceType: 'd20',
          count: 1,
          modifier: toHitMod,
          rolls: hitRoll.rolls,
          total: hitTotal,
          advantageMode: advMode,
          keptRoll: hitRoll.keptRoll,
          timestamp: Date.now(),
        };

        const attackCat = getActivationCategory(found);
        const attackTag = attackCat === 'bonus' ? ' (Bonus Action)' : attackCat === 'reaction' ? ' (Reaction)' : '';

        onBroadcastRoll?.(rollResult);
        onSendMessage({
          id: crypto.randomUUID(),
          senderId: player.id,
          senderName: effectiveSenderName,
          senderColor: player.color,
          text: `attacks with ${found.name}${attackTag}! To Hit: ${hitTotal} (${hitRoll.rolls.join('/')}${toHitMod >= 0 ? `+${toHitMod}` : toHitMod}) | Damage: ${dmgParsed.total} [${dmgExpr}]`,
          timestamp: Date.now(),
          roll: rollResult,
          tokenId: associatedToken?.id,
          tokenName: associatedToken?.name,
          tokenImageUrl: associatedToken?.imageUrl,
        });
        return true;
      }

      // 4a. /spell? [name or index] - Inspection mode (OB-180, OB-181, OB-141)
      if (cmd === 'spell?' || (cmd === 'spell' && args[0] === '?')) {
        const queryArgs = cmd === 'spell?' ? args : args.slice(1);
        const spellQuery = queryArgs.join(' ').trim();
        const availableSpells = effectiveCharacter?.spells || [];

        if (!spellQuery) {
          if (availableSpells.length === 0) {
            sendPrivateSystemMessage(
              'Usage: `/spell? <name>`\nInspects a spell from your sheet or reference database (e.g. `/spell? magic-missile`, `/spell? fireball`).',
              'Spell Inspection'
            );
            return true;
          }
          const listText = availableSpells
            .map((s, idx) => `${idx + 1}. ${s.name} (${s.level === 0 ? 'Cantrip' : `Level ${s.level}`})`)
            .join('\n');
          sendPrivateSystemMessage(
            `No spell specified. Spells for ${effectiveCharacter?.name || 'character'}:\n${listText}\n\nUsage: /spell? [name or index]`
          );
          return true;
        }

        // 1. Check character sheet
        let found: DnDSpell | undefined;
        const numIdx = parseInt(spellQuery, 10);
        if (!isNaN(numIdx) && String(numIdx) === spellQuery && numIdx >= 1 && numIdx <= availableSpells.length) {
          found = availableSpells[numIdx - 1];
        } else {
          found = availableSpells.find((s) =>
            s.name.toLowerCase().includes(spellQuery.toLowerCase())
          );
        }

        if (found) {
          const statBlock = convertDnDSpellToEntityAction(found, '5e');
          onSendMessage({
            id: crypto.randomUUID(),
            senderId: player.id,
            senderName: effectiveSenderName,
            senderColor: player.color,
            text: `inspects spell: **${found.name}**`,
            timestamp: Date.now(),
            statBlock,
            tokenId: associatedToken?.id,
            tokenName: associatedToken?.name,
            tokenImageUrl: associatedToken?.imageUrl,
          });
          return true;
        }

        // 2. Fetch from Open5e reference, with PF2e fallback
        fetchOpen5eSpell(spellQuery).then(async (open5eBlock) => {
          if (open5eBlock) {
            onSendMessage({
              id: crypto.randomUUID(),
              senderId: player.id,
              senderName: effectiveSenderName,
              senderColor: player.color,
              text: `inspects spell: **${open5eBlock.name}**`,
              timestamp: Date.now(),
              statBlock: open5eBlock,
              tokenId: associatedToken?.id,
              tokenName: associatedToken?.name,
              tokenImageUrl: associatedToken?.imageUrl,
            });
            return;
          }

          // Fallback to PF2e reference
          const pf2eBlock = await fetchPF2eReference('spell', spellQuery);
          if (pf2eBlock) {
            onSendMessage({
              id: crypto.randomUUID(),
              senderId: player.id,
              senderName: effectiveSenderName,
              senderColor: player.color,
              text: `inspects PF2e spell: **${pf2eBlock.name}**`,
              timestamp: Date.now(),
              statBlock: pf2eBlock,
              tokenId: associatedToken?.id,
              tokenName: associatedToken?.name,
              tokenImageUrl: associatedToken?.imageUrl,
            });
            return;
          }

          sendPrivateSystemMessage(
            `Could not find spell matching "${spellQuery}" on sheet, Open5e, or PF2e database.`,
            'System',
            '#f43f5e'
          );
        });
        return true;
      }

      // 4. /spell [name] [adv|dis]
      if (cmd === 'spell') {
        const lastArg = args[args.length - 1]?.toLowerCase();
        let advMode: 'normal' | 'advantage' | 'disadvantage' = 'normal';
        let spellQuery = args.join(' ').trim();

        if (lastArg === 'adv' || lastArg === 'advantage') {
          advMode = 'advantage';
          spellQuery = args.slice(0, -1).join(' ').trim();
        } else if (lastArg === 'dis' || lastArg === 'disadvantage') {
          advMode = 'disadvantage';
          spellQuery = args.slice(0, -1).join(' ').trim();
        }

        const availableSpells = effectiveCharacter?.spells || [];

        // Bug #54 & #71: No spell name provided -> list options, do not roll
        if (!spellQuery) {
          if (availableSpells.length === 0) {
            sendPrivateSystemMessage(
              effectiveCharacter
                ? `No spells found on ${effectiveCharacter.name}'s sheet.`
                : 'Please link a character sheet with spells first.',
              'System',
              '#f43f5e'
            );
            return true;
          }
          const listText = availableSpells
            .map((s, idx) => {
              const cat = getActivationCategory(s);
              const badge = cat === 'bonus' ? ' [Bonus Action]' : cat === 'reaction' ? ' [Reaction]' : '';
              return `${idx + 1}. ${s.name}${badge} (${s.level === 0 ? 'Cantrip' : `Level ${s.level}`}${s.school ? `, ${s.school}` : ''}${s.castingTime ? ` • ${s.castingTime}` : ''})`;
            })
            .join('\n');
          sendPrivateSystemMessage(
            `No spell specified. Available spells for ${effectiveCharacter?.name || 'character'}:\n${listText}\n\nUsage: /spell [name or index] [adv|dis]`
          );
          return true;
        }

        // Search matching spell by 1-based index or name
        let found: DnDSpell | undefined;
        const numIdx = parseInt(spellQuery, 10);
        if (!isNaN(numIdx) && String(numIdx) === spellQuery && numIdx >= 1 && numIdx <= availableSpells.length) {
          found = availableSpells[numIdx - 1];
        } else {
          found = availableSpells.find((s) =>
            s.name.toLowerCase().includes(spellQuery.toLowerCase())
          );
        }

        if (!found) {
          const listText = availableSpells.length > 0
            ? availableSpells
                .map((s, idx) => {
                  const cat = getActivationCategory(s);
                  const badge = cat === 'bonus' ? ' [Bonus Action]' : cat === 'reaction' ? ' [Reaction]' : '';
                  return `${idx + 1}. ${s.name}${badge}`;
                })
                .join('\n')
            : '(No spells available)';
          sendPrivateSystemMessage(
            `Could not find spell matching "${spellQuery}". Available options:\n${listText}`,
            'System',
            '#f43f5e'
          );
          return true;
        }

        const intMod = Math.floor(((effectiveCharacter?.stats?.int ?? 10) - 10) / 2);
        const prof = effectiveCharacter?.proficiencyBonus ?? 2;
        const spellToHitMod = intMod + prof;

        const hitRoll = parseDiceExpression('1d20', advMode)!;
        const hitTotal = (hitRoll.keptRoll ?? hitRoll.rolls[0]) + spellToHitMod;
        const dmgExpr = `${found.level > 0 ? found.level : 1}d10`;
        const dmgParsed = parseDiceExpression(dmgExpr) || { total: 5, rolls: [5] };

        const rollResult: DiceRollResult = {
          id: crypto.randomUUID(),
          userId: player.id,
          userName: effectiveSenderName,
          userColor: player.color,
          diceType: 'd20',
          count: 1,
          modifier: spellToHitMod,
          rolls: hitRoll.rolls,
          total: hitTotal,
          advantageMode: advMode,
          keptRoll: hitRoll.keptRoll,
          timestamp: Date.now(),
        };

        const spellCat = getActivationCategory(found);
        const spellTag = spellCat === 'bonus' ? ' (Bonus Action)' : spellCat === 'reaction' ? ' (Reaction)' : '';

        onBroadcastRoll?.(rollResult);
        onSendMessage({
          id: crypto.randomUUID(),
          senderId: player.id,
          senderName: effectiveSenderName,
          senderColor: player.color,
          text: `casts ${found.name}${spellTag}! Attack: ${hitTotal} (${hitRoll.rolls.join('/')}${spellToHitMod >= 0 ? `+${spellToHitMod}` : spellToHitMod}) | Effect/Damage: ${dmgParsed.total} [${dmgExpr}]`,
          timestamp: Date.now(),
          roll: rollResult,
          tokenId: associatedToken?.id,
          tokenName: associatedToken?.name,
          tokenImageUrl: associatedToken?.imageUrl,
        });
        return true;
      }

      // 5. /skill [name] [adv|dis]
      if (cmd === 'skill') {
        const lastArg = args[args.length - 1]?.toLowerCase();
        let advMode: 'normal' | 'advantage' | 'disadvantage' = 'normal';
        let skillQuery = args.join(' ').trim();

        if (lastArg === 'adv' || lastArg === 'advantage') {
          advMode = 'advantage';
          skillQuery = args.slice(0, -1).join(' ').trim();
        } else if (lastArg === 'dis' || lastArg === 'disadvantage') {
          advMode = 'disadvantage';
          skillQuery = args.slice(0, -1).join(' ').trim();
        }

        const ALL_SKILLS = [
          'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics',
          'Deception', 'History', 'Insight', 'Intimidation',
          'Investigation', 'Medicine', 'Nature', 'Perception',
          'Performance', 'Persuasion', 'Religion', 'Sleight of Hand',
          'Stealth', 'Survival'
        ];

        const skillsList = effectiveCharacter?.skills && effectiveCharacter.skills.length > 0
          ? effectiveCharacter.skills
          : ALL_SKILLS.map((s) => ({ name: s, modifier: 0, proficiency: 'none' as const }));

        // Bug #54 & #91: No skill specified -> list options with 1-based index, do not roll
        if (!skillQuery) {
          const listText = skillsList
            .map((s, idx) => `${idx + 1}. ${s.name} (${s.modifier >= 0 ? `+${s.modifier}` : s.modifier}${s.proficiency !== 'none' ? ' • Proficient' : ''})`)
            .join('\n');
          sendPrivateSystemMessage(
            `No skill specified. Available skills${effectiveCharacter ? ` for ${effectiveCharacter.name}` : ''}:\n${listText}\n\nUsage: /skill [skill or index] [adv|dis]`
          );
          return true;
        }

        // Search matching skill by 1-based index or name
        let foundSkill: { name: string; modifier: number; proficiency: string } | undefined;
        const numIdx = parseInt(skillQuery, 10);
        if (!isNaN(numIdx) && String(numIdx) === skillQuery && numIdx >= 1 && numIdx <= skillsList.length) {
          foundSkill = skillsList[numIdx - 1];
        } else {
          foundSkill = skillsList.find((s) =>
            s.name.toLowerCase().includes(skillQuery.toLowerCase())
          );
        }

        if (!foundSkill) {
          const listText = skillsList.map((s, idx) => `${idx + 1}. ${s.name}`).join('\n');
          sendPrivateSystemMessage(
            `Could not find skill matching "${skillQuery}". Available skills:\n${listText}`,
            'System',
            '#f43f5e'
          );
          return true;
        }

        const skillName = foundSkill.name;
        const skillMod = foundSkill.modifier;
        const d20 = parseDiceExpression('1d20', advMode)!;
        const total = (d20.keptRoll ?? d20.rolls[0]) + skillMod;

        const rollResult: DiceRollResult = {
          id: crypto.randomUUID(),
          userId: player.id,
          userName: effectiveSenderName,
          userColor: player.color,
          diceType: 'd20',
          count: 1,
          modifier: skillMod,
          rolls: d20.rolls,
          total,
          advantageMode: advMode,
          keptRoll: d20.keptRoll,
          timestamp: Date.now(),
        };

        onBroadcastRoll?.(rollResult);
        onSendMessage({
          id: crypto.randomUUID(),
          senderId: player.id,
          senderName: effectiveSenderName,
          senderColor: player.color,
          text: `checks ${skillName}! Result: ${total} (${d20.rolls.join('/')}${skillMod >= 0 ? `+${skillMod}` : skillMod})${advMode !== 'normal' ? ` (${advMode})` : ''}`,
          timestamp: Date.now(),
          roll: rollResult,
          tokenId: associatedToken?.id,
          tokenName: associatedToken?.name,
          tokenImageUrl: associatedToken?.imageUrl,
        });
        return true;
      }

      // 5.4 /item? [name or index] - Inspection mode (OB-180, OB-181, OB-141)
      if (cmd === 'item?' || (cmd === 'item' && args[0] === '?')) {
        const queryArgs = cmd === 'item?' ? args : args.slice(1);
        const itemQuery = queryArgs.join(' ').trim();
        const availableItems = effectiveCharacter?.items || [];

        if (!itemQuery) {
          if (availableItems.length === 0) {
            sendPrivateSystemMessage(
              'Usage: `/item? <name>`\nInspects an item from your inventory or reference database (e.g. `/item? potion of healing`, `/item? bag of holding`).',
              'Item Inspection'
            );
            return true;
          }
          const listText = availableItems
            .map((it, idx) => `${idx + 1}. ${it.name}${it.quantity ? ` (x${it.quantity})` : ''}`)
            .join('\n');
          sendPrivateSystemMessage(
            `No item specified. Items for ${effectiveCharacter?.name || 'character'}:\n${listText}\n\nUsage: /item? [name or index]`
          );
          return true;
        }

        // 1. Check character inventory
        let found: typeof availableItems[0] | undefined;
        const numIdx = parseInt(itemQuery, 10);
        if (!isNaN(numIdx) && String(numIdx) === itemQuery && numIdx >= 1 && numIdx <= availableItems.length) {
          found = availableItems[numIdx - 1];
        } else {
          found = availableItems.find((it) =>
            it.name.toLowerCase().includes(itemQuery.toLowerCase())
          );
        }

        if (found) {
          const statBlock = convertDnDItemToEntityAction(found, '5e');
          onSendMessage({
            id: crypto.randomUUID(),
            senderId: player.id,
            senderName: effectiveSenderName,
            senderColor: player.color,
            text: `inspects item: **${found.name}**`,
            timestamp: Date.now(),
            statBlock,
            tokenId: associatedToken?.id,
            tokenName: associatedToken?.name,
            tokenImageUrl: associatedToken?.imageUrl,
          });
          return true;
        }

        // 2. Fetch from Open5e reference, with PF2e fallback
        fetchOpen5eItem(itemQuery).then(async (open5eBlock) => {
          if (open5eBlock) {
            onSendMessage({
              id: crypto.randomUUID(),
              senderId: player.id,
              senderName: effectiveSenderName,
              senderColor: player.color,
              text: `inspects item: **${open5eBlock.name}**`,
              timestamp: Date.now(),
              statBlock: open5eBlock,
              tokenId: associatedToken?.id,
              tokenName: associatedToken?.name,
              tokenImageUrl: associatedToken?.imageUrl,
            });
            return;
          }

          // Fallback to PF2e reference
          const pf2eBlock = await fetchPF2eReference('item', itemQuery);
          if (pf2eBlock) {
            onSendMessage({
              id: crypto.randomUUID(),
              senderId: player.id,
              senderName: effectiveSenderName,
              senderColor: player.color,
              text: `inspects PF2e item: **${pf2eBlock.name}**`,
              timestamp: Date.now(),
              statBlock: pf2eBlock,
              tokenId: associatedToken?.id,
              tokenName: associatedToken?.name,
              tokenImageUrl: associatedToken?.imageUrl,
            });
            return;
          }

          sendPrivateSystemMessage(
            `Could not find item matching "${itemQuery}" in inventory, Open5e, or PF2e database.`,
            'System',
            '#f43f5e'
          );
        });
        return true;
      }

      // 5.5 /item [name or index]
      if (cmd === 'item') {
        const itemQuery = args.join(' ').trim();
        const availableItems: Array<{ id?: string; name: string; description?: string; quantity?: number }> =
          (effectiveCharacter?.items && effectiveCharacter.items.length > 0)
            ? effectiveCharacter.items
            : [
                { name: 'Potion of Healing', description: 'Regains 2d4 + 2 hit points when consumed.', quantity: 2 },
                { name: 'Rope (hempen, 50 feet)', description: '50 feet of hempen rope, burst DC 17.', quantity: 1 },
                { name: 'Torch', description: 'Burns for 1 hour, shedding bright light in 20ft radius.', quantity: 5 },
                { name: 'Rations (1 day)', description: 'Consists of dry foods suitable for travel.', quantity: 10 },
              ];

        // Bare command -> list options with 1-based index
        if (!itemQuery) {
          const listText = availableItems
            .map((it, idx) => `${idx + 1}. ${it.name}${it.quantity ? ` (x${it.quantity})` : ''}${it.description ? ` - ${it.description}` : ''}`)
            .join('\n');
          sendPrivateSystemMessage(
            `No item specified. Available items${effectiveCharacter ? ` for ${effectiveCharacter.name}` : ''}:\n${listText}\n\nUsage: /item [name or index]`
          );
          return true;
        }

        // Search matching item by 1-based index or name
        let found: typeof availableItems[0] | undefined;
        const numIdx = parseInt(itemQuery, 10);
        if (!isNaN(numIdx) && String(numIdx) === itemQuery && numIdx >= 1 && numIdx <= availableItems.length) {
          found = availableItems[numIdx - 1];
        } else {
          found = availableItems.find((it) => it.name.toLowerCase().includes(itemQuery.toLowerCase()));
        }

        if (found) {
          onSendMessage({
            id: crypto.randomUUID(),
            senderId: player.id,
            senderName: effectiveSenderName,
            senderColor: player.color,
            text: `uses/inspects item: ${found.name}${found.quantity ? ` (x${found.quantity})` : ''}${found.description ? `\n"${found.description}"` : ''}`,
            timestamp: Date.now(),
            tokenId: associatedToken?.id,
            tokenName: associatedToken?.name,
            tokenImageUrl: associatedToken?.imageUrl,
          });
          return true;
        }

        // OB-141: If not in local character sheet, attempt Open5e item fetch
        fetchOpen5eItem(itemQuery).then((open5eItem) => {
          if (open5eItem) {
            onSendMessage({
              id: crypto.randomUUID(),
              senderId: player.id,
              senderName: effectiveSenderName,
              senderColor: player.color,
              text: `inspects item: **${open5eItem.name}**`,
              timestamp: Date.now(),
              statBlock: open5eItem,
              tokenId: associatedToken?.id,
              tokenName: associatedToken?.name,
              tokenImageUrl: associatedToken?.imageUrl,
            });
          } else {
            const listText = availableItems.map((it, idx) => `${idx + 1}. ${it.name}`).join('\n');
            sendPrivateSystemMessage(
              `Could not find item matching "${itemQuery}". Available options:\n${listText}`,
              'System',
              '#f43f5e'
            );
          }
        });
        return true;
      }

      // 5.6 /ability? [name] - Inspection mode (OB-180, OB-181)
      if (cmd === 'ability?' || (cmd === 'ability' && args[0] === '?')) {
        const queryArgs = cmd === 'ability?' ? args : args.slice(1);
        const abilityQuery = queryArgs.join(' ').trim();
        const availableActions = effectiveCharacter?.actions || [];

        if (!abilityQuery) {
          const listText = availableActions
            .map((a, idx) => `${idx + 1}. ${a.name}`)
            .join('\n');
          sendPrivateSystemMessage(
            `No ability specified. Available abilities:\n${listText || '(None)'}\n\nUsage: /ability? [name or index]`
          );
          return true;
        }

        let found = availableActions.find((a) =>
          a.name.toLowerCase().includes(abilityQuery.toLowerCase())
        );
        if (!found) {
          sendPrivateSystemMessage(
            `Could not find ability matching "${abilityQuery}".`,
            'System',
            '#f43f5e'
          );
          return true;
        }

        const statBlock = convertDnDActionToEntityAction(found, '5e');
        statBlock.type = 'ability';
        onSendMessage({
          id: crypto.randomUUID(),
          senderId: player.id,
          senderName: effectiveSenderName,
          senderColor: player.color,
          text: `inspects ability: **${found.name}**`,
          timestamp: Date.now(),
          statBlock,
          tokenId: associatedToken?.id,
          tokenName: associatedToken?.name,
          tokenImageUrl: associatedToken?.imageUrl,
        });
        return true;
      }

      // 5.7 /monster? [name] - Monster statblock inspection (OB-180, OB-181, OB-142)
      if (cmd === 'monster?' || cmd === 'monster' || (cmd === 'monster' && args[0] === '?')) {
        const queryArgs = (cmd === 'monster?' || cmd === 'monster') && args[0] !== '?' ? args : args.slice(1);
        const monsterQuery = queryArgs.join(' ').trim();

        if (!monsterQuery) {
          const sceneTokens = (context.tokens || []).filter(
            (t) => t.customProps?.character || (t as any).monsterData || t.character
          );
          const names = Array.from(new Set(sceneTokens.map((t) => t.name)));
          sendPrivateSystemMessage(
            `Usage: \`/monster? <name>\`\nExamples: \`/monster? goblin\`, \`/monster? ankheg\`${
              names.length > 0 ? `\n\nCreatures on current map:\n• ${names.join('\n• ')}` : ''
            }`,
            'Monster Inspection'
          );
          return true;
        }

        // 1. Check scene tokens
        const matchedToken = (context.tokens || []).find((t) =>
          t.name.toLowerCase().includes(monsterQuery.toLowerCase())
        );
        if (matchedToken) {
          const char = matchedToken.customProps?.character || matchedToken.character;
          if (char) {
            const statBlock = convertCharacterToMonsterStatBlock(char, '5e');
            statBlock.name = matchedToken.name;
            onSendMessage({
              id: crypto.randomUUID(),
              senderId: player.id,
              senderName: player.name,
              senderColor: player.color,
              text: `inspects creature: **${statBlock.name}**`,
              timestamp: Date.now(),
              statBlock,
            });
            return true;
          }
        }

        // 2. Query Open5e monsters, with PF2e fallback
        fetchOpen5eMonster(monsterQuery).then(async (open5eBlock) => {
          if (open5eBlock) {
            onSendMessage({
              id: crypto.randomUUID(),
              senderId: player.id,
              senderName: player.name,
              senderColor: player.color,
              text: `inspects monster: **${open5eBlock.name}**`,
              timestamp: Date.now(),
              statBlock: open5eBlock,
            });
            return;
          }

          const pf2eBlock = await fetchPF2eReference('monster', monsterQuery);
          if (pf2eBlock) {
            onSendMessage({
              id: crypto.randomUUID(),
              senderId: player.id,
              senderName: player.name,
              senderColor: player.color,
              text: `inspects PF2e creature: **${pf2eBlock.name}**`,
              timestamp: Date.now(),
              statBlock: pf2eBlock,
            });
            return;
          }

          sendPrivateSystemMessage(
            `Could not find monster matching "${monsterQuery}" on canvas, Open5e, or PF2e database.`,
            'System',
            '#f43f5e'
          );
        });
        return true;
      }

      // 6. /sync [urlOrId] [tokenIndex]
      if (cmd === 'sync') {
        let urlOrId = args[0];
        let tokenIndexArg = args[1];

        const knownCharId =
          context.player?.dndBeyondCharacterId ||
          context.player?.dndBeyondCharacter?.id ||
          (context.tokens && context.tokens[0]?.character?.id);

        if (!urlOrId && knownCharId) {
          urlOrId = /^\d+$/.test(knownCharId) ? `https://www.dndbeyond.com/characters/${knownCharId}` : knownCharId;
        }

        if (!urlOrId) {
          sendPrivateSystemMessage(
            `Usage: /sync <dndbeyond url or id> [token index]\nExample: /sync 47804290 or /sync https://www.dndbeyond.com/characters/47804290 1\nUse /tokens to view your available tokens.`,
            'D&D Beyond Sync'
          );
          return true;
        }

        const syncTokens = context.tokens || [];

        let targetToken: Token | undefined;
        let tokenIndexNum: number | undefined;

        if (syncTokens.length === 1) {
          targetToken = syncTokens[0];
          tokenIndexNum = 1;
        } else if (syncTokens.length > 1) {
          if (!tokenIndexArg) {
            sendPrivateSystemMessage(
              `You have ${syncTokens.length} tokens. Please specify the token index to sync:\n/sync ${urlOrId} <token index>\n\nUse /tokens to view your token list.`,
              'D&D Beyond Sync',
              '#f59e0b'
            );
            return true;
          }

          const parsedIdx = parseInt(tokenIndexArg, 10);
          if (isNaN(parsedIdx) || parsedIdx < 1 || parsedIdx > syncTokens.length) {
            sendPrivateSystemMessage(
              `Invalid token index "${tokenIndexArg}". Please choose an index between 1 and ${syncTokens.length}.\nUse /tokens to view your token list.`,
              'D&D Beyond Sync',
              '#f43f5e'
            );
            return true;
          }
          targetToken = syncTokens[parsedIdx - 1];
          tokenIndexNum = parsedIdx;
        }

        sendPrivateSystemMessage(
          `Fetching character data from D&D Beyond...`,
          'D&D Beyond Sync',
          '#3b82f6'
        );

        const fetchFn = context.fetchCharacterFn || (async (query: string) => {
          const idMatch = query.match(/characters\/(\d+)/) || query.match(/^(\d+)$/);
          const charId = idMatch ? idMatch[1] : query.trim();
          const res = await fetch(`/api/dndbeyond/${encodeURIComponent(charId)}`);
          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || `HTTP error ${res.status}`);
          }
          return res.json();
        });

        fetchFn(urlOrId)
          .then((char) => {
            context.onUpdatePlayerChar?.(char);

            if (targetToken) {
              const updates: Partial<Token> = {
                name: char.name,
                currentHp: char.currentHp,
                maxHp: char.maxHp,
                speed: char.speed,
                initiativeBonus: char.initiativeBonus,
                character: char,
              };
              if (char.avatarUrl) {
                updates.imageUrl = char.avatarUrl;
              }
              context.onSyncToken?.(targetToken.id, updates);

              sendPrivateSystemMessage(
                `Successfully synced "${char.name}" to token #${tokenIndexNum} (${targetToken.name}) and your player sheet!`,
                'D&D Beyond Sync',
                '#10b981'
              );
            } else {
              sendPrivateSystemMessage(
                `Successfully synced "${char.name}" to your character sheet! (No tokens on map to sync)`,
                'D&D Beyond Sync',
                '#10b981'
              );
            }
          })
          .catch((err: any) => {
            sendPrivateSystemMessage(
              `Failed to sync character: ${err.message || err}`,
              'D&D Beyond Sync',
              '#f43f5e'
            );
          });

        return true;
      }

      // 7. /tokens
      if (cmd === 'tokens') {
        const syncTokens = context.tokens || [];
        if (syncTokens.length === 0) {
          sendPrivateSystemMessage(
            `No controllable tokens found on the map to sync.`,
            'Tokens'
          );
          return true;
        }

        const lines = syncTokens.map((t, idx) => {
          const hpStr = t.maxHp ? ` [HP: ${t.currentHp ?? 0}/${t.maxHp}]` : '';
          const charStr = t.character ? ` (${t.character.classes || t.character.name})` : '';
          return `${idx + 1}. ${t.name}${charStr}${hpStr}`;
        });

        sendPrivateSystemMessage(
          `Controllable tokens available to sync:\n${lines.join('\n')}\n\nUse /sync <url or id> <index> to sync a character.`,
          'Tokens'
        );
        return true;
      }

      // 7b. /token [name or index or clear] (OB-182)
      if (cmd === 'token' || cmd === 'as') {
        const syncTokens = context.tokens || [];
        const query = args.join(' ').trim();

        if (!query || query === '?') {
          const currentName = associatedToken ? `**${associatedToken.name}**` : '*(None - Using Player Sheet)*';
          if (syncTokens.length === 0) {
            sendPrivateSystemMessage(
              `Active Chat Token: ${currentName}\nNo controllable tokens available on this map.`,
              'Token Association',
              '#6366f1'
            );
            return true;
          }

          const lines = syncTokens.map((t, idx) => {
            const isCurrent = associatedToken?.id === t.id ? ' ⭐️ (Active)' : '';
            const charStr = t.character ? ` (${t.character.classes || t.character.name})` : '';
            const hpStr = t.maxHp ? ` [HP: ${t.currentHp ?? 0}/${t.maxHp}]` : '';
            return `${idx + 1}. ${t.name}${charStr}${hpStr}${isCurrent}`;
          });

          sendPrivateSystemMessage(
            `Active Chat Token: ${currentName}\n\nControllable tokens:\n${lines.join('\n')}\n\nUsage:\n• \`/token <index or name>\` - Switch active token for chat & /attack\n• \`/token clear\` - Revert to player character sheet`,
            'Token Association',
            '#6366f1'
          );
          return true;
        }

        if (query === 'clear' || query === 'none' || query === 'reset') {
          onSetAssociatedToken?.(null);
          sendPrivateSystemMessage(
            `🔄 Cleared token association. Chat and commands like \`/attack\` now use your default character sheet (${character?.name || player.name}).`,
            'Token Association',
            '#10b981'
          );
          return true;
        }

        // Match by 1-based index or name
        let targetToken: Token | undefined;
        const numIdx = parseInt(query, 10);
        if (!isNaN(numIdx) && String(numIdx) === query && numIdx >= 1 && numIdx <= syncTokens.length) {
          targetToken = syncTokens[numIdx - 1];
        } else {
          targetToken = syncTokens.find((t) => t.name.toLowerCase().includes(query.toLowerCase()));
        }

        if (!targetToken) {
          sendPrivateSystemMessage(
            `⚠️ Could not find controllable token matching "${query}". Use \`/tokens\` or \`/token\` to list available tokens.`,
            'Token Association',
            '#f43f5e'
          );
          return true;
        }

        onSetAssociatedToken?.(targetToken);
        sendPrivateSystemMessage(
          `🎭 Associated chat with token **${targetToken.name}**! Commands like \`/attack\`, \`/spell\`, and \`/roll\` will now roll on behalf of ${targetToken.name}.`,
          'Token Association',
          '#10b981'
        );
        return true;
      }

      // 8. /import [category] <url> (OB-177, OB-153)
      if (cmd === 'import') {
        const firstArg = args[0]?.toLowerCase();
        const validCategories = ['pf2e', 'spell', 'item', 'monster', 'dndbeyond'];
        let category: string | null = null;
        let targetUrl = '';

        if (validCategories.includes(firstArg)) {
          category = firstArg;
          targetUrl = args.slice(1).join(' ').trim().replace(/^["']|["']$/g, '');
        } else {
          targetUrl = args.join(' ').trim().replace(/^["']|["']$/g, '');
        }

        if (!targetUrl) {
          sendPrivateSystemMessage(
            'Usage: `/import <url>` or `/import <category> <url>`\n\n' +
              'Supported Categories: `pf2e`, `spell`, `item`, `monster`\n\n' +
              'Examples:\n' +
              '• `/import https://raw.githubusercontent.com/foundryvtt/pf2e/master/packs/spells/1st-rank/acidic-burst.json`\n' +
              '• `/import pf2e "https://github.com/foundryvtt/pf2e/blob/master/packs/equipment/healing-potion.json"`\n' +
              '• `/import spell https://api.open5e.com/v1/spells/magic-missile/`\n' +
              '• `/import monster https://api.open5e.com/v1/monsters/goblin/`',
            'Reference Data Import',
            '#6366f1'
          );
          return true;
        }

        const lowerUrl = targetUrl.toLowerCase();
        const isPf2e =
          category === 'pf2e' ||
          lowerUrl.includes('foundryvtt/pf2e') ||
          lowerUrl.includes('/packs/') ||
          lowerUrl.endsWith('.json');

        const isDndBeyondChar =
          category === 'dndbeyond' ||
          lowerUrl.includes('dndbeyond.com/characters/') ||
          lowerUrl.includes('character-service.dndbeyond.com');

        const isDndBeyondMonster = lowerUrl.includes('dndbeyond.com/monsters/');

        const isOpen5e =
          lowerUrl.includes('open5e.com') || lowerUrl.includes('api.open5e.com');

        sendPrivateSystemMessage(
          `Importing reference data from \`${targetUrl.length > 50 ? `${targetUrl.slice(0, 50)}...` : targetUrl}\`...`,
          'Reference Data Import',
          '#3b82f6'
        );

        if (isDndBeyondChar) {
          const idMatch =
            targetUrl.match(/characters\/(\d+)/) ||
            targetUrl.match(/character\/v\d+\/character\/(\d+)/) ||
            targetUrl.match(/^(\d+)$/);
          const charId = idMatch ? idMatch[1] : targetUrl;
          const fetchFn =
            context.fetchCharacterFn ||
            (async (id: string) => {
              const res = await fetch(`/api/dndbeyond/${encodeURIComponent(id)}`);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            });

          fetchFn(charId)
            .then((char: DnDCharacter) => {
              const block = convertCharacterToMonsterStatBlock(char, '5e');
              block.sourceUrl = `https://www.dndbeyond.com/characters/${charId}`;
              onSendMessage({
                id: crypto.randomUUID(),
                senderId: player.id,
                senderName: player.name,
                senderColor: player.color,
                text: `imported D&D Beyond character: **${char.name}**`,
                timestamp: Date.now(),
                statBlock: block,
              });
            })
            .catch((err: any) => {
              sendPrivateSystemMessage(
                `Failed to import D&D Beyond character: ${err.message || err}`,
                'Reference Data Import',
                '#f43f5e'
              );
            });
          return true;
        }

        if (isDndBeyondMonster) {
          const monsterMatch = targetUrl.match(/monsters\/(?:\d+-)?([a-z0-9-]+)/i);
          const monsterSlug = monsterMatch ? monsterMatch[1] : targetUrl;
          fetchOpen5eMonster(monsterSlug)
            .then((block) => {
              if (block) {
                block.sourceUrl = targetUrl;
                onSendMessage({
                  id: crypto.randomUUID(),
                  senderId: player.id,
                  senderName: player.name,
                  senderColor: player.color,
                  text: `imported D&D Beyond monster: **${block.name}**`,
                  timestamp: Date.now(),
                  statBlock: block,
                });
              } else {
                sendPrivateSystemMessage(
                  `Could not find statblock for monster "${monsterSlug}".`,
                  'Reference Data Import',
                  '#f43f5e'
                );
              }
            })
            .catch((err) => {
              sendPrivateSystemMessage(
                `Failed to import monster: ${err.message || err}`,
                'Reference Data Import',
                '#f43f5e'
              );
            });
          return true;
        }

        if (isPf2e) {
          fetchPF2eFromUrl(targetUrl)
            .then((block) => {
              if (block) {
                onSendMessage({
                  id: crypto.randomUUID(),
                  senderId: player.id,
                  senderName: player.name,
                  senderColor: player.color,
                  text: `imported PF2e ${block.type}: **${block.name}**`,
                  timestamp: Date.now(),
                  statBlock: block,
                });
              } else {
                sendPrivateSystemMessage(
                  `Could not parse PF2e pack JSON from URL: ${targetUrl}`,
                  'Reference Data Import',
                  '#f43f5e'
                );
              }
            })
            .catch((err) => {
              sendPrivateSystemMessage(
                `Failed to import PF2e data: ${err.message || err}`,
                'Reference Data Import',
                '#f43f5e'
              );
            });
          return true;
        }

        if (isOpen5e) {
          let fetcherPromise: Promise<EntityStatBlock | null>;
          if (category === 'spell' || lowerUrl.includes('/spells/')) {
            const slug = lowerUrl.split('/spells/')[1]?.replace(/\/$/, '') || targetUrl;
            fetcherPromise = fetchOpen5eSpell(slug);
          } else if (category === 'monster' || lowerUrl.includes('/monsters/')) {
            const slug = lowerUrl.split('/monsters/')[1]?.replace(/\/$/, '') || targetUrl;
            fetcherPromise = fetchOpen5eMonster(slug);
          } else {
            const slug =
              lowerUrl.split('/magicitems/')[1]?.replace(/\/$/, '') ||
              lowerUrl.split('/weapons/')[1]?.replace(/\/$/, '') ||
              targetUrl;
            fetcherPromise = fetchOpen5eItem(slug);
          }

          fetcherPromise
            .then((block) => {
              if (block) {
                onSendMessage({
                  id: crypto.randomUUID(),
                  senderId: player.id,
                  senderName: player.name,
                  senderColor: player.color,
                  text: `imported 5e ${block.type}: **${block.name}**`,
                  timestamp: Date.now(),
                  statBlock: block,
                });
              } else {
                sendPrivateSystemMessage(
                  `Could not fetch Open5e reference data from URL: ${targetUrl}`,
                  'Reference Data Import',
                  '#f43f5e'
                );
              }
            })
            .catch((err) => {
              sendPrivateSystemMessage(
                `Failed to import Open5e data: ${err.message || err}`,
                'Reference Data Import',
                '#f43f5e'
              );
            });
          return true;
        }

        // Generic fallback: fetch and inspect JSON format
        fetch(targetUrl)
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then((jsonData) => {
            if (jsonData && jsonData.system && jsonData.name) {
              const block = parseFoundryPF2eJson(jsonData, targetUrl);
              onSendMessage({
                id: crypto.randomUUID(),
                senderId: player.id,
                senderName: player.name,
                senderColor: player.color,
                text: `imported ${block.type}: **${block.name}**`,
                timestamp: Date.now(),
                statBlock: block,
              });
            } else {
              sendPrivateSystemMessage(
                `Unsupported data format from ${targetUrl}. Expected Foundry PF2e pack JSON or Open5e URL.`,
                'Reference Data Import',
                '#f43f5e'
              );
            }
          })
          .catch((err) => {
            sendPrivateSystemMessage(
              `Failed to fetch or parse URL: ${err.message || err}`,
              'Reference Data Import',
              '#f43f5e'
            );
          });

        return true;
      }
  return false;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  player,
  character,
  tokens,
  associatedToken: propAssociatedToken,
  onSetAssociatedToken: propOnSetAssociatedToken,
  selectedToken,
  messages,
  onSendMessage,
  onBroadcastRoll,
  onSyncToken,
  onUpdatePlayerChar,
  onSpawnMonsterToken,
  fetchCharacterFn,
  onConfigureDiscordWebhook,
  onStartTimer,
  onOpenClocks,
  isOpen,
  onToggleOpen,
}) => {
  const [localAssociatedToken, setLocalAssociatedToken] = useState<Token | null>(null);
  const activeAssociatedToken = propAssociatedToken !== undefined ? propAssociatedToken : localAssociatedToken;
  const handleSetAssociatedToken = (token: Token | null) => {
    setLocalAssociatedToken(token);
    propOnSetAssociatedToken?.(token);
  };

  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    draft,
    isNavigating,
    addToHistory,
    navigateUp,
    navigateDown,
    resetNavigation,
  } = useChatHistory();
  const { windowRef, position, isDragging, handleMouseDown, zIndex } = useDraggableWindow({
    storageKey: 'obr_chat_pos',
    defaultZIndex: 50,
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const handleCommand = (raw: string) => {
    const text = raw.trim();
    if (!text) return;

    if (text.startsWith('/')) {
      processSlashCommand(text, {
        player,
        character: character || undefined,
        tokens,
        associatedToken: activeAssociatedToken,
        onSetAssociatedToken: handleSetAssociatedToken,
        onSendMessage,
        onBroadcastRoll,
        onSyncToken,
        onUpdatePlayerChar,
        onSpawnMonsterToken,
        fetchCharacterFn,
        onConfigureDiscordWebhook,
        onStartTimer,
        onOpenClocks,
      });
      return;
    }

    // Regular Chat message
    onSendMessage({
      id: crypto.randomUUID(),
      senderId: player.id,
      senderName: activeAssociatedToken ? `${player.name} (${activeAssociatedToken.name})` : player.name,
      senderColor: player.color,
      text,
      timestamp: Date.now(),
      tokenId: activeAssociatedToken?.id,
      tokenName: activeAssociatedToken?.name,
      tokenImageUrl: activeAssociatedToken?.imageUrl,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    addToHistory(inputText);
    handleCommand(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      const isAtStart = e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0;
      const isEmpty = inputText.trim() === '';
      if (isNavigating || isAtStart || isEmpty) {
        e.preventDefault();
        const prev = navigateUp(inputText);
        if (prev !== null) {
          setInputText(prev);
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(prev.length, prev.length);
            }
          });
        }
      }
    } else if (e.key === 'ArrowDown') {
      if (isNavigating) {
        e.preventDefault();
        const next = navigateDown();
        if (next !== null) {
          setInputText(next);
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(next.length, next.length);
            }
          });
        }
      }
    } else if (e.key === 'Escape') {
      if (isNavigating) {
        e.preventDefault();
        setInputText(draft);
        resetNavigation();
      }
    }
  };

  return (
    <>
      {/* Expanded Chat & Commands Drawer */}
      {isOpen && (
        <div
          ref={windowRef}
          className="glass-panel-elevated animate-slide-up draggable-window"
          style={{
            position: 'fixed',
            left: position ? `${position.x}px` : '1.25rem',
            top: position ? `${position.y}px` : undefined,
            bottom: position ? undefined : '1.25rem',
            width: '360px',
            maxHeight: isMinimized ? '46px' : '440px',
            height: isMinimized ? '46px' : '420px',
            zIndex: zIndex ?? 50,
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: isDragging ? '0 24px 48px rgba(0,0,0,0.8)' : '0 20px 40px rgba(0,0,0,0.7)',
            border: '1px solid var(--border-subtle)',
            color: '#ffffff',
            transition: isDragging ? 'none' : 'max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <DraggableWindowTitleBar
            onMouseDown={handleMouseDown}
            isDragging={isDragging}
            icon={<MessageSquare size={16} color="var(--accent-primary)" />}
            title="Table Chat & Dice"
            isMinimized={isMinimized}
            onToggleMinimize={() => setIsMinimized((v) => !v)}
            onClose={onToggleOpen}
          />

          <div
            className={`draggable-window-body ${isMinimized ? 'minimized' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflow: 'hidden',
            }}
          >

          {/* Quick Command Hints */}
          <div
            style={{
              padding: '0.35rem 0.75rem',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
            }}
          >
            <span
              style={{ cursor: 'pointer', color: 'var(--accent-indigo)' }}
              onClick={() => {
                resetNavigation();
                setInputText('/roll 1d20+5 adv');
                inputRef.current?.focus();
              }}
            >
              /roll 1d20+5 adv
            </span>
            <span>•</span>
            <span
              style={{ cursor: 'pointer', color: 'var(--accent-emerald)' }}
              onClick={() => {
                resetNavigation();
                setInputText('/attack ');
                inputRef.current?.focus();
              }}
            >
              /attack
            </span>
            <span>•</span>
            <span
              style={{ cursor: 'pointer', color: '#f59e0b' }}
              onClick={() => {
                resetNavigation();
                setInputText('/skill ');
                inputRef.current?.focus();
              }}
            >
              /skill
            </span>
            <span>•</span>
            <span
              style={{ cursor: 'pointer', color: '#a855f7' }}
              onClick={() => {
                resetNavigation();
                setInputText('/spell ');
                inputRef.current?.focus();
              }}
            >
              /spell
            </span>
            <span>•</span>
            <span
              style={{ cursor: 'pointer', color: '#38bdf8' }}
              onClick={() => {
                resetNavigation();
                setInputText('/token ');
                inputRef.current?.focus();
              }}
            >
              /token
            </span>
            <span>•</span>
            <span
              style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
              onClick={() => handleCommand('/help')}
            >
              /help
            </span>
          </div>

          {/* Message List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {messages.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No messages yet. Type a message or try <code>/roll 1d20+4 adv</code>
              </div>
            ) : (
              messages.map((m) => {
                const isSelf = m.senderId === player.id;
                const isSys = m.senderId === 'system';

                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '0.5rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSys
                        ? 'rgba(99, 102, 241, 0.12)'
                        : isSelf
                        ? 'rgba(30, 41, 59, 0.8)'
                        : 'rgba(15, 23, 42, 0.8)',
                      borderLeft: `3px solid ${m.senderColor || '#6366f1'}`,
                      fontSize: '0.8rem',
                      lineHeight: 1.4,
                      color: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700, color: m.senderColor || 'white', fontSize: '0.75rem' }}>
                        {m.senderName}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {m.text && (
                      <div style={{ color: '#ffffff', whiteSpace: 'pre-wrap', marginBottom: m.statBlock ? '0.4rem' : 0 }}>
                        {m.text}
                      </div>
                    )}

                    {m.statBlock && (
                      <StatBlockCard
                        statBlock={m.statBlock}
                        compact
                        onAddToCharacter={
                          onUpdatePlayerChar && character
                            ? (block) => {
                                if (block.type === 'spell') {
                                  const newSpell: DnDSpell = {
                                    id: block.id || crypto.randomUUID(),
                                    name: block.name,
                                    level: (block as EntityStatBlock).level ?? 0,
                                    school: (block as EntityStatBlock).school || block.traits?.[0] || 'Universal',
                                    castingTime: (block as EntityStatBlock).castingTime || getActionCostGlyph(block.cost) || '1 action',
                                    range: block.range || 'Self',
                                    duration: block.duration || 'Instantaneous',
                                    description: block.description || '',
                                    dndBeyondUrl: block.sourceUrl || '',
                                  };
                                  onUpdatePlayerChar({
                                    ...character,
                                    spells: [...(character.spells || []), newSpell],
                                  });
                                  onSendMessage({
                                    id: crypto.randomUUID(),
                                    senderId: 'system',
                                    senderName: 'VTT Guide',
                                    senderColor: '#10b981',
                                    text: `✅ Added spell **${block.name}** to ${character.name}'s character sheet.`,
                                    timestamp: Date.now(),
                                    isEphemeral: true,
                                    recipientId: player.id,
                                  });
                                } else if (block.type === 'item') {
                                  const newItem: DnDItem = {
                                    id: block.id || crypto.randomUUID(),
                                    name: block.name,
                                    description: block.description,
                                    dndBeyondUrl: block.sourceUrl,
                                    quantity: 1,
                                  };
                                  onUpdatePlayerChar({
                                    ...character,
                                    items: [...(character.items || []), newItem],
                                  });
                                  onSendMessage({
                                    id: crypto.randomUUID(),
                                    senderId: 'system',
                                    senderName: 'VTT Guide',
                                    senderColor: '#10b981',
                                    text: `✅ Added item **${block.name}** to ${character.name}'s inventory.`,
                                    timestamp: Date.now(),
                                    isEphemeral: true,
                                    recipientId: player.id,
                                  });
                                } else {
                                  const newAction: DnDAction = {
                                    name: block.name,
                                    type: block.type,
                                    activationType: block.cost,
                                    damageDice: block.damageFormula,
                                    range: block.range,
                                    description: block.description,
                                  };
                                  onUpdatePlayerChar({
                                    ...character,
                                    actions: [...(character.actions || []), newAction],
                                  });
                                  onSendMessage({
                                    id: crypto.randomUUID(),
                                    senderId: 'system',
                                    senderName: 'VTT Guide',
                                    senderColor: '#10b981',
                                    text: `✅ Added action **${block.name}** to ${character.name}'s actions.`,
                                    timestamp: Date.now(),
                                    isEphemeral: true,
                                    recipientId: player.id,
                                  });
                                }
                              }
                            : undefined
                        }
                        onRoll={(block) => {
                          const expr = block.damageFormula || block.rollFormula || '1d20';
                          const parsed = parseDiceExpression(expr);
                          if (parsed) {
                            const rollResult: DiceRollResult = {
                              id: crypto.randomUUID(),
                              userId: player.id,
                              userName: player.name,
                              userColor: player.color,
                              diceType: parsed.diceType,
                              count: parsed.count,
                              modifier: parsed.modifier,
                              rolls: parsed.rolls,
                              total: parsed.total,
                              timestamp: Date.now(),
                            };
                            onBroadcastRoll?.(rollResult);
                            onSendMessage({
                              id: crypto.randomUUID(),
                              senderId: player.id,
                              senderName: player.name,
                              senderColor: player.color,
                              text: `rolls **${block.name}** (${expr}) = ${parsed.total} [${parsed.rolls.join(', ')}]`,
                              timestamp: Date.now(),
                              roll: rollResult,
                            });
                          }
                        }}
                        onSpawnToken={
                          onSpawnMonsterToken
                            ? (block) => {
                                onSpawnMonsterToken(block);
                                onSendMessage({
                                  id: crypto.randomUUID(),
                                  senderId: 'system',
                                  senderName: 'VTT Guide',
                                  senderColor: '#10b981',
                                  text: `✨ Spawned token for **${block.name}** on the canvas.`,
                                  timestamp: Date.now(),
                                  isEphemeral: true,
                                  recipientId: player.id,
                                });
                              }
                            : undefined
                        }
                      />
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Active Token Selector Bar (OB-182) */}
          <div
            style={{
              padding: '0.35rem 0.75rem',
              backgroundColor: activeAssociatedToken ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.6)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.72rem',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
              🎭 <strong style={{ color: activeAssociatedToken ? '#38bdf8' : 'var(--text-primary)' }}>As:</strong>
            </span>
            <select
              value={activeAssociatedToken?.id || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  handleSetAssociatedToken(null);
                } else {
                  const target = (tokens || []).find((t) => t.id === val);
                  if (target) handleSetAssociatedToken(target);
                }
              }}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '0.2rem 0.35rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: activeAssociatedToken ? '#38bdf8' : 'white',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              <option value="">👤 {character?.name || player.name} (Player Sheet)</option>
              {(tokens || []).map((t) => (
                <option key={t.id} value={t.id}>
                  🎭 {t.name}{t.character ? ` (${t.character.name || t.character.classes})` : ''}
                </option>
              ))}
            </select>
            {selectedToken && selectedToken.id !== activeAssociatedToken?.id && (
              <button
                type="button"
                onClick={() => handleSetAssociatedToken(selectedToken)}
                style={{
                  padding: '0.2rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid #6366f1',
                  color: '#c7d2fe',
                  fontSize: '0.68rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                title={`Switch chat to selected token "${selectedToken.name}"`}
              >
                Bind Selected
              </button>
            )}
            {activeAssociatedToken && (
              <button
                type="button"
                onClick={() => handleSetAssociatedToken(null)}
                style={{
                  padding: '0.2rem 0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.68rem',
                  cursor: 'pointer',
                }}
                title="Reset to player character sheet"
              >
                ✕
              </button>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '0.5rem 0.75rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={
                activeAssociatedToken
                  ? `Chat or /attack, /roll as ${activeAssociatedToken.name}...`
                  : 'Chat or /roll, /attack, /skill...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                padding: '0.45rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'white',
                fontSize: '0.8rem',
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.45rem 0.75rem' }}
              disabled={!inputText.trim()}
            >
              <Send size={14} />
            </button>
          </form>
          </div>
        </div>
      )}
    </>
  );
};
