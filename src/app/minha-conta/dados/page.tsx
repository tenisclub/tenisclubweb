'use client';

import React, { useEffect, useState } from 'react';
import { Save, Lock } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';

export default function MeusDadosPage() {
  const { user, refreshSession, toast } = useStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast('A confirmação de senha não confere.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Erro ao salvar dados.', 'error');
        return;
      }

      setNewPassword('');
      setConfirmPassword('');
      await refreshSession();
      toast(data.message || 'Seus dados foram atualizados!', 'success');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-black text-white">Meus Dados Pessoais</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Mantenha suas informações atualizadas para facilitar o atendimento e entrega.
        </p>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Nome completo</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
// step 3/6
