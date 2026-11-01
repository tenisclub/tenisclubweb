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
