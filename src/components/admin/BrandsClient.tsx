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
// step 2/6
