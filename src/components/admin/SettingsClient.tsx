'use client';

import React, { useState } from 'react';
import { Save, Upload } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import type { StoreSettings } from '@/types/database';

export function SettingsClient({ initialSettings }: { initialSettings: StoreSettings }) {
  const { toast } = useStore();
  const [form, setForm] = useState<StoreSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const setField = (key: keyof StoreSettings, value: string | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUploadAsset = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo_url' | 'hero_banner_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'store');

      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Falha no upload.', 'error');
        return;
      }
      setField(field, data.url);
      toast('Imagem enviada! Clique em Salvar Configurações para publicar.', 'success');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Erro ao salvar configurações.', 'error');
        return;
      }
      toast('Configurações da loja atualizadas!', 'success');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Configurações da Loja</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Personalize identidade visual, WhatsApp, endereço, horários e políticas institucionais.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs sm:text-sm font-black"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      {/* Identity & Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-4">
        <h2 className="text-base font-black text-white">Identidade & Banner Principal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-400">Nome da Loja</label>
            <input
              type="text"
              value={form.store_name}
              onChange={(e) => setField('store_name', e.target.value)}
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Slogan</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setField('tagline', e.target.value)}
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Selo Superior (Hero Badge)</label>
            <input
              type="text"
              value={form.hero_badge}
              onChange={(e) => setField('hero_badge', e.target.value)}
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Frase Principal do Banner</label>
            <input
              type="text"
              value={form.hero_title}
              onChange={(e) => setField('hero_title', e.target.value)}
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-400">Subtítulo do Banner</label>
            <input
              type="text"
              value={form.hero_subtitle}
              onChange={(e) => setField('hero_subtitle', e.target.value)}
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-4 space-y-2">
            <span className="text-xs font-bold text-white block">
              Logotipo Personalizado (opcional)
            </span>
            <p className="text-[11px] text-zinc-400">
              Em branco, usa o logotipo vetorial oficial TÊNIS CLUB.
            </p>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 text-xs font-bold text-[#BEFA46] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {uploadingField === 'logo_url' ? 'Enviando...' : 'Enviar Logo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadAsset(e, 'logo_url')}
                  className="hidden"
                />
              </label>
              {form.logo_url && (
                <button
                  type="button"
                  onClick={() => setField('logo_url', null)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Restaurar padrão
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-4 space-y-2">
            <span className="text-xs font-bold text-white block">
              Imagem de Fundo do Banner (opcional)
            </span>
            <p className="text-[11px] text-zinc-400">
              Exibida suavemente atrás do destaque principal na Home.
            </p>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 text-xs font-bold text-[#BEFA46] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {uploadingField === 'hero_banner_url' ? 'Enviando...' : 'Enviar Banner'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadAsset(e, 'hero_banner_url')}
                  className="hidden"
                />
              </label>
              {form.hero_banner_url && (
                <button
                  type="button"
                  onClick={() => setField('hero_banner_url', null)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Physical Address */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-4">
        <h2 className="text-base font-black text-white">Contato, WhatsApp & Endereço</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-400">WhatsApp (com DDI 55)</label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => setField('whatsapp', e.target.value)}
              placeholder="5511999999999"
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Telefone Exibido</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">E-mail de Contato</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-400">Endereço Físico Completo</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Horários de Funcionamento</label>
            <input
              type="text"
              value={form.business_hours}
              onChange={(e) => setField('business_hours', e.target.value)}
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Instagram URL</label>
            <input
              type="text"
              value={form.instagram_url || ''}
              onChange={(e) => setField('instagram_url', e.target.value)}
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Facebook URL</label>
            <input
              type="text"
              value={form.facebook_url || ''}
              onChange={(e) => setField('facebook_url', e.target.value)}
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">TikTok URL</label>
            <input
              type="text"
              value={form.tiktok_url || ''}
              onChange={(e) => setField('tiktok_url', e.target.value)}
              className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* Policies & Institutional Texts */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-4">
        <h2 className="text-base font-black text-white">
          Retirada, Entrega & Políticas Institucionais
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400">Informações sobre Retirada na Loja</label>
            <textarea
              rows={2}
              value={form.pickup_info}
              onChange={(e) => setField('pickup_info', e.target.value)}
              className="mt-1 w-full p-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Informações sobre Entrega Local</label>
            <textarea
              rows={2}
              value={form.delivery_info}
              onChange={(e) => setField('delivery_info', e.target.value)}
              className="mt-1 w-full p-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Política de Troca e Devolução</label>
            <textarea
              rows={2}
              value={form.exchange_policy}
              onChange={(e) => setField('exchange_policy', e.target.value)}
              className="mt-1 w-full p-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Sobre Nós (Apresentação da Loja)</label>
            <textarea
              rows={3}
              value={form.about_text}
              onChange={(e) => setField('about_text', e.target.value)}
              className="mt-1 w-full p-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
        </div>
      </div>
    </form>
  );
}

