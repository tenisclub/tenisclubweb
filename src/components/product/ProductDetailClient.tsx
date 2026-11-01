'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingBag,
  Heart,
  Share2,
  MessageCircle,
  Check,
  Minus,
  Plus,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import {
  buildProductWhatsAppUrl,
  cn,
  formatCurrency,
  GENDER_LABELS,
} from '@/lib/utils';
import type { Product } from '@/types/database';

export function ProductDetailClient({
  product,
  whatsapp,
}: {
  product: Product;
  whatsapp: string;
}) {
  const { addToCart, toggleFavorite, favoriteIds, toast } = useStore();
  const isFav = favoriteIds.includes(product.id);

  const [activeImage, setActiveImage] = useState(product.primary_image);

  // Group variants by color
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of product.variants) {
      if (!map.has(v.color)) map.set(v.color, v.color_hex);
    }
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [product.variants]);

  const initialVariant =
    product.variants.find((v) => v.stock > 0) || product.variants[0] || null;

  const [selectedColor, setSelectedColor] = useState(initialVariant?.color || colors[0]?.name || '');
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariant?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const colorVariants = useMemo(
    () => product.variants.filter((v) => !selectedColor || v.color === selectedColor),
    [product.variants, selectedColor]
  );

  const selectedVariant = useMemo(
    () => colorVariants.find((v) => v.id === selectedVariantId) || null,
    [colorVariants, selectedVariantId]
  );

  const allowBackorder = Boolean(product.allow_backorder);
  const canBuySelected = Boolean(
    selectedVariant && (selectedVariant.stock > 0 || allowBackorder)
  );
  const maxStock = allowBackorder ? 99 : selectedVariant?.stock || 0;

  useEffect(() => {
    const stillExists = product.images.some((img) => img.url === activeImage);
    if (!stillExists || activeImage !== product.primary_image) {
      if (!stillExists) {
        setActiveImage(product.primary_image);
      }
    }
  }, [product.images, product.primary_image, activeImage]);

  useEffect(() => {
    setActiveImage(product.primary_image);
  }, [product.primary_image]);

  useEffect(() => {
    const current = product.variants.find((v) => v.id === selectedVariantId);
    if (!current || (!allowBackorder && current.stock <= 0)) {
      const sameColorAvail = product.variants.find(
        (v) => v.color === selectedColor && (v.stock > 0 || allowBackorder)
      );
      const anyAvail =
        product.variants.find((v) => v.stock > 0 || allowBackorder) || product.variants[0];
      const next = sameColorAvail || anyAvail;
      if (next) {
        setSelectedColor(next.color);
        setSelectedVariantId(next.id);
      }
    } else if (!allowBackorder && quantity > current.stock && current.stock > 0) {
      setQuantity(current.stock);
    }
  }, [product.variants, allowBackorder, selectedColor, selectedVariantId, quantity]);

  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    const firstInStock = product.variants.find(
      (v) => v.color === colorName && v.stock > 0
    );
    const fallback = product.variants.find((v) => v.color === colorName);
    setSelectedVariantId(firstInStock?.id || fallback?.id || '');
    setQuantity(1);
  };

  const handleSelectSize = (variantId: string, stock: number) => {
    if (!allowBackorder && stock <= 0) return;
    setSelectedVariantId(variantId);
    setQuantity(1);
  };

  const handleAdd = async (redirectToCart = false) => {
    if (!selectedVariant || (!allowBackorder && selectedVariant.stock <= 0)) {
      toast('Selecione uma numeração disponível em estoque.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await addToCart({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity,
        redirectToCart,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | Tênis Club`,
          text: product.short_description || product.name,
          url,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    if (url && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast('Link do produto copiado!', 'info');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const waUrl = buildProductWhatsAppUrl({
    whatsapp,
    productName: product.name,
    sku: product.sku,
    size: selectedVariant?.size,
    price: product.effective_price,
  });

  const additionalSpecs = Object.entries(product.additional_info || {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      {/* Left: Image Gallery */}
      <div className="lg:col-span-7 space-y-4">
        <div className="relative aspect-square sm:aspect-[4/3.5] rounded-3xl overflow-hidden bg-[#EAE0D5] border border-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage}
            alt={product.name}
            className="w-full h-full object-cover object-center"
          />

          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {product.discount_percent > 0 && (
              <span className="px-3 py-1 rounded-full bg-[#BEFA46] text-[#09090B] text-xs font-black">
                -{product.discount_percent}% OFF
              </span>
            )}
            {product.is_new_release && (
              <span className="px-3 py-1 rounded-full bg-[#09090B]/85 text-white text-xs font-bold uppercase tracking-wider">
                Lançamento
              </span>
            )}
          </div>
        </div>

        {product.images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {product.images.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImage(img.url)}
                className={cn(
                  'relative w-20 h-20 rounded-2xl overflow-hidden bg-[#EAE0D5] border-2 shrink-0 transition',
                  activeImage === img.url
                    ? 'border-[#BEFA46]'
                    : 'border-zinc-800 opacity-70 hover:opacity-100'
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt_text || product.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Commercial Info & Actions */}
      <div className="lg:col-span-5 flex flex-col space-y-6">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold uppercase tracking-widest text-zinc-400 min-w-0 pt-1">
              {product.brand?.name && (
                <span className="text-[#BEFA46]">{product.brand.name}</span>
              )}
              <span>•</span>
              <span>{GENDER_LABELS[product.gender]}</span>
              {product.sku && (
                <>
                  <span>•</span>
                  <span>{product.sku}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                className={cn(
                  'p-2.5 rounded-full border transition',
                  isFav
                    ? 'bg-[#BEFA46] text-[#09090B] border-[#BEFA46]'
                    : 'bg-[#15151B] text-zinc-300 border-zinc-800 hover:border-zinc-600'
                )}
                title={isFav ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
              >
                <Heart className={cn('w-4 h-4', isFav && 'fill-current')} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-2.5 rounded-full bg-[#15151B] text-zinc-300 border border-zinc-800 hover:border-zinc-600 transition"
                title="Compartilhar produto"
              >
                {copied ? <Check className="w-4 h-4 text-[#BEFA46]" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            {product.name}
          </h1>

          {product.short_description && (
            <p className="text-sm text-zinc-400 leading-relaxed">{product.short_description}</p>
          )}
        </div>

        {/* Pricing Card */}
        <div className="rounded-2xl border border-zinc-800 bg-[#121217] p-4 sm:p-5">
          {product.promo_price !== null && product.promo_price < product.base_price && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-zinc-500 line-through">
                De {formatCurrency(product.base_price)}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#BEFA46]/15 text-[#BEFA46] text-[11px] font-bold">
                Economize {formatCurrency(product.base_price - product.effective_price)}
              </span>
            </div>
          )}
          <div className="text-3xl sm:text-4xl font-black text-[#BEFA46] tracking-tight">
            {formatCurrency(product.effective_price)}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Reserve agora sem pagamento online • Combine Pix, cartão ou dinheiro na entrega/retirada
          </p>
        </div>

        {/* Colors */}
        {colors.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Cor: <strong className="text-white">{selectedColor}</strong>
            </span>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => {
                const active = selectedColor === c.name;
                return (
// step 7/12
