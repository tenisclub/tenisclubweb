'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Eye } from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatDateTime,
  formatOrderModalityLabel,
  ORDER_STATUS_CONFIG,
} from '@/lib/utils';
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

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nº do pedido ou cliente..."
            className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-[#BEFA46]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 px-3.5 rounded-xl bg-[#121216] border border-zinc-800 text-xs sm:text-sm font-semibold text-white"
        >
          <option value="all">Todos os status</option>
          {Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </select>

        <select
          value={deliveryFilter}
          onChange={(e) => setDeliveryFilter(e.target.value)}
          className="h-11 px-3.5 rounded-xl bg-[#121216] border border-zinc-800 text-xs sm:text-sm font-semibold text-white"
        >
          <option value="all">Qualquer recebimento</option>
          <option value="pickup">Retirada na Loja</option>
          <option value="local_delivery">Entrega Local</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-11 px-3.5 rounded-xl bg-[#121216] border border-zinc-800 text-xs sm:text-sm text-white"
        />
// step 3/8
