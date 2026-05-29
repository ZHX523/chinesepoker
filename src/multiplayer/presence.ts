import { getSessionId } from './session';
import type { FriendRoom, RoomPlayer } from './room';
import { readRoom, writeRoom } from './room';

export const PRESENCE_HEARTBEAT_MS = 2000;
export const PRESENCE_TIMEOUT_MS = 8000;

function isHumanSeat(seat: RoomPlayer | null): seat is RoomPlayer {
  return seat != null && !seat.isComputer;
}

export function isPlayerConnected(
  room: FriendRoom,
  sessionId: string,
): boolean {
  const seat = room.seats.find((s) => s?.sessionId === sessionId);
  if (!seat || seat.isComputer) return true;
  if (seat.lastSeenAt != null) {
    return Date.now() - seat.lastSeenAt <= PRESENCE_TIMEOUT_MS;
  }
  return seat.connected !== false;
}

export function seatDisconnectedFlags(room: FriendRoom): boolean[] {
  return room.seats.map((seat) => {
    if (!seat || seat.isComputer) return false;
    return !isPlayerConnected(room, seat.sessionId);
  });
}

function markStaleDisconnects(room: FriendRoom): FriendRoom {
  const now = Date.now();
  const seats = room.seats.map((seat) => {
    if (!isHumanSeat(seat)) return seat;
    if (seat.lastSeenAt == null) return { ...seat, connected: true, lastSeenAt: now };
    const connected = now - seat.lastSeenAt <= PRESENCE_TIMEOUT_MS;
    return { ...seat, connected };
  });

  const spectators = (room.spectators ?? []).map((spec) => ({
    ...spec,
    connected: spec.lastSeenAt != null && now - spec.lastSeenAt <= PRESENCE_TIMEOUT_MS,
  }));

  return { ...room, seats, spectators };
}

/** Heartbeat for the current browser tab; returns updated room or null. */
export function touchPresence(roomId: string): FriendRoom | null {
  const room = readRoom(roomId);
  if (!room) return null;

  const sessionId = getSessionId();
  const now = Date.now();
  let changed = false;

  const seats = room.seats.map((seat) => {
    if (seat?.sessionId !== sessionId) return seat;
    changed = true;
    return { ...seat, lastSeenAt: now, connected: true };
  });

  let spectators = room.spectators ?? [];
  const specIdx = spectators.findIndex((s) => s.sessionId === sessionId);
  if (specIdx !== -1) {
    changed = true;
    spectators = spectators.map((spec, i) =>
      i === specIdx ? { ...spec, lastSeenAt: now, connected: true } : spec,
    );
  }

  const next = markStaleDisconnects({ ...room, seats, spectators });
  if (changed || next !== room) {
    writeRoom(next);
    return next;
  }
  writeRoom(next);
  return next;
}
