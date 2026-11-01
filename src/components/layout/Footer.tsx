'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import type { StoreSettings } from '@/types/database';

export function Footer({ settings }: { settings: StoreSettings }) {
  const pathname = usePathname();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (pathname.startsWith('/admin')) {
    return null;
  }

// step 2/5
