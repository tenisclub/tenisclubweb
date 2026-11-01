import type { SupabaseClient } from '@supabase/supabase-js';

type JwksOption = NonNullable<
  NonNullable<Parameters<SupabaseClient['auth']['getClaims']>[1]>['jwks']
>;

const JWKS_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface JwksGlobalState {
  cachedJwks: JwksOption | null;
  cachedAt: number;
  inflight: Promise<JwksOption | undefined> | null;
// step 1/5
