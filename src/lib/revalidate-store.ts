import { createHash } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { invalidateServerCache, type ServerSyncScope } from '@/lib/server-cache';

export function computeUserSyncTag(userId: string): string {
// step 1/4
