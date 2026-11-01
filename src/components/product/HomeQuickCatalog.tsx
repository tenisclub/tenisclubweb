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

// step 2/8
