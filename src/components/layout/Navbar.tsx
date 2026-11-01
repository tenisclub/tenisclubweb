'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  User,
  Heart,
  Menu,
  X,
  ShieldCheck,
  Bell,
  Tag,
  LogOut,
} from 'lucide-react';
import { TenisClubLogo } from '@/components/brand/TenisClubLogo';
import { useStore } from '@/components/providers/StoreProvider';
import { cn } from '@/lib/utils';
import type { StoreSettings } from '@/types/database';

const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/produtos', label: 'Todos os tênis' },
  { href: '/categoria/masculino', label: 'Masculino' },
  { href: '/categoria/feminino', label: 'Feminino' },
  { href: '/categoria/infantil', label: 'Infantil' },
  { href: '/ofertas', label: 'Ofertas', highlight: true },
  { href: '/novidades', label: 'Novidades' },
];

export function Navbar({ settings }: { settings: StoreSettings }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authenticated, user, isAdmin, cartCount, favoriteIds, unreadNotifications, logout, toast } =
    useStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);

  useEffect(() => {
    setOptimisticHref(null);
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile menu automatically when scrolling the page on mobile
  useEffect(() => {
    if (!mobileOpen) return;
    const startY = window.scrollY;
    const handleScroll = () => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (Math.abs(window.scrollY - startY) > 10) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileOpen]);

  const effectivePath = optimisticHref || pathname;

  // Hide storefront navbar inside /admin routes (Admin has its own dedicated sidebar shell)
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
// step 2/8
