'use client';

import React, { useState } from 'react';
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
  const { authenticated, user, isAdmin, cartCount, favoriteIds, unreadNotifications } = useStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-3">
          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 -ml-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition"
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <TenisClubLogo size="md" logoUrl={settings.logo_url} />
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md mx-4 relative"
          >
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tênis, marca, cor ou código..."
              className="w-full h-10 pl-10 pr-4 rounded-full bg-[#15151A] border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46] transition"
            />
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#BEFA46]/15 border border-[#BEFA46]/40 text-[#BEFA46] text-xs font-bold hover:bg-[#BEFA46]/25 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Painel Admin</span>
              </Link>
            )}

            <Link
              href={authenticated ? '/minha-conta/favoritos' : '/login?redirect=/minha-conta/favoritos'}
              className="relative p-2.5 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800/70 transition"
              title="Meus favoritos"
            >
              <Heart className="w-5 h-5" />
              {favoriteIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-zinc-700 text-[10px] font-bold text-white flex items-center justify-center">
                  {favoriteIds.length}
                </span>
              )}
            </Link>

            <Link
              href={authenticated ? '/minha-conta' : '/login'}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#15151A] border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm font-medium text-zinc-200 hover:text-white transition"
            >
              <div className="relative">
                <User className="w-4 h-4 text-[#BEFA46]" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#BEFA46]" />
                )}
              </div>
              <span className="hidden sm:inline max-w-[110px] truncate">
                {authenticated ? user?.full_name?.split(' ')[0] || 'Minha Conta' : 'Entrar'}
              </span>
            </Link>

            <Link
              href="/carrinho"
              className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#BEFA46] hover:bg-[#d0ff6b] text-[#09090B] font-bold text-xs sm:text-sm transition shadow-[0_0_20px_rgba(190,250,70,0.2)]"
              aria-label="Carrinho de compras"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.4]" />
              <span className="hidden sm:inline">Carrinho</span>
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#09090B] text-[#BEFA46] text-[11px] font-extrabold">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>

        {/* Desktop Secondary Category Nav */}
        <nav className="hidden lg:flex items-center justify-center gap-1 pb-2.5">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === '/'
                ? pathname === '/'
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition inline-flex items-center gap-1',
                  active
                    ? 'bg-[#BEFA46] text-[#09090B] font-bold'
                    : link.highlight
                      ? 'text-[#BEFA46] hover:bg-[#BEFA46]/10'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                )}
              >
                {link.highlight && <Tag className="w-3 h-3" />}
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-[#0E0E12] px-4 pt-3 pb-6 space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar produto, marca ou numeração..."
              className="w-full h-11 pl-10 pr-4 rounded-full bg-[#18181F] border border-zinc-700 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46]"
            />
          </form>

          <nav className="grid grid-cols-2 gap-2">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-semibold border transition',
                    active
                      ? 'bg-[#BEFA46] text-[#09090B] border-[#BEFA46]'
                      : 'bg-[#15151B] text-zinc-200 border-zinc-800 hover:border-zinc-700'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#BEFA46]/15 border border-[#BEFA46]/40 text-[#BEFA46] text-sm font-bold"
              >
                <ShieldCheck className="w-4 h-4" />
                Acessar Painel Administrativo
              </Link>
            )}
            <Link
              href={authenticated ? '/minha-conta' : '/login'}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-semibold"
            >
              {unreadNotifications > 0 && <Bell className="w-4 h-4 text-[#BEFA46]" />}
              {authenticated ? `Minha Conta (${user?.full_name})` : 'Entrar ou Criar Conta'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

