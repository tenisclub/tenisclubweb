'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  CheckoutIcon,
  CheckoutIconPicker,
} from '@/components/cart/CheckoutDeliveryIcons';
import { useStore } from '@/components/providers/StoreProvider';
import {
  calculateCheckoutShipping,
  DEFAULT_CHECKOUT_DELIVERY_CONFIG,
  normalizeCheckoutDeliveryConfig,
  type CheckoutCustomButton,
  type CheckoutDeliveryConfig,
  type CheckoutExtraCard,
  type DeliveryFeeMode,
} from '@/lib/checkout-config';
import { cn, formatCurrency } from '@/lib/utils';
import type { DeliveryMethod, StoreSettings } from '@/types/database';

const PREVIEW_SUBTOTAL = 299.9;

export function SettingsClient({ initialSettings }: { initialSettings: StoreSettings }) {
  const router = useRouter();
  const { toast } = useStore();
  const [form, setForm] = useState<StoreSettings>(() => ({
    ...initialSettings,
    checkout_delivery_config: normalizeCheckoutDeliveryConfig(
      initialSettings.checkout_delivery_config
    ),
  }));
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [previewMethod, setPreviewMethod] = useState<DeliveryMethod>('pickup');

  const deliveryCfg = useMemo(
    () => normalizeCheckoutDeliveryConfig(form.checkout_delivery_config),
    [form.checkout_delivery_config]
  );

  const setField = (key: keyof StoreSettings, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateDeliveryCfg = (patch: Partial<CheckoutDeliveryConfig>) => {
    setForm((prev) => {
      const current = normalizeCheckoutDeliveryConfig(prev.checkout_delivery_config);
      const next = { ...current, ...patch };
      return { ...prev, checkout_delivery_config: next };
    });
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
      router.refresh();
      toast('Configurações da loja atualizadas em todo o site!', 'success');
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

  // Extra cards helpers
  const addExtraCard = () => {
    const nextCard: CheckoutExtraCard = {
      id: `card-${Date.now()}`,
      icon: 'sparkles',
      title: 'Aviso importante',
      description: 'Entregas realizadas no mesmo dia para pedidos confirmados até 15h.',
      badge: 'Rápido',
      visibility: 'always',
    };
    updateDeliveryCfg({ extra_cards: [...deliveryCfg.extra_cards, nextCard] });
  };

  const updateExtraCard = (id: string, patch: Partial<CheckoutExtraCard>) => {
    updateDeliveryCfg({
      extra_cards: deliveryCfg.extra_cards.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    });
  };

  const removeExtraCard = (id: string) => {
    updateDeliveryCfg({
      extra_cards: deliveryCfg.extra_cards.filter((c) => c.id !== id),
    });
  };

  // Custom buttons helpers
  const buildStoreWhatsAppLink = () => {
    const digits = (form.whatsapp || '').replace(/\D/g, '');
    const text = encodeURIComponent(
      'Olá! Gostaria de consultar a taxa e o prazo de entrega para o meu endereço.'
    );
    return `https://wa.me/${digits}?text=${text}`;
  };

  const addCustomButton = () => {
    const nextBtn: CheckoutCustomButton = {
      id: `btn-${Date.now()}`,
      label: 'Consultar taxa no WhatsApp',
      url: buildStoreWhatsAppLink(),
      icon: 'message-circle',
      variant: 'whatsapp',
      visibility: 'always',
    };
    updateDeliveryCfg({ custom_buttons: [...deliveryCfg.custom_buttons, nextBtn] });
  };

  const updateCustomButton = (id: string, patch: Partial<CheckoutCustomButton>) => {
    updateDeliveryCfg({
      custom_buttons: deliveryCfg.custom_buttons.map((b) =>
        b.id === id ? { ...b, ...patch } : b
      ),
    });
  };

  const removeCustomButton = (id: string) => {
    updateDeliveryCfg({
      custom_buttons: deliveryCfg.custom_buttons.filter((b) => b.id !== id),
    });
  };

  // Live preview calculations
  const activePreviewMethod: DeliveryMethod =
    previewMethod === 'pickup' && !deliveryCfg.pickup_enabled && deliveryCfg.delivery_enabled
      ? 'local_delivery'
      : previewMethod === 'local_delivery' &&
          !deliveryCfg.delivery_enabled &&
          deliveryCfg.pickup_enabled
        ? 'pickup'
        : previewMethod;

  const previewShipping = useMemo(
    () => calculateCheckoutShipping(deliveryCfg, activePreviewMethod, PREVIEW_SUBTOTAL),
    [deliveryCfg, activePreviewMethod]
  );

  const previewExtraCards = useMemo(
    () =>
      deliveryCfg.extra_cards.filter(
        (c) =>
          (c.title.trim() || c.description.trim()) &&
          (c.visibility === 'always' || c.visibility === activePreviewMethod)
      ),
    [deliveryCfg.extra_cards, activePreviewMethod]
  );

  const previewCustomButtons = useMemo(
    () =>
      deliveryCfg.custom_buttons.filter(
        (b) =>
          b.label.trim() &&
          b.url.trim() &&
          (b.visibility === 'always' || b.visibility === activePreviewMethod)
      ),
    [deliveryCfg.custom_buttons, activePreviewMethod]
  );

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Configurações da Loja</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Personalize identidade visual, prévia no WhatsApp, checkout (entrega/retirada) e políticas.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] text-xs sm:text-sm font-black transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      {/* 1. Identity, Banner & WhatsApp Link Preview */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-5">
        <h2 className="text-base font-black text-white">
          Identidade, Banner & Prévia do Link (WhatsApp / Google)
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="text-xs text-zinc-400">Slogan (Título no Link)</label>
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
              <label className="text-xs text-zinc-400">
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
            <div className="flex items-center justify-between gap-2">
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
              <strong className="text-zinc-200">Dica sobre cache do WhatsApp:</strong> após salvar,
              o site já atualiza na hora, mas o aplicativo do WhatsApp guarda no celular o texto de
              links já enviados antes. Use o botão <strong>Copiar link atualizado</strong> para
              forçar o WhatsApp a ler o texto novo imediatamente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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
              Imagem de Compartilhamento / Fundo (opcional)
            </span>
            <p className="text-[11px] text-zinc-400">
              Usada como miniatura OpenGraph ao compartilhar o link da loja.
            </p>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 text-xs font-bold text-[#BEFA46] cursor-pointer">
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
                  className="text-xs text-red-400 hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Contact & Physical Address */}
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

      {/* 3. CHECKOUT ETAPA 3 CUSTOMIZER + LIVE PREVIEW */}
      <div className="rounded-3xl border border-[#BEFA46]/30 bg-[#121216] p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/90 pb-5">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#BEFA46]">
              <Sparkles className="w-3.5 h-3.5" />
              Checkout Personalizável
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Retirada & Entrega — Etapa 3 do Checkout (Com Prévia ao Vivo)
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Ative ou oculte os 3 cards, troque ícones e títulos, configure taxa de entrega fixa
              ou grátis, edite informações de retirada e adicione botões ou avisos extras.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                updateDeliveryCfg({
                  pickup_enabled: false,
                  delivery_enabled: false,
                  pickup_info_card_enabled: false,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700 bg-[#18181F] hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
              Ocultar os 3 cards
            </button>
            <button
              type="button"
              onClick={() => updateDeliveryCfg(DEFAULT_CHECKOUT_DELIVERY_CONFIG)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700 bg-[#18181F] hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#BEFA46]" />
              Restaurar padrão
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: CONTROLS */}
          <div className="xl:col-span-7 space-y-5">
            {/* Quick Visibility Toggles for the 3 Cards */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-4 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 block">
                Visibilidade dos 3 Cards Principais
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    key: 'pickup_enabled' as const,
                    label: 'Card 1: Retirar na Loja',
                    enabled: deliveryCfg.pickup_enabled,
                  },
                  {
                    key: 'delivery_enabled' as const,
                    label: 'Card 2: Entrega Local',
                    enabled: deliveryCfg.delivery_enabled,
                  },
                  {
                    key: 'pickup_info_card_enabled' as const,
                    label: 'Card 3: Info. de Retirada',
                    enabled: deliveryCfg.pickup_info_card_enabled,
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => updateDeliveryCfg({ [item.key]: !item.enabled })}
                    className={cn(
                      'flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer',
                      item.enabled
                        ? 'border-[#BEFA46]/60 bg-[#BEFA46]/10 text-white'
                        : 'border-zinc-800 bg-[#121216] text-zinc-500'
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.enabled ? (
                      <Eye className="w-4 h-4 text-[#BEFA46] shrink-0" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-zinc-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Header & Footer Button */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-4 space-y-4">
              <h3 className="text-sm font-black text-white">Título da Etapa & Botão Avançar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-zinc-400">Título da Etapa (deixe vazio p/ ocultar)</label>
                  <input
                    type="text"
                    value={deliveryCfg.step_title}
                    onChange={(e) => updateDeliveryCfg({ step_title: e.target.value })}
                    placeholder="Etapa 3 — Entrega ou Retirada"
                    className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#121216] border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Texto do Botão Continuar</label>
                  <input
                    type="text"
                    value={deliveryCfg.next_button_label}
                    onChange={(e) => updateDeliveryCfg({ next_button_label: e.target.value })}
                    placeholder="Revisar Confirmação"
                    className="mt-1 w-full h-10 px-3.5 rounded-xl bg-[#121216] border border-zinc-800 text-sm text-white"
                  />
                </div>
              </div>
              <CheckoutIconPicker
                label="Ícone ao lado do Título da Etapa"
                value={deliveryCfg.step_icon}
                onChange={(step_icon) => updateDeliveryCfg({ step_icon })}
              />
            </div>

            {/* Card 1 + Card 3: Pickup & Pickup Info */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-white">
                  Card 1 & Card 3 — Retirada na Loja e Informações
                </h3>
                <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryCfg.pickup_enabled}
                    onChange={(e) => updateDeliveryCfg({ pickup_enabled: e.target.checked })}
                    className="accent-[#BEFA46] w-4 h-4 rounded"
                  />
                  Card ativo
                </label>
              </div>

              <CheckoutIconPicker
                label="Ícone do Card de Retirada"
                value={deliveryCfg.pickup_icon}
                onChange={(pickup_icon) => updateDeliveryCfg({ pickup_icon })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs text-zinc-400">Título do Card</label>
                  <input
                    type="text"
                    value={deliveryCfg.pickup_title}
                    onChange={(e) => updateDeliveryCfg({ pickup_title: e.target.value })}
                    className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Selo (quando R$ 0)</label>
                  <input
                    type="text"
                    value={deliveryCfg.pickup_badge}
                    onChange={(e) => updateDeliveryCfg({ pickup_badge: e.target.value })}
                    placeholder="Grátis"
                    className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Taxa de Retirada (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={deliveryCfg.pickup_fee}
                    onChange={(e) =>
                      updateDeliveryCfg({ pickup_fee: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs text-zinc-400">
                    Subtítulo / Endereço exibido no card (em branco usa o Endereço Físico da loja)
                  </label>
                  <input
                    type="text"
                    value={deliveryCfg.pickup_subtitle}
                    onChange={(e) => updateDeliveryCfg({ pickup_subtitle: e.target.value })}
                    placeholder={form.address}
                    className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs text-white"
                  />
                </div>
              </div>

              {/* Card 3: Pickup Info Card */}
              <div className="border-t border-zinc-800 pt-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-zinc-200">
                    Card 3 — Quadro de Informações de Retirada
                  </span>
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryCfg.pickup_info_card_enabled}
                      onChange={(e) =>
                        updateDeliveryCfg({ pickup_info_card_enabled: e.target.checked })
                      }
                      className="accent-[#BEFA46] w-4 h-4 rounded"
                    />
                    Exibir quadro
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400">Título do Quadro</label>
                    <input
                      type="text"
                      value={deliveryCfg.pickup_info_card_title}
                      onChange={(e) =>
                        updateDeliveryCfg({ pickup_info_card_title: e.target.value })
                      }
                      placeholder="Informações de retirada:"
                      className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs text-white"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deliveryCfg.show_pickup_hours}
                        onChange={(e) =>
                          updateDeliveryCfg({ show_pickup_hours: e.target.checked })
                        }
                        className="accent-[#BEFA46] w-4 h-4 rounded"
                      />
                      Mostrar horário da loja automaticamente
                    </label>
                  </div>
                </div>

                <CheckoutIconPicker
                  label="Ícone do Quadro de Informações"
                  value={deliveryCfg.pickup_info_card_icon}
                  onChange={(pickup_info_card_icon) =>
                    updateDeliveryCfg({ pickup_info_card_icon })
                  }
                />

                <div>
                  <label className="text-xs text-zinc-400">Texto de Informações de Retirada</label>
                  <textarea
                    rows={2}
                    value={form.pickup_info}
                    onChange={(e) => setField('pickup_info', e.target.value)}
                    className="mt-1 w-full p-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Local Delivery & Delivery Fee */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-white">
                  Card 2 — Entrega Local & Taxa de Entrega
                </h3>
                <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryCfg.delivery_enabled}
                    onChange={(e) => updateDeliveryCfg({ delivery_enabled: e.target.checked })}
                    className="accent-[#BEFA46] w-4 h-4 rounded"
                  />
                  Card ativo
                </label>
              </div>

              <CheckoutIconPicker
                label="Ícone do Card de Entrega"
                value={deliveryCfg.delivery_icon}
                onChange={(delivery_icon) => updateDeliveryCfg({ delivery_icon })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400">Título do Card</label>
                  <input
                    type="text"
                    value={deliveryCfg.delivery_title}
                    onChange={(e) => updateDeliveryCfg({ delivery_title: e.target.value })}
                    className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Modo de Taxa de Entrega</label>
                  <select
                    value={deliveryCfg.delivery_fee_mode}
                    onChange={(e) =>
                      updateDeliveryCfg({
                        delivery_fee_mode: e.target.value as DeliveryFeeMode,
                      })
                    }
                    className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-sm text-white"
                  >
                    <option value="to_combine">A combinar (confirmado pela loja)</option>
                    <option value="fixed">Taxa fixa automática em R$</option>
                    <option value="free">Entrega Grátis</option>
                  </select>
                </div>

                {deliveryCfg.delivery_fee_mode === 'fixed' ? (
                  <>
                    <div>
                      <label className="text-xs text-zinc-400">
                        Taxa de Entrega Fixa (R$) — soma no total do pedido
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.50"
                        value={deliveryCfg.delivery_fee}
                        onChange={(e) =>
                          updateDeliveryCfg({
                            delivery_fee: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">
                        Frete Grátis para compras acima de (R$ — 0 desativa)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={deliveryCfg.free_delivery_threshold}
                        onChange={(e) =>
                          updateDeliveryCfg({
                            free_delivery_threshold: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-sm text-white"
                      />
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-zinc-400">Texto do Selo no Card</label>
                    <input
                      type="text"
                      value={deliveryCfg.delivery_badge}
                      onChange={(e) => updateDeliveryCfg({ delivery_badge: e.target.value })}
                      placeholder={
                        deliveryCfg.delivery_fee_mode === 'free' ? 'Grátis' : 'A combinar'
                      }
                      className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-sm text-white"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="text-xs text-zinc-400">Descrição / Subtítulo do Card</label>
                  <input
                    type="text"
                    value={deliveryCfg.delivery_subtitle}
                    onChange={(e) => updateDeliveryCfg({ delivery_subtitle: e.target.value })}
                    className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryCfg.require_address_on_delivery}
                    onChange={(e) =>
                      updateDeliveryCfg({ require_address_on_delivery: e.target.checked })
                    }
                    className="accent-[#BEFA46] w-4 h-4 rounded"
                  />
                  Pedir endereço completo (CEP, Rua, Número, Bairro)
                </label>

                <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryCfg.delivery_info_card_enabled}
                    onChange={(e) =>
                      updateDeliveryCfg({ delivery_info_card_enabled: e.target.checked })
                    }
                    className="accent-[#BEFA46] w-4 h-4 rounded"
                  />
                  Exibir quadro informativo na Entrega Local
                </label>
              </div>

              <div className="border-t border-zinc-800 pt-3 space-y-3">
                {deliveryCfg.delivery_info_card_enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400">Título do Quadro de Entrega</label>
                      <input
                        type="text"
                        value={deliveryCfg.delivery_info_card_title}
                        onChange={(e) =>
                          updateDeliveryCfg({ delivery_info_card_title: e.target.value })
                        }
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs text-white"
                      />
                    </div>
                    <CheckoutIconPicker
                      label="Ícone do Quadro"
                      value={deliveryCfg.delivery_info_card_icon}
                      onChange={(delivery_info_card_icon) =>
                        updateDeliveryCfg({ delivery_info_card_icon })
                      }
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs text-zinc-400">
                    Informações sobre Entrega Local (usado no Checkout e na página Entrega & Retirada)
                  </label>
                  <textarea
                    rows={2}
                    value={form.delivery_info}
                    onChange={(e) => setField('delivery_info', e.target.value)}
                    className="mt-1 w-full p-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Custom Action Buttons */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-white">Botões Extras na Etapa 3</h3>
                  <p className="text-[11px] text-zinc-400">
                    Adicione botões como WhatsApp para cotar motoboy, localização no Google Maps, etc.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCustomButton}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Botão
                </button>
              </div>

              {deliveryCfg.custom_buttons.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">
                  Nenhum botão extra adicionado.
                </p>
              ) : (
                <div className="space-y-3">
                  {deliveryCfg.custom_buttons.map((btn) => (
                    <div
                      key={btn.id}
                      className="rounded-xl border border-zinc-800 bg-[#121216] p-3.5 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-zinc-400">Texto do Botão</label>
                          <input
                            type="text"
                            value={btn.label}
                            onChange={(e) =>
                              updateCustomButton(btn.id, { label: e.target.value })
                            }
                            placeholder="Ex: Consultar taxa no WhatsApp"
                            className="mt-1 w-full h-9 px-3 rounded-lg bg-[#18181F] border border-zinc-800 text-xs text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-zinc-400">Estilo</label>
                            <select
                              value={btn.variant}
                              onChange={(e) =>
                                updateCustomButton(btn.id, {
                                  variant: e.target.value as CheckoutCustomButton['variant'],
                                })
                              }
                              className="mt-1 w-full h-9 px-2.5 rounded-lg bg-[#18181F] border border-zinc-800 text-xs text-white"
                            >
                              <option value="whatsapp">Verde WhatsApp</option>
                              <option value="volt">Destaque Volt</option>
                              <option value="outline">Borda Discreta</option>
                              <option value="subtle">Sutil Escuro</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] text-zinc-400">Exibir em</label>
                            <select
                              value={btn.visibility}
                              onChange={(e) =>
                                updateCustomButton(btn.id, {
                                  visibility: e.target.value as CheckoutCustomButton['visibility'],
                                })
                              }
                              className="mt-1 w-full h-9 px-2.5 rounded-lg bg-[#18181F] border border-zinc-800 text-xs text-white"
                            >
                              <option value="always">Sempre</option>
                              <option value="pickup">Só Retirada</option>
                              <option value="local_delivery">Só Entrega</option>
                            </select>
                          </div>
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] text-zinc-400">Link (URL)</label>
                            <button
                              type="button"
                              onClick={() =>
                                updateCustomButton(btn.id, { url: buildStoreWhatsAppLink() })
                              }
                              className="text-[11px] font-bold text-[#BEFA46] hover:underline cursor-pointer"
                            >
                              Preencher WhatsApp da loja
                            </button>
                          </div>
                          <input
                            type="text"
                            value={btn.url}
                            onChange={(e) => updateCustomButton(btn.id, { url: e.target.value })}
                            placeholder="https://wa.me/5511999999999"
                            className="w-full h-9 px-3 rounded-lg bg-[#18181F] border border-zinc-800 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-3">
                        <CheckoutIconPicker
                          label="Ícone do Botão"
                          value={btn.icon}
                          onChange={(icon) => updateCustomButton(btn.id, { icon })}
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomButton(btn.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Extra Custom Cards */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-white">Cards / Avisos Extras</h3>
                  <p className="text-[11px] text-zinc-400">
                    Crie quadros adicionais de aviso (ex: motoboy expresso, brinde na retirada, etc.).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addExtraCard}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#BEFA46]/50 bg-[#BEFA46]/10 text-[#BEFA46] text-xs font-black cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Card Extra
                </button>
              </div>

              {deliveryCfg.extra_cards.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">Nenhum card extra adicionado.</p>
              ) : (
                <div className="space-y-3">
                  {deliveryCfg.extra_cards.map((card) => (
                    <div
                      key={card.id}
                      className="rounded-xl border border-zinc-800 bg-[#121216] p-3.5 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[11px] text-zinc-400">Título</label>
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) =>
                              updateExtraCard(card.id, { title: e.target.value })
                            }
                            className="mt-1 w-full h-9 px-3 rounded-lg bg-[#18181F] border border-zinc-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-zinc-400">Selo (opcional)</label>
                          <input
                            type="text"
                            value={card.badge}
                            onChange={(e) =>
                              updateExtraCard(card.id, { badge: e.target.value })
                            }
                            placeholder="Ex: Hoje"
                            className="mt-1 w-full h-9 px-3 rounded-lg bg-[#18181F] border border-zinc-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-zinc-400">Exibir em</label>
                          <select
                            value={card.visibility}
                            onChange={(e) =>
                              updateExtraCard(card.id, {
                                visibility: e.target.value as CheckoutExtraCard['visibility'],
                              })
                            }
                            className="mt-1 w-full h-9 px-2.5 rounded-lg bg-[#18181F] border border-zinc-800 text-xs text-white"
                          >
                            <option value="always">Sempre</option>
                            <option value="pickup">Só Retirada</option>
                            <option value="local_delivery">Só Entrega</option>
                          </select>
                        </div>
                        <div className="sm:col-span-3">
                          <label className="text-[11px] text-zinc-400">Descrição</label>
                          <textarea
                            rows={2}
                            value={card.description}
                            onChange={(e) =>
                              updateExtraCard(card.id, { description: e.target.value })
                            }
                            className="mt-1 w-full p-2.5 rounded-lg bg-[#18181F] border border-zinc-800 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-3">
                        <CheckoutIconPicker
                          label="Ícone do Card"
                          value={card.icon}
                          onChange={(icon) => updateExtraCard(card.id, { icon })}
                        />
                        <button
                          type="button"
                          onClick={() => removeExtraCard(card.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY LIVE INTERACTIVE PREVIEW */}
          <div className="xl:col-span-5 xl:sticky xl:top-24 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#BEFA46]">
                Prévia ao Vivo — Visão do Cliente
              </span>
              <div className="inline-flex rounded-xl border border-zinc-800 bg-[#18181F] p-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewMethod('pickup')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition cursor-pointer',
                    activePreviewMethod === 'pickup'
                      ? 'bg-[#BEFA46] text-[#09090B]'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  Retirada
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMethod('local_delivery')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition cursor-pointer',
                    activePreviewMethod === 'local_delivery'
                      ? 'bg-[#BEFA46] text-[#09090B]'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  Entrega
                </button>
              </div>
            </div>

            {/* Simulated Checkout Etapa 3 Container */}
            <div className="rounded-3xl border border-zinc-800 bg-[#0D0D11] p-5 sm:p-6 space-y-4 shadow-2xl">
              {deliveryCfg.step_title && (
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  {deliveryCfg.step_icon !== 'none' && (
                    <CheckoutIcon
                      name={deliveryCfg.step_icon}
                      className="w-5 h-5 text-[#BEFA46] shrink-0"
                    />
                  )}
                  <span>{deliveryCfg.step_title}</span>
                </h3>
              )}

              {(deliveryCfg.pickup_enabled || deliveryCfg.delivery_enabled) && (
                <div
                  className={cn(
                    'grid grid-cols-1 gap-3',
                    deliveryCfg.pickup_enabled &&
                      deliveryCfg.delivery_enabled &&
                      'sm:grid-cols-2'
                  )}
                >
                  {deliveryCfg.pickup_enabled && (
                    <button
                      type="button"
                      onClick={() => setPreviewMethod('pickup')}
                      className={cn(
                        'rounded-2xl border p-3.5 text-left space-y-1.5 transition cursor-pointer',
                        activePreviewMethod === 'pickup'
                          ? 'border-[#BEFA46] bg-[#BEFA46]/10'
                          : 'border-zinc-800 bg-[#18181F] hover:border-zinc-700'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {deliveryCfg.pickup_icon !== 'none' ? (
                          <CheckoutIcon
                            name={deliveryCfg.pickup_icon}
                            className="w-5 h-5 text-[#BEFA46]"
                          />
                        ) : (
                          <span />
                        )}
                        <span className="text-xs font-extrabold text-emerald-400">
                          {previewShipping.pickupCardBadge}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-extrabold text-white">
                        {deliveryCfg.pickup_title || 'Retirar na Loja'}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {deliveryCfg.pickup_subtitle || form.address}
                      </p>
                    </button>
                  )}

                  {deliveryCfg.delivery_enabled && (
                    <button
                      type="button"
                      onClick={() => setPreviewMethod('local_delivery')}
                      className={cn(
                        'rounded-2xl border p-3.5 text-left space-y-1.5 transition cursor-pointer',
                        activePreviewMethod === 'local_delivery'
                          ? 'border-[#BEFA46] bg-[#BEFA46]/10'
                          : 'border-zinc-800 bg-[#18181F] hover:border-zinc-700'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {deliveryCfg.delivery_icon !== 'none' ? (
                          <CheckoutIcon
                            name={deliveryCfg.delivery_icon}
                            className="w-5 h-5 text-[#BEFA46]"
                          />
                        ) : (
                          <span />
                        )}
                        <span
                          className={cn(
                            'text-xs font-semibold',
                            previewShipping.deliveryCardBadge === 'Grátis'
                              ? 'text-emerald-400 font-extrabold'
                              : 'text-zinc-200'
                          )}
                        >
                          {previewShipping.deliveryCardBadge}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-extrabold text-white">
                        {deliveryCfg.delivery_title || 'Solicitar Entrega Local'}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {deliveryCfg.delivery_subtitle}
                      </p>
                      {deliveryCfg.delivery_fee_mode === 'fixed' &&
                        deliveryCfg.free_delivery_threshold > 0 &&
                        PREVIEW_SUBTOTAL < deliveryCfg.free_delivery_threshold && (
                          <p className="text-[10px] font-semibold text-[#BEFA46]">
                            Frete grátis acima de{' '}
                            {formatCurrency(deliveryCfg.free_delivery_threshold)}
                          </p>
                        )}
                    </button>
                  )}
                </div>
              )}

              {/* Card 3 Preview (Pickup) */}
              {activePreviewMethod === 'pickup' &&
                deliveryCfg.pickup_info_card_enabled &&
                (form.pickup_info ||
                  (deliveryCfg.show_pickup_hours && form.business_hours)) && (
                  <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-3.5 text-xs text-zinc-300 space-y-1">
                    {deliveryCfg.pickup_info_card_title && (
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        {deliveryCfg.pickup_info_card_icon !== 'none' && (
                          <CheckoutIcon
                            name={deliveryCfg.pickup_info_card_icon}
                            className="w-4 h-4 text-[#BEFA46] shrink-0"
                          />
                        )}
                        <span>{deliveryCfg.pickup_info_card_title}</span>
                      </div>
                    )}
                    {form.pickup_info && (
                      <p className="whitespace-pre-line text-[11px]">{form.pickup_info}</p>
                    )}
                    {deliveryCfg.show_pickup_hours && form.business_hours && (
                      <p className="text-[11px] text-zinc-400">
                        Horário: {form.business_hours}
                      </p>
                    )}
                  </div>
                )}

              {/* Delivery Info Card Preview */}
              {activePreviewMethod === 'local_delivery' &&
                deliveryCfg.delivery_info_card_enabled &&
                form.delivery_info && (
                  <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-3.5 text-xs text-zinc-300 space-y-1">
                    {deliveryCfg.delivery_info_card_title && (
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        {deliveryCfg.delivery_info_card_icon !== 'none' && (
                          <CheckoutIcon
                            name={deliveryCfg.delivery_info_card_icon}
                            className="w-4 h-4 text-[#BEFA46] shrink-0"
                          />
                        )}
                        <span>{deliveryCfg.delivery_info_card_title}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-line text-[11px]">{form.delivery_info}</p>
                  </div>
                )}

              {/* Extra Cards Preview */}
              {previewExtraCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-2xl border border-zinc-800 bg-[#18181F] p-3.5 text-xs text-zinc-300 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      {card.icon !== 'none' && (
                        <CheckoutIcon
                          name={card.icon}
                          className="w-4 h-4 text-[#BEFA46] shrink-0"
                        />
                      )}
                      <span>{card.title}</span>
                    </div>
                    {card.badge && (
                      <span className="text-[10px] font-extrabold text-[#BEFA46]">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  {card.description && (
                    <p className="whitespace-pre-line text-[11px] text-zinc-400">
                      {card.description}
                    </p>
                  )}
                </div>
              ))}

              {/* Custom Buttons Preview */}
              {previewCustomButtons.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {previewCustomButtons.map((btn) => (
                    <span
                      key={btn.id}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold',
                        btn.variant === 'volt' && 'bg-[#BEFA46] text-[#09090B] font-black',
                        btn.variant === 'whatsapp' &&
                          'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300',
                        btn.variant === 'outline' &&
                          'bg-[#18181F] border border-zinc-700 text-white',
                        btn.variant === 'subtle' && 'bg-zinc-900 text-zinc-300'
                      )}
                    >
                      {btn.icon !== 'none' && (
                        <CheckoutIcon name={btn.icon} className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{btn.label}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Address Form Indicator when Local Delivery is selected */}
              {deliveryCfg.delivery_enabled &&
                activePreviewMethod === 'local_delivery' &&
                deliveryCfg.require_address_on_delivery && (
                  <div className="rounded-xl border border-dashed border-zinc-700 bg-[#14141B] p-3 text-[11px] text-zinc-400">
                    Campos de endereço (CEP, Rua, Número, Bairro e Ponto de Referência) aparecem
                    aqui para o cliente preencher.
                  </div>
                )}

              <div className="flex items-center justify-between pt-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar
                </span>
                <span className="px-4 py-2.5 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black inline-flex items-center gap-1.5">
                  {deliveryCfg.next_button_label || 'Revisar Confirmação'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Simulated Financial Summary */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-4 space-y-2 text-xs">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                Simulação do Resumo do Pedido
              </span>
              <div className="flex justify-between text-zinc-300">
                <span>Subtotal exemplo (1 par)</span>
                <span>{formatCurrency(PREVIEW_SUBTOTAL)}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Entrega / Retirada</span>
                <span className="font-bold text-white">{previewShipping.summaryLabel}</span>
              </div>
              <div className="border-t border-zinc-800 pt-2 flex justify-between items-baseline">
                <span className="font-bold text-white">Total final registrado</span>
                <span className="text-base font-black text-[#BEFA46]">
                  {formatCurrency(PREVIEW_SUBTOTAL + previewShipping.shippingCost)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Institutional Policies */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-4">
        <h2 className="text-base font-black text-white">Políticas Institucionais & Sobre Nós</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-400">Política de Troca e Devolução</label>
            <textarea
              rows={2}
              value={form.exchange_policy}
              onChange={(e) => setField('exchange_policy', e.target.value)}
              className="mt-1 w-full p-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-400">Sobre Nós (Apresentação da Loja)</label>
            <textarea
              rows={3}
              value={form.about_text}
              onChange={(e) => setField('about_text', e.target.value)}
              className="mt-1 w-full p-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Política de Privacidade (LGPD)</label>
            <textarea
              rows={2}
              value={form.privacy_policy}
              onChange={(e) => setField('privacy_policy', e.target.value)}
              className="mt-1 w-full p-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Termos de Uso</label>
            <textarea
              rows={2}
              value={form.terms_of_use}
              onChange={(e) => setField('terms_of_use', e.target.value)}
              className="mt-1 w-full p-3 rounded-xl bg-[#18181F] border border-zinc-800 text-xs text-white"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] text-sm font-black shadow-[0_8px_28px_rgba(190,250,70,0.25)] transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
        </button>
      </div>
    </form>
  );
}
