import http from 'node:http';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createSession, getSession, getAllSessions, initSessionsFromDb } from './session.js';
import { setupWebSocket } from './signaling.js';
import { fetchDnDCharacter } from './dndbeyond.js';
import { initDb, isDbConnected, getDbPool } from './db.js';

// Load environment variables from root workspace and local directory
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '3001', 10);

app.use(cors());
app.use(express.json());

// Health check endpoint (both /health and /api/health for direct and proxied requests)
const healthHandler = async (_req: express.Request, res: express.Response) => {
  let dbStatus: 'connected' | 'in-memory' | 'error' = isDbConnected() ? 'connected' : 'in-memory';
  let dbDetails: any = null;

  if (isDbConnected()) {
    try {
      const pool = getDbPool();
      const testRes = await pool?.query('SELECT NOW() as now, count(*)::int as sessions_count FROM sessions');
      dbDetails = {
        dbTime: testRes?.rows[0]?.now,
        persistedSessions: testRes?.rows[0]?.sessions_count ?? 0,
      };
    } catch (err: any) {
      dbStatus = 'error';
      dbDetails = { error: err.message };
    }
  }

  res.json({
    status: 'ok',
    database: dbStatus,
    uptime: process.uptime(),
    dbDetails,
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// List all active sessions
app.get('/api/sessions', (_req, res) => {
  res.json({ sessions: getAllSessions() });
});

// Create new game session
app.post('/api/sessions', (req, res) => {
  const { name } = req.body || {};
  const { session, gmKey } = createSession(name);
  res.json({
    roomId: session.id,
    gmKey,
    session,
  });
});

// Get session details
app.get('/api/sessions/:roomId', (req, res) => {
  const session = getSession(req.params.roomId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json({ session });
});

// Proxy and normalize D&D Beyond character data
app.get('/api/dndbeyond/:characterId', async (req, res) => {
  try {
    const character = await fetchDnDCharacter(req.params.characterId);
    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }
    res.json(character);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch character from D&D Beyond' });
  }
});

// Proxy Pathbuilder 2e build exports
app.get('/api/pathbuilder/:buildId', async (req, res) => {
  try {
    const buildId = req.params.buildId.replace(/[^\d]/g, '');
    if (!buildId) {
      res.status(400).json({ error: 'Invalid Pathbuilder 2e build ID' });
      return;
    }
    const response = await fetch(`https://pathbuilder2e.com/json.php?id=${encodeURIComponent(buildId)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OldBearVTT/0.1.0',
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      res.status(response.status).json({ error: `Pathbuilder returned status ${response.status}` });
      return;
    }
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch build from Pathbuilder' });
  }
});

// Fallback for HTTP GET /ws when a reverse proxy (e.g. Nginx Proxy Manager) fails to forward WebSocket upgrade
app.get('/ws', (_req, res) => {
  res.status(426).json({
    error: 'Upgrade Required',
    message: 'This endpoint requires a WebSocket connection. If you are accessing this through a reverse proxy (such as Nginx Proxy Manager), please toggle ON "Websockets Support" in your proxy host settings.',
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

setupWebSocket(wss);

async function start() {
  // Start HTTP and WebSocket server immediately so clients and proxies can connect without delay
  server.listen(PORT, () => {
    console.log(`[OldBear Server] Running on http://localhost:${PORT}`);
    console.log(`[OldBear Server] WebSocket listening on ws://localhost:${PORT}`);
    console.log(`[OldBear Server] Database mode: ${isDbConnected() ? 'PostgreSQL (Persistent)' : 'In-Memory'}`);
  });

  // Attempt PostgreSQL initialization if configured
  try {
    const connected = await initDb(5, 2000);
    if (connected) {
      await initSessionsFromDb();
      console.log('[OldBear Server] Sessions loaded from PostgreSQL.');
    }
  } catch (err: any) {
    console.warn('[OldBear Server] Database initialization notice:', err.message);
  }
}

start();
