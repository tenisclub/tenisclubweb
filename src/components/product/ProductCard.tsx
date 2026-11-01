'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Eye, MessageCircle } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import {
  buildProductWhatsAppUrl,
  cn,
  formatCurrency,
  GENDER_LABELS,
} from '@/lib/utils';
import type { Product } from '@/types/database';

interface ProductCardProps {
  product: Product;
  whatsapp?: string;
}

export function ProductCard({ product, whatsapp = '5511999999999' }: ProductCardProps) {
  const router = useRouter();
  const prefetchedRef = useRef(false);
  const { addToCart, toggleFavorite, favoriteIds } = useStore();
  const isFav = favoriteIds.includes(product.id);

  const allowBackorder = Boolean(product.allow_backorder);
  const firstAvailableVariant =
    product.variants.find((v) => v.stock > 0) ||
    (allowBackorder ? product.variants[0] : undefined);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    firstAvailableVariant?.id || ''
  );
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const current = product.variants.find((v) => v.id === selectedVariantId);
    if (!current || (!allowBackorder && current.stock <= 0)) {
      setSelectedVariantId(firstAvailableVariant?.id || '');
    }
  }, [product.variants, allowBackorder, firstAvailableVariant?.id, selectedVariantId]);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const canPurchase = product.total_stock > 0 || (allowBackorder && product.variants.length > 0);

  const handleQuickAdd = async () => {
    const targetVar = selectedVariant || firstAvailableVariant;
    if (!targetVar || (!allowBackorder && targetVar.stock <= 0)) return;
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        variantId: targetVar.id,
        quantity: 1,
      });
    } finally {
      setAdding(false);
    }
  };

  const waUrl = buildProductWhatsAppUrl({
    whatsapp,
    productName: product.name,
    sku: product.sku,
    size: selectedVariant?.size,
    price: product.effective_price,
  });

  return (
    <article
      onMouseEnter={() => {
        if (!prefetchedRef.current) {
          prefetchedRef.current = true;
          router.prefetch(`/produto/${product.slug}`);
        }
      }}
      className="group relative flex flex-col rounded-2xl bg-[#121216] border border-zinc-800/90 hover:border-[#BEFA46]/50 overflow-hidden transition-all duration-300 shadow-lg hover:shadow-[0_12px_36px_rgba(0,0,0,0.65)]"
    >
      {/* Top Studio Image Container */}
      <div className="relative aspect-[4/3.6] w-full bg-[#EAE0D5] overflow-hidden">
        <Link href={`/produto/${product.slug}`} className="block w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.primary_image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
          {product.discount_percent > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-[#BEFA46] text-[#09090B] text-[11px] font-black tracking-wide shadow">
              -{product.discount_percent}%
            </span>
          )}
          {product.is_new_release && (
            <span className="px-2.5 py-1 rounded-full bg-[#09090B]/85 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider">
              Novo
            </span>
          )}
          {!canPurchase && (
            <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
              Esgotado
            </span>
          )}
        </div>

        {/* Favorite Heart */}
        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          className={cn(
            'absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition shadow',
            isFav
              ? 'bg-[#BEFA46] text-[#09090B]'
              : 'bg-[#09090B]/70 text-white hover:bg-[#09090B]'
          )}
          aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart className={cn('w-4 h-4', isFav && 'fill-current')} />
        </button>
      </div>

      {/* Card Body matching TÊNIS CLUB dark studio aesthetic */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Eyebrow: GENDER · SKU · BRAND */}
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold tracking-wider uppercase text-zinc-400">
// step 4/8
