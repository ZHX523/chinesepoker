import type { GameState } from '../game/types';
import { BOT_NAMES, dealFriendTableGame } from '../game/gameLogic';
import { MAX_TABLE_PLAYERS, ROOM_STORAGE_PREFIX } from './constants';
import { encodeRoomSeed, hydrateRoomFromUrlSeed } from './roomSeed';
import {
  fetchRemoteRoom,
  pushRemoteRoom,
  connectRoomSocket,
  type RoomSyncSource,
} from './roomRemote';
import { getSessionId, getPlayerProfile, savePlayerProfile } from './session';
import {
  isValidZodiacIndex,
  pickUniqueZodiacIndex,
} from '../constants/zodiacAvatars';

export interface RoomPlayer {
  sessionId: string;
  name: string;
  isHost: boolean;
  isComputer: boolean;
  avatarIndex?: number;
  lastSeenAt?: number;
  connected?: boolean;
}

export interface RoomSpectator {
  sessionId: string;
  name: string;
  lastSeenAt?: number;
  connected?: boolean;
}

export interface FriendRoom {
  roomId: string;
  hostSessionId: string;
  /** Fixed seats 0–3 (bottom, left, top, right). */
  seats: (RoomPlayer | null)[];
  spectators?: RoomSpectator[];
  status: 'waiting' | 'playing';
  gameState: GameState | null;
  /** Maps session id → seat index (0–3) after the deal. */
  seatsBySession: Record<string, number>;
}

function storageKey(roomId: string): string {
  return `${ROOM_STORAGE_PREFIX}${roomId}`;
}

function emptySeats(): (RoomPlayer | null)[] {
  return Array.from({ length: MAX_TABLE_PLAYERS }, () => null);
}

function normalizeRoom(raw: FriendRoom): FriendRoom {
  if (raw.seats?.length === MAX_TABLE_PLAYERS) {
    return {
      ...raw,
      spectators: raw.spectators ?? [],
      seats: raw.seats.map((seat) =>
        seat
          ? {
              ...seat,
              isComputer: seat.isComputer ?? false,
            }
          : null,
      ),
    };
  }

  const seats = emptySeats();
  const legacyPlayers = (raw as { players?: RoomPlayer[] }).players ?? [];
  legacyPlayers.forEach((player, index) => {
    if (index < MAX_TABLE_PLAYERS) {
      seats[index] = {
        ...player,
        isComputer: player.isComputer ?? false,
      };
    }
  });

  return { ...raw, seats, spectators: raw.spectators ?? [] };
}

function seatedPlayers(room: FriendRoom): RoomPlayer[] {
  return room.seats.filter((seat): seat is RoomPlayer => seat != null);
}

function seatedAvatarIndices(room: FriendRoom): number[] {
  return seatedPlayers(room).flatMap((seat) =>
    seat.avatarIndex != null ? [seat.avatarIndex] : [],
  );
}

function avatarForPlayerJoining(used: number[]): number {
  const saved = getPlayerProfile()?.avatarIndex;
  if (saved != null && isValidZodiacIndex(saved) && !used.includes(saved)) {
    return saved;
  }
  return pickUniqueZodiacIndex(used);
}

function filledSeatCount(room: FriendRoom): number {
  return seatedPlayers(room).length;
}

export function generateRoomId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
}

export function getRoomIdFromUrl(): string | null {
  const id = new URLSearchParams(window.location.search).get('room')?.trim();
  return id && id.length > 0 ? id.toUpperCase() : null;
}

export function buildShareUrl(room: FriendRoom | string): string {
  const roomId = typeof room === 'string' ? room : room.roomId;
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('room', roomId);
  if (typeof room !== 'string') {
    const seed = encodeRoomSeed(room);
    if (seed) url.searchParams.set('seed', seed);
  }
  return url.toString();
}

function readRoomLocal(roomId: string): FriendRoom | null {
  try {
    const raw = localStorage.getItem(storageKey(roomId));
    if (!raw) return null;
    return normalizeRoom(JSON.parse(raw) as FriendRoom);
  } catch {
    return null;
  }
}

export type { RoomSyncSource } from './roomRemote';

/** Prefer the hosted room server so cross-device clients stay in sync. */
export async function syncRoomFromServer(roomId: string): Promise<FriendRoom | null> {
  const id = roomId.toUpperCase();
  const remote = await fetchRemoteRoom(id, normalizeRoom);
  if (!remote) return readRoomLocal(id);
  writeRoomLocal(remote);
  return remote;
}

export function readRoom(roomId: string): FriendRoom | null {
  const local = readRoomLocal(roomId);
  if (local) return local;

  const fromSeed = hydrateRoomFromUrlSeed(roomId, normalizeRoom);
  if (fromSeed) {
    writeRoomLocal(fromSeed);
    void pushRemoteRoom(fromSeed);
    return fromSeed;
  }

  return null;
}

function writeRoomLocal(room: FriendRoom): void {
  localStorage.setItem(storageKey(room.roomId), JSON.stringify(room));
}

