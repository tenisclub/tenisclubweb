'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  User,
  MapPin,
  Heart,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn } from '@/lib/utils';

const ACCOUNT_LINKS = [
  { href: '/minha-conta', label: 'Visão Geral', icon: LayoutDashboard, exact: true },
  { href: '/minha-conta/pedidos', label: 'Meus Pedidos', icon: ShoppingBag },
  { href: '/minha-conta/favoritos', label: 'Meus Favoritos', icon: Heart },
  { href: '/minha-conta/dados', label: 'Meus Dados', icon: User },
  { href: '/minha-conta/enderecos', label: 'Endereços', icon: MapPin },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout, toast } = useStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);

  useEffect(() => {
    setOptimisticHref(null);
  }, [pathname]);

  const effectivePath = optimisticHref || pathname;

  useEffect(() => {
    router.prefetch('/');
  }, [router]);

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    toast('Sessão encerrada com segurança.', 'info');
    logout('/');
  };

  return (
    <aside className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-5 space-y-3.5 lg:space-y-5">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-3.5 lg:pb-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#BEFA46]">
            Área do Cliente
          </p>
          <p className="text-sm sm:text-base font-black text-white truncate mt-0.5">
            {user?.full_name || 'Minha Conta'}
          </p>
          <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
        </div>

        {/* Compact Mobile Logout & Admin Action */}
        <div className="flex items-center gap-1.5 lg:hidden shrink-0">
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-bold text-[#BEFA46] bg-[#BEFA46]/10 border border-[#BEFA46]/30"
              title="Painel Administrativo"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 disabled:opacity-60 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? '...' : 'Sair'}</span>
          </button>
        </div>
      </div>

      <nav className="flex lg:flex-col gap-1.5 lg:gap-1 overflow-x-auto pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0">
        {ACCOUNT_LINKS.map((link) => {
          const Icon = link.icon;
          const active = link.exact
            ? effectivePath === link.href
            : effectivePath === link.href || effectivePath.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              onClick={() => setOptimisticHref(link.href)}
              className={cn(
                'flex items-center gap-2 lg:gap-3 px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap shrink-0',
                active
                  ? 'bg-[#BEFA46] text-[#09090B]'
                  : 'bg-[#18181F] lg:bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800/70'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className="hidden lg:flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#BEFA46] bg-[#BEFA46]/10 border border-[#BEFA46]/30 mt-2"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Painel Administrativo
          </Link>
        )}
      </nav>

      <div className="hidden lg:block pt-3 border-t border-zinc-800">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-red-400 hover:bg-red-500/10 transition disabled:opacity-60 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          {loggingOut ? 'Encerrando...' : 'Encerrar Sessão'}
        </button>
      </div>
    </aside>
  );
}

