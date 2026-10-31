import { cache } from 'react';
import {
  getOrLoadCacheSlot,
  primeCacheSlot,
  type AdminBadgesSnapshot,
} from '@/lib/server-cache';
import { createServiceClient } from '@/lib/supabase/server';
import { sortShoeSizes } from '@/lib/utils';
import type {
  Brand,
  CartItemView,
  Category,
  EnrichedVariant,
  Product,
  ProductGender,
  ProductImage,
  StoreSettings,
} from '@/types/database';

const FALLBACK_SHOE_IMAGE =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85';

const DEFAULT_SETTINGS: StoreSettings = {
  id: 1,
  store_name: 'Tênis Club',
  tagline: 'Estilo para toda a família',
  hero_badge: 'DROP NOVO · CATÁLOGO',
  hero_title: 'Seu próximo par tá aqui. Bora?',
  hero_subtitle:
    'Tênis, mocassins, sociais e lançamentos exclusivos com numeração garantida e atendimento ágil.',
  hero_banner_url: null,
  logo_url: null,
  whatsapp: '5511999999999',
  phone: '(11) 99999-9999',
  email: 'tenisclub.contato@gmail.com',
  address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
  business_hours: 'Seg a Sex: 09h às 19h | Sáb: 09h às 16h',
  instagram_url: 'https://instagram.com/tenisclub',
  facebook_url: '',
  tiktok_url: '',
  pickup_info: 'Retirada gratuita na loja física mediante confirmação de separação do pedido.',
  delivery_info: 'Entrega local rápida. Valor e prazo confirmados pela equipe.',
  exchange_policy:
    'Trocas em até 7 dias corridos após o recebimento, sem sinais de uso e na embalagem original.',
  privacy_policy:
    'Em conformidade com a LGPD, coletamos apenas os dados essenciais para processar seus pedidos.',
  terms_of_use: 'Preços e estoques são validados no momento da confirmação do pedido.',
  about_text:
    'A Tênis Club nasceu com a missão de unir estilo, conforto e autenticidade para toda a família.',
  checkout_delivery_config: {},
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function enrichProductRow(row: any, includeCost = false): Product {
  const images: ProductImage[] = [...(row.product_images || [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const primaryImage = images[0]?.url || FALLBACK_SHOE_IMAGE;

  const variants: EnrichedVariant[] = [...(row.product_variants || [])]
    .filter((v) => v.is_active !== false)
    .map((v) => {
      const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
      return {
        id: v.id,
        product_id: v.product_id,
        color: v.color || 'Padrão',
        color_hex: v.color_hex || '#18181B',
        size: String(v.size),
        variant_sku: v.variant_sku || null,
        is_active: v.is_active !== false,
        stock: Number(inv?.quantity ?? 0),
        low_stock_threshold: Number(inv?.low_stock_threshold ?? 3),
      };
    })
    .sort((a, b) => {
      const na = Number(a.size);
      const nb = Number(b.size);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.size.localeCompare(b.size);
    });

  const allowBackorder = Boolean(row.allow_backorder);
  const totalStock = variants.reduce((acc, v) => acc + v.stock, 0);
  const allSizes = sortShoeSizes(variants.map((v) => v.size));
  const availableSizes = allowBackorder
    ? allSizes
    : sortShoeSizes(variants.filter((v) => v.stock > 0).map((v) => v.size));

  let sizeRangeLabel = 'Sob consulta';
  if (allSizes.length === 1) {
    sizeRangeLabel = allSizes[0];
  } else if (allSizes.length > 1) {
    sizeRangeLabel = `${allSizes[0]} ao ${allSizes[allSizes.length - 1]}`;
  }

  const basePrice = Number(row.base_price ?? 0);
  let activePromoPrice = row.promo_price != null ? Number(row.promo_price) : null;

  const now = Date.now();
  const activePromos = (row.promotions || []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pr: any) =>
      pr.is_active &&
      (!pr.starts_at || new Date(pr.starts_at).getTime() <= now) &&
      (!pr.ends_at || new Date(pr.ends_at).getTime() >= now)
  );
  if (activePromos.length > 0) {
    const minPromo = Math.min(...activePromos.map((p: { promo_price: number }) => Number(p.promo_price)));
    if (activePromoPrice === null || minPromo < activePromoPrice) {
      activePromoPrice = minPromo;
    }
  }

  const effectivePrice =
    activePromoPrice !== null && activePromoPrice > 0 && activePromoPrice < basePrice
      ? activePromoPrice
      : basePrice;

  const discountPercent =
    effectivePrice < basePrice && basePrice > 0
      ? Math.round(((basePrice - effectivePrice) / basePrice) * 100)
      : 0;

  const product: Product = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku || null,
    brand_id: row.brand_id || null,
    category_id: row.category_id || null,
    gender: (row.gender || 'unissex') as ProductGender,
    short_description: row.short_description || '',
    description: row.description || '',
    additional_info: (row.additional_info as Record<string, string>) || {},
    base_price: basePrice,
    promo_price: effectivePrice < basePrice ? effectivePrice : null,
    effective_price: effectivePrice,
    discount_percent: discountPercent,
    is_active: Boolean(row.is_active),
    is_featured: Boolean(row.is_featured),
    is_new_release: Boolean(row.is_new_release),
    allow_backorder: allowBackorder,
    sold_count: Number(row.sold_count ?? 0),
    views_count: Number(row.views_count ?? 0),
    meta_title: row.meta_title || null,
    meta_description: row.meta_description || null,
    created_at: row.created_at,
    brand: Array.isArray(row.brands) ? row.brands[0] : row.brands || null,
    category: Array.isArray(row.categories) ? row.categories[0] : row.categories || null,
    images,
    primary_image: primaryImage,
    variants,
    available_sizes: availableSizes,
    all_sizes: allSizes,
    total_stock: totalStock,
    size_range_label: sizeRangeLabel,
  };

  if (includeCost) {
    product.cost_price = Number(row.cost_price ?? 0);
  }

  return product;
}

const PRODUCT_SELECT_QUERY = `
  *,
  brands(*),
  categories(*),
  product_images(*),
  product_variants(*, inventory(*)),
  promotions(*)
`;

export interface CatalogFilters {
  q?: string;
  gender?: string;
  category?: string;
  brand?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyAvailable?: boolean;
  onlyPromo?: boolean;
  onlyNew?: boolean;
  onlyFeatured?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'bestsellers' | 'popular';
  page?: number;
  pageSize?: number;
}

export const getAdminProducts = cache(async (): Promise<Product[]> => {
  return getOrLoadCacheSlot('allProductsAdmin', 45_000, async () => {
    const supabase = createServiceClient();
    const { data: rows } = await supabase
      .from('products')
      .select(PRODUCT_SELECT_QUERY)
      .order('created_at', { ascending: false });

    return (rows || []).map((r) => enrichProductRow(r, true));
  });
});

export async function getAdminProductById(id: string): Promise<Product | null> {
  const all = await getAdminProducts();
  const cached = all.find((p) => p.id === id);
  if (cached) return cached;

  const supabase = createServiceClient();
  const { data: row } = await supabase
    .from('products')
    .select(PRODUCT_SELECT_QUERY)
    .eq('id', id)
    .maybeSingle();

  return row ? enrichProductRow(row, true) : null;
}

const getActiveProductsMemo = cache(async (): Promise<Product[]> => {
  const all = await getAdminProducts();
  return all
    .filter((p) => p.is_active)
    .map((p) => {
      // Strip internal cost_price before passing to storefront components
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { cost_price: _cost, ...publicProduct } = p;
      return publicProduct;
    });
});

export async function getCatalogProducts(filters: CatalogFilters = {}) {
  let products = [...(await getActiveProductsMemo())];

  // Search query (name, brand, category, color, sku, description)
  if (filters.q && filters.q.trim()) {
