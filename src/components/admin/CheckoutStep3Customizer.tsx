'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import {
  CheckoutIcon,
  CheckoutIconPicker,
} from '@/components/cart/CheckoutDeliveryIcons';
import {
  calculateCheckoutShipping,
  getSelectableCheckoutOptions,
  resolveDefaultOptionKey,
  shouldRequireCheckoutAddress,
  type CheckoutCardType,
  type CheckoutCustomButton,
  type CheckoutDeliveryConfig,
  type CheckoutExtraCard,
  type DeliveryFeeMode,
} from '@/lib/checkout-config';
import { cn, formatCurrency } from '@/lib/utils';
import type { DeliveryMethod, StoreSettings } from '@/types/database';

const PREVIEW_SUBTOTAL = 299.9;

interface CheckoutStep3CustomizerProps {
  form: StoreSettings;
  deliveryCfg: CheckoutDeliveryConfig;
  setField: (key: keyof StoreSettings, value: unknown) => void;
  updateDeliveryCfg: (patch: Partial<CheckoutDeliveryConfig>) => void;
  onResetDefault: () => void;
}

export function CheckoutStep3Customizer({
  form,
  deliveryCfg,
  setField,
  updateDeliveryCfg,
  onResetDefault,
}: CheckoutStep3CustomizerProps) {
  const [previewOptionKey, setPreviewOptionKey] = useState<string>(() =>
    resolveDefaultOptionKey(deliveryCfg)
  );

  // Track which card editor is expanded so the screen stays clean and never stacks a wall of forms
  const [expandedCardId, setExpandedCardId] = useState<string | null>(() => {
    if (deliveryCfg.extra_cards.length > 0) return deliveryCfg.extra_cards[0].id;
    if (!deliveryCfg.pickup_removed && deliveryCfg.pickup_enabled) return 'main:pickup';
    if (!deliveryCfg.delivery_removed && deliveryCfg.delivery_enabled) return 'main:delivery';
    return null;
  });

  const toggleExpand = (id: string) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  const handleReset = () => {
    onResetDefault();
    setPreviewOptionKey('pickup');
    setExpandedCardId('main:pickup');
  };

  const addCustomCard = (type: CheckoutCardType = 'option') => {
    const id = `card-${Date.now()}`;
    const nextCard: CheckoutExtraCard =
      type === 'option'
        ? {
            id,
            enabled: true,
            card_type: 'option',
            icon: 'zap',
            title: 'Entrega Expressa',
            description: 'Receba hoje mesmo alinhando horário pelo WhatsApp.',
            badge: 'A combinar',
            fee_mode: 'to_combine',
            fee: 0,
            free_threshold: 0,
            require_address: true,
            visibility: 'always',
          }
        : {
            id,
            enabled: true,
            card_type: 'info',
            icon: 'sparkles',
            title: 'Confirmação de pedido',
            description: 'Confirme seu pedido diretamente no WhatsApp da loja.',
            badge: 'A combinar',
            fee_mode: 'free',
            fee: 0,
            free_threshold: 0,
            require_address: false,
            visibility: 'always',
          };

    updateDeliveryCfg({ extra_cards: [...deliveryCfg.extra_cards, nextCard] });
    setExpandedCardId(id);
    if (type === 'option') {
      setPreviewOptionKey(`custom:${id}`);
    }
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
    if (expandedCardId === id) {
      setExpandedCardId(null);
    }
  };

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
  const previewSelectableOptions = useMemo(
    () => getSelectableCheckoutOptions(deliveryCfg, form.address, PREVIEW_SUBTOTAL),
    [deliveryCfg, form.address]
  );

  const activePreviewOption =
    previewSelectableOptions.find((opt) => opt.key === previewOptionKey) ??
    previewSelectableOptions[0] ??
    null;

  const activePreviewKey = activePreviewOption?.key ?? 'pickup';
  const activePreviewMethod: DeliveryMethod =
    activePreviewOption?.deliveryMethod ?? 'pickup';

  const previewShipping = useMemo(
    () => calculateCheckoutShipping(deliveryCfg, activePreviewKey, PREVIEW_SUBTOTAL),
    [deliveryCfg, activePreviewKey]
  );

  const previewInfoCards = useMemo(
    () =>
      deliveryCfg.extra_cards.filter(
        (c) =>
          c.enabled &&
          c.card_type === 'info' &&
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

  const previewRequiresAddress = useMemo(
    () =>
      shouldRequireCheckoutAddress(
        deliveryCfg,
        activePreviewOption,
        activePreviewMethod
      ),
    [deliveryCfg, activePreviewOption, activePreviewMethod]
  );

  const hasAnyCard =
    !deliveryCfg.pickup_removed ||
    !deliveryCfg.delivery_removed ||
    !deliveryCfg.pickup_info_removed ||
    deliveryCfg.extra_cards.length > 0;

  const hasDeletedMainCard =
    deliveryCfg.pickup_removed ||
    deliveryCfg.delivery_removed ||
    deliveryCfg.pickup_info_removed;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-6">
      {/* MAIN HEADER — Single Reset Button, Clean Hierarchy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#BEFA46]">
            <Sparkles className="w-3.5 h-3.5" />
            Etapa 3 do Checkout
          </span>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Personalização de Recebimento, Avisos & Endereço
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Configure opções clicáveis, quadros de aviso, solicitação de endereço e botão do
            WhatsApp. Clique em qualquer card abaixo para expandir e editar seus detalhes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-[#18181F] hover:bg-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-300 transition cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#BEFA46]" />
          Restaurar padrão
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: STRUCTURED, CLEAN CONTROLS */}
        <div className="xl:col-span-7 space-y-5 min-w-0">
          {/* SECTION 1: STANDALONE ADDRESS TOGGLE BAR */}
          <div
            className={cn(
              'rounded-2xl border p-4 transition',
              deliveryCfg.always_require_address
                ? 'border-[#BEFA46]/50 bg-[#BEFA46]/[0.05]'
                : 'border-zinc-800/90 bg-[#18181F]'
            )}
          >
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 transition',
                    deliveryCfg.always_require_address
                      ? 'border-[#BEFA46]/50 bg-[#BEFA46]/15 text-[#BEFA46]'
                      : 'border-zinc-800 bg-[#121216] text-zinc-400'
                  )}
                >
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-white">
                      Pedir Endereço (Independente)
                    </h3>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider',
                        deliveryCfg.always_require_address
                          ? 'bg-[#BEFA46] text-[#09090B]'
                          : 'bg-zinc-800 text-zinc-400'
                      )}
                    >
                      {deliveryCfg.always_require_address ? 'Sempre Ativo' : 'Por Card'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Exige CEP, Rua, Número, Bairro e Cidade na Etapa 3 e envia no WhatsApp, mesmo
                    sem nenhum card selecionável.
                  </p>
                </div>
              </div>

              {/* Modern Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={deliveryCfg.always_require_address}
                onClick={() =>
                  updateDeliveryCfg({
                    always_require_address: !deliveryCfg.always_require_address,
                  })
                }
                className={cn(
                  'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  deliveryCfg.always_require_address ? 'bg-[#BEFA46]' : 'bg-zinc-700'
                )}
                title={
                  deliveryCfg.always_require_address
                    ? 'Desativar endereço obrigatório global'
                    : 'Ativar endereço obrigatório global'
                }
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[#09090B] shadow ring-0 transition duration-200 ease-in-out',
                    deliveryCfg.always_require_address ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </div>

          {/* SECTION 2: UNIFIED CARDS & CALLOUTS ACCORDION LIST */}
          <div className="rounded-2xl border border-zinc-800/90 bg-[#18181F] p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white">
                  Cards & Quadros da Etapa 3
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Clique em um card para abrir suas opções, oculte com o ícone de olho ou exclua.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => addCustomCard('option')}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] text-xs font-black transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  Opção Clicável
                </button>
                <button
                  type="button"
                  onClick={() => addCustomCard('info')}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700 bg-[#121216] hover:bg-zinc-800 text-xs font-bold text-zinc-200 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#BEFA46]" />
                  Quadro de Aviso
                </button>
              </div>
            </div>

            {!hasAnyCard ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-[#121216] px-4 py-6 text-center space-y-1.5">
                <p className="text-xs font-bold text-zinc-300">
                  Nenhum card ativo na Etapa 3
                </p>
                <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                  O cliente verá apenas os dados do pedido, {deliveryCfg.always_require_address ? 'o formulário de endereço, ' : ''}o campo de observações e o botão de finalizar no WhatsApp. Use os botões acima se quiser adicionar uma opção ou aviso.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* CUSTOM CARDS */}
                {deliveryCfg.extra_cards.map((card, index) => {
                  const isExpanded = expandedCardId === card.id;
                  return (
                    <div
                      key={card.id}
                      className={cn(
                        'rounded-xl border transition overflow-hidden',
                        card.enabled
                          ? isExpanded
                            ? 'border-[#BEFA46]/50 bg-[#121216]'
                            : 'border-zinc-800 bg-[#121216] hover:border-zinc-700'
                          : 'border-zinc-800/60 bg-[#121216]/60 opacity-75'
                      )}
                    >
                      {/* Compact Accordion Row Header */}
                      <div className="px-3.5 py-3 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpand(card.id)}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0',
                              card.enabled
                                ? 'border-[#BEFA46]/30 bg-[#BEFA46]/10 text-[#BEFA46]'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-500'
                            )}
                          >
                            <CheckoutIcon
                              name={card.icon === 'none' ? 'sparkles' : card.icon}
                              className="w-4 h-4"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                                {card.title || `Card Personalizado #${index + 1}`}
                              </span>
                              <span
                                className={cn(
                                  'px-1.5 py-0.5 rounded text-[10px] font-bold',
                                  card.card_type === 'option'
                                    ? 'bg-[#BEFA46]/15 text-[#BEFA46]'
                                    : 'bg-sky-500/15 text-sky-300'
                                )}
                              >
                                {card.card_type === 'option' ? 'Opção Clicável' : 'Quadro de Aviso'}
                              </span>
                              {card.require_address && (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-semibold text-zinc-300 inline-flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5 text-[#BEFA46]" />
                                  Pede endereço
                                </span>
                              )}
                              {!card.enabled && (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-semibold text-zinc-400">
                                  Oculto
                                </span>
                              )}
                            </div>
                            {card.description && (
                              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                {card.description}
                              </p>
                            )}
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            title={card.enabled ? 'Ocultar no checkout' : 'Mostrar no checkout'}
                            onClick={() => updateExtraCard(card.id, { enabled: !card.enabled })}
                            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                          >
                            {card.enabled ? (
                              <Eye className="w-4 h-4 text-[#BEFA46]" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-zinc-500" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleExpand(card.id)}
                            className={cn(
                              'px-2.5 py-1.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer',
                              isExpanded
                                ? 'border-[#BEFA46]/40 bg-[#BEFA46]/10 text-[#BEFA46]'
                                : 'border-zinc-800 bg-[#18181F] text-zinc-300 hover:text-white'
                            )}
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span className="hidden sm:inline">Editar</span>
                            <ChevronDown
                              className={cn(
                                'w-3.5 h-3.5 transition-transform',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          </button>
                          <button
                            type="button"
                            title="Excluir card"
                            onClick={() => removeExtraCard(card.id)}
                            className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Body */}
                      {isExpanded && (
                        <div className="border-t border-zinc-800/80 p-3.5 sm:p-4 bg-[#15151B] space-y-3.5">
                          {/* Type Switcher + Icon Picker side-by-side */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-zinc-400 block">
                                Formato do Card
                              </label>
                              <div className="grid grid-cols-2 rounded-xl border border-zinc-800 bg-[#121216] p-1 text-xs font-bold gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateExtraCard(card.id, { card_type: 'option' })}
                                  className={cn(
                                    'py-1.5 px-2 rounded-lg transition cursor-pointer text-center truncate',
                                    card.card_type === 'option'
                                      ? 'bg-[#BEFA46] text-[#09090B] font-black'
                                      : 'text-zinc-400 hover:text-white'
                                  )}
                                >
                                  Opção Clicável
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateExtraCard(card.id, { card_type: 'info' })}
                                  className={cn(
                                    'py-1.5 px-2 rounded-lg transition cursor-pointer text-center truncate',
                                    card.card_type === 'info'
                                      ? 'bg-[#BEFA46] text-[#09090B] font-black'
                                      : 'text-zinc-400 hover:text-white'
                                  )}
                                >
                                  Quadro de Aviso
                                </button>
                              </div>
                            </div>

                            <CheckoutIconPicker
                              label="Ícone do Card"
                              value={card.icon}
                              onChange={(icon) => updateExtraCard(card.id, { icon })}
                            />
                          </div>

                          {card.card_type === 'option' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] font-semibold text-zinc-400">
                                  Título da Opção
                                </label>
                                <input
                                  type="text"
                                  value={card.title}
                                  onChange={(e) =>
                                    updateExtraCard(card.id, { title: e.target.value })
                                  }
                                  placeholder="Ex: Entrega Expressa / Retirar no Shopping"
                                  className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs sm:text-sm text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-zinc-400">
                                  Modo de Taxa
                                </label>
                                <select
                                  value={card.fee_mode}
                                  onChange={(e) =>
                                    updateExtraCard(card.id, {
                                      fee_mode: e.target.value as DeliveryFeeMode,
                                    })
                                  }
                                  className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs sm:text-sm text-white"
                                >
                                  <option value="to_combine">A combinar (confirmado pela loja)</option>
                                  <option value="fixed">Taxa fixa automática em R$</option>
                                  <option value="free">Grátis</option>
                                </select>
                              </div>

                              {card.fee_mode === 'fixed' ? (
                                <>
                                  <div>
                                    <label className="text-[11px] font-semibold text-zinc-400">
                                      Valor da Taxa (R$)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.50"
                                      value={card.fee}
                                      onChange={(e) =>
                                        updateExtraCard(card.id, {
                                          fee: Math.max(0, Number(e.target.value) || 0),
                                        })
                                      }
                                      className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs sm:text-sm text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-semibold text-zinc-400">
                                      Grátis acima de (R$ — 0 desativa)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={card.free_threshold}
                                      onChange={(e) =>
                                        updateExtraCard(card.id, {
                                          free_threshold: Math.max(0, Number(e.target.value) || 0),
                                        })
                                      }
                                      className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs sm:text-sm text-white"
                                    />
                                  </div>
                                </>
                              ) : (
                                <div className="sm:col-span-2">
                                  <label className="text-[11px] font-semibold text-zinc-400">
                                    Selo exibido no Card
                                  </label>
                                  <input
                                    type="text"
                                    value={card.badge}
                                    onChange={(e) =>
                                      updateExtraCard(card.id, { badge: e.target.value })
                                    }
                                    placeholder={card.fee_mode === 'free' ? 'Grátis' : 'A combinar'}
                                    className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs sm:text-sm text-white"
                                  />
                                </div>
                              )}

                              <div className="sm:col-span-2">
                                <label className="text-[11px] font-semibold text-zinc-400">
                                  Descrição / Subtítulo
                                </label>
                                <input
                                  type="text"
                                  value={card.description}
                                  onChange={(e) =>
                                    updateExtraCard(card.id, { description: e.target.value })
                                  }
                                  placeholder="Ex: Entrega no mesmo dia para pedidos até as 16h."
                                  className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs text-white"
                                />
                              </div>

                              <div className="sm:col-span-2 pt-1">
                                <label className="inline-flex items-center gap-2.5 text-xs text-zinc-200 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={card.require_address}
                                    onChange={(e) =>
                                      updateExtraCard(card.id, {
                                        require_address: e.target.checked,
                                      })
                                    }
                                    className="accent-[#BEFA46] w-4 h-4 rounded shrink-0"
                                  />
                                  <span>
                                    Pedir endereço (CEP, Rua, Número e Bairro) ao escolher esta opção
                                  </span>
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[11px] font-semibold text-zinc-400">
                                  Título do Aviso
                                </label>
                                <input
                                  type="text"
                                  value={card.title}
                                  onChange={(e) =>
                                    updateExtraCard(card.id, { title: e.target.value })
                                  }
                                  className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-zinc-400">
                                  Selo (opcional)
                                </label>
                                <input
                                  type="text"
                                  value={card.badge}
                                  onChange={(e) =>
                                    updateExtraCard(card.id, { badge: e.target.value })
                                  }
                                  placeholder="Ex: A combinar"
                                  className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-zinc-400">
                                  Quando exibir
                                </label>
                                <select
                                  value={card.visibility}
                                  onChange={(e) =>
                                    updateExtraCard(card.id, {
                                      visibility: e.target.value as CheckoutExtraCard['visibility'],
                                    })
                                  }
                                  className="mt-1 w-full h-10 px-2.5 rounded-xl bg-[#121216] border border-zinc-800 text-xs text-white"
                                >
                                  <option value="always">Sempre visível</option>
                                  <option value="pickup">Só em Retirada</option>
                                  <option value="local_delivery">Só em Entrega</option>
                                </select>
                              </div>
                              <div className="sm:col-span-3">
                                <label className="text-[11px] font-semibold text-zinc-400">
                                  Texto do Aviso
                                </label>
                                <textarea
                                  rows={2}
                                  value={card.description}
                                  onChange={(e) =>
                                    updateExtraCard(card.id, { description: e.target.value })
                                  }
                                  className="mt-1 w-full p-2.5 rounded-xl bg-[#121216] border border-zinc-800 text-xs text-white"
                                />
                              </div>
                              <div className="sm:col-span-3 pt-1">
                                <label className="inline-flex items-center gap-2.5 text-xs text-zinc-200 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={card.require_address}
                                    onChange={(e) =>
                                      updateExtraCard(card.id, {
                                        require_address: e.target.checked,
                                      })
                                    }
                                    className="accent-[#BEFA46] w-4 h-4 rounded shrink-0"
                                  />
                                  <span>
                                    Pedir endereço (CEP, Rua, Número e Bairro) junto com este quadro de aviso
                                  </span>
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* MAIN CARD 1: PICKUP */}
                {!deliveryCfg.pickup_removed && (
                  <div
                    className={cn(
                      'rounded-xl border transition overflow-hidden',
                      deliveryCfg.pickup_enabled
                        ? expandedCardId === 'main:pickup'
                          ? 'border-[#BEFA46]/50 bg-[#121216]'
                          : 'border-zinc-800 bg-[#121216] hover:border-zinc-700'
                        : 'border-zinc-800/60 bg-[#121216]/60 opacity-75'
                    )}
                  >
                    <div className="px-3.5 py-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleExpand('main:pickup')}
                        className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0',
                            deliveryCfg.pickup_enabled
                              ? 'border-[#BEFA46]/30 bg-[#BEFA46]/10 text-[#BEFA46]'
                              : 'border-zinc-800 bg-zinc-900 text-zinc-500'
                          )}
                        >
                          <CheckoutIcon
                            name={
                              deliveryCfg.pickup_icon === 'none'
                                ? 'store'
                                : deliveryCfg.pickup_icon
                            }
                            className="w-4 h-4"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                              {deliveryCfg.pickup_title || 'Retirar na Loja'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300">
                              Card Principal
                            </span>
                            {!deliveryCfg.pickup_enabled && (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-semibold text-zinc-400">
                                Oculto
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {deliveryCfg.pickup_subtitle || form.address || 'Retirada física na loja'}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          title={deliveryCfg.pickup_enabled ? 'Ocultar card' : 'Mostrar card'}
                          onClick={() =>
                            updateDeliveryCfg({ pickup_enabled: !deliveryCfg.pickup_enabled })
                          }
                          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                        >
                          {deliveryCfg.pickup_enabled ? (
                            <Eye className="w-4 h-4 text-[#BEFA46]" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-zinc-500" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleExpand('main:pickup')}
                          className={cn(
                            'px-2.5 py-1.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer',
                            expandedCardId === 'main:pickup'
                              ? 'border-[#BEFA46]/40 bg-[#BEFA46]/10 text-[#BEFA46]'
                              : 'border-zinc-800 bg-[#18181F] text-zinc-300 hover:text-white'
                          )}
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span className="hidden sm:inline">Editar</span>
                          <ChevronDown
                            className={cn(
                              'w-3.5 h-3.5 transition-transform',
                              expandedCardId === 'main:pickup' && 'rotate-180'
                            )}
                          />
                        </button>
                        <button
                          type="button"
                          title="Excluir card principal"
                          onClick={() =>
                            updateDeliveryCfg({ pickup_removed: true, pickup_enabled: false })
                          }
                          className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {expandedCardId === 'main:pickup' && (
                      <div className="border-t border-zinc-800/80 p-3.5 sm:p-4 bg-[#15151B] space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400">
                              Título do Card
                            </label>
                            <input
                              type="text"
                              value={deliveryCfg.pickup_title}
                              onChange={(e) =>
                                updateDeliveryCfg({ pickup_title: e.target.value })
                              }
                              className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs sm:text-sm text-white"
                            />
                          </div>
                          <CheckoutIconPicker
                            label="Ícone do Card"
                            value={deliveryCfg.pickup_icon}
                            onChange={(pickup_icon) => updateDeliveryCfg({ pickup_icon })}
                          />
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400">
                              Selo (quando R$ 0)
                            </label>
                            <input
                              type="text"
                              value={deliveryCfg.pickup_badge}
                              onChange={(e) =>
                                updateDeliveryCfg({ pickup_badge: e.target.value })
                              }
                              placeholder="Grátis"
                              className="mt-1 w-full h-10 px-3 rounded-xl bg-[#121216] border border-zinc-800 text-xs sm:text-sm text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400">
                              Taxa de Retirada (R$)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.50"
                              value={deliveryCfg.pickup_fee}
                              onChange={(e) =>
                                updateDeliveryCfg({
                                  pickup_fee: Math.max(0, Number(e.target.value) || 0),
                                })
// step 11/24
