import type { Brand, Category, Product, StoreSettings, UserProfile, UserRole } from '@/types/database';

export type ServerSyncScope =
  | 'all'
  | 'catalog'
  | 'settings'
  | 'orders'
  | 'notifications'
  | 'users'
  | 'user_private';

export interface CachedAuthRecord {
  profile: UserProfile;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface AdminBadgesSnapshot {
  pendingOrdersCount: number;
  unreadAdminNotifs: number;
}

interface CacheSlot<T> {
  value: T | null;
  expiresAt: number;
  inflight: Promise<T> | null;
  generation: number;
}

interface GlobalServerCacheStore {
  settings: CacheSlot<StoreSettings>;
  allProductsAdmin: CacheSlot<Product[]>;
  allCategoriesAndBrands: CacheSlot<{ categories: Category[]; brands: Brand[] }>;
  adminBadges: CacheSlot<AdminBadgesSnapshot>;
  authByUser: Map<string, { value: CachedAuthRecord | null; expiresAt: number }>;
  lastBustedRealtimeVersion: number;
  lastLocalMutationAt: number;
}

function createEmptySlot<T>(): CacheSlot<T> {
  return {
    value: null,
    expiresAt: 0,
    inflight: null,
    generation: 0,
  };
}

const globalRef = globalThis as unknown as {
  __tcServerCache?: GlobalServerCacheStore;
};

const store: GlobalServerCacheStore =
  globalRef.__tcServerCache ??
  (globalRef.__tcServerCache = {
    settings: createEmptySlot<StoreSettings>(),
    allProductsAdmin: createEmptySlot<Product[]>(),
    allCategoriesAndBrands: createEmptySlot<{ categories: Category[]; brands: Brand[] }>(),
    adminBadges: createEmptySlot<AdminBadgesSnapshot>(),
    authByUser: new Map(),
    lastBustedRealtimeVersion: 0,
    lastLocalMutationAt: 0,
  });

export type SlotKey = 'settings' | 'allProductsAdmin' | 'allCategoriesAndBrands' | 'adminBadges';

export async function getOrLoadCacheSlot<K extends SlotKey>(
  key: K,
  ttlMs: number,
  loader: () => Promise<NonNullable<GlobalServerCacheStore[K]['value']>>
): Promise<NonNullable<GlobalServerCacheStore[K]['value']>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slot = store[key] as CacheSlot<any>;
  const now = Date.now();

  if (slot.value !== null && now < slot.expiresAt) {
    return slot.value;
  }

  if (slot.inflight) {
    return slot.inflight;
  }

  const startGen = slot.generation;
  const promise = loader()
    .then((result) => {
      // Only commit to cache if no invalidation occurred while the query was in flight
      if (slot.generation === startGen) {
        slot.value = result;
        slot.expiresAt = Date.now() + ttlMs;
      }
      return result;
    })
    .finally(() => {
      if (slot.inflight === promise) {
        slot.inflight = null;
      }
    });

  slot.inflight = promise;
  return promise;
}

export function primeCacheSlot<K extends SlotKey>(
  key: K,
  value: NonNullable<GlobalServerCacheStore[K]['value']>,
  ttlMs: number
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slot = store[key] as CacheSlot<any>;
  slot.generation += 1;
  slot.inflight = null;
  slot.value = value;
  slot.expiresAt = Date.now() + ttlMs;
}

function clearSlot(key: SlotKey) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slot = store[key] as CacheSlot<any>;
  slot.generation += 1;
  slot.value = null;
  slot.expiresAt = 0;
  slot.inflight = null;
}

export function getCachedAuthRecord(userId: string): CachedAuthRecord | null | undefined {
  const entry = store.authByUser.get(userId);
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    store.authByUser.delete(userId);
    return undefined;
  }
  return entry.value;
}

export function setCachedAuthRecord(
  userId: string,
  value: CachedAuthRecord | null,
  ttlMs = 45_000
) {
  store.authByUser.set(userId, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateAuthCache(userId?: string) {
  if (userId) {
    store.authByUser.delete(userId);
  } else {
    store.authByUser.clear();
  }
}

export function invalidateServerCache(
  scope: ServerSyncScope = 'all',
  remoteVersion?: number
): boolean {
  if (typeof remoteVersion === 'number' && remoteVersion > 0) {
    if (remoteVersion <= store.lastBustedRealtimeVersion) {
      return false;
    }
    store.lastBustedRealtimeVersion = remoteVersion;

    // If this server process JUST ran a local mutation within the last 800ms, its slots were already cleared synchronously
    if (Date.now() - store.lastLocalMutationAt < 800) {
      return false;
    }
  } else {
    store.lastLocalMutationAt = Date.now();
  }

  if (scope === 'all') {
    clearSlot('settings');
// step 7/8
