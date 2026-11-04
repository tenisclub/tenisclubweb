-- ============================================================================
-- TÊNIS CLUB — COMPLETE E-COMMERCE DATABASE SCHEMA, RLS & TRANSACTIONAL RPCs
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ROLES & PERMISSIONS (RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('customer', 'admin_operational', 'super_admin')),
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ----------------------------------------------------------------------------
-- 2. USER PROFILES, USER ROLES & ADDRESSES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'email',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_terms_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  assigned_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Principal',
  recipient_name TEXT NOT NULL,
  zip_code TEXT NOT NULL DEFAULT '',
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT DEFAULT '',
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'SP',
  reference TEXT DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper RBAC Security Definer Functions (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := CASE
    WHEN current_user IN ('anon', 'authenticated') THEN auth.uid()
    ELSE check_user_id
  END;
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    JOIN public.user_profiles up ON up.id = ur.user_id
    WHERE ur.user_id = v_uid
      AND up.is_active = TRUE
      AND r.name IN ('admin_operational', 'super_admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := CASE
    WHEN current_user IN ('anon', 'authenticated') THEN auth.uid()
    ELSE check_user_id
  END;
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    JOIN public.user_profiles up ON up.id = ur.user_id
    WHERE ur.user_id = v_uid
      AND up.is_active = TRUE
      AND r.name = 'super_admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF check_user_id IS NULL THEN
    RETURN 'visitor';
  END IF;
  SELECT r.name INTO v_role
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  JOIN public.user_profiles up ON up.id = ur.user_id
  WHERE ur.user_id = check_user_id
    AND up.is_active = TRUE
  ORDER BY
    CASE r.name
      WHEN 'super_admin' THEN 1
      WHEN 'admin_operational' THEN 2
      ELSE 3
    END
  LIMIT 1;

  RETURN COALESCE(v_role, 'customer');
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. CATEGORIES, BRANDS, PRODUCTS, IMAGES, VARIANTS & INVENTORY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  gender TEXT NOT NULL DEFAULT 'unissex' CHECK (gender IN ('masculino', 'feminino', 'infantil', 'unissex')),
  short_description TEXT DEFAULT '',
  description TEXT DEFAULT '',
  additional_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
  promo_price NUMERIC(10, 2) CHECK (promo_price IS NULL OR promo_price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_release BOOLEAN NOT NULL DEFAULT FALSE,
  allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,
  sold_count INT NOT NULL DEFAULT 0,
  views_count INT NOT NULL DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT DEFAULT '',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color TEXT NOT NULL DEFAULT 'Padrão',
  color_hex TEXT NOT NULL DEFAULT '#18181B',
  size TEXT NOT NULL,
  variant_sku TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, color, size)
);

CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID UNIQUE NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  previous_quantity INT NOT NULL,
  moved_quantity INT NOT NULL,
  new_quantity INT NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'order_reserve', 'order_cancel_return')),
  reason TEXT NOT NULL,
  order_id UUID,
  performed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. PROMOTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percent NUMERIC(5, 2),
  promo_price NUMERIC(10, 2) NOT NULL CHECK (promo_price >= 0),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  highlight_home BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. CARTS, CART ITEMS & FAVORITES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, variant_id)
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- ----------------------------------------------------------------------------
-- 6. ORDERS, ORDER ITEMS & ORDER STATUS HISTORY
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1001;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('pickup', 'local_delivery')),
  shipping_address JSONB,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
    'received',
    'awaiting_confirmation',
    'confirmed',
    'separating',
    'ready_for_pickup',
    'out_for_delivery',
    'completed',
    'cancelled'
  )),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid_manual', 'refunded_manual')),
  payment_method_note TEXT DEFAULT '',
  paid_at TIMESTAMPTZ,
  customer_notes TEXT DEFAULT '',
  store_notes TEXT DEFAULT '',
  internal_notes TEXT DEFAULT '',
  stock_deducted BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT DEFAULT '',
  product_image TEXT DEFAULT '',
  brand_name TEXT DEFAULT '',
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  original_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  quantity INT NOT NULL CHECK (quantity > 0),
  stock_deducted_qty INT NOT NULL DEFAULT 0,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent column upgrades for existing deployments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'allow_backorder'
  ) THEN
    ALTER TABLE public.products ADD COLUMN allow_backorder BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'stock_deducted_qty'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN stock_deducted_qty INT;
    UPDATE public.order_items SET stock_deducted_qty = quantity WHERE stock_deducted_qty IS NULL;
    ALTER TABLE public.order_items ALTER COLUMN stock_deducted_qty SET DEFAULT 0;
    ALTER TABLE public.order_items ALTER COLUMN stock_deducted_qty SET NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  note TEXT DEFAULT '',
  changed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. NOTIFICATIONS, ADMIN LOGS & STORE SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  target_audience TEXT NOT NULL DEFAULT 'customer' CHECK (target_audience IN ('customer', 'admin')),
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.store_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name TEXT NOT NULL DEFAULT 'Tênis Club',
  tagline TEXT NOT NULL DEFAULT 'Estilo para toda a família',
  hero_badge TEXT NOT NULL DEFAULT 'DROP NOVO · CATÁLOGO',
  hero_title TEXT NOT NULL DEFAULT 'Seu próximo par tá aqui. Bora?',
  hero_subtitle TEXT NOT NULL DEFAULT 'Tênis, mocassins, sociais e lançamentos exclusivos com numeração garantida e atendimento ágil.',
  hero_banner_url TEXT,
  logo_url TEXT,
  whatsapp TEXT NOT NULL DEFAULT '5511999999999',
  phone TEXT NOT NULL DEFAULT '(11) 99999-9999',
  email TEXT NOT NULL DEFAULT 'tenisclub.contato@gmail.com',
  address TEXT NOT NULL DEFAULT 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
  business_hours TEXT NOT NULL DEFAULT 'Seg a Sex: 09h às 19h | Sáb: 09h às 16h',
  instagram_url TEXT DEFAULT 'https://instagram.com/tenisclub',
  facebook_url TEXT DEFAULT '',
  tiktok_url TEXT DEFAULT '',
  pickup_info TEXT NOT NULL DEFAULT 'Retirada gratuita na loja física mediante confirmação de separação do pedido.',
  delivery_info TEXT NOT NULL DEFAULT 'Entrega local rápida via motoboy ou transportadora parceira. Valor e prazo confirmados no atendimento.',
  exchange_policy TEXT NOT NULL DEFAULT 'Você pode solicitar a troca de numeração ou modelo em até 7 dias corridos após o recebimento, desde que o calçado esteja sem sinais de uso e na caixa original.',
  privacy_policy TEXT NOT NULL DEFAULT 'Em conformidade com a LGPD (Lei nº 13.709/2018), coletamos apenas os dados essenciais para processar seus pedidos, entrega e atendimento.',
  terms_of_use TEXT NOT NULL DEFAULT 'Ao realizar um pedido na Tênis Club, os itens selecionados têm preço e disponibilidade validados no momento da confirmação.',
  about_text TEXT NOT NULL DEFAULT 'A Tênis Club nasceu com a missão de unir estilo, conforto e autenticidade para toda a família. Trabalhamos com curadoria rigorosa de tênis casuais, esportivos, sapatos sociais e lançamentos.',
  checkout_delivery_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_gender ON public.products(gender);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_size ON public.product_variants(size);
