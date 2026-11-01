'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { formatCurrency } from '@/lib/utils';
import type { CartItemView } from '@/types/database';

export function CartClient({
  initialItems,
  initialTotalItems,
  initialSubtotal,
  initialTotal,
}: {
  initialItems: CartItemView[];
  initialTotalItems: number;
  initialSubtotal: number;
  initialTotal: number;
}) {
  const { setCartCount, toast } = useStore();
  const [items, setItems] = useState<CartItemView[]>(initialItems);
  const [totalItems, setTotalItems] = useState(initialTotalItems);
  const [subtotal, setSubtotal] = useState(initialSubtotal);
  const [total, setTotal] = useState(initialTotal);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (loadingId !== null) return;
    setItems(initialItems);
    setTotalItems(initialTotalItems);
    setSubtotal(initialSubtotal);
    setTotal(initialTotal);
    setCartCount(initialTotalItems);
  }, [initialItems, initialTotalItems, initialSubtotal, initialTotal, loadingId, setCartCount]);

  const applyCartData = (data: {
    items: CartItemView[];
    totalItems: number;
    subtotal: number;
// step 1/8
