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
      i.id === itemId ? { ...i, quantity: nextQty, subtotal: i.unit_price * nextQty } : i
    );
    recomputeAndApply(optimistic);
    setLoadingId(itemId);

    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: nextQty }),
      });
      const data = await res.json();
      if (!res.ok) {
        recomputeAndApply(prevSnapshot);
        toast(data.error || 'Erro ao atualizar quantidade.', 'error');
        return;
      }
      applyCartData(data);
    } catch {
      recomputeAndApply(prevSnapshot);
      toast('Erro ao atualizar quantidade.', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    const prevSnapshot = items;
    recomputeAndApply(items.filter((i) => i.id !== itemId));
    toast('Item removido do carrinho.', 'info');
    setLoadingId(itemId);

    try {
      const res = await fetch(`/api/cart?itemId=${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        applyCartData(data);
      } else {
        recomputeAndApply(prevSnapshot);
        toast(data.error || 'Erro ao remover item.', 'error');
      }
    } catch {
      recomputeAndApply(prevSnapshot);
      toast('Erro ao remover item.', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6 sm:my-10">
        <div className="w-16 h-16 rounded-2xl bg-[#BEFA46]/10 border border-[#BEFA46]/30 text-[#BEFA46] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">Seu carrinho está vazio</h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Explore nosso catálogo, escolha sua numeração e adicione seus pares favoritos.
        </p>
        <Link
          href="/produtos"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#BEFA46] text-[#09090B] text-sm font-extrabold"
        >
          Explorar Catálogo
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const hasUnavailable = items.some((i) => !i.is_available);
  const savings = Math.max(0, subtotal - total);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
      <div className="lg:col-span-8 space-y-4">
        {hasUnavailable && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Alguns itens no carrinho ficaram sem estoque ou inativos. Remova-os para prosseguir com o pedido.
            </span>
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-zinc-800 bg-[#121216] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
              <Link
                href={`/produto/${item.product_slug}`}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#EAE0D5] shrink-0"
// step 4/8
