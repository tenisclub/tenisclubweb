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
  Wallet,
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
  { href: '/admin/financeiro', label: 'Painel Financeiro', icon: Wallet },
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
// etapa 4/8
