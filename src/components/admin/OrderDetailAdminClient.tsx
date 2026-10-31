'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import {
  cleanWhatsAppNumber,
  cn,
  formatCurrency,
  formatDateTime,
  ORDER_STATUS_CONFIG,
} from '@/lib/utils';
import type { Order, OrderStatus, PaymentStatus } from '@/types/database';

export function OrderDetailAdminClient({ initialOrder }: { initialOrder: Order }) {
  const router = useRouter();
  const { toast } = useStore();

  const [status, setStatus] = useState<OrderStatus>(initialOrder.status);
  const [statusNote, setStatusNote] = useState('');
  const [storeNotes, setStoreNotes] = useState(initialOrder.store_notes || '');
  const [internalNotes, setInternalNotes] = useState(initialOrder.internal_notes || '');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    initialOrder.payment_status
  );
  const [paymentMethodNote, setPaymentMethodNote] = useState(
    initialOrder.payment_method_note || ''
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async (overrideStatus?: OrderStatus, overrideNote?: string) => {
    const nextStatus = overrideStatus || status;

    if (nextStatus === 'cancelled' && initialOrder.status !== 'cancelled') {
      const ok = window.confirm(
        'Confirma o cancelamento deste pedido? O estoque das numerações reservadas será devolvido automaticamente sem duplicidade.'
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${initialOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          note: overrideNote ?? statusNote,
          store_notes: storeNotes,
          internal_notes: internalNotes,
          payment_status: paymentStatus,
          payment_method_note: paymentMethodNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Erro ao salvar pedido.', 'error');
        return;
      }

      setStatus(nextStatus);
      setStatusNote('');
      toast('Pedido atualizado com sucesso!', 'success');
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const customerWaUrl = `https://wa.me/${cleanWhatsAppNumber(
    initialOrder.customer_phone
  )}?text=${encodeURIComponent(
    `Olá, ${initialOrder.customer_name}! Aqui é da Tênis Club sobre o seu pedido #${initialOrder.order_number}.`
  )}`;

  const stCfg = ORDER_STATUS_CONFIG[initialOrder.status];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/pedidos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para Pedidos
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Pedido #{initialOrder.order_number}
            </h1>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-bold border',
                stCfg?.colorClass
              )}
            >
              {stCfg?.label}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Criado em {formatDateTime(initialOrder.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={customerWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-bold"
          >
            <MessageCircle className="w-4 h-4" />
            Chamar Cliente no WhatsApp
          </a>

          {initialOrder.status === 'received' && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('confirmed', 'Pedido confirmado pela loja!')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Pedido Rápido
            </button>
          )}

          {initialOrder.status !== 'cancelled' && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('cancelled', 'Pedido cancelado administrativamente.')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold"
            >
              <XCircle className="w-4 h-4" />
              Cancelar Pedido
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Items & Customer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-4">
            <h2 className="text-base font-black text-white">Itens Solicitados</h2>
            <div className="divide-y divide-zinc-800">
              {(initialOrder.items || []).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {item.product_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-14 h-14 rounded-xl object-cover bg-[#EAE0D5]"
                      />
                    )}
                    <div>
                      <p className="text-sm font-extrabold text-white">{item.product_name}</p>
                      <p className="text-xs text-zinc-400">
                        Cor: {item.color} • Tam. <strong>{item.size}</strong> • Qtd:{' '}
                        <strong>{item.quantity}</strong>
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Unitário: {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-[#BEFA46]">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 pt-4 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">Valor Total do Pedido</span>
              <span className="text-xl font-black text-[#BEFA46]">
                {formatCurrency(initialOrder.total)}
              </span>
            </div>
          </div>

          {/* Customer & Delivery Info */}
          <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-3 text-xs sm:text-sm">
            <h2 className="text-base font-black text-white">Dados do Cliente & Entrega</h2>
            <p className="text-zinc-300">
              <strong className="text-white">Nome:</strong> {initialOrder.customer_name}
            </p>
            <p className="text-zinc-300">
              <strong className="text-white">E-mail:</strong> {initialOrder.customer_email}
            </p>
            <p className="text-zinc-300">
              <strong className="text-white">Telefone/WhatsApp:</strong>{' '}
              {initialOrder.customer_phone}
            </p>
            <p className="text-zinc-300">
              <strong className="text-white">Modalidade:</strong>{' '}
              {initialOrder.delivery_method === 'pickup'
                ? 'Retirada na Loja'
                : 'Entrega Local'}
            </p>
            {initialOrder.delivery_method === 'local_delivery' &&
              initialOrder.shipping_address && (
                <div className="rounded-xl bg-[#18181F] p-3 text-zinc-300">
                  {initialOrder.shipping_address.street}, {initialOrder.shipping_address.number}
                  {initialOrder.shipping_address.complement
                    ? ` - ${initialOrder.shipping_address.complement}`
                    : ''}
                  <br />
                  {initialOrder.shipping_address.neighborhood} •{' '}
                  {initialOrder.shipping_address.city}/{initialOrder.shipping_address.state}
                  {initialOrder.shipping_address.reference && (
                    <>
                      <br />
                      Ref: {initialOrder.shipping_address.reference}
                    </>
                  )}
                </div>
              )}
            {initialOrder.customer_notes && (
              <p className="text-amber-300 pt-1">
                <strong>Nota do cliente:</strong> {initialOrder.customer_notes}
              </p>
            )}
          </div>

          {/* Status History */}
          <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#BEFA46]" />
              Linha do Tempo de Status
            </h3>
            <div className="space-y-2.5">
              {(initialOrder.history || []).map((h) => (
                <div key={h.id} className="text-xs border-l-2 border-zinc-700 pl-3 py-0.5">
                  <p className="font-bold text-white">
                    {ORDER_STATUS_CONFIG[h.new_status as OrderStatus]?.label || h.new_status}
                  </p>
                  {h.note && <p className="text-zinc-400">{h.note}</p>}
                  <span className="text-[11px] text-zinc-500">
                    {formatDateTime(h.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Administrative Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-4">
            <h2 className="text-base font-black text-white">Controle Operacional</h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Status do Pedido</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm font-bold text-white"
              >
                {Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Mensagem de atualização (histórico / notificação)
              </label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Ex: Pares conferidos e separados no balcão"
                className="w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
              />
            </div>

            <div className="pt-3 border-t border-zinc-800 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#BEFA46]">
                Registro Manual de Pagamento
              </h3>
              <p className="text-[11px] text-zinc-500">
                Sem gateway integrado: registre aqui pagamentos recebidos via Pix, cartão ou dinheiro.
              </p>

              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs font-bold text-white"
              >
                <option value="pending">Aguardando recebimento</option>
                <option value="paid_manual">Pagamento recebido manualmente</option>
                <option value="refunded_manual">Estornado manualmente</option>
              </select>

              <input
                type="text"
                value={paymentMethodNote}
                onChange={(e) => setPaymentMethodNote(e.target.value)}
                placeholder="Ex: Pix recebido em 31/10 às 14:20"
                className="w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
              />
            </div>

            <div className="pt-3 border-t border-zinc-800 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300">
                  Observações para o Cliente (visível em Minha Conta)
                </label>
                <textarea
                  rows={2}
                  value={storeNotes}
                  onChange={(e) => setStoreNotes(e.target.value)}
                  className="mt-1 w-full p-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-300">
                  Observações Internas (restrito à equipe Admin)
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="mt-1 w-full p-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave()}
              className="w-full h-12 rounded-xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] text-sm font-black inline-flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações do Pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
