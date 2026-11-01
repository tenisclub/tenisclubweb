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
  formatOrderModalityLabel,
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
// step 1/8
