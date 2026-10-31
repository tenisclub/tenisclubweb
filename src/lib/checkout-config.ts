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
