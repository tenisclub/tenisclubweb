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
// step 1/12
