'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { TenisClubLogo } from '@/components/brand/TenisClubLogo';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/components/providers/StoreProvider';

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const { toast } = useStore();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      toast('Nova senha definida com sucesso!', 'success');
      router.push('/');
    } catch {
      setErrorMsg('Erro ao redefinir senha.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#111116] p-5 sm:p-9 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <TenisClubLogo size="md" />
          <h1 className="text-xl sm:text-2xl font-black text-white pt-2">
            Definir Nova Senha
// step 3/6
