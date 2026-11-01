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

  if (state.inflight) {
    return state.inflight;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!supabaseUrl) return undefined;

  state.inflight = (async () => {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/.well-known/jwks.json`, {
        cache: 'force-cache',
        next: { revalidate: 1800 },
      });
      if (!res.ok) return state.cachedJwks ?? undefined;
      const data = (await res.json()) as JwksOption;
      if (data && Array.isArray(data.keys) && data.keys.length > 0) {
        state.cachedJwks = data;
        state.cachedAt = Date.now();
        return data;
      }
      return state.cachedJwks ?? undefined;
    } catch {
      return state.cachedJwks ?? undefined;
    } finally {
      state.inflight = null;
    }
  })();

  return state.inflight;
}
