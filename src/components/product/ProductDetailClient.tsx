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
