'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Store,
  Truck,
  Package,
  Clock,
  Zap,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Navigation,
  Gift,
  ExternalLink,
  Info,
  Ban,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckoutIconKey } from '@/lib/checkout-config';

export const CHECKOUT_ICON_OPTIONS: { key: CheckoutIconKey; label: string }[] = [
  { key: 'store', label: 'Loja' },
  { key: 'truck', label: 'Entrega' },
  { key: 'map-pin', label: 'Local' },
  { key: 'package', label: 'Caixa' },
  { key: 'clock', label: 'Horário' },
  { key: 'zap', label: 'Expresso' },
  { key: 'shield-check', label: 'Seguro' },
  { key: 'sparkles', label: 'Destaque' },
  { key: 'message-circle', label: 'WhatsApp' },
  { key: 'navigation', label: 'Rota' },
  { key: 'gift', label: 'Presente' },
  { key: 'info', label: 'Aviso' },
  { key: 'external-link', label: 'Link' },
  { key: 'none', label: 'Sem ícone' },
];

export function CheckoutIcon({
  name,
  className = 'w-5 h-5',
}: {
  name: CheckoutIconKey;
  className?: string;
}) {
  switch (name) {
    case 'map-pin':
      return <MapPin className={className} />;
    case 'store':
      return <Store className={className} />;
    case 'truck':
      return <Truck className={className} />;
// step 2/6
