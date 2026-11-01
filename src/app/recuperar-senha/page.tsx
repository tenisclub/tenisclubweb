'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { TenisClubLogo } from '@/components/brand/TenisClubLogo';
import { createClient } from '@/lib/supabase/client';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [googleNotice, setGoogleNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSentMessage('');
    setGoogleNotice('');
    setLoading(true);

    try {
      const checkRes = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const checkData = await checkRes.json();

      if (checkData.googleOnly) {
        setGoogleNotice(checkData.message);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSentMessage(
          'Se o e-mail estiver cadastrado, enviamos um link seguro de recuperação para sua caixa de entrada.'
        );
      }
    } catch {
      setErrorMsg('Erro ao solicitar recuperação de senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#111116] p-5 sm:p-9 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <TenisClubLogo size="md" />
          <h1 className="text-xl sm:text-2xl font-black text-white pt-2">
            Recuperar Senha
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Informe o e-mail da sua conta para receber o link de redefinição.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {googleNotice && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200 space-y-2">
            <p>{googleNotice}</p>
            <Link
              href="/login"
              className="inline-block font-bold text-[#BEFA46] hover:underline"
            >
              Ir para Login com Google →
            </Link>
          </div>
        )}

        {sentMessage ? (
          <div className="rounded-2xl border border-[#BEFA46]/40 bg-[#BEFA46]/10 p-5 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-[#BEFA46] mx-auto" />
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">{sentMessage}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#BEFA46] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRecover} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Seu e-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] font-black text-sm transition disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}

