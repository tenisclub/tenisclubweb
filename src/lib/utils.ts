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
    customerLines.push(`*E-mail:* ${order.customer_email.trim()}`);
  }

  const receiptLines = [`*Recebimento:* ${modalityLabel}`];
  if (hasStreet) {
    const streetLine = `${addr?.street?.trim() || ''}, Nº ${addr?.number?.trim() || 'S/N'}${
      addr?.complement?.trim() ? ` (${addr.complement.trim()})` : ''
    }`;
    const cityState = [addr?.city?.trim(), addr?.state?.trim()].filter(Boolean).join('/');
    const districtLine = [addr?.neighborhood?.trim(), cityState]
      .filter(Boolean)
      .join(' — ');
    receiptLines.push(`*Endereço:* ${streetLine}`);
    if (districtLine) {
      receiptLines.push(`*Bairro / Cidade:* ${districtLine}`);
    }
    if (addr?.zip_code?.trim()) {
      receiptLines.push(`*CEP:* ${addr.zip_code.trim()}`);
    }
    if (addr?.reference?.trim()) {
      receiptLines.push(`*Referência:* ${addr.reference.trim()}`);
    }
  } else if (order.delivery_method === 'pickup' && addr?.pickup_address?.trim()) {
    receiptLines.push(`*Local de Retirada:* ${addr.pickup_address.trim()}`);
  }

  const shippingCost = Number(order.shipping_cost) || 0;
  const discountTotal = Number(order.discount_total) || 0;
  const totalValue = Number(order.total) || 0;
  const itemsSubtotal = Number(order.subtotal) || Math.max(0, totalValue - shippingCost);

  const financialLines: string[] = [];
  if (discountTotal > 0 || shippingCost > 0) {
    financialLines.push(`*Subtotal:* ${formatCurrency(itemsSubtotal)}`);
  }
  if (discountTotal > 0) {
    financialLines.push(`*Desconto em ofertas:* -${formatCurrency(discountTotal)}`);
  }
  if (shippingCost > 0) {
    financialLines.push(`*Taxa de entrega:* ${formatCurrency(shippingCost)}`);
  } else if (addr?.shipping_label?.trim()) {
    financialLines.push(`*Entrega / Recebimento:* ${addr.shipping_label.trim()}`);
  }
  financialLines.push(`*Total do Pedido:* *${formatCurrency(totalValue)}*`);
  if (order.payment_method_note?.trim()) {
    financialLines.push(`*Forma de pagamento:* ${order.payment_method_note.trim()}`);
  }

  const notesBlock = order.customer_notes?.trim()
    ? [`*Observações:* ${order.customer_notes.trim()}`, ``]
    : [];

  const msg = [
    `Olá, *${storeName || 'Tênis Club'}*! Acabei de finalizar meu pedido pelo site:`,
    ``,
    `*Pedido:* #${order.order_number}`,
    ...customerLines,
    ``,
    `*Itens do pedido:*`,
    itemsLines,
    ``,
    ...receiptLines,
    ``,
    ...financialLines,
    ``,
    ...notesBlock,
    `Aguardo retorno para alinharmos o pagamento e a confirmação!`,
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

