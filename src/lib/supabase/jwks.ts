import type { SupabaseClient } from '@supabase/supabase-js';

type JwksOption = NonNullable<
  NonNullable<Parameters<SupabaseClient['auth']['getClaims']>[1]>['jwks']
>;

const JWKS_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface JwksGlobalState {
  cachedJwks: JwksOption | null;
  cachedAt: number;
  inflight: Promise<JwksOption | undefined> | null;
}

const globalForJwks = globalThis as unknown as {
  __tcJwksState?: JwksGlobalState;
};

const state: JwksGlobalState =
  globalForJwks.__tcJwksState ??
  (globalForJwks.__tcJwksState = {
    cachedJwks: null,
    cachedAt: 0,
    inflight: null,
  });

export async function getSupabaseJwks(): Promise<JwksOption | undefined> {
  const now = Date.now();
  if (state.cachedJwks && now - state.cachedAt < JWKS_TTL_MS) {
    return state.cachedJwks;
  }
