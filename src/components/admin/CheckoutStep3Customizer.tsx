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
