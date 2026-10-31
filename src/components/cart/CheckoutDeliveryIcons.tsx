'use client';

import React from 'react';
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
  return (
    <div className="space-y-1.5">
      {label && <span className="text-xs text-zinc-400 block">{label}</span>}
      <div className="flex flex-wrap gap-1.5">
        {CHECKOUT_ICON_OPTIONS.map((opt) => {
          const active = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              title={opt.label}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition',
                active
                  ? 'border-[#BEFA46] bg-[#BEFA46]/15 text-[#BEFA46]'
                  : 'border-zinc-800 bg-[#18181F] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              )}
            >
              {opt.key === 'none' ? (
                <Ban className="w-3.5 h-3.5 opacity-60" />
              ) : (
                <CheckoutIcon name={opt.key} className="w-3.5 h-3.5" />
              )}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
