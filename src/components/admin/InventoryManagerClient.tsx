'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, History, PlusCircle, MinusCircle, Sliders } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn } from '@/lib/utils';

export interface StockRowItem {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  image: string;
  color: string;
  size: string;
  quantity: number;
  lowStockThreshold: number;
  allowBackorder?: boolean;
}

export function InventoryManagerClient({ initialRows }: { initialRows: StockRowItem[] }) {
  const { toast } = useStore();
  const [rows, setRows] = useState<StockRowItem[]>(initialRows);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'zero'>('all');

  // Active Adjustment Modal
  const [activeRow, setActiveRow] = useState<StockRowItem | null>(null);
  const [operation, setOperation] = useState<'in' | 'out' | 'adjustment'>('in');
  const [amount, setAmount] = useState('1');
  const [threshold, setThreshold] = useState('3');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRows(initialRows);
    setActiveRow((prev) => {
      if (!prev) return null;
      return initialRows.find((r) => r.variantId === prev.variantId) || prev;
    });
  }, [initialRows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${r.productName} ${r.sku} ${r.color} ${r.size}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (stockFilter === 'zero' && r.quantity !== 0) return false;
      if (stockFilter === 'low' && r.quantity > r.lowStockThreshold) return false;
      return true;
    });
  }, [rows, search, stockFilter]);

  const openModal = (row: StockRowItem, op: 'in' | 'out' | 'adjustment') => {
    setActiveRow(row);
    setOperation(op);
    setAmount(op === 'adjustment' ? String(row.quantity) : '1');
    setThreshold(String(row.lowStockThreshold));
    setReason('');
  };

  const handleConfirmMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRow) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: activeRow.variantId,
          operation,
          amount: Number(amount),
          lowStockThreshold: Number(threshold),
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Erro ao movimentar estoque.', 'error');
        return;
      }

      const nextQty = Number(data.result?.new_quantity ?? activeRow.quantity);
      setRows((prev) =>
        prev.map((r) =>
          r.variantId === activeRow.variantId
            ? { ...r, quantity: nextQty, lowStockThreshold: Number(threshold) }
            : r
        )
      );
      toast('Movimentação registrada com sucesso!', 'success');
      setActiveRow(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">
            Controle de Estoque por Numeração
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Adicione entradas, baixe saídas, corrija quantidades e defina alertas mínimos com rastreabilidade.
          </p>
        </div>

        <Link
          href="/admin/movimentacoes"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#16161D] border border-zinc-800 text-xs sm:text-sm font-bold text-[#BEFA46] hover:border-zinc-600 shrink-0"
        >
          <History className="w-4 h-4" />
          Ver Histórico de Movimentações
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por produto, código, cor ou numeração..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#121216] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
          />
        </div>
        <div className="grid grid-cols-3 sm:flex gap-1.5 sm:gap-2">
          {[
            { v: 'all', l: 'Todos' },
            { v: 'low', l: 'Estoque Baixo' },
            { v: 'zero', l: 'Sem Estoque' },
          ].map((btn) => (
            <button
              key={btn.v}
              type="button"
              onClick={() => setStockFilter(btn.v as typeof stockFilter)}
              className={cn(
                'px-2 sm:px-4 h-11 rounded-xl text-[11px] sm:text-xs font-bold border transition text-center',
                stockFilter === btn.v
                  ? 'bg-[#BEFA46] text-[#09090B] border-[#BEFA46]'
                  : 'bg-[#121216] text-zinc-300 border-zinc-800'
              )}
            >
              {btn.l}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Stock Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((r) => (
          <div
            key={r.variantId}
            className="rounded-2xl border border-zinc-800 bg-[#121216] p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
