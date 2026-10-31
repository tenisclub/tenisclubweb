import { formatCurrency } from '@/lib/utils';
import type { DeliveryMethod } from '@/types/database';

export type CheckoutIconKey =
  | 'map-pin'
  | 'store'
  | 'truck'
  | 'package'
  | 'clock'
  | 'zap'
  | 'shield-check'
  | 'sparkles'
  | 'message-circle'
  | 'navigation'
  | 'gift'
  | 'external-link'
  | 'info'
  | 'none';

export type DeliveryFeeMode = 'to_combine' | 'fixed' | 'free';

export interface CheckoutCustomButton {
  id: string;
  label: string;
  url: string;
  icon: CheckoutIconKey;
  variant: 'volt' | 'whatsapp' | 'outline' | 'subtle';
  visibility: 'always' | 'pickup' | 'local_delivery';
}

export interface CheckoutExtraCard {
  id: string;
  icon: CheckoutIconKey;
  title: string;
  description: string;
  badge: string;
  visibility: 'always' | 'pickup' | 'local_delivery';
}

export interface CheckoutDeliveryConfig {
  step_title: string;
  step_icon: CheckoutIconKey;

  // Card 1: Pickup
  pickup_enabled: boolean;
  pickup_icon: CheckoutIconKey;
  pickup_title: string;
  pickup_subtitle: string;
  pickup_badge: string;
  pickup_fee: number;

  // Card 2: Local Delivery
  delivery_enabled: boolean;
  delivery_icon: CheckoutIconKey;
  delivery_title: string;
  delivery_subtitle: string;
  delivery_fee_mode: DeliveryFeeMode;
  delivery_fee: number;
  free_delivery_threshold: number;
  delivery_badge: string;
  require_address_on_delivery: boolean;

  // Card 3: Info Box (Pickup / Delivery)
  pickup_info_card_enabled: boolean;
  pickup_info_card_icon: CheckoutIconKey;
  pickup_info_card_title: string;
  show_pickup_hours: boolean;

  delivery_info_card_enabled: boolean;
  delivery_info_card_icon: CheckoutIconKey;
  delivery_info_card_title: string;

  // Extra Cards & Custom Action Buttons
  extra_cards: CheckoutExtraCard[];
  custom_buttons: CheckoutCustomButton[];

  // Footer CTA
  next_button_label: string;
}

export const DEFAULT_CHECKOUT_DELIVERY_CONFIG: CheckoutDeliveryConfig = {
  step_title: 'Etapa 3 — Entrega ou Retirada',
  step_icon: 'map-pin',

  pickup_enabled: true,
  pickup_icon: 'store',
  pickup_title: 'Retirar na Loja',
  pickup_subtitle: '',
  pickup_badge: 'Grátis',
  pickup_fee: 0,

  delivery_enabled: true,
  delivery_icon: 'truck',
  delivery_title: 'Solicitar Entrega Local',
  delivery_subtitle: 'Disponibilidade e taxa confirmadas manualmente pela loja.',
  delivery_fee_mode: 'to_combine',
  delivery_fee: 0,
  free_delivery_threshold: 0,
  delivery_badge: 'A combinar',
  require_address_on_delivery: true,

  pickup_info_card_enabled: true,
  pickup_info_card_icon: 'none',
  pickup_info_card_title: 'Informações de retirada:',
  show_pickup_hours: true,

  delivery_info_card_enabled: false,
  delivery_info_card_icon: 'info',
  delivery_info_card_title: 'Informações de entrega:',

  extra_cards: [],
  custom_buttons: [],

  next_button_label: 'Revisar Confirmação',
};

const VALID_ICONS = new Set<CheckoutIconKey>([
  'map-pin',
  'store',
  'truck',
  'package',
  'clock',
  'zap',
  'shield-check',
  'sparkles',
  'message-circle',
  'navigation',
  'gift',
  'external-link',
  'info',
  'none',
]);

function safeIcon(val: unknown, fallback: CheckoutIconKey): CheckoutIconKey {
  return typeof val === 'string' && VALID_ICONS.has(val as CheckoutIconKey)
    ? (val as CheckoutIconKey)
    : fallback;
}

