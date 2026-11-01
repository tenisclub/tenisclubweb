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
