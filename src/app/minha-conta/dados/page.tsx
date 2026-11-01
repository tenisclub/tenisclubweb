'use client';

import React, { useEffect, useState } from 'react';
import { Save, Lock } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';

export default function MeusDadosPage() {
  const { user, refreshSession, toast } = useStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast('A confirmação de senha não confere.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Erro ao salvar dados.', 'error');
        return;
      }

      setNewPassword('');
      setConfirmPassword('');
      await refreshSession();
