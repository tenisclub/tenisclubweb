'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn } from '@/lib/utils';
import type { Brand } from '@/types/database';

export function BrandsClient({ initialBrands }: { initialBrands: Brand[] }) {
  const { toast } = useStore();
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [name, setName] = useState('');

  useEffect(() => {
    setBrands(initialBrands);
  }, [initialBrands]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch('/api/admin/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || 'Erro ao criar marca.', 'error');
      return;
    }
    setBrands((prev) => [...prev, data.brand]);
    setName('');
    toast('Marca cadastrada!', 'success');
  };

  const toggleActive = async (brand: Brand) => {
    const res = await fetch('/api/admin/brands', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: brand.id, is_active: !brand.is_active }),
    });
    if (res.ok) {
      setBrands((prev) =>
        prev.map((b) => (b.id === brand.id ? { ...b, is_active: !b.is_active } : b))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir esta marca?')) return;
    const res = await fetch(`/api/admin/brands?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setBrands((prev) => prev.filter((b) => b.id !== id));
      toast('Marca excluída.', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
// step 3/6
