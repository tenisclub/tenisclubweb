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
    const terms = filters.q
      .toLowerCase()
      .trim()
      .split(/\s+/);
    products = products.filter((p) => {
      const haystack = [
        p.name,
        p.sku || '',
        p.brand?.name || '',
        p.category?.name || '',
        p.gender,
        p.short_description,
        ...p.variants.map((v) => v.color),
      ]
        .join(' ')
        .toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }

  if (filters.gender && filters.gender !== 'todos') {
    const g = filters.gender.toLowerCase();
    products = products.filter((p) =>
      g === 'unissex'
        ? p.gender === 'unissex'
        : p.gender === g || (p.gender === 'unissex' && (g === 'masculino' || g === 'feminino'))
    );
  }

  if (filters.category && filters.category !== 'todos') {
    const cat = filters.category.toLowerCase();
    products = products.filter(
      (p) => p.category?.slug.toLowerCase() === cat || p.category_id === filters.category
    );
  }

  if (filters.brand && filters.brand !== 'todas') {
    const br = filters.brand.toLowerCase();
    products = products.filter(
      (p) => p.brand?.slug.toLowerCase() === br || p.brand_id === filters.brand
    );
  }

  if (filters.size && filters.size !== 'todos') {
    products = products.filter((p) => p.available_sizes.includes(String(filters.size)));
  }

  if (filters.color && filters.color !== 'todas') {
    const col = filters.color.toLowerCase();
    products = products.filter((p) =>
      p.variants.some(
        (v) => v.color.toLowerCase().includes(col) && (v.stock > 0 || p.allow_backorder)
      )
    );
  }

  if (typeof filters.minPrice === 'number' && !Number.isNaN(filters.minPrice)) {
    products = products.filter((p) => p.effective_price >= filters.minPrice!);
  }

  if (typeof filters.maxPrice === 'number' && !Number.isNaN(filters.maxPrice)) {
    products = products.filter((p) => p.effective_price <= filters.maxPrice!);
  }

  if (filters.onlyAvailable) {
    products = products.filter((p) => p.total_stock > 0 || p.allow_backorder);
  }

  if (filters.onlyPromo) {
    products = products.filter((p) => p.discount_percent > 0);
  }

  if (filters.onlyNew) {
    products = products.filter((p) => p.is_new_release);
  }

  if (filters.onlyFeatured) {
    products = products.filter((p) => p.is_featured);
  }

  // Sort
  switch (filters.sort) {
    case 'price_asc':
      products.sort((a, b) => a.effective_price - b.effective_price);
      break;
    case 'price_desc':
      products.sort((a, b) => b.effective_price - a.effective_price);
      break;
    case 'bestsellers':
      products.sort((a, b) => b.sold_count - a.sold_count);
      break;
    case 'popular':
      products.sort((a, b) => b.views_count + b.sold_count * 2 - (a.views_count + a.sold_count * 2));
      break;
    case 'newest':
    default:
      products.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
  }

  const total = products.length;
  const page = Math.max(1, filters.page || 1);
  const pageSize = filters.pageSize || 12;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginated = products.slice((page - 1) * pageSize, page * pageSize);

  return {
    products: paginated,
    allMatching: products,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const cachedAll = await getActiveProductsMemo();
  const cachedMatch = cachedAll.find((p) => p.slug === slug);

  if (cachedMatch) {
    const supabase = createServiceClient();
    supabase
      .from('products')
      .update({ views_count: Number(cachedMatch.views_count || 0) + 1 })
      .eq('id', cachedMatch.id)
      .then(() => {});
    return cachedMatch;
  }

  const supabase = createServiceClient();
  const { data: row } = await supabase
    .from('products')
    .select(PRODUCT_SELECT_QUERY)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!row) return null;

  // Increment view count asynchronously
  supabase
    .from('products')
    .update({ views_count: Number(row.views_count || 0) + 1 })
    .eq('id', row.id)
    .then(() => {});

  return enrichProductRow(row, false);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const { products } = await getCatalogProducts({ pageSize: 24 });
  return products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.category_id === product.category_id || p.gender === product.gender)
    )
    .slice(0, limit);
}

export const getAdminCategoriesAndBrands = cache(
  async (): Promise<{ categories: Category[]; brands: Brand[] }> => {
    return getOrLoadCacheSlot('allCategoriesAndBrands', 60_000, async () => {
      const supabase = createServiceClient();
      const [{ data: categories }, { data: brands }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('brands').select('*').order('name', { ascending: true }),
      ]);

      return {
        categories: (categories || []) as Category[],
        brands: (brands || []) as Brand[],
      };
    });
  }
);

export const getCategoriesAndBrands = cache(
  async (): Promise<{ categories: Category[]; brands: Brand[] }> => {
    const all = await getAdminCategoriesAndBrands();
    return {
      categories: all.categories.filter((c) => c.is_active),
      brands: all.brands.filter((b) => b.is_active),
// step 8/12
