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
  return digits.startsWith('55') ? digits : `55${digits}`;
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

export function buildOrderWhatsAppUrl(whatsapp: string, order: Order): string {
  const phone = cleanWhatsAppNumber(whatsapp);
  const itemsLines = (order.items || [])
    .map(
      (item) =>
        `• ${item.quantity}x ${item.product_name} (${item.color} | Tam. ${item.size}) — ${formatCurrency(item.subtotal)}`
    )
    .join('\n');

  const deliveryLabel =
    order.delivery_method === 'pickup'
      ? 'Retirada na Loja'
      : `Entrega Local (${order.shipping_address?.street || ''}, ${order.shipping_address?.number || ''} - ${order.shipping_address?.neighborhood || ''})`;

  const shippingLine =
    Number(order.shipping_cost) > 0
      ? `*Taxa de entrega:* ${formatCurrency(order.shipping_cost)}\n`
      : '';

  const msg = [
    `Olá, *Tênis Club*! Acabei de realizar um pedido pelo site:`,
    ``,
    `*Pedido:* #${order.order_number}`,
    `*Cliente:* ${order.customer_name}`,
    `*Recebimento:* ${deliveryLabel}`,
    ``,
    `*Itens do pedido:*`,
    itemsLines,
    ``,
    `${shippingLine}*Total:* ${formatCurrency(order.total)}`,
    ``,
    `Gostaria de alinhar a confirmação e forma de pagamento!`,
  ].join('\n');

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; colorClass: string; step: number }
> = {
  received: {
    label: 'Pedido recebido',
    colorClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    step: 1,
  },
  awaiting_confirmation: {
    label: 'Aguardando confirmação',
    colorClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    step: 2,
  },
  confirmed: {
    label: 'Confirmado',
    colorClass: 'bg-[#BEFA46]/15 text-[#BEFA46] border-[#BEFA46]/30',
    step: 3,
  },
  separating: {
    label: 'Em separação',
    colorClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    step: 4,
  },
  ready_for_pickup: {
    label: 'Pronto para retirada',
    colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    step: 5,
  },
  out_for_delivery: {
    label: 'Saiu para entrega',
    colorClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    step: 5,
  },
  completed: {
    label: 'Concluído',
    colorClass: 'bg-green-500/20 text-green-400 border-green-500/40',
    step: 6,
  },
  cancelled: {
    label: 'Cancelado',
    colorClass: 'bg-red-500/15 text-red-400 border-red-500/30',
    step: 0,
  },
};

export const GENDER_LABELS: Record<ProductGender, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  infantil: 'Infantil',
  unissex: 'Unissex',
};

export const STANDARD_SHOE_SIZES = [
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
];

export function sortShoeSizes(sizes: string[]): string[] {
  return [...new Set(sizes)].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });
}

