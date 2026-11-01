import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Order, OrderStatus, ProductGender } from '@/types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(num) ? num : 0);
}

export function formatDate(iso: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateTime(iso: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function cleanWhatsAppNumber(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '5511999999999';
  return digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`;
}

export function buildProductWhatsAppUrl(params: {
  whatsapp: string;
  productName: string;
  sku?: string | null;
  size?: string;
  price: number;
}): string {
  const phone = cleanWhatsAppNumber(params.whatsapp);
  const skuPart = params.sku ? ` (${params.sku})` : '';
  const sizePart = params.size ? ` na numeração *${params.size}*` : '';
  const msg = `Olá, Tênis Club! Tenho interesse no *${params.productName}*${skuPart}${sizePart} por *${formatCurrency(params.price)}*. Está disponível?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export function buildOrderWhatsAppUrl(
  whatsapp: string,
  order: Order,
  storeName = 'Tênis Club'
): string {
  const phone = cleanWhatsAppNumber(whatsapp);
  const itemsLines = (order.items || [])
    .map((item) => {
      const brand = item.brand_name?.trim() || '';
      const nameHasBrand =
        brand && item.product_name.toLowerCase().startsWith(brand.toLowerCase());
      const title = brand && !nameHasBrand ? `${brand} ${item.product_name}` : item.product_name;
      const skuInfo = item.product_sku?.trim() ? ` [SKU: ${item.product_sku.trim()}]` : '';
      const colorInfo = item.color?.trim() ? `Cor: ${item.color.trim()} | ` : '';
      const unitInfo =
        item.quantity > 1 ? ` (${formatCurrency(item.unit_price)} un.)` : '';
      return `• *${item.quantity}x ${title}*${skuInfo}\n  ${colorInfo}Tam: *${item.size}* — *${formatCurrency(item.subtotal)}*${unitInfo}`;
    })
    .join('\n');

  const addr = order.shipping_address;
  const customTitle = addr?.custom_option_title?.trim();
  const hasStreet = Boolean(addr?.street?.trim());

  const modalityLabel =
    customTitle ||
    (order.delivery_method === 'pickup' ? 'Retirada na Loja' : 'Entrega Local');

  const customerLines = [`*Cliente:* ${order.customer_name}`];
  if (order.customer_phone?.trim()) {
    customerLines.push(`*WhatsApp / Telefone:* ${order.customer_phone.trim()}`);
  }
  if (order.customer_email?.trim()) {
