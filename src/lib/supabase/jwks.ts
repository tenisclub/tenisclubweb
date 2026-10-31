import type { SupabaseClient } from '@supabase/supabase-js';

type JwksOption = NonNullable<
  NonNullable<Parameters<SupabaseClient['auth']['getClaims']>[1]>['jwks']
>;

const JWKS_TTL_MS = 10 * 60 * 1000; // 10 minutes

let cachedJwks: JwksOption | null = null;
let cachedAt = 0;
let inflight: Promise<JwksOption | undefined> | null = null;

export async function getSupabaseJwks(): Promise<JwksOption | undefined> {
  const now = Date.now();
  if (cachedJwks && now - cachedAt < JWKS_TTL_MS) {
    return cachedJwks;
  }

  if (inflight) {
    return inflight;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!supabaseUrl) return undefined;

  inflight = (async () => {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/.well-known/jwks.json`, {
        next: { revalidate: 600 },
      });
      if (!res.ok) return cachedJwks ?? undefined;
      const data = (await res.json()) as JwksOption;
      if (data && Array.isArray(data.keys) && data.keys.length > 0) {
        cachedJwks = data;
        cachedAt = Date.now();
        return data;
      }
      return cachedJwks ?? undefined;
    } catch {
      return cachedJwks ?? undefined;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

