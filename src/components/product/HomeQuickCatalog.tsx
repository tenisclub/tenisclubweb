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
// step 3/8
