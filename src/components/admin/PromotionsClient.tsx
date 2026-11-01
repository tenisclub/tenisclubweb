'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';

export interface PromotionRow {
  id: string;
  name: string;
  description: string;
  product_id: string;
  product_name: string;
  base_price: number;
  promo_price: number;
  discount_percent: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  highlight_home: boolean;
}

export function PromotionsClient({
  initialPromos,
  productsList,
}: {
  initialPromos: PromotionRow[];
  productsList: { id: string; name: string; base_price: number }[];
}) {
  const { toast } = useStore();
  const [promos, setPromos] = useState<PromotionRow[]>(initialPromos);

  useEffect(() => {
// step 1/8
