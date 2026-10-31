'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldPlus, History } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn, formatDateTime } from '@/lib/utils';

export interface AdminUserItem {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  role: 'super_admin' | 'admin_operational';
  created_at: string;
}

export interface AdminLogRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  admin_name: string;
}

export function AdminsManagerClient({
  initialAdmins,
  logs,
}: {
  initialAdmins: AdminUserItem[];
  logs: AdminLogRow[];
}) {
  const router = useRouter();
  const { toast } = useStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState<'admin_operational' | 'super_admin'>(
    'admin_operational'
  );
  const [submitting, setSubmitting] = useState(false);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          roleName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Erro ao configurar administrador.', 'error');
        return;
      }
      toast('Permissão administrativa configurada!', 'success');
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const updateRoleOrStatus = async (
    userId: string,
    patch: { roleName?: string; is_active?: boolean }
  ) => {
    const res = await fetch('/api/admin/admins', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || 'Operação não permitida.', 'error');
      return;
    }
    toast('Acesso administrativo atualizado!', 'info');
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">
          Gerenciamento de Administradores & Auditoria
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Área exclusiva do Administrador Principal para controlar níveis de acesso e auditar operações.
        </p>
      </div>

      {/* Create / Promote Admin */}
      <form
        onSubmit={handleGrant}
        className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-4"
      >
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <ShieldPlus className="w-5 h-5 text-[#BEFA46]" />
          Criar ou Promover Administrador
        </h2>
        <p className="text-xs text-zinc-400">
          Se o e-mail já possuir conta de cliente, será promovido ao nível escolhido. Caso contrário, uma nova conta será criada.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nome completo"
            className="h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail *"
            className="h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha (para novos)"
            className="h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
          />
          <select
            value={roleName}
            onChange={(e) => setRoleName(e.target.value as typeof roleName)}
            className="h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs font-bold text-white"
          >
            <option value="admin_operational">Admin Operacional</option>
            <option value="super_admin">Admin Principal</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="h-10 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black"
          >
            {submitting ? 'Salvando...' : 'Conceder Acesso'}
          </button>
        </div>
      </form>

      {/* Active Admins List */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] divide-y divide-zinc-800">
        {initialAdmins.map((adm) => (
          <div
            key={adm.id}
            className="p-5 flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm font-extrabold text-white">{adm.full_name}</p>
              <p className="text-xs text-zinc-400">{adm.email}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={adm.role}
                onChange={(e) => updateRoleOrStatus(adm.id, { roleName: e.target.value })}
                className="h-9 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs font-bold text-white"
              >
                <option value="super_admin">Administrador Principal</option>
                <option value="admin_operational">Administrador Operacional</option>
                <option value="customer">Revogar (Tornar Cliente)</option>
              </select>

              <button
                type="button"
                onClick={() =>
                  updateRoleOrStatus(adm.id, { is_active: !adm.is_active })
                }
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold',
                  adm.is_active
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-red-500/15 text-red-400'
                )}
              >
                {adm.is_active ? 'Ativo' : 'Bloqueado'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Log */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-4">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <History className="w-4 h-4 text-[#BEFA46]" />
          Histórico de Atividades Administrativas
        </h2>

        <div className="divide-y divide-zinc-800/80 max-h-96 overflow-y-auto text-xs">
          {logs.map((log) => (
            <div
              key={log.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="font-bold text-white">
                  <span className="text-[#BEFA46]">{log.admin_name}</span> executou{' '}
                  <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200">
                    {log.action}
                  </code>
                </p>
                <p className="text-zinc-500 font-mono text-[11px] truncate max-w-xl">
                  {JSON.stringify(log.details)}
                </p>
              </div>
              <span className="text-zinc-500 whitespace-nowrap">
                {formatDateTime(log.created_at)}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="py-6 text-center text-zinc-500">
              Nenhuma atividade registrada ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
