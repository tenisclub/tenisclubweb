'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import { TenisClubLogo } from '@/components/brand/TenisClubLogo';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/components/providers/StoreProvider';
import { cn } from '@/lib/utils';

function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '';
  const { refreshSession, toast } = useStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const pwdStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('As senhas informadas não coincidem.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Sua senha deve conter pelo menos 8 caracteres.');
      return;
    }

    if (!acceptedTerms) {
      setErrorMsg('Aceite os Termos de Uso e a Política de Privacidade para continuar.');
      return;
    }

    setLoading(true);
    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          acceptedTerms,
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        setErrorMsg(regData.error || 'Erro ao criar conta.');
        setLoading(false);
        return;
      }

      // Auto-sign in after registration
      const supabase = createClient();
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      await refreshSession();
      toast('Cadastro realizado com sucesso! Bem-vindo(a) à Tênis Club!', 'success');

      if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
        router.push(redirectParam);
      } else {
        router.push('/');
      }
      router.refresh();
    } catch {
      setErrorMsg('Falha de comunicação ao realizar cadastro.');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const supabase = createClient();
    const callbackUrl = `${window.location.origin}/auth/callback${
      redirectParam ? `?next=${encodeURIComponent(redirectParam)}` : ''
    }`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#111116] p-7 sm:p-9 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <TenisClubLogo size="md" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-white pt-1">
            Crie sua conta na Tênis Club
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Rápido, gratuito e seguro. Acompanhe todos os seus pedidos.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-300">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full h-11 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm inline-flex items-center justify-center gap-2.5 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.8z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z"
            />
          </svg>
          Cadastrar rapidamente com Google
        </button>

        <div className="relative flex items-center justify-center">
          <span className="w-full border-t border-zinc-800" />
          <span className="px-3 bg-[#111116] text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
            ou preencha seus dados
          </span>
          <span className="w-full border-t border-zinc-800" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Nome completo *</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Lucas Oliveira"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">E-mail *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Telefone / WhatsApp *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Senha *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Confirmar senha *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46]"
                />
              </div>
            </div>
          </div>

          {/* Password strength bar */}
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'h-1.5 rounded-full transition-colors',
                      pwdStrength >= level
                        ? pwdStrength <= 1
                          ? 'bg-red-500'
                          : pwdStrength === 2
                            ? 'bg-amber-400'
                            : 'bg-[#BEFA46]'
                        : 'bg-zinc-800'
                    )}
                  />
                ))}
              </div>
              <p className="text-[11px] text-zinc-400">
                Segurança da senha:{' '}
                <strong className="text-zinc-200">
                  {pwdStrength <= 1
                    ? 'Fraca'
                    : pwdStrength === 2
                      ? 'Média'
                      : pwdStrength === 3
                        ? 'Boa'
                        : 'Excelente'}
                </strong>
              </p>
            </div>
          )}

          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#BEFA46] rounded"
            />
            <span className="text-xs text-zinc-400 leading-relaxed">
              Li e concordo com os{' '}
              <Link href="/termos" className="text-[#BEFA46] hover:underline">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link href="/privacidade" className="text-[#BEFA46] hover:underline">
                Política de Privacidade (LGPD)
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] font-black text-sm inline-flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {loading ? 'Criando sua conta...' : 'Criar Conta'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          Já possui cadastro?{' '}
          <Link
            href={`/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
            className="font-bold text-[#BEFA46] hover:underline"
          >
            Entrar na minha conta
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="min-h-[75vh]" />}>
      <CadastroForm />
    </Suspense>
  );
}