CREATE INDEX IF NOT EXISTS idx_inventory_variant ON public.inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_admin ON public.notifications(target_audience, is_read, created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. AUTH USER CREATION & SYNC TRIGGER (RN01 & RN16)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_role_id UUID;
  v_full_name TEXT;
  v_phone TEXT;
  v_avatar TEXT;
  v_provider TEXT;
BEGIN
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture');
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  INSERT INTO public.user_profiles (id, email, full_name, phone, avatar_url, auth_provider, is_active, accepted_terms_at)
  VALUES (NEW.id, LOWER(NEW.email), v_full_name, v_phone, v_avatar, v_provider, TRUE, NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN public.user_profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.user_profiles.full_name END,
    avatar_url = COALESCE(public.user_profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();

  -- RN01: Every new account is created strictly as customer
  SELECT id INTO v_customer_role_id FROM public.roles WHERE name = 'customer' LIMIT 1;
  IF v_customer_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, v_customer_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  -- Ensure persistent cart exists
  INSERT INTO public.carts (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Customer welcome notification
  INSERT INTO public.notifications (user_id, target_audience, type, title, message, link)
  VALUES (
    NEW.id,
    'customer',
    'welcome',
    'Bem-vindo(a) à Tênis Club!',
    'Seu cadastro foi realizado com sucesso. Explore nosso catálogo e garanta seu próximo par!',
    '/produtos'
  );

  -- Admin notification
  INSERT INTO public.notifications (user_id, target_audience, type, title, message, link)
  VALUES (
    NULL,
    'admin',
    'new_customer',
    'Novo cliente cadastrado',
    v_full_name || ' (' || NEW.email || ') acabou de criar uma conta.',
    '/admin/clientes'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 10. TRANSACTIONAL ORDER CREATION RPC (RN04, RN05, RN07, RN08, RN09, RN10, RN13, RN18)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_user_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_delivery_method TEXT,
  p_shipping_address JSONB DEFAULT NULL,
  p_customer_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_id UUID;
  v_item RECORD;
  v_subtotal NUMERIC(10, 2) := 0;
  v_discount_total NUMERIC(10, 2) := 0;
  v_shipping_cost NUMERIC(10, 2) := 0;
  v_items_total NUMERIC(10, 2) := 0;
  v_total NUMERIC(10, 2) := 0;
  v_unit_price NUMERIC(10, 2);
  v_promo_price NUMERIC(10, 2);
  v_order_id UUID;
  v_order_number TEXT;
  v_items_count INT := 0;
  v_primary_img TEXT;
  v_deduct_qty INT;
  v_new_qty INT;
  v_delivery_cfg JSONB := '{}'::jsonb;
  v_custom_card JSONB := NULL;
  v_fee NUMERIC(10, 2) := 0;
  v_free_min NUMERIC(10, 2) := 0;
BEGIN
  IF current_user IN ('anon', 'authenticated') AND (auth.uid() IS NULL OR (auth.uid() <> p_user_id AND NOT public.is_admin(auth.uid()))) THEN
    RAISE EXCEPTION 'Operação não autorizada para este usuário.';
  END IF;

  IF p_delivery_method NOT IN ('pickup', 'local_delivery') THEN
    RAISE EXCEPTION 'Modalidade de recebimento inválida.';
  END IF;

  SELECT id INTO v_cart_id FROM public.carts WHERE user_id = p_user_id;
  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'Carrinho não encontrado.';
  END IF;

  SELECT COUNT(*) INTO v_items_count FROM public.cart_items WHERE cart_id = v_cart_id;
  IF v_items_count = 0 THEN
    RAISE EXCEPTION 'Seu carrinho está vazio.';
  END IF;

  SELECT COALESCE(checkout_delivery_config, '{}'::jsonb)
  INTO v_delivery_cfg
  FROM public.store_settings
  WHERE id = 1;

  -- Generate unique order number TC-YYYY-XXXX
  v_order_number := 'TC-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(NEXTVAL('public.order_number_seq')::TEXT, 4, '0');

  -- First pass: lock inventory rows and validate stock & active status
  FOR v_item IN
    SELECT
      ci.id AS cart_item_id,
      ci.quantity AS cart_qty,
      p.id AS product_id,
      p.name AS product_name,
      p.sku AS product_sku,
      p.base_price,
      p.promo_price AS product_promo_price,
      p.is_active AS product_active,
      COALESCE(p.allow_backorder, FALSE) AS allow_backorder,
      b.name AS brand_name,
      pv.id AS variant_id,
      pv.color,
      pv.size,
      pv.is_active AS variant_active,
      inv.id AS inv_id,
      inv.quantity AS stock_qty,
      inv.low_stock_threshold
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    LEFT JOIN public.brands b ON b.id = p.brand_id
    JOIN public.product_variants pv ON pv.id = ci.variant_id
    JOIN public.inventory inv ON inv.variant_id = pv.id
    WHERE ci.cart_id = v_cart_id
    ORDER BY inv.id
    FOR UPDATE OF inv
  LOOP
    IF NOT v_item.product_active OR NOT v_item.variant_active THEN
      RAISE EXCEPTION 'O produto "%" (Tam. %) não está mais disponível para venda.', v_item.product_name, v_item.size;
    END IF;

    IF NOT v_item.allow_backorder AND v_item.stock_qty < v_item.cart_qty THEN
      IF v_item.stock_qty = 0 THEN
        RAISE EXCEPTION 'O produto "%" na numeração % esgotou.', v_item.product_name, v_item.size;
      ELSE
        RAISE EXCEPTION 'Estoque insuficiente para "%" (Tam. %). Disponível: % un.', v_item.product_name, v_item.size, v_item.stock_qty;
      END IF;
    END IF;

    -- RN07: Validate current price (active scheduled promotion OR product promo_price OR base_price)
    SELECT pr.promo_price INTO v_promo_price
    FROM public.promotions pr
    WHERE pr.product_id = v_item.product_id
      AND pr.is_active = TRUE
      AND (pr.starts_at IS NULL OR pr.starts_at <= NOW())
      AND (pr.ends_at IS NULL OR pr.ends_at >= NOW())
-- etapa 8/25
