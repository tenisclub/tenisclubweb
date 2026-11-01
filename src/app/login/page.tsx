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

// step 4/8
