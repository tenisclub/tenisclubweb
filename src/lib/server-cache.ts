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
// step 2/8
