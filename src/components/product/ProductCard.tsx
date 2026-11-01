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
