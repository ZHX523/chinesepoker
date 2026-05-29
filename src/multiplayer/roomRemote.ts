import type { FriendRoom } from './room';

export type RoomSyncSource = 'poll' | 'storage' | 'ws';

function apiBase(): string {
  const fromEnv = import.meta.env.VITE_ROOM_API_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '');
  }
  return '';
}

function roomUrl(roomId: string): string {
  const base = apiBase();
  const path = `/api/rooms/${encodeURIComponent(roomId)}`;
  return base ? `${base}${path}` : path;
}

function roomWsUrl(roomId: string): string {
  const base = apiBase();
  const path = `/api/rooms/ws?roomId=${encodeURIComponent(roomId)}`;
  if (base) {
    const httpBase = base.replace(/^http/, 'ws');
    return `${httpBase}${path}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}

export async function fetchRemoteRoom(
  roomId: string,
  normalize: (raw: FriendRoom) => FriendRoom,
): Promise<FriendRoom | null> {
  try {
    const res = await fetch(roomUrl(roomId), { cache: 'no-store' });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (data == null || typeof data !== 'object') return null;
    return normalize(data as FriendRoom);
  } catch {
    return null;
  }
}

export async function pushRemoteRoom(room: FriendRoom): Promise<boolean> {
  try {
    const res = await fetch(roomUrl(room.roomId), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function connectRoomSocket(
  roomId: string,
  onRoom: (room: FriendRoom) => void,
  onStatus?: (connected: boolean) => void,
): () => void {
  let closed = false;
  let socket: WebSocket | null = null;
  let retryTimer: number | null = null;

  const connect = () => {
    if (closed) return;

    try {
      socket = new WebSocket(roomWsUrl(roomId));
    } catch {
      scheduleRetry();
      return;
    }

    socket.addEventListener('open', () => {
      onStatus?.(true);
    });

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(String(event.data)) as {
          type?: string;
          room?: FriendRoom;
        };
        if (data.type === 'room' && data.room) {
          onRoom(data.room);
        }
      } catch {
        /* ignore malformed payloads */
      }
    });

    socket.addEventListener('close', () => {
      onStatus?.(false);
      if (!closed) scheduleRetry();
    });

    socket.addEventListener('error', () => {
      socket?.close();
    });
  };

  const scheduleRetry = () => {
    if (closed || retryTimer != null) return;
    retryTimer = window.setTimeout(() => {
      retryTimer = null;
      connect();
    }, 2000);
  };

  connect();

  return () => {
    closed = true;
    if (retryTimer != null) window.clearTimeout(retryTimer);
    socket?.close();
  };
}

export async function isRoomServerAvailable(): Promise<boolean> {
  try {
    const base = apiBase();
    const path = '/api/health';
    const url = base ? `${base}${path}` : path;
    const res = await fetch(url, { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}
