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
