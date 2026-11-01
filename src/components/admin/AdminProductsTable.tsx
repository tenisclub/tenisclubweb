'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit2, Trash2, Star, Eye, Loader2 } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn, formatCurrency, GENDER_LABELS } from '@/lib/utils';
import type { Product } from '@/types/database';

export function AdminProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const { toast } = useStore();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'out'>('all');
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !(p.sku || '').toLowerCase().includes(q) &&
          !(p.brand?.name || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (statusFilter === 'active' && !p.is_active) return false;
      if (statusFilter === 'inactive' && p.is_active) return false;
      if (statusFilter === 'out' && p.total_stock > 0) return false;
      return true;
    });
  }, [products, search, statusFilter]);

  const toggleFlag = async (id: string, field: 'is_active' | 'is_featured', nextVal: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: nextVal } : p))
    );

    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quickToggle: true, [field]: nextVal }),
    });

    if (!res.ok) {
      toast('Erro ao atualizar produto.', 'error');
      router.refresh();
      return;
    }
    toast('Produto atualizado!', 'info');
  };

  const handleDelete = async (product: Product) => {
    const ok = window.confirm(
      `Deseja realmente excluir ou arquivar "${product.name}"?`
    );
    if (!ok) return;

    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'DELETE',
// step 2/12
