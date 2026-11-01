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
        } else if (
          p.gender !== gender &&
          !(p.gender === 'unissex' && (gender === 'masculino' || gender === 'feminino'))
        ) {
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

  const categoryItems = useMemo(
    () => [
      { id: 'todos', slug: 'todos', name: 'Todos' },
      ...categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
    ],
    [categories]
  );

  return (
    <section className="pt-6 pb-10 bg-[#09090B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* TÊNIS CLUB Quick Filter Panel */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#101015] p-4 sm:p-6 space-y-4 shadow-xl">
          {/* Top Search & Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto, marca ou modelo..."
                className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[#17171E] border border-zinc-800/90 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46] transition"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              {hasFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpar
                </button>
              ) : (
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 sm:hidden">
                  Busca rápida
                </span>
              )}

              <Link
                href="/produtos"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#BEFA46]/30 bg-[#BEFA46]/10 hover:bg-[#BEFA46]/15 text-xs font-extrabold text-[#BEFA46] transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filtros avançados
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {/* GÊNERO */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <span className="md:w-20 shrink-0 text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">
                Gênero
              </span>
              <div className="grid grid-cols-6 sm:flex sm:flex-wrap gap-2 flex-1">
                {GENDER_OPTIONS.map((opt, idx) => {
                  const active = gender === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGender(opt.value)}
                      className={cn(
                        'h-9 px-2 sm:px-3.5 rounded-xl sm:rounded-full text-xs font-bold border transition text-center truncate cursor-pointer',
                        idx < 3 ? 'col-span-2' : 'col-span-3',
                        active
                          ? 'bg-[#BEFA46] text-[#09090B] border-[#BEFA46] font-extrabold shadow-[0_2px_10px_rgba(190,250,70,0.18)]'
                          : 'bg-[#17171E] text-zinc-300 border-zinc-800/90 hover:border-zinc-600 hover:text-white'
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TIPO */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 pt-3 border-t border-white/[0.05]">
              <span className="md:w-20 shrink-0 text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">
                Tipo
              </span>
// step 5/8
