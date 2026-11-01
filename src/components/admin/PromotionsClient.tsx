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
    if (res.ok) {
      setPromos((prev) => prev.filter((p) => p.id !== id));
      toast('Promoção removida.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Gerenciar Promoções</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Crie descontos, programe campanhas de início/término e destaque produtos na página inicial.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-4"
      >
        <h2 className="text-base font-black text-white">Nova Campanha Promocional</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-400">Nome da Campanha *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Semana do Sneaker"
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>

          <div>
// step 4/8
