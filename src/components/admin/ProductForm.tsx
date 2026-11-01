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
              className="w-full h-11 px-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Preço de Venda (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Preço Promocional (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={promoPrice}
              onChange={(e) => setPromoPrice(e.target.value)}
              placeholder="Opcional"
              className="w-full h-11 px-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-zinc-300">Resumo curto</label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Frase de impacto exibida nos cards e SEO"
              className="mt-1 w-full h-10 px-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300">Descrição completa</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full p-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-zinc-400">Material</label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Ex: Couro Legítimo / Mesh"
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400">Solado</label>
            <input
              type="text"
              value={solado}
              onChange={(e) => setSolado(e.target.value)}
              placeholder="Ex: Borracha Antiderrapante"
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400">Garantia</label>
            <input
              type="text"
              value={garantia}
              onChange={(e) => setGarantia(e.target.value)}
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
        </div>

        {/* Status Toggles */}
        <div className="flex flex-wrap gap-6 pt-3 border-t border-zinc-800 text-xs font-bold text-zinc-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-[#BEFA46]"
            />
            Produto Ativo na Loja
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 accent-[#BEFA46]"
            />
            Destaque na Página Inicial
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isNewRelease}
              onChange={(e) => setIsNewRelease(e.target.checked)}
              className="w-4 h-4 accent-[#BEFA46]"
            />
            Marcar como Lançamento / Novidade
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[#BEFA46]">
            <input
              type="checkbox"
              checked={allowBackorder}
              onChange={(e) => setAllowBackorder(e.target.checked)}
              className="w-4 h-4 accent-[#BEFA46]"
            />
            Vender mesmo sem estoque
          </label>
        </div>
      </div>

      {/* 2. Multi-Image Gallery Manager */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">2. Fotos do Produto</h2>
            <p className="text-xs text-zinc-400">
              Envie do computador/celular (JPG, PNG, WEBP até 5 MB), defina a principal e ordene.
            </p>
          </div>

          <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black cursor-pointer shrink-0">
            <Upload className="w-4 h-4" />
            {uploading ? 'Enviando...' : 'Enviar Imagens'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={externalImageUrl}
            onChange={(e) => setExternalImageUrl(e.target.value)}
            placeholder="Ou cole o link de uma foto (https://...)"
            className="flex-1 h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
          />
          <button
            type="button"
            onClick={addExternalUrl}
            className="w-full sm:w-auto px-4 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white shrink-0"
          >
            Adicionar URL
          </button>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div
                key={`${img.url}-${idx}`}
                className={cn(
                  'rounded-2xl border p-2.5 bg-[#18181F] space-y-2',
                  img.is_primary ? 'border-[#BEFA46]' : 'border-zinc-800'
                )}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-[#EAE0D5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  {img.is_primary && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#BEFA46] text-[#09090B] text-[10px] font-black">
                      Principal
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => setPrimaryImage(idx)}
                    className={cn(
                      'p-1.5 rounded-lg text-xs',
                      img.is_primary ? 'text-[#BEFA46]' : 'text-zinc-400 hover:text-white'
                    )}
                    title="Definir como foto principal"
                  >
                    <Star className={cn('w-4 h-4', img.is_primary && 'fill-current')} />
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, -1)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-30"
                      title="Mover para esquerda"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => moveImage(idx, 1)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-30"
                      title="Mover para direita"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-1.5 rounded-lg bg-red-500/15 text-red-400"
                      title="Excluir imagem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Variants & Per-Size Stock Matrix */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">
              3. Numerações, Cores e Estoque por Tamanho
            </h2>
            <p className="text-xs text-zinc-400">
              Controle individualizado por cor e numeração.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={defaultColor}
                onChange={(e) => setDefaultColor(e.target.value)}
                placeholder="Cor (ex: Preto)"
                className="flex-1 sm:w-36 h-9 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
              />
              <input
                type="color"
                value={defaultColorHex}
                onChange={(e) => setDefaultColorHex(e.target.value)}
                className="w-9 h-9 rounded-lg bg-transparent border border-zinc-700 cursor-pointer shrink-0"
                title="Cor visual"
              />
            </div>
            <button
              type="button"
              onClick={() => generateStandardSizes(37, 43, allowBackorder ? 0 : 3)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-[#BEFA46]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Gerar 37 ao 43
            </button>
            <button
              type="button"
              onClick={() => generateStandardSizes(34, 39, allowBackorder ? 0 : 3)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200"
            >
              Gerar 34 ao 39
            </button>
            <button
              type="button"
              onClick={addSingleVariant}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3.5 h-9 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Linha
            </button>
          </div>
        </div>

        {/* Allow Backorder Toggle Box inside Stock Section */}
        <label
          className={cn(
            'flex items-start sm:items-center justify-between gap-3 rounded-2xl border p-3.5 cursor-pointer transition',
            allowBackorder
              ? 'border-[#BEFA46]/50 bg-[#BEFA46]/10'
              : 'border-zinc-800 bg-[#18181F] hover:border-zinc-700'
          )}
        >
          <div className="flex items-start sm:items-center gap-3">
            <input
              type="checkbox"
              checked={allowBackorder}
              onChange={(e) => setAllowBackorder(e.target.checked)}
              className="w-4 h-4 accent-[#BEFA46] mt-0.5 sm:mt-0 shrink-0"
            />
            <div className="space-y-0.5">
              <span className="block text-xs sm:text-sm font-extrabold text-white">
                Vender este produto mesmo sem estoque
              </span>
              <span className="block text-[11px] sm:text-xs text-zinc-400">
                Quando ativado, o cliente pode escolher qualquer numeração abaixo e finalizar o pedido mesmo com saldo 0.
              </span>
            </div>
          </div>
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0',
              allowBackorder
                ? 'bg-[#BEFA46] text-[#09090B]'
                : 'bg-zinc-800 text-zinc-400'
            )}
          >
            {allowBackorder ? 'Ativado' : 'Desativado'}
          </span>
        </label>

        {variants.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">
            Nenhuma numeração adicionada. Use os botões acima para gerar a grade de tamanhos.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {variants.map((v, idx) => (
              <div
                key={`${v.id || idx}`}
                className="rounded-2xl border border-zinc-800 bg-[#18181F] p-3 flex flex-wrap sm:flex-nowrap items-center gap-2"
              >
                <input
                  type="color"
                  value={v.color_hex}
                  onChange={(e) => updateVariant(idx, { color_hex: e.target.value })}
                  className="w-7 h-7 rounded bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={v.color}
                  onChange={(e) => updateVariant(idx, { color: e.target.value })}
                  placeholder="Cor"
                  className="flex-1 min-w-[78px] sm:w-24 h-9 px-2.5 rounded-lg bg-[#111116] border border-zinc-800 text-xs text-white"
                />
                <select
                  value={v.size}
                  onChange={(e) => updateVariant(idx, { size: e.target.value })}
                  className="w-16 h-9 px-1.5 rounded-lg bg-[#111116] border border-zinc-800 text-xs font-bold text-white shrink-0"
                >
                  {STANDARD_SHOE_SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                  {!STANDARD_SHOE_SIZES.includes(v.size) && (
                    <option value={v.size}>{v.size}</option>
                  )}
                </select>
                <div className="w-16 sm:flex-1 shrink-0">
                  <input
                    type="number"
                    min="0"
                    value={v.stock}
                    onChange={(e) => updateVariant(idx, { stock: Number(e.target.value) })}
                    className="w-full h-9 px-2 rounded-lg bg-[#111116] border border-zinc-800 text-xs font-extrabold text-[#BEFA46]"
                    title="Quantidade em estoque"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}

