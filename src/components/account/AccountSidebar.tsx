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
// step 3/6
