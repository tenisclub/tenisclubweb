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
              <div className="flex items-center gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.image}
                  alt={r.productName}
                  className="w-12 h-12 rounded-xl object-cover bg-[#EAE0D5] shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{r.productName}</p>
                  <p className="text-[11px] text-zinc-400">
                    Cor: {r.color} • Tam. <strong className="text-white">{r.size}</strong>
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-zinc-500">
                      Alerta mín.: {r.lowStockThreshold} un.
                    </span>
                    {r.allowBackorder && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 text-[9px] font-bold">
                        Venda s/ estoque
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0',
                  r.quantity === 0
                    ? r.allowBackorder
                      ? 'bg-sky-500/15 text-sky-300'
                      : 'bg-red-500/15 text-red-400'
                    : r.quantity <= r.lowStockThreshold
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-emerald-500/15 text-emerald-400'
                )}
              >
                {r.quantity} un.
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => openModal(r, 'in')}
                className="h-9 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs font-bold inline-flex items-center justify-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Entrada
              </button>
              <button
                type="button"
                onClick={() => openModal(r, 'out')}
                className="h-9 rounded-xl bg-red-500/15 text-red-300 text-xs font-bold inline-flex items-center justify-center gap-1"
              >
                <MinusCircle className="w-3.5 h-3.5" />
                Saída
              </button>
              <button
                type="button"
                onClick={() => openModal(r, 'adjustment')}
                className="h-9 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold inline-flex items-center justify-center gap-1"
              >
                <Sliders className="w-3.5 h-3.5" />
                Corrigir
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-[#121216] p-8 text-center text-xs text-zinc-500">
            Nenhuma numeração encontrada.
          </div>
        )}
      </div>

      {/* Desktop Inventory Table */}
      <div className="hidden md:block rounded-3xl border border-zinc-800 bg-[#121216] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#17171E] text-zinc-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Modelo</th>
                <th className="px-4 py-3.5">Cor</th>
                <th className="px-4 py-3.5">Numeração</th>
                <th className="px-4 py-3.5">Quantidade</th>
                <th className="px-4 py-3.5">Alerta Mín.</th>
                <th className="px-4 py-3.5 text-right">Operações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filtered.map((r) => (
                <tr key={r.variantId} className="hover:bg-zinc-900/40">
                  <td className="px-4 py-3">
// step 7/12
