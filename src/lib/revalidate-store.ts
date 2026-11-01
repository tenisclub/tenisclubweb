import { createHash } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { invalidateServerCache, type ServerSyncScope } from '@/lib/server-cache';

export function computeUserSyncTag(userId: string): string {
  return createHash('md5').update(`tc:${userId}`).digest('hex');
}

export function revalidateStoreData(scope: ServerSyncScope = 'all') {
  invalidateServerCache(scope);
  try {
    if (scope === 'all' || scope === 'catalog' || scope === 'orders') {
      revalidateTag('catalog', { expire: 0 });
    }
    if (scope === 'all' || scope === 'settings') {
      revalidateTag('store-settings', { expire: 0 });
// step 3/4
