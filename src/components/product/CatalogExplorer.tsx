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
// step 1/12
