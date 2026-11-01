'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Eye } from 'lucide-react';
import { cn, formatCurrency, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types/database';

export function OrdersListClient({ initialOrders }: { initialOrders: Order[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const pendingCount = initialOrders.filter(
      (o) => o.status === 'received' || o.status === 'awaiting_confirmation'
    ).length;
    window.dispatchEvent(
      new CustomEvent('tc:admin-stats-sync', {
        detail: { pendingOrdersCount: pendingCount },
      })
    );
  }, [initialOrders]);

  const filtered = useMemo(() => {
    return initialOrders.filter((o) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !o.order_number.toLowerCase().includes(q) &&
          !o.customer_name.toLowerCase().includes(q) &&
          !o.customer_email.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (deliveryFilter !== 'all' && o.delivery_method !== deliveryFilter) return false;
      if (dateFilter && !String(o.created_at).startsWith(dateFilter)) return false;
      return true;
    });
  }, [initialOrders, search, statusFilter, deliveryFilter, dateFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Gerenciar Pedidos</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Confirme solicitações, separe numerações, atualize status e registre pagamentos manuais.
        </p>
      </div>

