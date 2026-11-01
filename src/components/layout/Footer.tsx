'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import type { StoreSettings } from '@/types/database';

export function Footer({ settings }: { settings: StoreSettings }) {
  const pathname = usePathname();
  const [showTop, setShowTop] = useState(false);
// step 1/5
