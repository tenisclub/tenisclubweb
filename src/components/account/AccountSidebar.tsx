'use client';

import React from 'react';
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
import { createClient } from '@/lib/supabase/client';
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
  const { user, isAdmin, refreshSession, toast } = useStore();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    await refreshSession();
    toast('Sessão encerrada com segurança.', 'info');
    router.push('/');
    router.refresh();
  };

  return (
    <aside className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 space-y-5">
      <div className="border-b border-zinc-800 pb-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#BEFA46]">
          Área do Cliente
        </p>
        <p className="text-base font-black text-white truncate mt-0.5">
          {user?.full_name || 'Minha Conta'}
        </p>
        <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
      </div>

      <nav className="space-y-1">
        {ACCOUNT_LINKS.map((link) => {
          const Icon = link.icon;
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition',
                active
                  ? 'bg-[#BEFA46] text-[#09090B]'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/70'
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
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#BEFA46] bg-[#BEFA46]/10 border border-[#BEFA46]/30 mt-2"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Painel Administrativo
          </Link>
        )}
      </nav>

      <div className="pt-3 border-t border-zinc-800">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-red-400 hover:bg-red-500/10 transition"
        >
          <LogOut className="w-4 h-4" />
          Encerrar Sessão
        </button>
      </div>
    </aside>
  );
}
