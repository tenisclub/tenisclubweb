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
    // Pre-warm singleton Supabase auth client so clicking Google/Email has zero init delay
    void createClient().auth.getSession();
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
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#111116] p-5 sm:p-9 shadow-2xl space-y-6">
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
