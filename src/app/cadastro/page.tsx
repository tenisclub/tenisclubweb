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

// step 1/8
