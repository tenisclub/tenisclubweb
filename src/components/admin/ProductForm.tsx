'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Star,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Save,
  Sparkles,
} from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn, STANDARD_SHOE_SIZES } from '@/lib/utils';
import type { Brand, Category, Product, ProductGender } from '@/types/database';

interface EditableImage {
  url: string;
  is_primary: boolean;
}

interface EditableVariant {
  id?: string;
  color: string;
  color_hex: string;
  size: string;
  stock: number;
}

export function ProductForm({
  initialProduct,
  categories,
  brands,
}: {
  initialProduct?: Product | null;
  categories: Category[];
  brands: Brand[];
}) {
  const router = useRouter();
  const { toast } = useStore();
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [brandId, setBrandId] = useState(initialProduct?.brand_id || brands[0]?.id || '');
  const [categoryId, setCategoryId] = useState(
    initialProduct?.category_id || categories[0]?.id || ''
  );
  const [gender, setGender] = useState<ProductGender>(initialProduct?.gender || 'masculino');
  const [shortDesc, setShortDesc] = useState(initialProduct?.short_description || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [costPrice, setCostPrice] = useState(
    initialProduct?.cost_price !== undefined ? String(initialProduct.cost_price) : '0'
  );
  const [basePrice, setBasePrice] = useState(
    initialProduct?.base_price !== undefined ? String(initialProduct.base_price) : ''
  );
  const [promoPrice, setPromoPrice] = useState(
    initialProduct?.promo_price ? String(initialProduct.promo_price) : ''
  );
  const [isActive, setIsActive] = useState(initialProduct ? initialProduct.is_active : true);
  const [isFeatured, setIsFeatured] = useState(initialProduct?.is_featured || false);
// step 1/12
