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
// step 1/8