function safeNum(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function normalizeCheckoutDeliveryConfig(
  raw: unknown
): CheckoutDeliveryConfig {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const d = DEFAULT_CHECKOUT_DELIVERY_CONFIG;

  const extraCardsRaw = Array.isArray(obj.extra_cards) ? obj.extra_cards : [];
  const customButtonsRaw = Array.isArray(obj.custom_buttons) ? obj.custom_buttons : [];

  return {
    step_title: typeof obj.step_title === 'string' ? obj.step_title : d.step_title,
    step_icon: safeIcon(obj.step_icon, d.step_icon),

    pickup_enabled:
      typeof obj.pickup_enabled === 'boolean' ? obj.pickup_enabled : d.pickup_enabled,
    pickup_icon: safeIcon(obj.pickup_icon, d.pickup_icon),
    pickup_title: typeof obj.pickup_title === 'string' ? obj.pickup_title : d.pickup_title,
    pickup_subtitle:
      typeof obj.pickup_subtitle === 'string' ? obj.pickup_subtitle : d.pickup_subtitle,
    pickup_badge: typeof obj.pickup_badge === 'string' ? obj.pickup_badge : d.pickup_badge,
    pickup_fee: safeNum(obj.pickup_fee, d.pickup_fee),

    delivery_enabled:
      typeof obj.delivery_enabled === 'boolean' ? obj.delivery_enabled : d.delivery_enabled,
    delivery_icon: safeIcon(obj.delivery_icon, d.delivery_icon),
    delivery_title:
      typeof obj.delivery_title === 'string' ? obj.delivery_title : d.delivery_title,
    delivery_subtitle:
      typeof obj.delivery_subtitle === 'string'
        ? obj.delivery_subtitle
        : d.delivery_subtitle,
    delivery_fee_mode:
      obj.delivery_fee_mode === 'fixed' ||
      obj.delivery_fee_mode === 'free' ||
      obj.delivery_fee_mode === 'to_combine'
        ? obj.delivery_fee_mode
        : d.delivery_fee_mode,
    delivery_fee: safeNum(obj.delivery_fee, d.delivery_fee),
    free_delivery_threshold: safeNum(
      obj.free_delivery_threshold,
      d.free_delivery_threshold
    ),
    delivery_badge:
      typeof obj.delivery_badge === 'string' ? obj.delivery_badge : d.delivery_badge,
    require_address_on_delivery:
      typeof obj.require_address_on_delivery === 'boolean'
        ? obj.require_address_on_delivery
        : d.require_address_on_delivery,

    pickup_info_card_enabled:
      typeof obj.pickup_info_card_enabled === 'boolean'
        ? obj.pickup_info_card_enabled
        : d.pickup_info_card_enabled,
    pickup_info_card_icon: safeIcon(obj.pickup_info_card_icon, d.pickup_info_card_icon),
    pickup_info_card_title:
      typeof obj.pickup_info_card_title === 'string'
        ? obj.pickup_info_card_title
        : d.pickup_info_card_title,
    show_pickup_hours:
      typeof obj.show_pickup_hours === 'boolean'
        ? obj.show_pickup_hours
        : d.show_pickup_hours,

    delivery_info_card_enabled:
      typeof obj.delivery_info_card_enabled === 'boolean'
        ? obj.delivery_info_card_enabled
        : d.delivery_info_card_enabled,
    delivery_info_card_icon: safeIcon(
      obj.delivery_info_card_icon,
      d.delivery_info_card_icon
    ),
    delivery_info_card_title:
      typeof obj.delivery_info_card_title === 'string'
        ? obj.delivery_info_card_title
        : d.delivery_info_card_title,

    extra_cards: extraCardsRaw
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item, idx) => ({
        id: typeof item.id === 'string' && item.id ? item.id : `card-${idx}`,
        icon: safeIcon(item.icon, 'info'),
        title: typeof item.title === 'string' ? item.title : '',
        description: typeof item.description === 'string' ? item.description : '',
        badge: typeof item.badge === 'string' ? item.badge : '',
        visibility:
          item.visibility === 'pickup' || item.visibility === 'local_delivery'
            ? item.visibility
            : 'always',
      })),

    custom_buttons: customButtonsRaw
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item, idx) => ({
        id: typeof item.id === 'string' && item.id ? item.id : `btn-${idx}`,
        label: typeof item.label === 'string' ? item.label : '',
        url: typeof item.url === 'string' ? item.url : '',
        icon: safeIcon(item.icon, 'external-link'),
        variant:
          item.variant === 'volt' ||
          item.variant === 'whatsapp' ||
          item.variant === 'subtle'
            ? item.variant
            : 'outline',
        visibility:
          item.visibility === 'pickup' || item.visibility === 'local_delivery'
            ? item.visibility
            : 'always',
      })),

    next_button_label:
      typeof obj.next_button_label === 'string' && obj.next_button_label.trim()
        ? obj.next_button_label
        : d.next_button_label,
  };
}

export function resolveDefaultDeliveryMethod(
  cfg: CheckoutDeliveryConfig
): DeliveryMethod {
  if (!cfg.pickup_enabled && cfg.delivery_enabled) {
    return 'local_delivery';
  }
  return 'pickup';
}

export function calculateCheckoutShipping(
  cfg: CheckoutDeliveryConfig,
  method: DeliveryMethod,
  itemsTotal: number
): {
  shippingCost: number;
  summaryLabel: string;
  pickupCardBadge: string;
  deliveryCardBadge: string;
} {
  const pickupFee = safeNum(cfg.pickup_fee, 0);
  const pickupCardBadge =
    pickupFee > 0 ? formatCurrency(pickupFee) : cfg.pickup_badge || 'Grátis';

  let deliveryCost = 0;
  let deliveryCardBadge = cfg.delivery_badge || 'A combinar';
  let deliverySummary = cfg.delivery_badge || 'A combinar';

  if (cfg.delivery_fee_mode === 'free') {
    deliveryCost = 0;
    deliveryCardBadge = cfg.delivery_badge?.trim() || 'Grátis';
    deliverySummary = 'Grátis';
  } else if (cfg.delivery_fee_mode === 'fixed') {
    const fixedFee = safeNum(cfg.delivery_fee, 0);
    const threshold = safeNum(cfg.free_delivery_threshold, 0);
    if (threshold > 0 && itemsTotal >= threshold) {
      deliveryCost = 0;
      deliveryCardBadge = 'Grátis';
      deliverySummary = 'Grátis';
    } else {
      deliveryCost = fixedFee;
      deliveryCardBadge = fixedFee > 0 ? formatCurrency(fixedFee) : 'Grátis';
      deliverySummary = fixedFee > 0 ? formatCurrency(fixedFee) : 'Grátis';
    }
  }

  const shippingCost = method === 'pickup' ? pickupFee : deliveryCost;
  const summaryLabel =
    method === 'pickup'
      ? pickupFee > 0
        ? formatCurrency(pickupFee)
        : cfg.pickup_badge || 'Grátis'
      : deliverySummary;

  return {
    shippingCost,
    summaryLabel,
    pickupCardBadge,
    deliveryCardBadge,
  };
}

