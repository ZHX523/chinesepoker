import type { GameState } from '../game/types';
import { toSpectatorViewState } from '../game/spectatorView';
import { rotateStateForSeat } from '../game/viewState';
import { touchPresence } from './presence';
import {
  ensureRoomLoaded,
  getRoomIdFromUrl,
  isSpectatorInRoom,
  readRoom,
  type FriendRoom,
} from './room';
import { getSessionId, savePlayerProfile } from './session';

export type JoinPhase = 'form' | 'share';
export type PlayMode = 'computer' | 'friends';

export interface RestoredAppSession {
  playerName: string | null;
  playMode: PlayMode | null;
  friendRoom: FriendRoom | null;
  joinPhase: JoinPhase;
  mySeat: number | null;
  isSpectator: boolean;
  state: GameState | null;
}

const EMPTY: RestoredAppSession = {
  playerName: null,
  playMode: null,
  friendRoom: null,
  joinPhase: 'form',
  mySeat: null,
  isSpectator: false,
  state: null,
};

function findSeatForSession(room: FriendRoom, sessionId: string): number {
  return room.seats.findIndex((seat) => seat?.sessionId === sessionId);
}

/** Build app state from a room the current session is already in. */
export function buildSessionFromRoom(room: FriendRoom): RestoredAppSession {
  const sessionId = getSessionId();
  const seatIndex = findSeatForSession(room, sessionId);

  if (seatIndex !== -1) {
    const me = room.seats[seatIndex]!;

    if (room.status === 'playing' && room.gameState) {
      const seat = room.seatsBySession[sessionId] ?? seatIndex;
      savePlayerProfile({
        name: me.name,
        roomId: room.roomId,
        playMode: 'friends',
        isSpectator: false,
      });
      return {
        playerName: me.name,
        playMode: 'friends',
        friendRoom: room,
        joinPhase: 'form',
        mySeat: seat,
        isSpectator: false,
        state: rotateStateForSeat(room.gameState, seat),
      };
    }

    savePlayerProfile({
      name: me.name,
      roomId: room.roomId,
      playMode: 'friends',
      isSpectator: false,
    });
    return {
      playerName: me.name,
      playMode: 'friends',
      friendRoom: room,
      joinPhase: 'share',
      mySeat: null,
      isSpectator: false,
      state: null,
    };
  }

  if (isSpectatorInRoom(room)) {
    const spec = room.spectators!.find((s) => s.sessionId === sessionId)!;
    savePlayerProfile({
      name: spec.name,
      roomId: room.roomId,
      playMode: 'friends',
      isSpectator: true,
    });
    return {
      playerName: spec.name,
      playMode: 'friends',
      friendRoom: room,
      joinPhase: 'form',
      mySeat: null,
      isSpectator: true,
      state:
        room.status === 'playing' && room.gameState
          ? toSpectatorViewState(room.gameState)
          : null,
    };
  }

  return EMPTY;
}

/** Mark online and return session when `?room=` is in the URL (sync, local room only). */
export function restoreAppSession(): RestoredAppSession {
  if (typeof window === 'undefined') return EMPTY;

  const roomId = getRoomIdFromUrl();
  if (!roomId) return EMPTY;

  const room = readRoom(roomId);
  if (!room) return EMPTY;

  const present = touchPresence(roomId) ?? room;
  return buildSessionFromRoom(present);
}

/** Load room from storage/API/seed, mark player present, restore in-progress game. */
export async function restoreAppSessionAsync(): Promise<RestoredAppSession> {
  if (typeof window === 'undefined') return EMPTY;

  const roomId = getRoomIdFromUrl();
  if (!roomId) return EMPTY;

  const room = await ensureRoomLoaded(roomId);
  if (!room) return EMPTY;

  const present = touchPresence(roomId) ?? room;
  return buildSessionFromRoom(present);
}
