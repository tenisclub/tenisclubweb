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
// step 2/4
