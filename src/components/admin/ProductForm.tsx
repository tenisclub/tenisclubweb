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
      id: v.id,
      color: v.color,
      color_hex: v.color_hex,
      size: v.size,
      stock: v.stock,
    })) || []
  );

  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'products');

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          toast(data.error || `Erro ao enviar ${file.name}`, 'error');
          continue;
        }

        setImages((prev) => [
          ...prev,
          { url: data.url, is_primary: prev.length === 0 },
        ]);
      }
      toast('Upload de imagem concluído!', 'success');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const addExternalUrl = () => {
    const trimmed = externalImageUrl.trim();
    if (!trimmed.startsWith('http')) {
      toast('Informe uma URL válida começando com http/https.', 'error');
      return;
    }
    setImages((prev) => [...prev, { url: trimmed, is_primary: prev.length === 0 }]);
    setExternalImageUrl('');
  };

  const setPrimaryImage = (idx: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, is_primary: i === idx }))
    );
  };

  const moveImage = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0 && !next.some((i) => i.is_primary)) {
        next[0].is_primary = true;
      }
      return next;
    });
  };

  const generateStandardSizes = (from = 37, to = 43, defaultQty = 3) => {
    const existingKeys = new Set(variants.map((v) => `${v.color}::${v.size}`));
    const additions: EditableVariant[] = [];
    for (let s = from; s <= to; s++) {
      const key = `${defaultColor}::${s}`;
      if (!existingKeys.has(key)) {
        additions.push({
          color: defaultColor,
          color_hex: defaultColorHex,
          size: String(s),
          stock: defaultQty,
        });
      }
    }
    setVariants((prev) => [...prev, ...additions]);
  };

  const addSingleVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        color: defaultColor || 'Padrão',
        color_hex: defaultColorHex,
        size: '40',
        stock: allowBackorder ? 0 : 2,
      },
    ]);
  };

  const updateVariant = (idx: number, patch: Partial<EditableVariant>) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, ...patch } : v))
    );
  };

  const removeVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !basePrice) {
      toast('Preencha o nome do calçado e o preço de venda.', 'error');
      return;
    }

    if (variants.length === 0) {
      toast('Adicione pelo menos uma numeração ao produto.', 'error');
      return;
    }

    setSaving(true);
    try {
      const additionalInfo: Record<string, string> = {};
      if (material.trim()) additionalInfo.Material = material.trim();
      if (solado.trim()) additionalInfo.Solado = solado.trim();
      if (garantia.trim()) additionalInfo.Garantia = garantia.trim();

      const payload = {
        name,
        sku,
        brand_id: brandId || null,
        category_id: categoryId || null,
        gender,
        short_description: shortDesc,
        description,
        additional_info: additionalInfo,
        cost_price: Number(costPrice || 0),
        base_price: Number(basePrice),
        promo_price: promoPrice ? Number(promoPrice) : null,
        is_active: isActive,
        is_featured: isFeatured,
        is_new_release: isNewRelease,
        allow_backorder: allowBackorder,
        images,
        variants,
      };

      const res = await fetch(
        isEditing ? `/api/admin/products/${initialProduct!.id}` : '/api/admin/products',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
// step 4/12
