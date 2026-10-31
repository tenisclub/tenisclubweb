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
