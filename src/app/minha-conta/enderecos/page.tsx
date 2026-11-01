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
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-4"
        >
          <h2 className="text-base font-black text-white">Cadastrar Endereço</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs text-zinc-400">Identificação</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Casa, Trabalho..."
                className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">CEP</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="00000-000"
                className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Número *</label>
              <input
                type="text"
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-400">Rua / Avenida *</label>
              <input
                type="text"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Complemento</label>
              <input
                type="text"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Bairro *</label>
              <input
                type="text"
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Cidade *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">UF</label>
              <input
                type="text"
                maxLength={2}
                value={stateUf}
                onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs text-zinc-400">Referência</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ponto de referência para facilitar a entrega"
                className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 accent-[#BEFA46]"
            />
            Definir como endereço padrão
          </label>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black"
          >
            Salvar Endereço
          </button>
        </form>
      )}

      {loading ? (
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-8 text-center text-sm text-zinc-400">
          Carregando endereços...
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-10 text-center space-y-2">
          <MapPin className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-bold text-white">Nenhum endereço cadastrado</p>
          <p className="text-xs text-zinc-400">
            Adicione um endereço para utilizá-lo automaticamente nos pedidos com entrega local.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="rounded-2xl border border-zinc-800 bg-[#121216] p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-white">{addr.label}</span>
                  {addr.is_default && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#BEFA46]/15 text-[#BEFA46] text-[10px] font-bold">
                      Principal
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-300">
                  {addr.street}, {addr.number}
                  {addr.complement ? ` - ${addr.complement}` : ''}
                </p>
                <p className="text-xs text-zinc-400">
                  {addr.neighborhood} • {addr.city}/{addr.state}{' '}
                  {addr.zip_code ? `• CEP ${addr.zip_code}` : ''}
                </p>
                {addr.reference && (
                  <p className="text-xs text-zinc-500">Ref: {addr.reference}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-zinc-800/80 text-xs">
                {!addr.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="inline-flex items-center gap-1 font-bold text-[#BEFA46] hover:underline"
                  >
                    <Star className="w-3.5 h-3.5" />
                    Tornar principal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="inline-flex items-center gap-1 font-semibold text-zinc-400 hover:text-red-400 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

