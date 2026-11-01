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
// step 1/8
