'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import { TenisClubLogo } from '@/components/brand/TenisClubLogo';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/components/providers/StoreProvider';
import { cn } from '@/lib/utils';

function resolvePostSignupTarget(raw: string): string {
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

function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '';
  const { refreshSession, hydrateSession, toast } = useStore();

  useEffect(() => {
    router.prefetch('/');
    void createClient().auth.getSession();
  }, [router]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

      if (regData.sessionSnapshot) {
        hydrateSession(regData.sessionSnapshot);
      } else {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        await refreshSession();
      }

      toast('Cadastro realizado com sucesso! Bem-vindo(a) à Tênis Club!', 'success');
      router.replace(resolvePostSignupTarget(redirectParam));
    } catch {
      setErrorMsg('Falha de comunicação ao realizar cadastro.');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const nextTarget = resolvePostSignupTarget(redirectParam);
      const callbackUrl = `${window.location.origin}/auth/callback${
        nextTarget !== '/' ? `?next=${encodeURIComponent(nextTarget)}` : ''
      }`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl },
      });
      if (error) {
        setErrorMsg('Não foi possível conectar ao Google. Tente novamente.');
        setGoogleLoading(false);
      }
    } catch {
      setErrorMsg('Falha ao iniciar autenticação com Google.');
      setGoogleLoading(false);
    }
  };
// step 3/8
