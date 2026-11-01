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
// step 1/12
