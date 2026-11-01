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
