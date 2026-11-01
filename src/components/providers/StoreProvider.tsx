'use client';

import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Info, MessageCircle, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile, UserRole } from '@/types/database';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface PendingCartIntent {
  productId: string;
  variantId: string;
  quantity: number;
  returnUrl: string;
}

interface SessionSnapshot {
  authenticated: boolean;
  user: UserProfile | null;
  role: UserRole;
  syncTag?: string | null;
  cartCount: number;
  favoriteIds: string[];
  unreadNotifications: number;
}

interface OrderConfirmedPopupData {
  orderNumber: string;
  waUrl?: string;
}

interface StoreContextValue {
  authenticated: boolean;
  user: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  cartCount: number;
  favoriteIds: string[];
  unreadNotifications: number;
  refreshSession: () => Promise<SessionSnapshot | null>;
  hydrateSession: (snap: SessionSnapshot) => void;
  logout: (redirectTo?: string) => void;
  addToCart: (params: {
    productId: string;
    variantId: string;
    quantity?: number;
    redirectToCart?: boolean;
  }) => Promise<boolean>;
  toggleFavorite: (productId: string) => Promise<void>;
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showOrderConfirmedPopup: (data: OrderConfirmedPopupData) => void;
  setCartCount: React.Dispatch<React.SetStateAction<number>>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const PENDING_CART_KEY = 'tc_pending_cart_intent';
const SESSION_CACHE_KEY = 'tc_session_cache_v1';
const ORDER_POPUP_KEY = 'tc_order_confirmed_popup';
const ORDER_POPUP_DURATION_MS = 5000;
const EMPTY_FAVORITES: string[] = [];

function clearClientAuthStorage() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_CACHE_KEY);
  sessionStorage.removeItem(PENDING_CART_KEY);

  const rawCookies = document.cookie ? document.cookie.split(';') : [];
  for (const part of rawCookies) {
    const eq = part.indexOf('=');
    const name = (eq > -1 ? part.slice(0, eq) : part).trim();
    if (name.startsWith('sb-')) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }

  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore restricted storage environments
  }
}

