'use client';

import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (saving) return;
    setStatus(initialOrder.status);
    setPaymentStatus(initialOrder.payment_status);
    setStoreNotes(initialOrder.store_notes || '');
    setInternalNotes(initialOrder.internal_notes || '');
    setPaymentMethodNote(initialOrder.payment_method_note || '');
  }, [
    initialOrder.updated_at,
    initialOrder.status,
    initialOrder.payment_status,
    initialOrder.store_notes,
    initialOrder.internal_notes,
    initialOrder.payment_method_note,
    saving,
  ]);

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
      window.dispatchEvent(new CustomEvent('tc:admin-stats-sync'));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/pedidos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para Pedidos
          </Link>
          <div className="flex flex-wrap items-center gap-2.5 mt-1">
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

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <a
            href={customerWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-bold"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            Chamar Cliente no WhatsApp
          </a>

          {initialOrder.status === 'received' && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('confirmed', 'Pedido confirmado pela loja!')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Confirmar Pedido Rápido
            </button>
          )}

