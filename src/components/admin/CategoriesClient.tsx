'use client';

import React, { useState } from 'react';
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
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir esta categoria?')) return;
    const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast('Categoria excluída.', 'info');
    } else {
      toast('Não foi possível excluir (verifique se há produtos vinculados).', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white">Gerenciar Categorias</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          As categorias aparecem automaticamente nos filtros e páginas da loja.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="text-xs text-zinc-400">Nome *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Chuteira, Botina..."
            className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-zinc-400">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descrição da linha"
            className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-16 h-10 px-2 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            title="Ordem"
          />
          <button
            type="submit"
            disabled={creating}
            className="flex-1 h-10 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black inline-flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Criar
          </button>
        </div>
      </form>

      <div className="rounded-3xl border border-zinc-800 bg-[#121216] divide-y divide-zinc-800">
        {categories.map((cat) => (
          <div key={cat.id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-white">
                {cat.name}{' '}
                <span className="text-xs font-normal text-zinc-500">(/categoria/{cat.slug})</span>
              </p>
              <p className="text-xs text-zinc-400">{cat.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleActive(cat)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold',
                  cat.is_active
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-400'
                )}
              >
                {cat.is_active ? 'Ativa' : 'Inativa'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                className="p-2 text-zinc-500 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

