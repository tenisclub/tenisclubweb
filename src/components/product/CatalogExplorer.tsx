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
// step 3/12
