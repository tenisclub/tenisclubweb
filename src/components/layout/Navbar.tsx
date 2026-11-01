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
    setMobileOpen(false);
    if (q) {
      router.push(`/produtos?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/produtos');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#09090B]/90 backdrop-blur-xl">
      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-1.5 sm:gap-3">
          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 -ml-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition shrink-0"
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="shrink-0 scale-[0.9] min-[390px]:scale-100 origin-left">
            <TenisClubLogo size="md" logoUrl={settings.logo_url} />
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md mx-4 relative"
          >
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
// step 3/8
