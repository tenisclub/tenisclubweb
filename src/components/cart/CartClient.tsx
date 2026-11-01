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
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  className="w-full h-full object-cover"
                />
              </Link>

              <div className="space-y-1 min-w-0 flex-1">
                {item.brand_name && (
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#BEFA46]">
                    {item.brand_name}
                  </span>
                )}
                <Link
                  href={`/produto/${item.product_slug}`}
                  className="block text-sm sm:text-base font-extrabold text-white hover:text-[#BEFA46] line-clamp-2 break-words"
                >
                  {item.product_name}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-200 font-semibold">
                    Tam. {item.size}
                  </span>
                  <span>Cor: {item.color}</span>
                </div>
                <div className="text-xs text-zinc-400 pt-0.5">
                  Unitário:{' '}
                  <strong className="text-zinc-200">{formatCurrency(item.unit_price)}</strong>
                </div>
                {!item.is_available && (
                  <span className="inline-block text-xs font-bold text-red-400">
                    Indisponível no estoque atual
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
              {item.is_available && (
                <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#18181F] px-2 py-1">
                  <button
                    type="button"
                    disabled={loadingId === item.id || item.quantity <= 1}
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg hover:bg-zinc-800 text-white flex items-center justify-center disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-extrabold text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={
                      loadingId === item.id ||
                      item.quantity >= (item.allow_backorder ? 99 : item.available_stock)
                    }
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg hover:bg-zinc-800 text-white flex items-center justify-center disabled:opacity-40"
                    title={
                      item.allow_backorder && item.available_stock <= 0
                        ? 'Disponível para pedido'
                        : `Estoque disponível: ${item.available_stock}`
                    }
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="text-right min-w-[95px]">
                <div className="text-base sm:text-lg font-black text-[#BEFA46]">
                  {formatCurrency(item.subtotal)}
                </div>
                <button
                  type="button"
                  disabled={loadingId === item.id}
                  onClick={() => removeItem(item.id)}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="pt-2">
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-300 hover:text-[#BEFA46]"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuar comprando
          </Link>
        </div>
      </div>

      {/* Order Summary Box */}
      <aside className="lg:col-span-4 rounded-3xl border border-zinc-800 bg-[#121216] p-5 sm:p-6 space-y-5 lg:sticky lg:top-28">
        <h2 className="text-lg font-black text-white">Resumo do Carrinho</h2>

        <div className="space-y-2.5 text-sm border-b border-zinc-800 pb-4">
          <div className="flex justify-between text-zinc-400">
            <span>Quantidade de pares</span>
            <strong className="text-white">{totalItems}</strong>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {savings > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Descontos aplicados</span>
              <span>-{formatCurrency(savings)}</span>
            </div>
          )}
// step 7/8
