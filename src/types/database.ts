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
  is_active: boolean;
  is_featured: boolean;
  is_new_release: boolean;
  sold_count: number;
  views_count: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  brand?: Brand | null;
  category?: Category | null;
  images: ProductImage[];
  primary_image: string;
  variants: EnrichedVariant[];
  available_sizes: string[];
  all_sizes: string[];
  total_stock: number;
  size_range_label: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  auth_provider: string;
  is_active: boolean;
  created_at: string;
  role?: UserRole;
}

export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  reference: string;
  is_default: boolean;
}

export interface CartItemView {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  product_name: string;
  product_slug: string;
  product_sku: string;
  product_image: string;
  brand_name: string;
  color: string;
  color_hex: string;
  size: string;
  base_price: number;
  unit_price: number;
  available_stock: number;
  is_available: boolean;
  subtotal: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_sku: string;
  product_image: string;
  brand_name: string;
  color: string;
  size: string;
  unit_price: number;
  original_price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  note: string;
  changed_by: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_method: DeliveryMethod;
  shipping_address: Partial<UserAddress> | null;
  subtotal: number;
  discount_total: number;
  shipping_cost: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method_note: string;
  paid_at: string | null;
  customer_notes: string;
  store_notes: string;
  internal_notes?: string;
  stock_deducted: boolean;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  history?: OrderStatusHistory[];
}

export interface NotificationItem {
  id: string;
  user_id: string | null;
  target_audience: 'customer' | 'admin';
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  tagline: string;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  hero_banner_url: string | null;
  logo_url: string | null;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  business_hours: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  pickup_info: string;
  delivery_info: string;
  exchange_policy: string;
  privacy_policy: string;
  terms_of_use: string;
  about_text: string;
  checkout_delivery_config?: unknown;
}

