'use client';

import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { cn, STANDARD_SHOE_SIZES } from '@/lib/utils';
import type { Brand, Category, Product } from '@/types/database';

interface CatalogExplorerProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  whatsapp: string;
  initialQuery?: string;
  initialGender?: string;
  initialCategory?: string;
  initialOnlyPromo?: boolean;
  initialOnlyNew?: boolean;
  heading?: string;
  subheading?: string;
}

const PAGE_SIZE = 8;

export function CatalogExplorer({
  products,
  categories,
  brands,
  whatsapp,
  initialQuery = '',
  initialGender = 'todos',
  initialCategory = 'todos',
  initialOnlyPromo = false,
  initialOnlyNew = false,
  heading = 'Catálogo Completo',
  subheading = 'Filtre por marca, numeração, cor, categoria ou faixa de preço.',
}: CatalogExplorerProps) {
  const [search, setSearch] = useState(initialQuery);
  const [gender, setGender] = useState(initialGender);
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState('todas');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('todas');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyPromo, setOnlyPromo] = useState(initialOnlyPromo);
  const [onlyNew, setOnlyNew] = useState(initialOnlyNew);
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc' | 'bestsellers' | 'popular'>('newest');
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Extract distinct colors dynamically
  const availableColors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.variants.forEach((v) => v.color && set.add(v.color)));
    return Array.from(set).sort();
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    let list = products.filter((p) => {
      if (search.trim()) {
        const terms = search.toLowerCase().trim().split(/\s+/);
        const hay = [
          p.name,
          p.sku || '',
          p.brand?.name || '',
          p.category?.name || '',
          p.gender,
          p.short_description,
          ...p.variants.map((v) => v.color),
        ]
          .join(' ')
          .toLowerCase();
        if (!terms.every((t) => hay.includes(t))) return false;
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

      if (category !== 'todos' && p.category?.slug !== category) {
        return false;
      }

      if (brand !== 'todas' && p.brand?.slug !== brand) {
        return false;
      }

      if (size && !p.available_sizes.includes(size)) {
        return false;
      }

      if (color !== 'todas' && !p.variants.some((v) => v.color === color)) {
        return false;
      }

      if (minPrice !== '' && p.effective_price < Number(minPrice)) {
        return false;
      }

      if (maxPrice !== '' && p.effective_price > Number(maxPrice)) {
        return false;
      }

      if (onlyAvailable && p.total_stock <= 0 && !p.allow_backorder) {
        return false;
      }

      if (onlyPromo && p.discount_percent <= 0) {
        return false;
      }

      if (onlyNew && !p.is_new_release) {
        return false;
      }

      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return a.effective_price - b.effective_price;
        case 'price_desc':
          return b.effective_price - a.effective_price;
        case 'bestsellers':
          return b.sold_count - a.sold_count;
        case 'popular':
          return b.views_count + b.sold_count * 2 - (a.views_count + a.sold_count * 2);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  }, [
    products,
    search,
    gender,
    category,
    brand,
    size,
    color,
    minPrice,
    maxPrice,
    onlyAvailable,
    onlyPromo,
    onlyNew,
    sort,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredAndSorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetAll = () => {
    setSearch('');
    setGender('todos');
    setCategory('todos');
    setBrand('todas');
    setSize('');
    setColor('todas');
    setMinPrice('');
    setMaxPrice('');
    setOnlyAvailable(false);
    setOnlyPromo(false);
    setOnlyNew(false);
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            {heading}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">{subheading}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden inline-flex items-center gap-2 h-10 px-3.5 rounded-xl bg-[#16161C] border border-zinc-800 text-xs font-bold text-white shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#BEFA46]" />
            {mobileFiltersOpen ? 'Ocultar Filtros' : 'Filtrar'}
          </button>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end min-w-0">
            <label htmlFor="sort-select" className="text-xs font-semibold text-zinc-400 hidden min-[380px]:inline shrink-0">
              Ordenar:
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as typeof sort);
                setPage(1);
              }}
              className="h-10 w-full sm:w-auto px-3 rounded-xl bg-[#16161C] border border-zinc-800 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#BEFA46]"
            >
              <option value="newest">Mais recentes</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="bestsellers">Mais vendidos</option>
              <option value="popular">Mais populares</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside
          className={cn(
            'lg:col-span-3 space-y-6 rounded-2xl border border-zinc-800/90 bg-[#111115] p-5',
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-widest text-white">
              Filtros
            </span>
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#BEFA46] hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar
            </button>
          </div>

          {/* Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400">Busca rápida</label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Modelo, marca, ref..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-400 block">Gênero</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { v: 'todos', l: 'Todos' },
                { v: 'masculino', l: 'Masculino' },
                { v: 'feminino', l: 'Feminino' },
                { v: 'infantil', l: 'Infantil' },
                { v: 'unissex', l: 'Unissex' },
              ].map((g) => (
                <button
                  key={g.v}
                  type="button"
                  onClick={() => {
                    setGender(g.v);
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold border transition',
                    gender === g.v
                      ? 'bg-[#BEFA46] text-[#09090B] border-[#BEFA46]'
                      : 'bg-[#18181F] text-zinc-300 border-zinc-800 hover:border-zinc-600'
                  )}
                >
                  {g.l}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 block">Categoria / Tipo</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs font-medium text-white focus:outline-none focus:border-[#BEFA46]"
            >
              <option value="todos">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 block">Marca</label>
            <select
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs font-medium text-white focus:outline-none focus:border-[#BEFA46]"
            >
              <option value="todas">Todas as marcas</option>
              {brands.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-400 block">Numeração</span>
            <div className="grid grid-cols-4 gap-1.5">
              {STANDARD_SHOE_SIZES.map((sz) => {
                const active = size === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      setSize(active ? '' : sz);
                      setPage(1);
                    }}
                    className={cn(
                      'h-8 rounded-lg text-xs font-bold border transition',
                      active
                        ? 'bg-[#BEFA46] text-[#09090B] border-[#BEFA46]'
                        : 'bg-[#18181F] text-zinc-300 border-zinc-800 hover:border-zinc-600'
                    )}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 block">Cor</label>
            <select
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs font-medium text-white focus:outline-none focus:border-[#BEFA46]"
            >
              <option value="todas">Todas as cores</option>
              {availableColors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-400 block">Faixa de preço (R$)</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="Mín"
                className="h-9 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46]"
              />
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="Máx"
                className="h-9 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-800">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => {
                  setOnlyAvailable(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 accent-[#BEFA46] rounded"
              />
              Apenas disponíveis em estoque
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={onlyPromo}
                onChange={(e) => {
                  setOnlyPromo(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 accent-[#BEFA46] rounded"
              />
              Em promoção / Ofertas
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={onlyNew}
                onChange={(e) => {
                  setOnlyNew(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 accent-[#BEFA46] rounded"
              />
              Lançamentos / Novidades
            </label>
          </div>
        </aside>

        {/* Product Grid + Pagination */}
        <div className="lg:col-span-9 space-y-6">
          <div className="text-xs text-zinc-400">
            <strong className="text-white">{filteredAndSorted.length}</strong> produto(s)
            encontrado(s)
          </div>

          {pageItems.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 sm:p-12 text-center space-y-3">
              <p className="text-base sm:text-lg font-bold text-white">
                Nenhum produto encontrado para essa combinação.
              </p>
              <p className="text-xs sm:text-sm text-zinc-400">
                Tente remover alguns filtros ou buscar por outro modelo.
              </p>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#BEFA46] text-[#09090B] text-xs font-extrabold"
              >
                Limpar todos os filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {pageItems.map((product) => (
                  <ProductCard key={product.id} product={product} whatsapp={whatsapp} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-6">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="h-10 px-3.5 rounded-xl border border-zinc-800 bg-[#141419] text-xs font-bold text-zinc-200 disabled:opacity-40 inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>

                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setPage(num);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={cn(
                        'w-10 h-10 rounded-xl text-xs font-extrabold border transition',
                        num === safePage
                          ? 'bg-[#BEFA46] text-[#09090B] border-[#BEFA46]'
                          : 'bg-[#141419] text-zinc-300 border-zinc-800 hover:border-zinc-600'
                      )}
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => {
                      setPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="h-10 px-3.5 rounded-xl border border-zinc-800 bg-[#141419] text-xs font-bold text-zinc-200 disabled:opacity-40 inline-flex items-center gap-1"
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

