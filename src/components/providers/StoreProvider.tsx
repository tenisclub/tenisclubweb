'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
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

interface StoreContextValue {
  authenticated: boolean;
  user: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  cartCount: number;
  favoriteIds: string[];
  unreadNotifications: number;
  refreshSession: () => Promise<void>;
  addToCart: (params: {
    productId: string;
    variantId: string;
    quantity?: number;
    redirectToCart?: boolean;
  }) => Promise<boolean>;
  toggleFavorite: (productId: string) => Promise<void>;
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
  setCartCount: React.Dispatch<React.SetStateAction<number>>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const PENDING_CART_KEY = 'tc_pending_cart_intent';

export function StoreProvider({
  children,
  initialAuth = false,
  initialUser = null,
  initialRole = 'visitor',
  initialCartCount = 0,
  initialFavoriteIds = [],
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
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(initialFavoriteIds);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setAuthenticated(Boolean(data.authenticated));
      setUser(data.user || null);
      setRole(data.role || 'visitor');
      setCartCount(data.cartCount || 0);
      setFavoriteIds(data.favoriteIds || []);
      setUnreadNotifications(data.unreadNotifications || 0);

      // Section 4.1: Replay preserved purchase intent right after authentication
      if (data.authenticated && typeof window !== 'undefined') {
        const rawIntent = sessionStorage.getItem(PENDING_CART_KEY);
        if (rawIntent) {
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
        }
      }
    } catch {
      // Ignore transient fetch errors
    }
  }, [toast]);

  useEffect(() => {
    refreshSession();
  }, [pathname, refreshSession]);

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

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variantId, quantity }),
      });

      const data = await res.json();

      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          const returnUrl = redirectToCart ? '/carrinho' : window.location.pathname;
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
      if (redirectToCart) {
        router.push('/carrinho');
      }
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
        return;
      }

      toast(
        wasFav ? 'Removido da sua lista de favoritos.' : 'Salvo nos seus favoritos!',
        'info'
      );
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
        addToCart,
        toggleFavorite,
        toast,
        setCartCount,
      }}
    >
      {children}

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
