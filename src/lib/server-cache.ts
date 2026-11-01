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
// step 1/8
