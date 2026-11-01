'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Copy,
  FileText,
  Globe,
  LayoutGrid,
  Phone,
  Save,
  Sparkles,
  Upload,
} from 'lucide-react';
import { CheckoutStep3Customizer } from '@/components/admin/CheckoutStep3Customizer';
import { useStore } from '@/components/providers/StoreProvider';
import {
  DEFAULT_CHECKOUT_DELIVERY_CONFIG,
  normalizeCheckoutDeliveryConfig,
  type CheckoutDeliveryConfig,
} from '@/lib/checkout-config';
import { cn } from '@/lib/utils';
import type { StoreSettings } from '@/types/database';

type SettingsSectionTab = 'all' | 'checkout' | 'identity' | 'contact' | 'policies';

export function SettingsClient({ initialSettings }: { initialSettings: StoreSettings }) {
  const router = useRouter();
  const { toast } = useStore();
  const isDirtyRef = useRef(false);
  const [activeTab, setActiveTab] = useState<SettingsSectionTab>('all');

  const [form, setForm] = useState<StoreSettings>(() => ({
    ...initialSettings,
    checkout_delivery_config: normalizeCheckoutDeliveryConfig(
      initialSettings.checkout_delivery_config
    ),
  }));
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Sync external Realtime changes when admin does not have unsaved local edits
  useEffect(() => {
    if (isDirtyRef.current || saving) return;
    const normalized = normalizeCheckoutDeliveryConfig(
      initialSettings.checkout_delivery_config
    );
    setForm({
      ...initialSettings,
      checkout_delivery_config: normalized,
    });
  }, [initialSettings, saving]);

  const deliveryCfg = useMemo(
    () => normalizeCheckoutDeliveryConfig(form.checkout_delivery_config),
    [form.checkout_delivery_config]
  );

  const setField = (key: keyof StoreSettings, value: unknown) => {
    isDirtyRef.current = true;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateDeliveryCfg = (patch: Partial<CheckoutDeliveryConfig>) => {
    isDirtyRef.current = true;
    setForm((prev) => {
      const current = normalizeCheckoutDeliveryConfig(prev.checkout_delivery_config);
      const next = { ...current, ...patch };
      return { ...prev, checkout_delivery_config: next };
    });
  };

  const resetEtapa3ToDefault = () => {
    isDirtyRef.current = true;
    setForm((prev) => ({
      ...prev,
      checkout_delivery_config: {
        ...DEFAULT_CHECKOUT_DELIVERY_CONFIG,
        extra_cards: [],
        custom_buttons: [],
      },
    }));
    toast('Cards da Etapa 3 restaurados para o padrão! Clique em Salvar para publicar.', 'info');
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
      const payload: StoreSettings = {
        ...form,
        checkout_delivery_config: deliveryCfg,
      };
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Erro ao salvar configurações.', 'error');
        return;
      }
      isDirtyRef.current = false;
      router.refresh();
      toast('Configurações da loja atualizadas em tempo real em todo o site!', 'success');
    } finally {
      setSaving(false);
    }
  };

  const copyFreshShareLink = async () => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://tenisclub.vercel.app';
    const freshUrl = `${origin}/?v=${Math.floor(Date.now() / 1000)}`;
    try {
      await navigator.clipboard.writeText(freshUrl);
      toast('Link com atualização de prévia copiado para colar no WhatsApp!', 'success');
    } catch {
      toast(freshUrl, 'info');
    }
  };

  const sectionTabs: { id: SettingsSectionTab; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Todas as Seções', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'checkout', label: 'Checkout (Etapa 3)', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'identity', label: 'Identidade & Link', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'contact', label: 'Contato & Redes', icon: <Phone className="w-3.5 h-3.5" /> },
    { id: 'policies', label: 'Políticas', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-7xl">
      {/* Top Header + Sticky Quick Filter & Save Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">Configurações da Loja</h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Personalize identidade visual, prévia no WhatsApp, checkout (entrega/retirada) e políticas.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] text-xs sm:text-sm font-black shadow-[0_4px_20px_rgba(190,250,70,0.22)] transition cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>

        {/* Section Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-zinc-800/90 bg-[#121216] p-1.5">
          {sectionTabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer',
                  active
                    ? 'bg-[#BEFA46] text-[#09090B] font-black shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-[#18181F]'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Identity, Banner & WhatsApp Link Preview */}
      {(activeTab === 'all' || activeTab === 'identity') && (
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-5">
          <div className="border-b border-zinc-800/80 pb-4">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#BEFA46] block">
              Identidade Visual & SEO
            </span>
            <h2 className="text-base sm:text-lg font-black text-white">
              Marca, Banner Principal & Prévia do Link no WhatsApp
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400">Nome da Loja</label>
                <input
                  type="text"
                  value={form.store_name}
                  onChange={(e) => setField('store_name', e.target.value)}
                  className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400">
                  Slogan (Título no Link)
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setField('tagline', e.target.value)}
                  className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400">
                  Selo Superior (Hero Badge)
                </label>
                <input
                  type="text"
                  value={form.hero_badge}
                  onChange={(e) => setField('hero_badge', e.target.value)}
                  className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400">
                  Frase Principal do Banner
                </label>
                <input
                  type="text"
                  value={form.hero_title}
                  onChange={(e) => setField('hero_title', e.target.value)}
                  className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-zinc-400">
                  Descrição do Site / Texto da Prévia no WhatsApp e Google
                </label>
                <input
                  type="text"
                  value={form.hero_subtitle}
                  onChange={(e) => setField('hero_subtitle', e.target.value)}
                  className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
                />
              </div>
            </div>

            {/* WhatsApp Link Preview Box */}
            <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-[#18181F] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#BEFA46]">
                  Prévia ao colar no WhatsApp
                </span>
                <button
                  type="button"
                  onClick={copyFreshShareLink}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-white transition cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-[#BEFA46]" />
                  Copiar link atualizado
                </button>
              </div>

              <div className="rounded-xl border-l-4 border-[#25D366] bg-[#1F2C34] p-3 space-y-1">
                <p className="text-xs font-bold text-white line-clamp-1">
                  {form.store_name || 'Tênis Club'} — {form.tagline || 'Estilo para toda a família'}
                </p>
                <p className="text-[11px] text-zinc-300 line-clamp-2">
                  {form.hero_subtitle || 'Descrição da loja'}
                </p>
                <p className="text-[10px] text-zinc-400">tenisclub.vercel.app</p>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                <strong className="text-zinc-200">Dica sobre cache do WhatsApp:</strong> use o
                botão <strong>Copiar link atualizado</strong> após salvar para forçar o celular a
                buscar o texto novo imediatamente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  Logotipo Personalizado (opcional)
                </span>
                <p className="text-[11px] text-zinc-400">
                  Em branco, usa o logotipo vetorial oficial TÊNIS CLUB.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-[#BEFA46] transition cursor-pointer">
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
                    className="text-xs text-red-400 hover:underline cursor-pointer"
                  >
                    Restaurar
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  Miniatura de Compartilhamento (opcional)
                </span>
                <p className="text-[11px] text-zinc-400">
                  Usada como imagem OpenGraph ao compartilhar o link.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-[#BEFA46] transition cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingField === 'hero_banner_url' ? 'Enviando...' : 'Enviar Imagem'}
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
                    className="text-xs text-red-400 hover:underline cursor-pointer"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Contact & Physical Address */}
      {(activeTab === 'all' || activeTab === 'contact') && (
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-4">
          <div className="border-b border-zinc-800/80 pb-4">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#BEFA46] block">
              Atendimento & Localização
            </span>
            <h2 className="text-base sm:text-lg font-black text-white">
              WhatsApp, Endereço Físico & Redes Sociais
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400">
                WhatsApp da Loja (com DDI 55)
              </label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setField('whatsapp', e.target.value)}
                placeholder="5511999999999"
                className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-400">Telefone Exibido</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-400">E-mail de Contato</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-zinc-400">
                Endereço Físico Completo
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
                className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-400">
                Horários de Funcionamento
              </label>
              <input
                type="text"
                value={form.business_hours}
                onChange={(e) => setField('business_hours', e.target.value)}
                className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-400">Instagram URL</label>
              <input
                type="text"
                value={form.instagram_url || ''}
                onChange={(e) => setField('instagram_url', e.target.value)}
                className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-400">Facebook URL</label>
              <input
                type="text"
                value={form.facebook_url || ''}
                onChange={(e) => setField('facebook_url', e.target.value)}
                className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-400">TikTok URL</label>
              <input
                type="text"
                value={form.tiktok_url || ''}
                onChange={(e) => setField('tiktok_url', e.target.value)}
                className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Checkout Etapa 3 Customizer + Live Preview */}
      {(activeTab === 'all' || activeTab === 'checkout') && (
        <CheckoutStep3Customizer
          form={form}
          deliveryCfg={deliveryCfg}
          setField={setField}
          updateDeliveryCfg={updateDeliveryCfg}
          onResetDefault={resetEtapa3ToDefault}
        />
      )}

      {/* 4. Institutional Policies */}
      {(activeTab === 'all' || activeTab === 'policies') && (
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-4">
          <div className="border-b border-zinc-800/80 pb-4">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#BEFA46] block">
              Páginas Institucionais
            </span>
            <h2 className="text-base sm:text-lg font-black text-white">
              Políticas de Troca, Privacidade & Sobre Nós
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-zinc-400">
                Política de Troca e Devolução
              </label>
              <textarea
                rows={2}
                value={form.exchange_policy}
                onChange={(e) => setField('exchange_policy', e.target.value)}
                className="mt-1 w-full p-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-zinc-400">
// step 11/12
