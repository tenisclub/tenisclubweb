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
    setPromos(initialPromos);
  }, [initialPromos]);

  const [name, setName] = useState('');
  const [productId, setProductId] = useState(productsList[0]?.id || '');
  const [promoPrice, setPromoPrice] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [highlightHome, setHighlightHome] = useState(true);

  const selectedProd = productsList.find((p) => p.id === productId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !productId || !promoPrice) return;

    const res = await fetch('/api/admin/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        product_id: productId,
        promo_price: Number(promoPrice),
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        highlight_home: highlightHome,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || 'Erro ao criar promoção.', 'error');
      return;
    }
// step 2/8
