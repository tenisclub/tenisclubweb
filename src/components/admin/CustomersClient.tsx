'use client';

import React, { useMemo, useState } from 'react';
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

      <div className="rounded-3xl border border-zinc-800 bg-[#121216] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#17171E] text-zinc-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Cliente</th>
                <th className="px-4 py-3.5">Telefone / WhatsApp</th>
                <th className="px-4 py-3.5">Cadastro</th>
                <th className="px-4 py-3.5">Pedidos</th>
                <th className="px-4 py-3.5">Total em Pedidos</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-900/40">
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-white">{c.full_name}</p>
                    <p className="text-[11px] text-zinc-500">
                      {c.email} • {c.auth_provider === 'google' ? 'Google' : 'E-mail'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-zinc-300">
                    {c.phone ? (
                      <a
                        href={`https://wa.me/${cleanWhatsAppNumber(c.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 hover:text-[#BEFA46]"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#BEFA46]" />
                        {c.phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-zinc-400">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3.5 font-bold text-white">{c.ordersCount}</td>
                  <td className="px-4 py-3.5 font-black text-[#BEFA46]">
                    {formatCurrency(c.totalSpent)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[11px] font-bold',
                        c.is_active
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/15 text-red-400'
                      )}
                    >
                      {c.is_active ? 'Ativo' : 'Desativado'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    {c.lastOrderId && (
                      <Link
                        href={`/admin/pedidos/${c.lastOrderId}`}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs font-bold text-zinc-200 hover:text-white"
                      >
                        Último Pedido
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleStatus(c)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300"
                    >
                      {c.is_active ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

