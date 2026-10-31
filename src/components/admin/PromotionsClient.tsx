'use client';

import React, { useState } from 'react';
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
        className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-4"
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
            <label className="text-xs text-zinc-400">Produto *</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            >
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatCurrency(p.base_price)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Preço Promocional (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={promoPrice}
              onChange={(e) => setPromoPrice(e.target.value)}
              placeholder="Ex: 199.90"
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Início Programado (Opcional)</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Término Programado (Opcional)</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>

          <div className="flex items-end justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 h-10">
              <input
                type="checkbox"
                checked={highlightHome}
                onChange={(e) => setHighlightHome(e.target.checked)}
                className="w-4 h-4 accent-[#BEFA46]"
              />
              Destacar na Home
            </label>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Criar
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-3xl border border-zinc-800 bg-[#121216] divide-y divide-zinc-800">
        {promos.map((pr) => (
          <div
            key={pr.id}
            className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">{pr.name}</span>
                {pr.discount_percent > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#BEFA46] text-[#09090B] text-[10px] font-black">
                    -{pr.discount_percent}%
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Produto: <strong>{pr.product_name}</strong> • De{' '}
                <span className="line-through text-zinc-500">
                  {formatCurrency(pr.base_price)}
                </span>{' '}
                por <strong className="text-[#BEFA46]">{formatCurrency(pr.promo_price)}</strong>
              </p>
              {(pr.starts_at || pr.ends_at) && (
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Vigência: {pr.starts_at ? formatDateTime(pr.starts_at) : 'Imediato'} até{' '}
                  {pr.ends_at ? formatDateTime(pr.ends_at) : 'Indeterminado'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => togglePromo(pr)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold',
                  pr.is_active
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-400'
                )}
              >
                {pr.is_active ? 'Ativa' : 'Pausada'}
              </button>
              <button
                type="button"
                onClick={() => deletePromo(pr.id)}
                className="p-2 text-zinc-500 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {promos.length === 0 && (
          <p className="p-8 text-center text-xs text-zinc-500">
            Nenhuma campanha promocional cadastrada.
          </p>
        )}
      </div>
    </div>
  );
}
