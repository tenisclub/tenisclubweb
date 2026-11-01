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
    );
    toast('Status da conta atualizado!', 'info');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Gerenciar Clientes</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Consulte dados de relacionamento, histórico de pedidos e status de acesso.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#121216] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
        />
      </div>

      {/* Mobile Customer Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-zinc-800 bg-[#121216] p-4 space-y-3"
          >
// step 3/8