export function writeRoom(room: FriendRoom): void {
  writeRoomLocal(room);
  void pushRemoteRoom(room);
}

export async function ensureRoomLoaded(roomId: string): Promise<FriendRoom | null> {
  const id = roomId.toUpperCase();
  const remote = await fetchRemoteRoom(id, normalizeRoom);
  if (remote) {
    writeRoomLocal(remote);
    return remote;
  }

  const existing = readRoomLocal(id);
  if (existing) return existing;

  const fromSeed = hydrateRoomFromUrlSeed(id, normalizeRoom);
  if (fromSeed) {
    writeRoomLocal(fromSeed);
    void pushRemoteRoom(fromSeed);
    return fromSeed;
  }

  return null;
}

export function subscribeRoom(
  roomId: string,
  onChange: (room: FriendRoom | null, source: RoomSyncSource) => void,
): () => void {
  const id = roomId.toUpperCase();
  let remotePullBusy = false;

  const applyRemote = (room: FriendRoom, source: RoomSyncSource) => {
    writeRoomLocal(room);
    onChange(room, source);
  };

  const pullRemote = async () => {
    if (remotePullBusy) return;
    remotePullBusy = true;
    try {
      const remote = await fetchRemoteRoom(id, normalizeRoom);
      if (remote) {
        applyRemote(remote, 'poll');
        return;
      }
    } finally {
      remotePullBusy = false;
    }
    const local = readRoomLocal(id);
    if (local) onChange(local, 'poll');
    else onChange(null, 'poll');
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey(id)) {
      const local = readRoomLocal(id);
      if (local) onChange(local, 'storage');
    }
  };

  window.addEventListener('storage', onStorage);

  const stopSocket = connectRoomSocket(
    id,
    (room) => {
      applyRemote(normalizeRoom(room), 'ws');
    },
    (connected) => {
      if (connected) void pullRemote();
    },
  );

  const interval = window.setInterval(() => void pullRemote(), 4000);
  void pullRemote();

  return () => {
    window.removeEventListener('storage', onStorage);
    window.clearInterval(interval);
    stopSocket();
  };
}

export function createFriendRoom(hostName: string): FriendRoom {
  const sessionId = getSessionId();
  const roomId = generateRoomId();
  const seats = emptySeats();
  const now = Date.now();
  const hostAvatar = avatarForPlayerJoining([]);
  seats[0] = {
    sessionId,
    name: hostName.trim(),
    isHost: true,
    isComputer: false,
    avatarIndex: hostAvatar,
    lastSeenAt: now,
    connected: true,
  };

  const room: FriendRoom = {
    roomId,
    hostSessionId: sessionId,
    seats,
    spectators: [],
    status: 'waiting',
    gameState: null,
    seatsBySession: {},
  };
  writeRoom(room);
  savePlayerProfile({
    name: hostName.trim(),
    roomId,
    playMode: 'friends',
    isSpectator: false,
    avatarIndex: hostAvatar,
  });
  window.history.replaceState({}, '', buildShareUrl(room));
  return room;
}

export async function joinFriendRoom(
  roomId: string,
  playerName: string,
): Promise<
  { room: FriendRoom; asSpectator?: boolean } | { error: string }
> {
  const room = await syncRoomFromServer(roomId);
  if (!room) {
    return { error: 'room.invalidLinkShort' };
  }

  const sessionId = getSessionId();
  const existingSeat = room.seats.findIndex(
    (seat) => seat?.sessionId === sessionId,
  );
  if (existingSeat !== -1) {
    const now = Date.now();
    room.seats[existingSeat] = {
      ...room.seats[existingSeat]!,
      name: playerName.trim(),
      lastSeenAt: now,
      connected: true,
    };
    writeRoom(room);
    savePlayerProfile({
      name: playerName.trim(),
      roomId,
      playMode: 'friends',
      isSpectator: false,
      avatarIndex:
        room.seats[existingSeat]?.avatarIndex ?? getPlayerProfile()?.avatarIndex,
    });
    return { room };
  }

  const openSeat = room.seats.findIndex((seat) => seat == null);
  if (room.status === 'playing' || openSeat === -1) {
    return await joinAsSpectator(roomId, playerName);
  }

  const now = Date.now();
  const joinAvatar = avatarForPlayerJoining(seatedAvatarIndices(room));
  room.seats[openSeat] = {
    sessionId,
    name: playerName.trim(),
    isHost: false,
    isComputer: false,
    avatarIndex: joinAvatar,
    lastSeenAt: now,
    connected: true,
  };
  room.spectators = (room.spectators ?? []).filter(
    (spec) => spec.sessionId !== sessionId,
  );
  writeRoom(room);
  savePlayerProfile({
    name: playerName.trim(),
    roomId,
    playMode: 'friends',
    isSpectator: false,
    avatarIndex: joinAvatar,
  });
  return { room };
}

