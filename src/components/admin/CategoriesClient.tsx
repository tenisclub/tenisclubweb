'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/database';

export function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const { toast } = useStore();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, sort_order: Number(sortOrder || 0) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Erro ao criar categoria.', 'error');
        return;
      }
      setCategories((prev) => [...prev, data.category]);
      setName('');
      setDescription('');
      toast('Categoria criada!', 'success');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (cat: Category) => {
    const res = await fetch('/api/admin/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cat.id, is_active: !cat.is_active }),
    });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: !cat.is_active } : c))
      );
      toast('Categoria atualizada.', 'info');
// step 2/6
