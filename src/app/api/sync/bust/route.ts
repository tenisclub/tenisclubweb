import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { invalidateServerCache, type ServerSyncScope } from '@/lib/server-cache';

const VALID_SCOPES = new Set<ServerSyncScope>([
  'all',
  'catalog',
  'settings',
  'orders',
  'notifications',
  'users',
  'user_private',
]);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawScope = typeof body?.scope === 'string' ? body.scope : 'all';
    const scope: ServerSyncScope = VALID_SCOPES.has(rawScope as ServerSyncScope)
      ? (rawScope as ServerSyncScope)
      : 'all';
    const version = typeof body?.version === 'number' ? body.version : undefined;

    const didBust = invalidateServerCache(scope, version);
    if (didBust) {
      if (scope === 'all' || scope === 'catalog' || scope === 'orders') {
        revalidateTag('catalog', { expire: 0 });
      }
      if (scope === 'all' || scope === 'settings') {
        revalidateTag('store-settings', { expire: 0 });
// step 3/4
