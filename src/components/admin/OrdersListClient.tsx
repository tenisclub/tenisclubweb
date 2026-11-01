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
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((o) => {
          const st = ORDER_STATUS_CONFIG[o.status as OrderStatus];
          const deliveryLabel = formatOrderModalityLabel(o);
          return (
            <div
              key={o.id}
              className="rounded-2xl border border-zinc-800 bg-[#121216] p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-white">#{o.order_number}</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                        st?.colorClass
                      )}
                    >
                      {st?.label || o.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-zinc-200 mt-1 truncate">
                    {o.customer_name}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {o.customer_phone} • {formatDateTime(o.created_at)}
                  </p>
                </div>
                <span className="text-base font-black text-[#BEFA46] shrink-0">
                  {formatCurrency(o.total)}
// step 4/8