export function StoreProvider({
  children,
  initialAuth = false,
  initialUser = null,
  initialRole = 'visitor',
  initialCartCount = 0,
  initialFavoriteIds = EMPTY_FAVORITES,
}: {
  children: React.ReactNode;
  initialAuth?: boolean;
  initialUser?: UserProfile | null;
  initialRole?: UserRole;
  initialCartCount?: number;
  initialFavoriteIds?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [authenticated, setAuthenticated] = useState(initialAuth);
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [syncTag, setSyncTag] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(initialFavoriteIds);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [hydratedCache, setHydratedCache] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [orderPopup, setOrderPopup] = useState<OrderConfirmedPopupData | null>(null);
  const [orderPopupProgress, setOrderPopupProgress] = useState(100);

  const isAdmin = role === 'super_admin' || role === 'admin_operational';

  const dismissOrderPopup = useCallback(() => {
    setOrderPopup(null);
    setOrderPopupProgress(100);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ORDER_POPUP_KEY);
    }
  }, []);

  const showOrderConfirmedPopup = useCallback((data: OrderConfirmedPopupData) => {
    setOrderPopupProgress(100);
    setOrderPopup(data);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        ORDER_POPUP_KEY,
        JSON.stringify({ ...data, createdAt: Date.now() })
      );
    }
  }, []);

  // Restore pending order confirmation popup if page reloaded on '/' after WhatsApp handoff
  useEffect(() => {
    if (typeof window === 'undefined' || orderPopup) return;
    const raw = sessionStorage.getItem(ORDER_POPUP_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as OrderConfirmedPopupData & { createdAt?: number };
      if (parsed.createdAt && Date.now() - parsed.createdAt > 120_000) {
        sessionStorage.removeItem(ORDER_POPUP_KEY);
        return;
      }
      if (parsed.orderNumber) {
        setOrderPopupProgress(100);
        setOrderPopup({ orderNumber: parsed.orderNumber, waUrl: parsed.waUrl });
      }
    } catch {
      sessionStorage.removeItem(ORDER_POPUP_KEY);
    }
  }, [pathname, orderPopup]);

  // Auto-close popup after 5 seconds of visible screen time on Home ('/')
  useEffect(() => {
    if (!orderPopup || pathname !== '/') return;

    let elapsed = 0;
    let lastTick = performance.now();

    const interval = window.setInterval(() => {
      const now = performance.now();
      if (document.visibilityState === 'visible') {
        elapsed += now - lastTick;
        const pct = Math.max(0, 100 - (elapsed / ORDER_POPUP_DURATION_MS) * 100);
        setOrderPopupProgress(pct);
        if (elapsed >= ORDER_POPUP_DURATION_MS) {
          window.clearInterval(interval);
          dismissOrderPopup();
        }
      }
      lastTick = now;
    }, 50);

    return () => window.clearInterval(interval);
  }, [orderPopup, pathname, dismissOrderPopup]);

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const replayPendingCartIntent = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const rawIntent = sessionStorage.getItem(PENDING_CART_KEY);
    if (!rawIntent) return;

    sessionStorage.removeItem(PENDING_CART_KEY);
    try {
      const intent: PendingCartIntent = JSON.parse(rawIntent);
      const cartRes = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: intent.productId,
          variantId: intent.variantId,
          quantity: intent.quantity || 1,
        }),
      });
      if (cartRes.ok) {
        const updated = await cartRes.json();
        setCartCount(updated.totalItems || 0);
        toast('Produto adicionado ao seu carrinho! Continue sua compra.', 'success');
      }
    } catch {
      // Ignore malformed intent
    }
  }, [toast]);

  const refreshSession = useCallback(async (): Promise<SessionSnapshot | null> => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      const isAuth = Boolean(data.authenticated);
      const snap: SessionSnapshot = {
        authenticated: isAuth,
        user: data.user || null,
        role: data.role || 'visitor',
        syncTag: data.syncTag || null,
        cartCount: data.cartCount || 0,
        favoriteIds: data.favoriteIds || [],
        unreadNotifications: data.unreadNotifications || 0,
      };

      setAuthenticated(snap.authenticated);
      setUser(snap.user);
      setRole(snap.role);
      setSyncTag(snap.syncTag || null);
      setCartCount(snap.cartCount);
      setFavoriteIds(snap.favoriteIds);
      setUnreadNotifications(snap.unreadNotifications);

      if (typeof window !== 'undefined') {
        if (isAuth) {
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(snap));
        } else {
          clearClientAuthStorage();
        }
      }

      if (isAuth) {
        await replayPendingCartIntent();
      }
      return snap;
    } catch {
      return null;
    }
  }, [replayPendingCartIntent]);

  const hydrateSession = useCallback(
    (snap: SessionSnapshot) => {
      setAuthenticated(snap.authenticated);
      setUser(snap.user);
      setRole(snap.role);
      setSyncTag(snap.syncTag || null);
      setCartCount(snap.cartCount);
      setFavoriteIds(snap.favoriteIds);
      setUnreadNotifications(snap.unreadNotifications);
      if (typeof window !== 'undefined' && snap.authenticated) {
        sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(snap));
      }
      if (snap.authenticated) {
        void replayPendingCartIntent();
      }
    },
    [replayPendingCartIntent]
  );

  const logout = useCallback(
    (redirectTo = '/') => {
      // 1. Instant 0ms state + cookie wipe
      setAuthenticated(false);
      setUser(null);
      setRole('visitor');
      setSyncTag(null);
      setCartCount(0);
      setFavoriteIds(EMPTY_FAVORITES);
      setUnreadNotifications(0);
      clearClientAuthStorage();

      // 2. Non-blocking cleanup of in-memory GoTrue state and server cookies
      try {
        const supabase = createClient();
        void supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      } catch {
        // Ignore
      }
      void fetch('/api/auth/logout', { method: 'POST', keepalive: true }).catch(() => {});

      // 3. Immediate client transition without competing router.refresh() race
      router.replace(redirectTo);
    },
    [router]
  );

  // Hydrate navbar session once on mount (zero requests for anonymous visitors; instant cache restore + background sync for logged-in users)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasAuthCookie = document.cookie.includes('-auth-token');
    if (!hasAuthCookie) {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
      setHydratedCache(true);
      return;
    }

    // Check for instant OAuth callback bootstrap cookie (0ms first-frame Google login hydration)
    try {
      const bootMatch = document.cookie.match(/(?:^|;\s*)tc_oauth_bootstrap=([^;]+)/);
      if (bootMatch?.[1]) {
        const parsed = JSON.parse(decodeURIComponent(bootMatch[1]));
        document.cookie = 'tc_oauth_bootstrap=; Path=/; Max-Age=0; SameSite=Lax';
        if (parsed?.authenticated && parsed?.user) {
          const bootSnap: SessionSnapshot = {
            authenticated: true,
            user: parsed.user,
            role: parsed.role || 'customer',
            syncTag: parsed.syncTag || null,
            cartCount: 0,
            favoriteIds: EMPTY_FAVORITES,
            unreadNotifications: 0,
          };
          setAuthenticated(true);
          setUser(bootSnap.user);
          setRole(bootSnap.role);
          setSyncTag(bootSnap.syncTag || null);
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(bootSnap));
        }
      }
    } catch {
      // Ignore malformed bootstrap cookie
    }

    try {
      const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as SessionSnapshot;
        if (cached.authenticated) {
          setAuthenticated(true);
          setUser(cached.user);
          setRole(cached.role);
          setSyncTag(cached.syncTag || null);
          setCartCount(cached.cartCount);
          setFavoriteIds(cached.favoriteIds);
          setUnreadNotifications(cached.unreadNotifications);
        }
      }
    } catch {
      // Ignore corrupt cache
    }

    setHydratedCache(true);
    void refreshSession();
  }, [refreshSession]);

  // Keep sessionStorage snapshot synced with optimistic cart/favorite updates
  useEffect(() => {
    if (!hydratedCache || typeof window === 'undefined') return;
    if (!authenticated) {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
      return;
    }
    const snap: SessionSnapshot = {
      authenticated,
      user,
      role,
      syncTag,
      cartCount,
      favoriteIds,
      unreadNotifications,
    };
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(snap));
  }, [hydratedCache, authenticated, user, role, syncTag, cartCount, favoriteIds, unreadNotifications]);

  // Live reactive references for the persistent Supabase Realtime channel
  const liveRefs = useRef({
    authenticated,
    isAdmin,
    syncTag,
    router,
    refreshSession,
  });
  liveRefs.current = {
    authenticated,
    isAdmin,
    syncTag,
    router,
    refreshSession,
  };

  // Global Real-Time Sync across ALL open tabs, devices, visitors, customers & admins
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supabase = createClient();
    let lastSeenVersion = 0;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingScope: string | null = null;
    const pending = {
      public: false,
      admin: false,
      user: false,
    };

    const flushPendingSync = async () => {
      debounceTimer = null;
      const snap = { ...pending };
      const scopeSnapshot = pendingScope || 'all';
      const versionSnapshot = lastSeenVersion;
      pending.public = false;
      pending.admin = false;
      pending.user = false;
      pendingScope = null;

      if (!snap.public && !snap.admin && !snap.user) return;

      const cur = liveRefs.current;

      // Ensure server memory cache is busted if change originated outside this server process
      if (snap.public || snap.admin) {
        try {
          await fetch('/api/sync/bust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scope: scopeSnapshot, version: versionSnapshot }),
          });
        } catch {
          // Ignore transient network errors
        }
      }

      startTransition(() => {
        cur.router.refresh();
      });

      window.dispatchEvent(new CustomEvent('tc:realtime-sync', { detail: snap }));

      // Only re-fetch admin badge stats when orders or notifications actually changed
      if (cur.isAdmin && snap.admin) {
        window.dispatchEvent(new CustomEvent('tc:admin-stats-sync'));
      }

      // Only re-fetch /api/auth/me when user-scoped data (cart/favorites/profile/roles) changed
      if (cur.authenticated && snap.user) {
        void cur.refreshSession();
      }
    };

    const scheduleFlush = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void flushPendingSync();
      }, 280);
    };

    const checkLatestVersionOnWake = async () => {
      try {
        const { data } = await supabase
          .from('site_sync_state')
          .select('version')
          .eq('id', 1)
          .maybeSingle();
        const remoteVersion = Number((data as { version?: number } | null)?.version || 0);
        if (lastSeenVersion === 0) {
          lastSeenVersion = remoteVersion;
          return;
        }
        if (remoteVersion > lastSeenVersion) {
          lastSeenVersion = remoteVersion;
          pendingScope = 'all';
          pending.public = true;
          if (liveRefs.current.isAdmin) pending.admin = true;
          if (liveRefs.current.authenticated) pending.user = true;
          scheduleFlush();
        }
      } catch {
        // Ignore transient offline state
      }
    };

    const channel = supabase
      .channel('tc-global-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_sync_state' },
        (payload: { new?: Record<string, unknown> }) => {
          const row = (payload.new || {}) as {
            version?: number;
            scope?: string;
            actor_tag?: string | null;
          };
          const v = Number(row.version || 0);
          if (v > lastSeenVersion) {
            lastSeenVersion = v;
          }

          const scope = row.scope || 'all';
          const actorTag = row.actor_tag || null;
          const cur = liveRefs.current;

          if (!pendingScope) {
            pendingScope = scope;
          } else if (pendingScope !== scope) {
            pendingScope = 'all';
          }

          if (scope === 'catalog' || scope === 'settings' || scope === 'all') {
            pending.public = true;
          }
          if (
            cur.isAdmin &&
            (scope === 'orders' || scope === 'notifications' || scope === 'users')
          ) {
            pending.admin = true;
          }
          if (
            cur.authenticated &&
            (scope === 'users' || (actorTag && cur.syncTag && actorTag === cur.syncTag))
          ) {
            pending.user = true;
          }

          if (pending.public || pending.admin || pending.user) {
            scheduleFlush();
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          void checkLatestVersionOnWake();
        }
      });

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkLatestVersionOnWake();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      void supabase.removeChannel(channel);
    };
  }, []);

  const addToCart = useCallback(
    async ({
      productId,
      variantId,
      quantity = 1,
      redirectToCart = false,
    }: {
      productId: string;
      variantId: string;
      quantity?: number;
      redirectToCart?: boolean;
    }): Promise<boolean> => {
      if (!authenticated) {
        if (typeof window !== 'undefined') {
          const returnUrl = redirectToCart ? '/carrinho' : window.location.pathname;
          sessionStorage.setItem(
            PENDING_CART_KEY,
            JSON.stringify({ productId, variantId, quantity, returnUrl })
          );
          toast('Entre na sua conta para adicionar ao carrinho. Guardamos sua escolha!', 'info');
          router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        }
        return false;
      }

      // Optimistic instant feedback when staying on the current page
      if (!redirectToCart) {
        setCartCount((prev) => prev + quantity);
        toast('Adicionado ao carrinho com sucesso!', 'success');

        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, variantId, quantity }),
        })
          .then(async (res) => {
            const data = await res.json();
            if (res.status === 401) {
              setCartCount((prev) => Math.max(0, prev - quantity));
              if (typeof window !== 'undefined') {
                const returnUrl = window.location.pathname;
                sessionStorage.setItem(
                  PENDING_CART_KEY,
                  JSON.stringify({ productId, variantId, quantity, returnUrl })
                );
                toast('Faça login para continuar. Guardamos sua numeração!', 'info');
                router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
              }
              return;
            }
            if (!res.ok) {
              setCartCount((prev) => Math.max(0, prev - quantity));
              toast(data.error || 'Não foi possível adicionar ao carrinho.', 'error');
              return;
            }
            if (typeof data.totalItems === 'number') {
              setCartCount(data.totalItems);
            }
          })
          .catch(() => {
            setCartCount((prev) => Math.max(0, prev - quantity));
            toast('Erro de conexão ao adicionar ao carrinho.', 'error');
          });

        return true;
      }

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variantId, quantity }),
      });

      const data = await res.json();

      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          const returnUrl = '/carrinho';
          sessionStorage.setItem(
            PENDING_CART_KEY,
            JSON.stringify({ productId, variantId, quantity, returnUrl })
          );
          toast('Faça login para continuar. Guardamos sua numeração!', 'info');
          router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        }
        return false;
      }

      if (!res.ok) {
        toast(data.error || 'Não foi possível adicionar ao carrinho.', 'error');
        return false;
      }

      setCartCount(data.totalItems || 0);
      toast('Adicionado ao carrinho com sucesso!', 'success');
      router.push('/carrinho');
      return true;
    },
    [authenticated, router, toast]
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!authenticated) {
        toast('Entre na sua conta para salvar seus tênis favoritos!', 'info');
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      const wasFav = favoriteIds.includes(productId);
      setFavoriteIds((prev) =>
        wasFav ? prev.filter((id) => id !== productId) : [...prev, productId]
      );
      toast(
        wasFav ? 'Removido da sua lista de favoritos.' : 'Salvo nos seus favoritos!',
        'info'
      );

      try {
        const res = await fetch('/api/favorites', {
// step 10/12
