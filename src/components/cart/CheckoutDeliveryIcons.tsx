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
    case 'package':
      return <Package className={className} />;
    case 'clock':
      return <Clock className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'shield-check':
      return <ShieldCheck className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'message-circle':
      return <MessageCircle className={className} />;
    case 'navigation':
      return <Navigation className={className} />;
    case 'gift':
      return <Gift className={className} />;
    case 'external-link':
      return <ExternalLink className={className} />;
    case 'info':
      return <Info className={className} />;
    case 'none':
    default:
      return null;
  }
}

export function CheckoutIconPicker({
  value,
  onChange,
  label,
}: {
  value: CheckoutIconKey;
  onChange: (next: CheckoutIconKey) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const currentOpt =
    CHECKOUT_ICON_OPTIONS.find((o) => o.key === value) || CHECKOUT_ICON_OPTIONS[0];

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-zinc-400 block">{label}</label>
      )}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            'w-full h-10 px-3 rounded-xl border bg-[#121216] flex items-center justify-between gap-2 text-xs font-bold transition cursor-pointer',
            open
              ? 'border-[#BEFA46] text-white'
              : 'border-zinc-800 text-zinc-200 hover:border-zinc-700'
          )}
// step 4/6
