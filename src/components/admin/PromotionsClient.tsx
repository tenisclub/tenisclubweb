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

    setPromos((prev) => [
      {
        ...data.promotion,
        product_name: selectedProd?.name || 'Produto',
        base_price: selectedProd?.base_price || 0,
      },
      ...prev,
    ]);
    setName('');
    setPromoPrice('');
    toast('Promoção programada com sucesso!', 'success');
  };

  const togglePromo = async (promo: PromotionRow) => {
    const res = await fetch('/api/admin/promotions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: promo.id, is_active: !promo.is_active }),
    });
    if (res.ok) {
      setPromos((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, is_active: !p.is_active } : p))
      );
      toast('Status da promoção atualizado!', 'info');
    }
  };

  const deletePromo = async (id: string) => {
    if (!window.confirm('Excluir esta promoção?')) return;
    const res = await fetch(`/api/admin/promotions?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
// step 3/8
