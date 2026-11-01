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
// step 1/8
