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
    total: number;
  }) => {
    setItems(data.items || []);
    setTotalItems(data.totalItems || 0);
    setSubtotal(data.subtotal || 0);
    setTotal(data.total || 0);
    setCartCount(data.totalItems || 0);
  };

  const recomputeAndApply = (nextItems: CartItemView[]) => {
    const active = nextItems.filter((i) => i.is_available);
    const nextTotalItems = active.reduce((acc, i) => acc + i.quantity, 0);
    const nextSubtotal = active.reduce((acc, i) => acc + i.base_price * i.quantity, 0);
    const nextTotal = active.reduce((acc, i) => acc + i.subtotal, 0);
    setItems(nextItems);
    setTotalItems(nextTotalItems);
    setSubtotal(nextSubtotal);
    setTotal(nextTotal);
    setCartCount(nextTotalItems);
  };

  const updateQty = async (itemId: string, nextQty: number) => {
    const prevSnapshot = items;
    const optimistic = items.map((i) =>
