import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { moveCardInOrder, syncHandOrder } from './utils/handOrder';
import {
  addCardsToSlot,
  createEmptyReserveSlots,
  pruneReserveSlots,
  removeCardsFromReserve,
} from './utils/reserve';
import { RightGameRail } from './components/RightGameRail';
import { GameTable } from './components/GameTable';
import { isFreeLeadTurn } from './game/gameLogic';
import { GameOverModal } from './components/GameOverModal';
import { JoinTableModal } from './components/JoinTableModal';
import { ShareFriendsModal } from './components/ShareFriendsModal';
import {
  applyTurnTimeout,
  botTakeTurn,
  clearError,
  createLobbyPreviewState,
  dealNewGame,
  enterPlayingPhase,
  humanPass,
  humanPlayCardIds,
} from './game/gameLogic';
import {
  getTurnTimerSeconds,
  isTurnAlertMuted,
  setTurnAlertMuted,
} from './settings/gameSettings';
import { playTurnDing, primeTurnSound } from './utils/turnSound';
import {
  handCountsFromState,
  toSpectatorViewState,
} from './game/spectatorView';
import {
  rotateSeatFlagsForSeat,
  rotateStateForSeat,
  unrotateStateFromSeat,
} from './game/viewState';
import {
  PRESENCE_HEARTBEAT_MS,
  isPlayerConnected,
  seatDisconnectedFlags,
  touchPresence,
} from './multiplayer/presence';
import {
  addComputerToRoom,
  buildShareUrl,
  createFriendRoom,
  ensureRoomLoaded,
  getRoomIdFromUrl,
  getSeatForSession,
  isRoomHost,
  joinFriendRoom,
  readRoom,
  removeComputerFromRoom,
  startFriendRoomGame,
  subscribeRoom,
  writeRoom,
  type FriendRoom,
} from './multiplayer/room';
import { getSessionId, getPlayerProfile, savePlayerProfile, clearRoomProfile } from './multiplayer/session';
import { normalizeZodiacIndex } from './constants/zodiacAvatars';
import {
  restoreAppSession,
  restoreAppSessionAsync,
} from './multiplayer/restoreSession';
import type { ChatMessage, GameState } from './game/types';

const BOT_DELAY_MS = 900;

type PlayMode = 'computer' | 'friends';
type JoinPhase = 'form' | 'share';

function loadInitialSession() {
  if (!getRoomIdFromUrl()) {
    clearRoomProfile();
    return restoreAppSession();
  }
  return restoreAppSession();
}

function applyViewState(
  canonical: GameState,
  playMode: PlayMode | null,
  seat: number | null,
): GameState {
  if (playMode === 'friends' && seat != null) {
    return rotateStateForSeat(canonical, seat);
  }
  return canonical;
}

function toCanonicalState(
  view: GameState,
  playMode: PlayMode | null,
  seat: number | null,
): GameState {
  if (playMode === 'friends' && seat != null) {
    return unrotateStateFromSeat(view, seat);
  }
  return view;
}

