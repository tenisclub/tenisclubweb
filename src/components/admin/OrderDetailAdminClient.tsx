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
