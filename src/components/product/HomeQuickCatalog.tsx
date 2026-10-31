'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, ArrowRight, RotateCcw } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { cn, STANDARD_SHOE_SIZES } from '@/lib/utils';
import type { Category, Product } from '@/types/database';

interface HomeQuickCatalogProps {
  products: Product[];
  categories: Category[];
  whatsapp: string;
}

const GENDER_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'infantil', label: 'Infantil' },
  { value: 'unissex', label: 'Unissex' },
];

export function HomeQuickCatalog({
  products,
  categories,
  whatsapp,
}: HomeQuickCatalogProps) {
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('todos');
  const [categorySlug, setCategorySlug] = useState('todos');
  const [selectedSize, setSelectedSize] = useState<string>('');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const hay = `${p.name} ${p.sku || ''} ${p.brand?.name || ''} ${p.category?.name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (gender !== 'todos') {
        if (gender === 'unissex') {
          if (p.gender !== 'unissex') return false;
        } else if (p.gender !== gender && !(p.gender === 'unissex' && (gender === 'masculino' || gender === 'feminino'))) {
          return false;
        }
      }

      if (categorySlug !== 'todos' && p.category?.slug !== categorySlug) {
        return false;
      }

      if (selectedSize && !p.available_sizes.includes(selectedSize)) {
        return false;
      }

      return true;
    });
  }, [products, search, gender, categorySlug, selectedSize]);

  const hasFilters =
    search.trim() !== '' || gender !== 'todos' || categorySlug !== 'todos' || selectedSize !== '';

  const resetFilters = () => {
    setSearch('');
    setGender('todos');
    setCategorySlug('todos');
    setSelectedSize('');
  };

  return (
    <section className="py-10 border-y border-zinc-900 bg-[#0A0A0D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* TÊNIS CLUB Signature Filter Bar (matching uploaded reference) */}
        <div className="rounded-3xl border border-zinc-800/90 bg-[#101014] p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full h-11 pl-10 pr-4 rounded-full bg-[#17171D] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46] transition"
              />
            </div>

            <div className="flex items-center gap-3">
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpar filtros
                </button>
              )}
              <Link
                href="/produtos"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#BEFA46] hover:underline"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filtros avançados
              </Link>
            </div>
          </div>

          {/* GÊNERO Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Gênero
            </span>
            {GENDER_OPTIONS.map((opt) => {
              const active = gender === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-bold border transition',
                    active
                      ? 'bg-[#BEFA46] text-[#09090B] border-[#BEFA46] shadow-[0_0_14px_rgba(190,250,70,0.28)]'
                      : 'bg-[#18181F] text-zinc-300 border-zinc-800 hover:border-zinc-600'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* TIPO Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Tipo
            </span>
            <button
              type="button"
              onClick={() => setCategorySlug('todos')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-bold border transition',
                categorySlug === 'todos'
                  ? 'bg-[#BEFA46] text-[#09090B] border-[#BEFA46] shadow-[0_0_14px_rgba(190,250,70,0.28)]'
                  : 'bg-[#18181F] text-zinc-300 border-zinc-800 hover:border-zinc-600'
              )}
            >
              Todos
            </button>
            {categories.map((cat) => {
              const active = categorySlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategorySlug(cat.slug)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-bold border transition',
                    active
                      ? 'bg-[#BEFA46] text-[#09090B] border-[#BEFA46] shadow-[0_0_14px_rgba(190,250,70,0.28)]'
                      : 'bg-[#18181F] text-zinc-300 border-zinc-800 hover:border-zinc-600'
                  )}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* NÚMERO Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Número
            </span>
            {STANDARD_SHOE_SIZES.map((sz) => {
              const active = selectedSize === sz;
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(active ? '' : sz)}
                  className={cn(
                    'min-w-[38px] h-8 px-2.5 rounded-full text-xs font-extrabold border transition',
                    active
                      ? 'bg-[#BEFA46] text-[#09090B] border-[#BEFA46] shadow-[0_0_14px_rgba(190,250,70,0.28)]'
                      : 'bg-[#18181F] text-zinc-300 border-zinc-800 hover:border-zinc-600'
                  )}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-12 text-center space-y-3">
            <p className="text-lg font-bold text-white">
              Nenhum calçado encontrado com esses filtros.
            </p>
            <p className="text-sm text-zinc-400">
              Experimente selecionar outra numeração ou limpar os filtros ativos.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#BEFA46] text-[#09090B] text-xs font-extrabold"
            >
              Mostrar todos os produtos
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-zinc-400">
                Exibindo <strong className="text-white">{Math.min(filtered.length, 8)}</strong> de{' '}
                <strong className="text-white">{filtered.length}</strong> pares encontrados
              </p>
              <Link
                href="/produtos"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#BEFA46] hover:underline"
              >
                Ver catálogo completo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filtered.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} whatsapp={whatsapp} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

