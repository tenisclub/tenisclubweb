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
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || 'Erro ao excluir produto.', 'error');
      return;
    }

    if (data.archived) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: false } : p))
      );
      toast(data.message, 'info');
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast('Produto excluído com sucesso.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Gerenciar Produtos</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Cadastre tênis, fotos, variações, preços e acompanhe o saldo por numeração.
          </p>
        </div>
        <Link
          href="/admin/produtos/novo"
          prefetch={true}
          onMouseEnter={() => router.prefetch('/admin/produtos/novo')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs sm:text-sm font-black shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
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
            placeholder="Buscar por nome, código SKU ou marca..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#121216] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-11 px-4 rounded-xl bg-[#121216] border border-zinc-800 text-xs sm:text-sm font-bold text-white"
        >
          <option value="all">Todos os status</option>
          <option value="active">Apenas ativos</option>
          <option value="inactive">Inativos / Arquivados</option>
          <option value="out">Sem estoque</option>
        </select>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-zinc-800 bg-[#121216] p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.primary_image}
                alt={p.name}
                className="w-14 h-14 rounded-xl object-cover bg-[#EAE0D5] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-white line-clamp-2 leading-snug">
                  {p.name}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                  {p.brand?.name || 'Sem marca'} • {GENDER_LABELS[p.gender]} • Tam. {p.size_range_label}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-sm font-black text-[#BEFA46]">
                    {formatCurrency(p.effective_price)}
                  </span>
                  {p.promo_price !== null && p.promo_price < p.base_price && (
                    <span className="text-[11px] text-zinc-500 line-through">
                      {formatCurrency(p.base_price)}
                    </span>
                  )}
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[11px] font-extrabold',
                      p.total_stock === 0
                        ? p.allow_backorder
                          ? 'bg-sky-500/15 text-sky-300'
                          : 'bg-red-500/15 text-red-400'
                        : p.total_stock <= 5
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-emerald-500/15 text-emerald-400'
                    )}
                  >
                    {p.total_stock} un.
                  </span>
                  {p.allow_backorder && (
                    <span className="px-2 py-0.5 rounded-full bg-[#BEFA46]/15 text-[#BEFA46] text-[10px] font-bold">
                      Venda s/ estoque
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleFlag(p.id, 'is_active', !p.is_active)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-bold border transition',
                    p.is_active
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  )}
                >
                  {p.is_active ? 'Ativo' : 'Inativo'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFlag(p.id, 'is_featured', !p.is_featured)}
                  className={cn(
                    'p-1.5 rounded-lg border transition',
                    p.is_featured
                      ? 'border-[#BEFA46] bg-[#BEFA46]/15 text-[#BEFA46]'
                      : 'border-zinc-800 text-zinc-500'
                  )}
                  title="Destacar na Home"
                >
                  <Star className={cn('w-3.5 h-3.5', p.is_featured && 'fill-current')} />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/produto/${p.slug}`}
                  target="_blank"
                  className="p-2 rounded-lg bg-zinc-800/80 text-zinc-300"
                  title="Visualizar na loja"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                <Link
                  href={`/admin/produtos/${p.id}`}
                  prefetch={true}
                  onTouchStart={() => router.prefetch(`/admin/produtos/${p.id}`)}
                  onClick={() => setOpeningId(p.id)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-[#BEFA46] text-xs font-bold inline-flex items-center gap-1"
                >
                  {openingId === p.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Edit2 className="w-3.5 h-3.5" />
                  )}
                  {openingId === p.id ? 'Abrindo...' : 'Editar'}
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(p)}
                  className="p-2 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-red-400"
                  title="Excluir / Arquivar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-[#121216] p-8 text-center text-xs text-zinc-500">
            Nenhum produto encontrado.
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-3xl border border-zinc-800 bg-[#121216] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#17171E] text-zinc-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Produto</th>
                <th className="px-4 py-3.5">Marca / Linha</th>
                <th className="px-4 py-3.5">Preço</th>
                <th className="px-4 py-3.5">Estoque Total</th>
                <th className="px-4 py-3.5">Destaque</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-900/40">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.primary_image}
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover bg-[#EAE0D5] shrink-0"
                      />
                      <div>
                        <p className="font-extrabold text-white">{p.name}</p>
                        <p className="text-[11px] text-zinc-500">
                          {p.sku || 'Sem SKU'} • Tam. {p.size_range_label}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-zinc-300">
                    <p className="font-semibold">{p.brand?.name || '—'}</p>
                    <p className="text-[11px] text-zinc-500">
                      {GENDER_LABELS[p.gender]} • {p.category?.name || 'Geral'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    {p.promo_price !== null && p.promo_price < p.base_price && (
                      <span className="block text-[11px] text-zinc-500 line-through">
                        {formatCurrency(p.base_price)}
                      </span>
                    )}
                    <span className="font-black text-[#BEFA46]">
                      {formatCurrency(p.effective_price)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-extrabold',
                          p.total_stock === 0
                            ? p.allow_backorder
                              ? 'bg-sky-500/15 text-sky-300'
                              : 'bg-red-500/15 text-red-400'
                            : p.total_stock <= 5
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-emerald-500/15 text-emerald-400'
                        )}
                      >
                        {p.total_stock} un.
                      </span>
                      {p.allow_backorder && (
                        <span className="px-2 py-0.5 rounded-full bg-[#BEFA46]/15 text-[#BEFA46] text-[10px] font-bold">
                          Venda s/ estoque
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleFlag(p.id, 'is_featured', !p.is_featured)}
                      className={cn(
                        'p-2 rounded-lg border transition',
                        p.is_featured
                          ? 'border-[#BEFA46] bg-[#BEFA46]/15 text-[#BEFA46]'
                          : 'border-zinc-800 text-zinc-500 hover:text-white'
                      )}
                      title="Destacar na Home"
                    >
                      <Star className={cn('w-4 h-4', p.is_featured && 'fill-current')} />
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleFlag(p.id, 'is_active', !p.is_active)}
                      className={cn(
                        'px-3 py-1 rounded-full text-[11px] font-bold border transition',
                        p.is_active
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      )}
                    >
                      {p.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/produto/${p.slug}`}
                        target="_blank"
                        className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300"
                        title="Visualizar na loja"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/produtos/${p.id}`}
                        prefetch={true}
                        onMouseEnter={() => router.prefetch(`/admin/produtos/${p.id}`)}
                        onClick={() => setOpeningId(p.id)}
                        className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-[#BEFA46]"
                        title="Editar produto"
                      >
// step 11/12
