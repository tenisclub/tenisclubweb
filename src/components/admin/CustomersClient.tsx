'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, MessageCircle } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cleanWhatsAppNumber, cn, formatCurrency, formatDate } from '@/lib/utils';

export interface CustomerSummary {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  auth_provider: string;
  is_active: boolean;
  created_at: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderId: string | null;
}

export function CustomersClient({ initialCustomers }: { initialCustomers: CustomerSummary[] }) {
  const { toast } = useStore();
  const [customers, setCustomers] = useState<CustomerSummary[]>(initialCustomers);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    });
  }, [customers, search]);

  const toggleStatus = async (c: CustomerSummary) => {
    const nextActive = !c.is_active;
    const reason = nextActive
      ? 'Reativação de conta'
      : window.prompt('Informe o motivo para desativar esta conta:') || '';
    if (!nextActive && !reason.trim()) return;

    const res = await fetch('/api/admin/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: c.id, is_active: nextActive, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || 'Erro ao alterar conta.', 'error');
      return;
    }

    setCustomers((prev) =>
      prev.map((item) => (item.id === c.id ? { ...item, is_active: nextActive } : item))
// step 2/8
