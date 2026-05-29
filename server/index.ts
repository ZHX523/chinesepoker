import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'node:http';

const PORT = Number(process.env.PORT ?? 8787);
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

interface StoredRoom {
  body: string;
  revision: number;
  updatedAt: number;
}

const rooms = new Map<string, StoredRoom>();
const socketsByRoom = new Map<string, Set<WebSocket>>();

function normalizeRoomId(raw: string): string {
  return raw.trim().toUpperCase();
}

function pruneExpiredRooms(): void {
  const now = Date.now();
  for (const [id, entry] of rooms) {
    if (now - entry.updatedAt > ROOM_TTL_MS) {
      rooms.delete(id);
      const sockets = socketsByRoom.get(id);
      if (sockets) {
        for (const socket of sockets) socket.close();
        socketsByRoom.delete(id);
      }
    }
  }
}

setInterval(pruneExpiredRooms, 60 * 60 * 1000);

function broadcastRoom(roomId: string, body: string, revision: number): void {
  const sockets = socketsByRoom.get(roomId);
  if (!sockets?.size) return;

  const payload = JSON.stringify({ type: 'room', revision, room: JSON.parse(body) });

  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}

function attachSocket(roomId: string, socket: WebSocket): void {
  let set = socketsByRoom.get(roomId);
  if (!set) {
    set = new Set();
    socketsByRoom.set(roomId, set);
  }
  set.add(socket);

  const stored = rooms.get(roomId);
  if (stored && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: 'room',
        revision: stored.revision,
        room: JSON.parse(stored.body),
      }),
    );
  }

  socket.on('close', () => {
    set?.delete(socket);
    if (set?.size === 0) socketsByRoom.delete(roomId);
  });
}

function roomIdFromWsUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, 'http://localhost');
    const id = parsed.searchParams.get('roomId')?.trim();
    return id ? normalizeRoomId(id) : null;
  } catch {
    return null;
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const roomId = normalizeRoomId(req.params.roomId);
  const stored = rooms.get(roomId);
  if (!stored) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.type('json').send(stored.body);
});

app.put('/api/rooms/:roomId', (req, res) => {
  const roomId = normalizeRoomId(req.params.roomId);
  const body = JSON.stringify(req.body);
  const prev = rooms.get(roomId);
  const revision = (prev?.revision ?? 0) + 1;
  const entry: StoredRoom = { body, revision, updatedAt: Date.now() };
  rooms.set(roomId, entry);
  broadcastRoom(roomId, body, revision);
  res.status(204).end();
});

const httpServer = createServer(app);

const wss = new WebSocketServer({ server: httpServer, path: '/api/rooms/ws' });

wss.on('connection', (socket, request: IncomingMessage) => {
  const roomId = roomIdFromWsUrl(request.url);
  if (!roomId) {
    socket.close(1008, 'roomId required');
    return;
  }
  attachSocket(roomId, socket);
});

httpServer.listen(PORT, () => {
  console.log(`Chinese Poker room server listening on http://localhost:${PORT}`);
});
