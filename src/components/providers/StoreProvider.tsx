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
      if (document.cookie.includes('tc_guest_cart=')) {
        void fetch('/api/cart', { cache: 'no-store' })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && typeof data.totalItems === 'number') {
              setCartCount(data.totalItems);
            }
          })
          .catch(() => {});
      }
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
      // Optimistic instant feedback when staying on the current page (works for both logged-in users and guests)
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

      if (!res.ok) {
        toast(data.error || 'Não foi possível adicionar ao carrinho.', 'error');
        return false;
      }

      setCartCount(data.totalItems || 0);
      toast('Adicionado ao carrinho com sucesso!', 'success');
      router.push('/carrinho');
      return true;
    },
    [router, toast]
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
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });

        if (!res.ok) {
          setFavoriteIds((prev) =>
            wasFav ? [...prev, productId] : prev.filter((id) => id !== productId)
          );
          toast('Erro ao atualizar favoritos.', 'error');
        }
      } catch {
        setFavoriteIds((prev) =>
          wasFav ? [...prev, productId] : prev.filter((id) => id !== productId)
        );
        toast('Erro ao atualizar favoritos.', 'error');
      }
    },
    [authenticated, favoriteIds, pathname, router, toast]
  );

  return (
    <StoreContext.Provider
      value={{
        authenticated,
        user,
        role,
        isAdmin: role === 'super_admin' || role === 'admin_operational',
        cartCount,
        favoriteIds,
        unreadNotifications,
        refreshSession,
        hydrateSession,
        logout,
        addToCart,
        toggleFavorite,
        toast,
        showOrderConfirmedPopup,
        setCartCount,
      }}
    >
      {children}

      {/* 5-Second Order Confirmed Popup on Home ('/') */}
      {orderPopup && pathname === '/' && (
        <div
          onClick={dismissOrderPopup}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-[#BEFA46]/40 bg-[#121216] p-6 text-center space-y-4 shadow-[0_24px_70px_rgba(0,0,0,0.85)] relative overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={dismissOrderPopup}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              aria-label="Fechar confirmação"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-full bg-[#BEFA46] text-[#09090B] flex items-center justify-center mx-auto shadow-[0_0_28px_rgba(190,250,70,0.4)]">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#BEFA46] block">
                Pedido Confirmado!
              </span>
              <h3 className="text-2xl font-black text-white">
                Pedido #{orderPopup.orderNumber}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Seu pedido foi enviado com sucesso! Finalize o atendimento pelo WhatsApp da loja.
              </p>
            </div>

            {orderPopup.waUrl && (
              <a
                href={orderPopup.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#BEFA46]/15 hover:bg-[#BEFA46]/25 border border-[#BEFA46]/30 text-xs font-extrabold text-[#BEFA46] transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Abrir conversa no WhatsApp
              </a>
            )}

            {/* 5-second visual countdown bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900">
              <div
                className="h-full bg-[#BEFA46] transition-[width] duration-75 ease-linear"
                style={{ width: `${orderPopupProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Stack */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-zinc-800 bg-[#141418]/95 backdrop-blur-md px-4 py-3.5 shadow-2xl text-sm text-zinc-100 animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            {item.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-[#BEFA46] shrink-0 mt-0.5" />
            )}
            {item.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            {item.type === 'info' && (
              <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            )}
            <span className="flex-1 leading-snug font-medium">{item.message}</span>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== item.id))}
              className="text-zinc-500 hover:text-zinc-200"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
