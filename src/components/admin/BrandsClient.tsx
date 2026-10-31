'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn } from '@/lib/utils';
import type { Brand } from '@/types/database';

export function BrandsClient({ initialBrands }: { initialBrands: Brand[] }) {
  const { toast } = useStore();
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [name, setName] = useState('');

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
        <h1 className="text-2xl font-black text-white">Gerenciar Marcas</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Marcas exibidas no cadastro de produtos e filtros do catálogo.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 flex gap-3"
      >
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Mizuno, Asics, Olympikus..."
          className="flex-1 h-11 px-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
        />
        <button
          type="submit"
          className="px-5 h-11 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Adicionar Marca
        </button>
      </form>

      <div className="rounded-3xl border border-zinc-800 bg-[#121216] divide-y divide-zinc-800">
        {brands.map((brand) => (
          <div key={brand.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold text-white">{brand.name}</p>
              <p className="text-xs text-zinc-500">Slug: {brand.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleActive(brand)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold',
                  brand.is_active
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-400'
                )}
              >
                {brand.is_active ? 'Ativa' : 'Inativa'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(brand.id)}
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
