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
export type CheckoutCardType = 'option' | 'info';

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
  enabled: boolean;
  card_type: CheckoutCardType;
  icon: CheckoutIconKey;
  title: string;
  description: string;
  badge: string;
  fee_mode: DeliveryFeeMode;
  fee: number;
  free_threshold: number;
  require_address: boolean;
  visibility: 'always' | 'pickup' | 'local_delivery';
}

export interface CheckoutDeliveryConfig {
  step_title: string;
  step_icon: CheckoutIconKey;

  // Card 1: Pickup
  pickup_removed: boolean;
  pickup_enabled: boolean;
  pickup_icon: CheckoutIconKey;
  pickup_title: string;
  pickup_subtitle: string;
  pickup_badge: string;
  pickup_fee: number;

  // Card 2: Local Delivery
  delivery_removed: boolean;
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
  pickup_info_removed: boolean;
  pickup_info_card_enabled: boolean;
  pickup_info_card_icon: CheckoutIconKey;
  pickup_info_card_title: string;
  show_pickup_hours: boolean;

  delivery_info_card_enabled: boolean;
  delivery_info_card_icon: CheckoutIconKey;
  delivery_info_card_title: string;

  // Custom Cards (Selectable Options or Info Cards) & Custom Action Buttons
  extra_cards: CheckoutExtraCard[];
  custom_buttons: CheckoutCustomButton[];

  // Independent Address Form Toggle (works even with only Info Cards or zero cards)
  always_require_address: boolean;

  // Footer CTA
  next_button_label: string;
}

export interface SelectableCheckoutOption {
  key: string;
  kind: 'pickup' | 'local_delivery' | 'custom';
  customCardId?: string;
  icon: CheckoutIconKey;
  title: string;
  subtitle: string;
  badgeLabel: string;
  shippingCost: number;
  summaryLabel: string;
  freeThreshold: number;
  requiresAddress: boolean;
  deliveryMethod: DeliveryMethod;
}

export const DEFAULT_CHECKOUT_DELIVERY_CONFIG: CheckoutDeliveryConfig = {
  step_title: 'Etapa 3 — Entrega ou Retirada',
  step_icon: 'map-pin',

  pickup_removed: false,
  pickup_enabled: true,
  pickup_icon: 'store',
  pickup_title: 'Retirar na Loja',
  pickup_subtitle: '',
  pickup_badge: 'Grátis',
  pickup_fee: 0,

  delivery_removed: false,
  delivery_enabled: true,
  delivery_icon: 'truck',
  delivery_title: 'Solicitar Entrega Local',
  delivery_subtitle: 'Disponibilidade e taxa confirmadas manualmente pela loja.',
  delivery_fee_mode: 'to_combine',
  delivery_fee: 0,
  free_delivery_threshold: 0,
  delivery_badge: 'A combinar',
  require_address_on_delivery: true,

  pickup_info_removed: false,
  pickup_info_card_enabled: true,
  pickup_info_card_icon: 'none',
  pickup_info_card_title: 'Informações de retirada:',
  show_pickup_hours: true,

  delivery_info_card_enabled: false,
  delivery_info_card_icon: 'info',
  delivery_info_card_title: 'Informações de entrega:',

  extra_cards: [],
  custom_buttons: [],

  always_require_address: false,

  next_button_label: 'Finalizar Pedido no WhatsApp',
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

  const pickupRemoved = Boolean(obj.pickup_removed);
  const deliveryRemoved = Boolean(obj.delivery_removed);
  const pickupInfoRemoved = Boolean(obj.pickup_info_removed);

  return {
    step_title: typeof obj.step_title === 'string' ? obj.step_title : d.step_title,
    step_icon: safeIcon(obj.step_icon, d.step_icon),

    pickup_removed: pickupRemoved,
    pickup_enabled: pickupRemoved
      ? false
      : typeof obj.pickup_enabled === 'boolean'
        ? obj.pickup_enabled
        : d.pickup_enabled,
    pickup_icon: safeIcon(obj.pickup_icon, d.pickup_icon),
    pickup_title: typeof obj.pickup_title === 'string' ? obj.pickup_title : d.pickup_title,
    pickup_subtitle:
      typeof obj.pickup_subtitle === 'string' ? obj.pickup_subtitle : d.pickup_subtitle,
    pickup_badge: typeof obj.pickup_badge === 'string' ? obj.pickup_badge : d.pickup_badge,
    pickup_fee: safeNum(obj.pickup_fee, d.pickup_fee),

    delivery_removed: deliveryRemoved,
    delivery_enabled: deliveryRemoved
      ? false
      : typeof obj.delivery_enabled === 'boolean'
        ? obj.delivery_enabled
        : d.delivery_enabled,
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

    pickup_info_removed: pickupInfoRemoved,
    pickup_info_card_enabled: pickupInfoRemoved
      ? false
      : typeof obj.pickup_info_card_enabled === 'boolean'
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
        enabled: item.enabled !== false,
        card_type: item.card_type === 'option' ? 'option' : 'info',
        icon: safeIcon(item.icon, item.card_type === 'option' ? 'truck' : 'info'),
        title: typeof item.title === 'string' ? item.title : '',
        description: typeof item.description === 'string' ? item.description : '',
        badge: typeof item.badge === 'string' ? item.badge : '',
        fee_mode:
          item.fee_mode === 'fixed' ||
          item.fee_mode === 'free' ||
          item.fee_mode === 'to_combine'
            ? item.fee_mode
            : 'to_combine',
        fee: safeNum(item.fee, 0),
        free_threshold: safeNum(item.free_threshold, 0),
        require_address: Boolean(item.require_address),
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

    always_require_address:
      typeof obj.always_require_address === 'boolean'
        ? obj.always_require_address
        : d.always_require_address,

    next_button_label:
      typeof obj.next_button_label === 'string'
        ? obj.next_button_label.trim() === 'Revisar Confirmação'
          ? d.next_button_label
          : obj.next_button_label
        : d.next_button_label,
  };
}

