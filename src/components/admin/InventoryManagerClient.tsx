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
// step 3/12
