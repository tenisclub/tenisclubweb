'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2, Star } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import type { UserAddress } from '@/types/database';

export default function MeusEnderecosPage() {
  const { toast } = useStore();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [label, setLabel] = useState('Casa');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [stateUf, setStateUf] = useState('SP');
  const [reference, setReference] = useState('');
  const [isDefault, setIsDefault] = useState(true);

  const loadAddresses = async () => {
    setLoading(true);
    const res = await fetch('/api/account/addresses', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setAddresses(data.addresses || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAddresses();
    const onRealtime = () => {
      void loadAddresses();
    };
    window.addEventListener('tc:realtime-sync', onRealtime);
    return () => window.removeEventListener('tc:realtime-sync', onRealtime);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/account/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label,
        zip_code: zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state: stateUf,
        reference,
        is_default: isDefault,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast(data.error || 'Erro ao adicionar endereço.', 'error');
      return;
    }

    toast('Endereço salvo com sucesso!', 'success');
    setShowForm(false);
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setReference('');
    loadAddresses();
  };

  const handleSetDefault = async (id: string) => {
    await fetch('/api/account/addresses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_default: true }),
    });
    loadAddresses();
    toast('Endereço principal atualizado.', 'info');
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    loadAddresses();
    toast('Endereço removido.', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Meus Endereços</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Cadastre seus endereços para agilizar pedidos com entrega local.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancelar' : 'Novo Endereço'}
// step 3/8
