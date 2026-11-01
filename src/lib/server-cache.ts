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
// step 3/8
