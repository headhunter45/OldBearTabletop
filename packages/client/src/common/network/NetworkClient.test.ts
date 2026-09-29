import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { NetworkClient } from './NetworkClient.js';
import { ServerToClientMessage } from '@oldbear/shared';

describe('NetworkClient Signaling & Message Dispatching', () => {
  let originalWindow: any;
  let originalWebSocket: any;
  let mockWsInstances: any[] = [];

  class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    static instances: MockWebSocket[] = [];
    url: string;
    readyState = 1;
    sentData: string[] = [];
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    onclose: ((event: { code: number }) => void) | null = null;

    constructor(url: string) {
      this.url = url;
      MockWebSocket.instances.push(this);
    }

    send(data: string) {
      this.sentData.push(data);
    }

    close(code = 1000) {
      this.readyState = 3;
      if (this.onclose) this.onclose({ code });
    }
  }

  beforeEach(() => {
    MockWebSocket.instances = [];
    originalWindow = (globalThis as any).window;
    originalWebSocket = (globalThis as any).WebSocket;

    (globalThis as any).window = {
      location: {
        protocol: 'https:',
        host: 'vtt.test.local:8080',
      },
      localStorage: {
        getItem: () => null,
        setItem: () => {},
      },
    };
    (globalThis as any).WebSocket = MockWebSocket;
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).WebSocket = originalWebSocket;
  });

  it('registers and unregisters status change listeners', () => {
    const client = new NetworkClient();
    const statuses: string[] = [];

    const unsubscribe = client.onStatusChange((status) => {
      statuses.push(status);
    });

    client.connect('room-101', 'Tester', '#3b82f6');
    assert.deepStrictEqual(statuses, ['connecting']);

    unsubscribe();

    // Trigger open on mock socket
    const ws = MockWebSocket.instances[0];
    assert.ok(ws);
    ws.onopen?.();

    // Should not record 'connected' because listener was unsubscribed
    assert.deepStrictEqual(statuses, ['connecting']);
  });

  it('connects to wss:// when page is served via https and dispatches join message on open', () => {
    const client = new NetworkClient();
    const statuses: string[] = [];

    client.onStatusChange((status) => statuses.push(status));
    client.connect('dungeon-crawl', 'Gandalf', '#ef4444', 'secret-gm-key');

    const ws = MockWebSocket.instances[0];
    assert.strictEqual(ws.url, 'wss://vtt.test.local:8080/ws');
    assert.deepStrictEqual(statuses, ['connecting']);

    ws.onopen?.();
    assert.deepStrictEqual(statuses, ['connecting', 'connected']);

    assert.strictEqual(ws.sentData.length, 1);
    const joinPayload = JSON.parse(ws.sentData[0]);
    assert.strictEqual(joinPayload.type, 'join');
    assert.strictEqual(joinPayload.roomId, 'dungeon-crawl');
    assert.strictEqual(joinPayload.playerName, 'Gandalf');
    assert.strictEqual(joinPayload.gmKey, 'secret-gm-key');
  });

  it('dispatches incoming server messages to subscribed message handlers', () => {
    const client = new NetworkClient();
    const receivedMessages: ServerToClientMessage[] = [];

    const unsubscribe = client.onMessage((msg) => {
      receivedMessages.push(msg);
    });

    client.connect('room-abc', 'Frodo', '#10b981');
    const ws = MockWebSocket.instances[0];
    ws.onopen?.();

    const mockJoinAck: ServerToClientMessage = {
      type: 'join-ack',
      session: {
        id: 'room-abc',
        name: 'The Shire',
        createdAt: Date.now(),
        gmId: 'gm-1',
        maps: [],
        tokens: {},
        fog: {},
        players: {},
        initiative: { round: 1, currentTurnIndex: 0, items: [] },
        markers: [],
        diceHistory: [],
        soundtracks: [],
        activeMapId: '',
      },
      player: {
        id: 'player-1',
        name: 'Frodo',
        role: 'player',
        color: '#10b981',
        connected: true,
        assignedTokenIds: [],
      },
      isGm: false,
    };

    ws.onmessage?.({ data: JSON.stringify(mockJoinAck) });

    assert.strictEqual(receivedMessages.length, 1);
    assert.strictEqual(receivedMessages[0].type, 'join-ack');
    assert.strictEqual((receivedMessages[0] as any).player.name, 'Frodo');

    // Unsubscribe and ensure no further notifications
    unsubscribe();
    ws.onmessage?.({ data: JSON.stringify(mockJoinAck) });
    assert.strictEqual(receivedMessages.length, 1);
  });

  it('notifies error status when socket closes abnormally', () => {
    const client = new NetworkClient();
    const statusHistory: { status: string; error?: string }[] = [];

    client.onStatusChange((status, error) => {
      statusHistory.push({ status, error });
    });

    client.connect('room-err', 'Gimli', '#f59e0b');
    const ws = MockWebSocket.instances[0];

    ws.onclose?.({ code: 1006 }); // Abnormal closure
    assert.strictEqual(statusHistory[statusHistory.length - 1].status, 'error');
    assert.ok(statusHistory[statusHistory.length - 1].error?.includes('1006'));
  });

  it('notifies disconnected status on clean closure (code 1000)', () => {
    const client = new NetworkClient();
    const statusHistory: { status: string; error?: string }[] = [];

    client.onStatusChange((status, error) => {
      statusHistory.push({ status, error });
    });

    client.connect('room-clean', 'Legolas', '#06b6d4');
    const ws = MockWebSocket.instances[0];

    ws.onclose?.({ code: 1000 });
    assert.strictEqual(statusHistory[statusHistory.length - 1].status, 'disconnected');
  });
});
