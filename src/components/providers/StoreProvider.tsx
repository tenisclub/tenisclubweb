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
