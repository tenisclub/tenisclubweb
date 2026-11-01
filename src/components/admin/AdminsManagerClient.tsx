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
