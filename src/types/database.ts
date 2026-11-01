export type UserRole = 'visitor' | 'customer' | 'admin_operational' | 'super_admin';

export type ProductGender = 'masculino' | 'feminino' | 'infantil' | 'unissex';

export type OrderStatus =
  | 'received'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'separating'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled';

export type DeliveryMethod = 'pickup' | 'local_delivery';

export type PaymentStatus = 'pending' | 'paid_manual' | 'refunded_manual';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
// step 1/8
