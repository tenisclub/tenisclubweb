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
  const [isNewRelease, setIsNewRelease] = useState(
    initialProduct ? initialProduct.is_new_release : true
  );
  const [allowBackorder, setAllowBackorder] = useState(
    Boolean(initialProduct?.allow_backorder)
  );

  // Additional info specs
  const [material, setMaterial] = useState(initialProduct?.additional_info?.Material || '');
  const [solado, setSolado] = useState(initialProduct?.additional_info?.Solado || '');
  const [garantia, setGarantia] = useState(
    initialProduct?.additional_info?.Garantia || '90 dias contra defeitos'
  );

  // Images Gallery
  const [images, setImages] = useState<EditableImage[]>(
    initialProduct?.images?.map((img) => ({
      url: img.url,
      is_primary: img.is_primary,
    })) || []
  );
  const [externalImageUrl, setExternalImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Variants & Per-Size Stock
  const [defaultColor, setDefaultColor] = useState(
    initialProduct?.variants[0]?.color || 'Preto'
  );
  const [defaultColorHex, setDefaultColorHex] = useState(
    initialProduct?.variants[0]?.color_hex || '#18181B'
  );
  const [variants, setVariants] = useState<EditableVariant[]>(
    initialProduct?.variants?.map((v) => ({
