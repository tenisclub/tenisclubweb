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
// step 1/12