export async function joinAsSpectator(
  roomId: string,
  playerName: string,
): Promise<{ room: FriendRoom; asSpectator?: boolean } | { error: string }> {
  const room = await syncRoomFromServer(roomId);
  if (!room) {
    return { error: 'room.invalidLinkShort' };
  }

  const sessionId = getSessionId();
  const seatIndex = room.seats.findIndex(
    (seat) => seat?.sessionId === sessionId,
  );
  if (seatIndex !== -1) {
    const now = Date.now();
    room.seats[seatIndex] = {
      ...room.seats[seatIndex]!,
      name: playerName.trim(),
      lastSeenAt: now,
      connected: true,
    };
    writeRoom(room);
    savePlayerProfile({
      name: playerName.trim(),
      roomId,
      playMode: 'friends',
      isSpectator: false,
      avatarIndex:
        room.seats[seatIndex]?.avatarIndex ?? getPlayerProfile()?.avatarIndex,
    });
    return { room };
  }

  const trimmed = playerName.trim();
  const now = Date.now();
  const entry: RoomSpectator = {
    sessionId,
    name: trimmed,
    lastSeenAt: now,
    connected: true,
  };
  const spectators = [...(room.spectators ?? [])];
  const existing = spectators.findIndex((spec) => spec.sessionId === sessionId);
  if (existing !== -1) {
    spectators[existing] = entry;
  } else {
    spectators.push(entry);
  }

  const next: FriendRoom = { ...room, spectators };
  writeRoom(next);
  savePlayerProfile({
    name: trimmed,
    roomId,
    playMode: 'friends',
    isSpectator: true,
  });
  return { room: next, asSpectator: true };
}

export function isSpectatorInRoom(room: FriendRoom): boolean {
  const sessionId = getSessionId();
  return (room.spectators ?? []).some((spec) => spec.sessionId === sessionId);
}

function nextComputerName(room: FriendRoom): string {
  const taken = new Set(
    seatedPlayers(room).map((player) => player.name.toLowerCase()),
  );
  const fromPool = BOT_NAMES.find((name) => !taken.has(name.toLowerCase()));
  if (fromPool) return fromPool;

  let index = 1;
  while (taken.has(`computer ${index}`.toLowerCase())) index += 1;
  return `Computer ${index}`;
}

export function addComputerToRoom(
  roomId: string,
  seatIndex: number,
): { room: FriendRoom } | { error: string } {
  const room = readRoom(roomId);
  if (!room) return { error: 'room.notExists' };
  if (!isRoomHost(room)) return { error: 'room.hostOnlyAddComputer' };
  if (room.status === 'playing') {
    return { error: 'room.gameStarted' };
  }
  if (seatIndex < 0 || seatIndex >= MAX_TABLE_PLAYERS) {
    return { error: 'room.invalidSeat' };
  }
  if (room.seats[seatIndex] != null) {
    return { error: 'room.seatTaken' };
  }

  room.seats[seatIndex] = {
    sessionId: `computer-${crypto.randomUUID()}`,
    name: nextComputerName(room),
    isHost: false,
    isComputer: true,
    avatarIndex: pickUniqueZodiacIndex(seatedAvatarIndices(room)),
  };
  writeRoom(room);
  return { room };
}

export function removeComputerFromRoom(
  roomId: string,
  seatIndex: number,
): { room: FriendRoom } | { error: string } {
  const room = readRoom(roomId);
  if (!room) return { error: 'room.notExists' };
  if (!isRoomHost(room)) return { error: 'room.hostOnlyRemoveComputer' };
  if (room.status === 'playing') {
    return { error: 'room.gameStarted' };
  }
  const seat = room.seats[seatIndex];
  if (!seat?.isComputer) {
    return { error: 'room.computerOnlyRemove' };
  }

  room.seats[seatIndex] = null;
  writeRoom(room);
  return { room };
}

export function getMySeat(room: FriendRoom): number | null {
  const seat = room.seatsBySession[getSessionId()];
  return seat !== undefined ? seat : null;
}

export function isRoomHost(room: FriendRoom): boolean {
  return room.hostSessionId === getSessionId();
}

export function getSeatForSession(
  room: FriendRoom,
  sessionId: string,
): number | undefined {
  const mapped = room.seatsBySession[sessionId];
  if (mapped !== undefined) return mapped;
  const index = room.seats.findIndex((seat) => seat?.sessionId === sessionId);
  return index >= 0 ? index : undefined;
}

export function startFriendRoomGame(roomId: string): FriendRoom | null {
  const room = readRoom(roomId);
  if (!room || filledSeatCount(room) < MAX_TABLE_PLAYERS) return null;
  if (room.seats.some((seat) => seat == null)) return null;

  const roster = room.seats.map((seat) => ({
    name: seat!.name,
    isHuman: !seat!.isComputer,
    avatarIndex: seat!.avatarIndex,
  }));
  const gameState = dealFriendTableGame(roster);

  const seatsBySession: Record<string, number> = {};
  room.seats.forEach((player, seat) => {
    if (player && !player.isComputer) {
      seatsBySession[player.sessionId] = seat;
    }
  });

  const next: FriendRoom = {
    ...room,
    status: 'playing',
    gameState,
    seatsBySession,
  };
  writeRoom(next);
  return next;
}
