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
// step 5/12
