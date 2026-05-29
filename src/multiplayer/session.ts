const SESSION_KEY = 'bigtwo-session-id';
const PROFILE_KEY = 'bigtwo-player-profile';

export type StoredPlayMode = 'computer' | 'friends';

export interface PlayerProfile {
  name: string;
  roomId: string | null;
  playMode: StoredPlayMode | null;
  isSpectator?: boolean;
  avatarIndex?: number;
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = sessionStorage.getItem(SESSION_KEY);
  }
  if (!id) {
    id = crypto.randomUUID();
  }

  localStorage.setItem(SESSION_KEY, id);
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

export function getPlayerProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerProfile;
  } catch {
    return null;
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearRoomProfile(): void {
  const profile = getPlayerProfile();
  if (!profile) return;
  savePlayerProfile({ ...profile, roomId: null, playMode: null });
}