export default function App() {
  const initialSession = useMemo(() => loadInitialSession(), []);
  const inviteRoomId = getRoomIdFromUrl();
  const lobbyPreview = useMemo(() => createLobbyPreviewState(), []);

  const [joinPhase, setJoinPhase] = useState<JoinPhase>(initialSession.joinPhase);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [friendRoom, setFriendRoom] = useState<FriendRoom | null>(
    initialSession.friendRoom,
  );
  const [playMode, setPlayMode] = useState<PlayMode | null>(
    initialSession.playMode,
  );
  const [mySeat, setMySeat] = useState<number | null>(initialSession.mySeat);
  const [playerName, setPlayerName] = useState<string | null>(
    initialSession.playerName,
  );
  const [state, setState] = useState<GameState | null>(initialSession.state);
  const [isSpectator, setIsSpectator] = useState(initialSession.isSpectator);

  const playModeRef = useRef(playMode);
  const isSpectatorRef = useRef(isSpectator);
  const mySeatRef = useRef(mySeat);
  const friendRoomRef = useRef(friendRoom);
  const roomIdRef = useRef<string | null>(null);
  playModeRef.current = playMode;
  mySeatRef.current = mySeat;
  isSpectatorRef.current = isSpectator;
  friendRoomRef.current = friendRoom;
  roomIdRef.current = friendRoom?.roomId ?? null;

  const spectatingGame =
    isSpectator &&
    friendRoom?.status === 'playing' &&
    friendRoom.gameState != null;
  const spectatingLobby = isSpectator && friendRoom != null && !spectatingGame;
  const atTable =
    state != null || spectatingGame || (spectatingLobby && playerName != null);
  const showShareLobby =
    !atTable &&
    joinPhase === 'share' &&
    friendRoom != null &&
    friendRoom.status === 'waiting' &&
    !isSpectator;
  const showJoinOverlay =
    playerName == null || showShareLobby || (joinPhase === 'form' && !atTable);

  const displayState = useMemo(() => {
    if (state) return state;
    if (spectatingGame && friendRoom?.gameState) {
      return toSpectatorViewState(friendRoom.gameState);
    }
    return lobbyPreview;
  }, [state, spectatingGame, friendRoom?.gameState, lobbyPreview]);

  const spectatorSeatCounts = useMemo(() => {
    if (!spectatingGame || !friendRoom?.gameState) return undefined;
    return handCountsFromState(friendRoom.gameState);
  }, [spectatingGame, friendRoom?.gameState]);

  const seatDisconnected = useMemo(() => {
    if (playMode !== 'friends' || !friendRoom) {
      return [false, false, false, false];
    }
    const flags = seatDisconnectedFlags(friendRoom);
    if (mySeat != null && !isSpectator) {
      return rotateSeatFlagsForSeat(flags, mySeat);
    }
    return flags;
  }, [playMode, friendRoom, mySeat, isSpectator]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [handOrder, setHandOrder] = useState<string[]>([]);
  const [reservedCombos, setReservedCombos] = useState<(string[] | null)[]>(
    createEmptyReserveSlots,
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [turnTimerSeconds, setTurnTimerSeconds] = useState(getTurnTimerSeconds);
  const [turnAlertMuted, setTurnAlertMutedState] = useState(isTurnAlertMuted);
  const [clockMs, setClockMs] = useState(() => Date.now());
  const timeoutHandledRef = useRef('');
  const wasHumanTurnRef = useRef(false);

  useEffect(() => {
    const onPointer = () => {
      primeTurnSound();
      document.removeEventListener('pointerdown', onPointer);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, []);

  const handleTurnAlertMutedChange = useCallback((muted: boolean) => {
    setTurnAlertMuted(muted);
    setTurnAlertMutedState(muted);
  }, []);

  useEffect(() => {
    if (showJoinOverlay) {
      wasHumanTurnRef.current = false;
      return;
    }

    const humanTurn =
      state?.gamePhase === 'PLAYING' && state.activePlayerIndex === 0;

    if (humanTurn && !wasHumanTurnRef.current) {
      playTurnDing();
    }
    wasHumanTurnRef.current = humanTurn;
  }, [
    showJoinOverlay,
    state?.gamePhase,
    state?.activePlayerIndex,
    state?.turnStartedAt,
  ]);

  const syncCanonicalToRoom = useCallback((canonical: GameState) => {
    const roomId = roomIdRef.current;
    if (!roomId || playModeRef.current !== 'friends') return;
    const room = readRoom(roomId);
    if (!room) return;
    writeRoom({ ...room, gameState: canonical });
  }, []);

  const mapGameUpdate = useCallback(
    (updater: (canonical: GameState) => GameState) => {
      setState((view) => {
        if (!view) return view;
        const canonical = toCanonicalState(
          view,
          playModeRef.current,
          mySeatRef.current,
        );
        const nextCanonical = updater(canonical);
        syncCanonicalToRoom(nextCanonical);
        return applyViewState(
          nextCanonical,
          playModeRef.current,
          mySeatRef.current,
        );
      });
    },
    [syncCanonicalToRoom],
  );

  const resetTableUi = useCallback(() => {
    setSelectedIds(new Set());
    setHandOrder([]);
    setReservedCombos(createEmptyReserveSlots());
    setChatMessages([]);
  }, []);

  const beginComputerGame = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      setPlayerName(trimmed);
      setPlayMode('computer');
      setJoinPhase('form');
      setFriendRoom(null);
      setIsSpectator(false);
      setMySeat(0);
      setJoinError(null);
      clearRoomProfile();
      const avatarIndex = getPlayerProfile()?.avatarIndex;
      savePlayerProfile({
        name: trimmed,
        roomId: null,
        playMode: 'computer',
        avatarIndex,
      });
      resetTableUi();
      primeTurnSound();
      setState(dealNewGame(trimmed, avatarIndex));
    },
    [resetTableUi],
  );

  const beginFriendsHost = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      setPlayerName(trimmed);
      setPlayMode('friends');
      setIsSpectator(false);
      setJoinError(null);
      resetTableUi();
      primeTurnSound();
      const room = createFriendRoom(trimmed);
      setFriendRoom(room);
      setJoinPhase('share');
    },
    [resetTableUi],
  );

  const beginFriendsJoin = useCallback(
    async (name: string) => {
      if (!inviteRoomId) return;
      const loaded = await ensureRoomLoaded(inviteRoomId);
      if (!loaded) {
        setJoinError('room.invalidLink');
        return;
      }
      const result = joinFriendRoom(inviteRoomId, name);
      if ('error' in result) {
        setJoinError(result.error);
        return;
      }
      const trimmed = name.trim();
      setPlayerName(trimmed);
      setPlayMode('friends');
      setJoinError(null);
      resetTableUi();
      primeTurnSound();
      const present = touchPresence(result.room.roomId) ?? result.room;
      setFriendRoom(present);

      if (result.asSpectator) {
        setIsSpectator(true);
        setJoinPhase('form');
        if (present.status === 'playing' && present.gameState) {
          setState(toSpectatorViewState(present.gameState));
        } else {
          setState(null);
        }
        return;
      }

      setIsSpectator(false);
      setJoinPhase('share');
    },
    [inviteRoomId, resetTableUi],
  );

  const handlePlayFriends = useCallback(
    (name: string) => {
      if (inviteRoomId) beginFriendsJoin(name);
      else beginFriendsHost(name);
    },
    [inviteRoomId, beginFriendsHost, beginFriendsJoin],
  );

  const handleStartFriendsGame = useCallback(() => {
    if (!friendRoom) return;
    const room = startFriendRoomGame(friendRoom.roomId);
    if (!room?.gameState) return;

    const seat = getSeatForSession(room, getSessionId()) ?? 0;
    setMySeat(seat);
    setIsSpectator(false);
    setJoinPhase('form');
    setFriendRoom(room);
    resetTableUi();
    primeTurnSound();
    wasHumanTurnRef.current = false;
    setState(applyViewState(room.gameState, 'friends', seat));
    savePlayerProfile({
      name: playerName ?? room.seats[seat]?.name ?? 'Player',
      roomId: room.roomId,
      playMode: 'friends',
    });
  }, [friendRoom, resetTableUi, playerName]);

  const handleAddComputer = useCallback(
    (seatIndex: number) => {
      if (!friendRoom) return;
      const result = addComputerToRoom(friendRoom.roomId, seatIndex);
      if ('error' in result) return;
      setFriendRoom(result.room);
    },
    [friendRoom],
  );

  const handleRemoveComputer = useCallback(
    (seatIndex: number) => {
      if (!friendRoom) return;
      const result = removeComputerFromRoom(friendRoom.roomId, seatIndex);
      if ('error' in result) return;
      setFriendRoom(result.room);
    },
    [friendRoom],
  );

  useEffect(() => {
    const roomId = friendRoom?.roomId;
    if (!roomId) return;

    return subscribeRoom(roomId, (room, source) => {
      if (!room) return;
      setFriendRoom(room);

      const sessionId = getSessionId();
      const seat = getSeatForSession(room, sessionId);
      const watching = (room.spectators ?? []).some(
        (spec) => spec.sessionId === sessionId,
      );

      if (room.status === 'playing' && room.gameState) {
        if (watching && seat === undefined) {
          setIsSpectator(true);
          setPlayMode('friends');
          setJoinPhase('form');
          setState(toSpectatorViewState(room.gameState));
          return;
        }

        if (seat === undefined) return;

        // Host runs bots locally; polling was overwriting bot turns every 800ms.
        if (isRoomHost(room) && source === 'poll') return;

        setIsSpectator(false);
        setMySeat(seat);
        setPlayMode('friends');
        setJoinPhase('form');
        const me = room.seats[seat];
        if (me) {
          setPlayerName(me.name);
          savePlayerProfile({
            name: me.name,
            roomId: room.roomId,
            playMode: 'friends',
            isSpectator: false,
            avatarIndex: me.avatarIndex,
          });
        }

        resetTableUi();
        primeTurnSound();
        wasHumanTurnRef.current = false;
        setState(applyViewState(room.gameState, 'friends', seat));
      }
    });
  }, [friendRoom?.roomId, resetTableUi]);

  const applyRestoredSession = useCallback(
    (session: ReturnType<typeof restoreAppSession>) => {
      if (session.playerName == null || session.friendRoom == null) return;

      setFriendRoom(session.friendRoom);
      setPlayerName(session.playerName);
      setPlayMode(session.playMode);
      setMySeat(session.mySeat);
      setIsSpectator(session.isSpectator);
      setJoinPhase(session.joinPhase);
      setJoinError(null);

      if (session.state) {
        setState(session.state);
        resetTableUi();
        primeTurnSound();
        wasHumanTurnRef.current = false;
      }
    },
    [resetTableUi],
  );

  useEffect(() => {
    if (!inviteRoomId) return;

    let cancelled = false;
    void restoreAppSessionAsync().then((session) => {
      if (!cancelled) applyRestoredSession(session);
    });

    return () => {
      cancelled = true;
    };
  }, [inviteRoomId, applyRestoredSession]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const roomId = roomIdRef.current;
      if (!roomId || playModeRef.current !== 'friends') return;
      const updated = touchPresence(roomId);
      if (updated) setFriendRoom(updated);
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    if (!friendRoom || playMode !== 'friends' || !isRoomHost(friendRoom)) {
      return;
    }
    window.history.replaceState({}, '', buildShareUrl(friendRoom));
  }, [friendRoom, playMode]);

  useEffect(() => {
    const roomId = friendRoom?.roomId;
    if (!roomId || playMode !== 'friends') return;

    const beat = () => {
      const updated = touchPresence(roomId);
      if (updated) setFriendRoom(updated);
    };

    beat();
    const id = window.setInterval(beat, PRESENCE_HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [friendRoom?.roomId, playMode]);

  const restart = useCallback(() => {
    if (!playerName) return;
    resetTableUi();
    wasHumanTurnRef.current = false;

    if (playMode === 'friends' && friendRoom) {
      const room = startFriendRoomGame(friendRoom.roomId);
      if (!room?.gameState) return;
      const seat = room.seatsBySession[getSessionId()] ?? mySeat ?? 0;
      setMySeat(seat);
      setFriendRoom(room);
      setState(applyViewState(room.gameState, 'friends', seat));
      return;
    }

    setState(dealNewGame(playerName, getPlayerProfile()?.avatarIndex));
  }, [playerName, playMode, friendRoom, mySeat, resetTableUi]);

  const handleAvatarChange = useCallback(
    (index: number) => {
      const avatarIndex = normalizeZodiacIndex(index);
      const existing = getPlayerProfile();
      savePlayerProfile({
        name: playerName ?? existing?.name ?? 'Player',
        roomId: friendRoom?.roomId ?? existing?.roomId ?? null,
        playMode: playMode ?? existing?.playMode ?? null,
        isSpectator: existing?.isSpectator,
        avatarIndex,
      });

      if (friendRoom && mySeat != null) {
        const seats = [...friendRoom.seats];
        const seated = seats[mySeat];
        if (seated) {
          seats[mySeat] = { ...seated, avatarIndex };
          const updatedRoom = { ...friendRoom, seats };
          setFriendRoom(updatedRoom);
          writeRoom(updatedRoom);
        }
      }

      if (playMode === 'friends' && mySeat != null) {
        mapGameUpdate((canonical) => ({
          ...canonical,
          players: canonical.players.map((p, i) =>
            i === mySeat ? { ...p, avatarIndex } : p,
          ),
        }));
        return;
      }

      setState((s) =>
        s
          ? {
              ...s,
              players: s.players.map((p, i) =>
                i === 0 ? { ...p, avatarIndex } : p,
              ),
            }
          : s,
      );
    },
    [playerName, playMode, friendRoom, mySeat, mapGameUpdate],
  );

  const exitToLobby = useCallback(() => {
    resetTableUi();
    wasHumanTurnRef.current = false;
    setState(null);
    setFriendRoom(null);
    setPlayMode(null);
    setPlayerName(null);
    setMySeat(null);
    setIsSpectator(false);
    setJoinPhase('form');
    setJoinError(null);
    clearRoomProfile();
    const path = window.location.pathname || '/';
    window.history.replaceState({}, '', path);
  }, [resetTableUi]);

  const humanHandKey =
    state?.players[0]?.hand.map((c) => c.id).join('|') ?? '';

  useEffect(() => {
    if (!state) return;
    const hand = state.players[0]?.hand ?? [];
    setHandOrder((prev) => syncHandOrder(prev, hand));
  }, [humanHandKey, state]);

  useEffect(() => {
    if (!state) return;
    const handIds = new Set(
      state.players[0]?.hand.map((c) => c.id) ?? [],
    );
    setReservedCombos((slots) => pruneReserveSlots(slots, handIds));
  }, [humanHandKey, state]);

  const reorderHand = useCallback(
    (
      draggedId: string,
      targetId: string | null,
      insertBefore: boolean,
    ) => {
      setHandOrder((order) =>
        moveCardInOrder(order, draggedId, targetId, insertBefore),
      );
    },
    [],
  );

  const toggleCard = useCallback((cardId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
    setState((s) => (s ? clearError(s) : s));
  }, []);

  const playCards = useCallback(
    (ids: Set<string>) => {
      mapGameUpdate((canonical) => {
        const next = humanPlayCardIds(canonical, ids);
        if (!next.errorMessage) {
          setSelectedIds(new Set());
          const played = [...ids];
          setReservedCombos((slots) =>
            slots.map((slot) => {
              if (!slot) return null;
              const remaining = slot.filter((id) => !played.includes(id));
              return remaining.length > 0 ? remaining : null;
            }),
          );
        }
        return next;
      });
    },
    [mapGameUpdate],
  );

  const addToSlot = useCallback((slotIndex: number, cardIds: string[]) => {
    setState((gameState) => {
      if (!gameState) return gameState;
      const handIds = new Set(
        gameState.players[0]?.hand.map((c) => c.id) ?? [],
      );
      const valid = [...new Set(cardIds)].filter((id) => handIds.has(id));
      if (valid.length > 0) {
        setReservedCombos((slots) => addCardsToSlot(slots, slotIndex, valid));
      }
      return clearError(gameState);
    });
    setSelectedIds(new Set());
  }, []);

  const reorderReserveSlot = useCallback(
    (
      slotIndex: number,
      draggedId: string,
      targetId: string | null,
      insertBefore: boolean,
    ) => {
      setReservedCombos((slots) =>
        slots.map((slot, i) => {
          if (i !== slotIndex || !slot) return slot;
          return moveCardInOrder(slot, draggedId, targetId, insertBefore);
        }),
      );
    },
    [],
  );

  const returnCardsToHand = useCallback((cardIds: string[]) => {
    if (cardIds.length === 0) return;
    setReservedCombos((slots) => removeCardsFromReserve(slots, cardIds));
    setSelectedIds(new Set());
  }, []);

  const handlePass = useCallback(() => {
    setSelectedIds(new Set());
    mapGameUpdate((canonical) => humanPass(canonical));
  }, [mapGameUpdate]);

  const handleSendChat = useCallback(
    (text: string) => {
      const senderName =
        playerName ?? state?.players[0]?.name ?? 'Player';
      if (!senderName) return;
      setChatMessages((msgs) => [
        ...msgs,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          senderId: isSpectatorRef.current ? -1 : 0,
          senderName,
          text,
          timestamp: Date.now(),
        },
      ]);
    },
    [playerName, state?.players],
  );

  useEffect(() => {
    if (!state || state.gamePhase !== 'DEALING') return;
    const t = window.setTimeout(() => {
      if (playModeRef.current === 'friends') {
        mapGameUpdate(enterPlayingPhase);
      } else {
        setState((s) => (s ? enterPlayingPhase(s) : s));
      }
    }, 700);
    return () => window.clearTimeout(t);
  }, [state?.gamePhase, mapGameUpdate]);

  useEffect(() => {
    if (!state || state.gamePhase !== 'PLAYING' || state.turnStartedAt == null) {
      return;
    }
    const id = window.setInterval(() => setClockMs(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [state?.gamePhase, state?.turnStartedAt, state?.activePlayerIndex]);

  useEffect(() => {
    if (!state || state.gamePhase !== 'PLAYING' || state.turnStartedAt == null) {
      return;
    }

    const elapsed = (clockMs - state.turnStartedAt) / 1000;
    if (elapsed < turnTimerSeconds) return;

    const turnKey = `${state.turnStartedAt}-${state.activePlayerIndex}`;
    if (timeoutHandledRef.current === turnKey) return;

    const canonical = toCanonicalState(
      state,
      playModeRef.current,
      mySeatRef.current,
    );
    const activeIndex = canonical.activePlayerIndex;
    const active = canonical.players[activeIndex];
    if (!active) return;

    let shouldEnforce = false;
    if (playModeRef.current === 'computer') {
      shouldEnforce = true;
    } else if (playModeRef.current === 'friends') {
      if (!active.isHuman) {
        shouldEnforce =
          friendRoomRef.current != null &&
          isRoomHost(friendRoomRef.current);
      } else {
        const room = friendRoomRef.current;
        const seated = room?.seats[activeIndex];
        const disconnected =
          seated &&
          !seated.isComputer &&
          !isPlayerConnected(room!, seated.sessionId);
        if (disconnected) {
          shouldEnforce =
            room != null && isRoomHost(room);
        } else {
          shouldEnforce = mySeatRef.current === activeIndex;
        }
      }
    }

    if (!shouldEnforce) return;

    timeoutHandledRef.current = turnKey;

    if (playModeRef.current === 'friends') {
      mapGameUpdate(applyTurnTimeout);
    } else {
      setState((s) => (s ? applyTurnTimeout(s) : s));
    }
  }, [
    clockMs,
    turnTimerSeconds,
    mapGameUpdate,
    state,
    state?.activePlayerIndex,
    state?.gamePhase,
    state?.turnStartedAt,
  ]);

  useEffect(() => {
    if (!state || state.gamePhase !== 'PLAYING') return;

    const active = state.players[state.activePlayerIndex];
    if (!active || active.isHuman) return;

    if (playMode === 'friends') {
      const room = friendRoomRef.current;
      if (!room || !isRoomHost(room)) return;
      const timer = window.setTimeout(() => {
        mapGameUpdate((canonical) => botTakeTurn(canonical));
      }, BOT_DELAY_MS);
      return () => window.clearTimeout(timer);
    }

    if (playMode === 'computer') {
      const timer = window.setTimeout(() => {
        setState((s) => (s ? botTakeTurn(s) : s));
      }, BOT_DELAY_MS);
      return () => window.clearTimeout(timer);
    }
  }, [
    playMode,
    mapGameUpdate,
    state?.activePlayerIndex,
    state?.gamePhase,
    state?.pile,
    state?.consecutivePasses,
    state?.freeLeadPlayerIndex,
    state?.isOpeningTurn,
  ]);

  const winnerName =
    displayState.winnerId != null
      ? displayState.players[displayState.winnerId]?.name ?? 'Winner'
      : '';

  const humanTurn =
    !isSpectator &&
    displayState.gamePhase === 'PLAYING' &&
    displayState.activePlayerIndex === 0;
  const isFreeLead = isFreeLeadTurn(displayState);
  const canPass =
    humanTurn &&
    !isFreeLead &&
    !(displayState.isOpeningTurn && displayState.pile === null) &&
    displayState.pile !== null;
  const passDisabled =
    showJoinOverlay ||
    displayState.gamePhase !== 'PLAYING' ||
    !humanTurn ||
    !canPass;

  return (
    <div className="game-app-shell relative flex w-full flex-col overflow-hidden bg-[#0a1210] md:flex-row">
      <div
        className={[
          'relative z-0 order-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-visible md:order-1 md:flex-[4]',
          showJoinOverlay &&
            'pointer-events-none select-none blur-[9.6px] brightness-[0.55] saturate-[0.85]',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <GameTable
          state={displayState}
          handOrder={handOrder}
          selectedIds={selectedIds}
          onCardClick={toggleCard}
          onPlayCards={playCards}
          onReorderHand={reorderHand}
          reservedCombos={reservedCombos}
          onAddToReserveSlot={addToSlot}
          onReorderReserveSlot={reorderReserveSlot}
          onReturnReserveToHand={returnCardsToHand}
          errorMessage={displayState.errorMessage}
          turnTimerSeconds={turnTimerSeconds}
          spectatorMode={isSpectator}
          forcedSeatCounts={spectatorSeatCounts}
          seatDisconnected={seatDisconnected}
          canEditAvatar={!isSpectator}
          onAvatarChange={handleAvatarChange}
          onPass={handlePass}
          passDisabled={passDisabled}
        />

        {!showJoinOverlay &&
          displayState.gamePhase === 'GAMEOVER' &&
          displayState.scores && (
            <GameOverModal
              scores={displayState.scores}
              winnerName={winnerName}
              onPlayAgain={restart}
            />
          )}
      </div>

      <div className="order-1 shrink-0 md:order-2 md:h-full md:min-h-0 md:flex-[1]">
        <RightGameRail
          actionLog={displayState.actionLog}
          chatMessages={chatMessages}
          onSendChat={handleSendChat}
          onPass={handlePass}
          onRestartGame={restart}
          onLobby={exitToLobby}
          passDisabled={passDisabled}
          turnTimerSeconds={turnTimerSeconds}
          onTurnTimerChange={setTurnTimerSeconds}
          turnAlertMuted={turnAlertMuted}
          onTurnAlertMutedChange={handleTurnAlertMutedChange}
        />
      </div>

      {showJoinOverlay && joinPhase === 'form' && (
        <JoinTableModal
          inviteRoomId={inviteRoomId}
          joinError={joinError}
          onPlayComputer={beginComputerGame}
          onPlayFriends={handlePlayFriends}
        />
      )}

      {showJoinOverlay && joinPhase === 'share' && friendRoom && (
        <ShareFriendsModal
          shareUrl={buildShareUrl(friendRoom)}
          seats={friendRoom.seats}
          isHost={isRoomHost(friendRoom)}
          onAddComputer={handleAddComputer}
          onRemoveComputer={handleRemoveComputer}
          onStartGame={handleStartFriendsGame}
        />
      )}
    </div>
  );
}
