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
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#111116] p-7 sm:p-9 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <TenisClubLogo size="md" />
          <h1 className="text-xl sm:text-2xl font-black text-white pt-2">
            Definir Nova Senha
          </h1>
          <p className="text-xs text-zinc-400">
            Escolha uma senha forte com pelo menos 8 caracteres.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Nova senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Confirmar nova senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#BEFA46] text-[#09090B] font-black text-sm"
          >
            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}

