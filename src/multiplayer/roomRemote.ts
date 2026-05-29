import type { FriendRoom } from './room';

export async function fetchRemoteRoom(
  roomId: string,
  normalize: (raw: FriendRoom) => FriendRoom,
): Promise<FriendRoom | null> {
  try {
    const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (data == null || typeof data !== 'object') return null;
    return normalize(data as FriendRoom);
  } catch {
    return null;
  }
}

export function pushRemoteRoom(room: FriendRoom): void {
  void fetch(`/api/rooms/${encodeURIComponent(room.roomId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(room),
  }).catch(() => {
    /* dev API may be unavailable in static builds */
  });
}
