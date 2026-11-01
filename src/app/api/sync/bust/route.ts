import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { invalidateServerCache, type ServerSyncScope } from '@/lib/server-cache';

const VALID_SCOPES = new Set<ServerSyncScope>([
  'all',
  'catalog',
  'settings',
  'orders',
  'notifications',
// step 1/4
