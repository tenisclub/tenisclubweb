'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  const { addToCart, toggleFavorite, favoriteIds } = useStore();
  const isFav = favoriteIds.includes(product.id);

  const firstAvailableVariant = product.variants.find((v) => v.stock > 0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    firstAvailableVariant?.id || ''
  );
  const [adding, setAdding] = useState(false);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const hasStock = product.total_stock > 0;

  const handleQuickAdd = async () => {
    const targetVar = selectedVariant || firstAvailableVariant;
    if (!targetVar || targetVar.stock <= 0) return;
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
    <article className="group relative flex flex-col rounded-2xl bg-[#121216] border border-zinc-800/90 hover:border-[#BEFA46]/50 overflow-hidden transition-all duration-300 shadow-lg hover:shadow-[0_12px_36px_rgba(0,0,0,0.65)]">
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
          {!hasStock && (
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
          <span className="truncate">
            {GENDER_LABELS[product.gender]}
            {product.sku ? ` · ${product.sku}` : ''}
          </span>
          {product.brand?.name && (
            <span className="text-zinc-500 font-bold shrink-0">{product.brand.name}</span>
          )}
        </div>

        {/* Product Title */}
        <Link
          href={`/produto/${product.slug}`}
          className="mt-1.5 text-base sm:text-lg font-extrabold text-white group-hover:text-[#BEFA46] transition line-clamp-2 leading-snug"
        >
          {product.name}
        </Link>

        {/* Size Range + Availability Indicator */}
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
          <span>Numeração: {product.size_range_label}</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 font-medium',
              hasStock ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                hasStock ? 'bg-emerald-400' : 'bg-red-400'
              )}
            />
            {hasStock ? 'Disponível' : 'Indisponível'}
          </span>
        </div>

        {/* Interactive Size Pills */}
        {product.variants.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {product.variants.slice(0, 8).map((v) => {
              const out = v.stock <= 0;
              const selected = selectedVariantId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={out}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={cn(
                    'min-w-[30px] h-7 px-1.5 rounded-lg text-[11px] font-bold border transition',
                    out
                      ? 'border-zinc-800/60 bg-zinc-900/40 text-zinc-600 line-through cursor-not-allowed'
                      : selected
                        ? 'border-[#BEFA46] bg-[#BEFA46] text-[#09090B]'
                        : 'border-zinc-800 bg-[#1A1A20] text-zinc-300 hover:border-zinc-600'
                  )}
                  title={out ? `Tam. ${v.size} indisponível` : `Tam. ${v.size} (${v.stock} un.)`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        )}

        {/* Pricing */}
        <div className="mt-auto pt-4">
          {product.promo_price !== null && product.promo_price < product.base_price && (
            <div className="text-xs text-zinc-500 line-through">
              {formatCurrency(product.base_price)}
            </div>
          )}
          <div className="text-xl sm:text-2xl font-black text-[#BEFA46] tracking-tight">
            {formatCurrency(product.effective_price)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3.5 flex flex-col gap-2">
          <button
            type="button"
            disabled={!hasStock || adding}
            onClick={handleQuickAdd}
            className={cn(
              'w-full h-11 rounded-xl font-extrabold text-sm inline-flex items-center justify-center gap-2 transition',
              hasStock
                ? 'bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] shadow-[0_4px_20px_rgba(190,250,70,0.18)]'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            )}
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.3]" />
            {adding
              ? 'Adicionando...'
              : hasStock
                ? `Adicionar${selectedVariant ? ` (Tam. ${selectedVariant.size})` : ''}`
                : 'Sem Estoque'}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/produto/${product.slug}`}
              className="h-9 rounded-xl bg-[#1A1A21] hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 inline-flex items-center justify-center gap-1.5 transition"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              Detalhes
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 rounded-xl bg-[#1A1A21] hover:bg-emerald-950/50 border border-zinc-800 hover:border-emerald-500/40 text-xs font-semibold text-zinc-200 hover:text-emerald-300 inline-flex items-center justify-center gap-1.5 transition"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#BEFA46]" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
