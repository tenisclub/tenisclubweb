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
      );

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Erro ao salvar produto.', 'error');
        return;
      }

      toast(
        isEditing ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!',
        'success'
      );
      router.push('/admin/produtos');
      setTimeout(() => {
        React.startTransition(() => {
          router.refresh();
        });
      }, 60);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/produtos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para Produtos
          </Link>
          <h1 className="text-xl sm:text-3xl font-black text-white mt-1 break-words">
            {isEditing ? `Editar: ${initialProduct?.name}` : 'Cadastrar Novo Produto'}
          </h1>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] text-sm font-black disabled:opacity-60 shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </div>

      {/* 1. Basic & Commercial Info */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-5">
        <h2 className="text-base font-black text-white">1. Dados Comerciais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Nome comercial *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nike Air Max Pulse / Mocassim Couro Caramelo"
              className="w-full h-11 px-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Código / SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Ex: REF. 015"
              className="w-full h-11 px-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Marca</label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
            >
              <option value="">Selecione...</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Categoria / Tipo</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
            >
              <option value="">Selecione...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Gênero / Público</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as ProductGender)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
            >
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="infantil">Infantil</option>
              <option value="unissex">Unissex</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Preço de Compra / Custo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
// step 6/12
