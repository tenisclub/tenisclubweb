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
// step 2/6
