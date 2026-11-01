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
