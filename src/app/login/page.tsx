'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { TenisClubLogo } from '@/components/brand/TenisClubLogo';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/components/providers/StoreProvider';

function resolvePostLoginTarget(raw: string): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  if (
    raw === '/minha-conta' ||
    raw.startsWith('/minha-conta?') ||
    raw.startsWith('/login') ||
    raw.startsWith('/cadastro')
  ) {
    return '/';
  }
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '';
  const { refreshSession, toast } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    router.prefetch('/');
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setErrorMsg('E-mail ou senha incorretos. Verifique seus dados ou use o login Google.');
        setLoading(false);
        return;
      }

      // Single round-trip to verify active account status and hydrate session state
      const snap = await refreshSession();

      if (!snap?.authenticated) {
        void supabase.auth.signOut({ scope: 'local' });
        setErrorMsg('Esta conta está temporariamente desativada. Entre em contato com a loja.');
        setLoading(false);
        return;
      }

      toast(`Bem-vindo(a) de volta, ${snap.user?.full_name?.split(' ')[0] || ''}!`, 'success');
      router.replace(resolvePostLoginTarget(redirectParam));
    } catch {
      setErrorMsg('Ocorreu um erro ao realizar login. Tente novamente.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const nextTarget = resolvePostLoginTarget(redirectParam);
      const callbackUrl = `${window.location.origin}/auth/callback${
        nextTarget !== '/' ? `?next=${encodeURIComponent(nextTarget)}` : ''
      }`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      });
      if (error) {
        setErrorMsg(
          'O provedor Google OAuth precisa estar habilitado no painel do Supabase Auth ou tente entrar com e-mail e senha.'
        );
        setGoogleLoading(false);
      }
    } catch {
      setErrorMsg('Falha ao iniciar autenticação com Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#111116] p-7 sm:p-9 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <TenisClubLogo size="lg" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-white pt-2">
            Acesse sua conta
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Acompanhe pedidos, salve favoritos e finalize suas compras.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full h-11 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm inline-flex items-center justify-center gap-2.5 transition disabled:opacity-60"
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
          {googleLoading ? 'Conectando ao Google...' : 'Continuar com Google'}
        </button>

        <div className="flex items-center gap-3">
          <span className="flex-1 border-t border-zinc-800" />
          <span className="shrink-0 whitespace-nowrap text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
            ou com e-mail
          </span>
          <span className="flex-1 border-t border-zinc-800" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">E-mail</label>
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Senha</label>
              <Link
                href="/recuperar-senha"
                className="text-xs font-semibold text-[#BEFA46] hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46]"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] font-black text-sm inline-flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          Ainda não tem cadastro?{' '}
          <Link
            href={`/cadastro${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
            className="font-bold text-[#BEFA46] hover:underline"
          >
            Criar minha conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <LoginForm />
    </Suspense>
  );
}

