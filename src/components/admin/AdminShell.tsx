'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Award,
  Boxes,
  History,
  ShoppingCart,
  Users,
  Tag,
  ShieldAlert,
  Settings,
  BarChart3,
  ExternalLink,
  Menu,
  X,
  LogOut,
  Loader2,
} from 'lucide-react';
import { TenisClubLogo } from '@/components/brand/TenisClubLogo';
import { useStore } from '@/components/providers/StoreProvider';
import { cn } from '@/lib/utils';
import type { UserProfile, UserRole } from '@/types/database';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/estoque', label: 'Controle de Estoque', icon: Boxes },
  { href: '/admin/movimentacoes', label: 'Movimentações', icon: History },
  { href: '/admin/categorias', label: 'Categorias', icon: Layers },
  { href: '/admin/marcas', label: 'Marcas', icon: Award },
  { href: '/admin/promocoes', label: 'Promoções', icon: Tag },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/admin/configuracoes', label: 'Configurações da Loja', icon: Settings },
  { href: '/admin/administradores', label: 'Administradores', icon: ShieldAlert, superOnly: true },
];

export function AdminShell({
  children,
  profile,
  role,
  pendingOrdersCount,
  unreadAdminNotifs,
}: {
  children: React.ReactNode;
  profile: UserProfile;
  role: UserRole;
  pendingOrdersCount: number;
  unreadAdminNotifs: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, toast } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);
  const [livePendingOrders, setLivePendingOrders] = useState(pendingOrdersCount);
  const [liveUnreadNotifs, setLiveUnreadNotifs] = useState(unreadAdminNotifs);
  const loggingOutRef = useRef(false);
  const lastStatsFetchRef = useRef(Date.now());

  const isSuper = role === 'super_admin';
  const effectivePath = optimisticHref || pathname;
  const isNavigating = Boolean(optimisticHref && optimisticHref !== pathname);

  useEffect(() => {
    setOptimisticHref(null);
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const startY = window.scrollY;
    const handleScroll = () => {
      if (Math.abs(window.scrollY - startY) > 10) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sidebarOpen]);

  useEffect(() => {
    router.prefetch('/login');
  }, [router]);

  useEffect(() => {
    setLivePendingOrders(pendingOrdersCount);
  }, [pendingOrdersCount]);

  useEffect(() => {
    setLiveUnreadNotifs(unreadAdminNotifs);
  }, [unreadAdminNotifs]);

  const fetchAdminStats = useCallback(async (force = false) => {
    if (loggingOutRef.current) return;
    const now = Date.now();
    if (!force && now - lastStatsFetchRef.current < 10_000) return;
    lastStatsFetchRef.current = now;

    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (!res.ok || loggingOutRef.current) return;
      const data = await res.json();
      if (typeof data.pendingOrdersCount === 'number') {
        setLivePendingOrders(data.pendingOrdersCount);
      }
      if (typeof data.unreadAdminNotifs === 'number') {
        setLiveUnreadNotifs(data.unreadAdminNotifs);
      }
    } catch {
      // Ignore transient errors
    }
  }, []);

  useEffect(() => {
    const onSync = (e: Event) => {
      const custom = e as CustomEvent<{ pendingOrdersCount?: number }>;
      if (typeof custom.detail?.pendingOrdersCount === 'number') {
        setLivePendingOrders(custom.detail.pendingOrdersCount);
      } else {
        void fetchAdminStats(true);
      }
    };
    const onFocus = () => {
      if (document.visibilityState === 'visible') {
        void fetchAdminStats(false);
      }
    };

    window.addEventListener('tc:admin-stats-sync', onSync);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('tc:admin-stats-sync', onSync);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [fetchAdminStats]);

  const handleLogout = () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setLoggingOut(true);
    setSidebarOpen(false);
    toast('Sessão encerrada com segurança.', 'info');
    logout('/login');
  };

  const visibleLinks = ADMIN_NAV.filter((item) => !item.superOnly || isSuper);

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-68 lg:flex-col lg:fixed lg:inset-y-0 border-r border-zinc-800/90 bg-[#0D0D11] z-40">
        <div className="h-20 px-6 flex items-center justify-between border-b border-zinc-800/80">
          <Link href="/admin" prefetch={true} onClick={() => setOptimisticHref('/admin')}>
            <TenisClubLogo size="sm" />
          </Link>
          <span className="px-2 py-0.5 rounded-md bg-[#BEFA46]/15 text-[#BEFA46] text-[10px] font-black uppercase">
            Admin
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {visibleLinks.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? effectivePath === item.href
              : effectivePath === item.href || effectivePath.startsWith(`${item.href}/`);
            const itemPending = optimisticHref === item.href && pathname !== item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onMouseEnter={() => router.prefetch(item.href)}
                onClick={() => {
                  if (pathname !== item.href) setOptimisticHref(item.href);
                }}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors duration-100',
                  active
                    ? 'bg-[#BEFA46] text-[#09090B]'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/70'
                )}
              >
                <span className="flex items-center gap-3">
                  {itemPending ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4 shrink-0" />
                  )}
                  {item.label}
                </span>
                {item.href === '/admin/pedidos' && livePendingOrders > 0 && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-black',
                      active
                        ? 'bg-[#09090B] text-[#BEFA46]'
                        : 'bg-amber-500/20 text-amber-300'
                    )}
                  >
                    {livePendingOrders}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800/80 space-y-3">
          <div className="rounded-xl bg-[#14141A] border border-zinc-800 p-3">
            <p className="text-xs font-extrabold text-white truncate">{profile.full_name}</p>
            <p className="text-[11px] text-[#BEFA46] font-semibold">
              {isSuper ? 'Administrador Principal' : 'Administrador Operacional'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              prefetch={true}
              className="h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-bold text-zinc-200 inline-flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver Loja
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 inline-flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              {loggingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-68 flex flex-col min-w-0">
        {/* Top Admin Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-zinc-800/80 bg-[#09090B]/92 backdrop-blur-md px-3.5 sm:px-8 flex items-center justify-between gap-2 relative overflow-hidden">
          {isNavigating && (
            <div className="absolute inset-x-0 top-0 h-0.5 bg-[#BEFA46]/25 overflow-hidden">
              <div className="h-full w-1/3 bg-[#BEFA46] animate-pulse" />
            </div>
          )}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-zinc-800/80 text-white shrink-0"
              aria-label="Abrir menu administrativo"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs sm:text-sm font-bold text-zinc-300 truncate">
              <span className="sm:hidden">Admin • </span>
              <span className="hidden sm:inline">Central de Operações • </span>
              <strong className="text-white">Tênis Club</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {liveUnreadNotifs > 0 && (
              <Link
                href="/admin"
                prefetch={true}
                onClick={() => setOptimisticHref('/admin')}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#BEFA46]/15 border border-[#BEFA46]/40 text-[#BEFA46] text-[11px] sm:text-xs font-extrabold whitespace-nowrap"
              >
                <span className="sm:hidden">{liveUnreadNotifs} alerta(s)</span>
                <span className="hidden sm:inline">{liveUnreadNotifs} alerta(s) pendente(s)</span>
              </Link>
            )}
            <Link
              href="/admin/produtos/novo"
              prefetch={true}
              onMouseEnter={() => router.prefetch('/admin/produtos/novo')}
              onClick={() => setOptimisticHref('/admin/produtos/novo')}
              className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black"
            >
              + Novo Produto
            </Link>
          </div>
// step 6/8