export function shouldRequireCheckoutAddress(
  cfg: CheckoutDeliveryConfig,
  activeOption: SelectableCheckoutOption | null,
  effectiveDeliveryMethod: DeliveryMethod = 'pickup'
): boolean {
  if (cfg.always_require_address) {
    return true;
  }
  if (activeOption?.requiresAddress) {
    return true;
  }
  return cfg.extra_cards.some(
    (c) =>
      c.enabled &&
      c.card_type === 'info' &&
      c.require_address &&
      (c.visibility === 'always' || c.visibility === effectiveDeliveryMethod)
  );
}

function computeOptionFee(
  feeMode: DeliveryFeeMode,
  rawFee: number,
  rawThreshold: number,
  rawBadge: string,
  itemsTotal: number
): { shippingCost: number; badgeLabel: string; summaryLabel: string } {
  const fallbackBadge = rawBadge.trim() || (feeMode === 'free' ? 'Grátis' : 'A combinar');

  if (feeMode === 'free') {
    return {
      shippingCost: 0,
      badgeLabel: rawBadge.trim() || 'Grátis',
      summaryLabel: 'Grátis',
    };
  }

  if (feeMode === 'fixed') {
    const fixedFee = safeNum(rawFee, 0);
    const threshold = safeNum(rawThreshold, 0);
    if (threshold > 0 && itemsTotal >= threshold) {
      return {
        shippingCost: 0,
        badgeLabel: 'Grátis',
        summaryLabel: 'Grátis',
      };
    }
    const label = fixedFee > 0 ? formatCurrency(fixedFee) : rawBadge.trim() || 'Grátis';
    return {
      shippingCost: fixedFee,
      badgeLabel: label,
      summaryLabel: fixedFee > 0 ? formatCurrency(fixedFee) : 'Grátis',
    };
  }

  return {
    shippingCost: 0,
    badgeLabel: fallbackBadge,
    summaryLabel: fallbackBadge,
  };
}

export function getSelectableCheckoutOptions(
  cfg: CheckoutDeliveryConfig,
  storeAddress: string,
  itemsTotal: number
): SelectableCheckoutOption[] {
  const options: SelectableCheckoutOption[] = [];

  if (!cfg.pickup_removed && cfg.pickup_enabled) {
    const pickupFee = safeNum(cfg.pickup_fee, 0);
    const badgeLabel =
      pickupFee > 0 ? formatCurrency(pickupFee) : cfg.pickup_badge || 'Grátis';

// step 9/12
