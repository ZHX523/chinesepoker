import type { FriendRoom } from './room';

const MAX_SEED_CHARS = 14_000;

function toBase64Url(bytes: string): string {
  return btoa(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

/** Compact room snapshot embedded in share links (for browsers without shared localStorage). */
export function encodeRoomSeed(room: FriendRoom): string | null {
  try {
    const json = JSON.stringify(room);
    if (json.length > MAX_SEED_CHARS) return null;
    return toBase64Url(
      encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) =>
        String.fromCharCode(Number.parseInt(hex, 16)),
      ),
    );
  } catch {
    return null;
  }
}

export function decodeRoomSeed(encoded: string): FriendRoom | null {
  try {
    const json = decodeURIComponent(
      fromBase64Url(encoded)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(json) as FriendRoom;
  } catch {
    return null;
  }
}

export function getRoomSeedFromUrl(): string | null {
  const seed = new URLSearchParams(window.location.search).get('seed')?.trim();
  return seed && seed.length > 0 ? seed : null;
}

export function hydrateRoomFromUrlSeed(
  roomId: string,
  normalize: (raw: FriendRoom) => FriendRoom,
): FriendRoom | null {
  const encoded = getRoomSeedFromUrl();
  if (!encoded) return null;

  const decoded = decodeRoomSeed(encoded);
  if (!decoded || decoded.roomId.toUpperCase() !== roomId.toUpperCase()) {
    return null;
  }

  return normalize(decoded);
}
