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
  logo_url: string | null;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

export interface InventoryRecord {
  id: string;
  variant_id: string;
  quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  color: string;
  color_hex: string;
  size: string;
  variant_sku: string | null;
  is_active: boolean;
  inventory?: InventoryRecord | InventoryRecord[] | null;
}

export interface EnrichedVariant {
  id: string;
  product_id: string;
  color: string;
  color_hex: string;
  size: string;
  variant_sku: string | null;
  is_active: boolean;
  stock: number;
  low_stock_threshold: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  brand_id: string | null;
  category_id: string | null;
  gender: ProductGender;
  short_description: string;
  description: string;
  additional_info: Record<string, string>;
  cost_price?: number;
  base_price: number;
  promo_price: number | null;
  effective_price: number;
  discount_percent: number;
// etapa 3/10
