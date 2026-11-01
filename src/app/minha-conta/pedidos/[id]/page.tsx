import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageCircle, MapPin, Store, Clock } from 'lucide-react';
import { requireAuth } from '@/lib/auth';
import { getStoreSettings } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';
import {
  buildOrderWhatsAppUrl,
  cn,
  formatCurrency,
  formatDateTime,
  ORDER_STATUS_CONFIG,
} from '@/lib/utils';
import type { Order, OrderStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function PedidoDetalheClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth(`/minha-conta/pedidos/${id}`);
  const [settings, supabase] = await Promise.all([
    getStoreSettings(),
    Promise.resolve(createServiceClient()),
  ]);

  // RN14: Strictly restrict to user's own order
  const { data: orderRaw } = await supabase
    .from('orders')
    .select(
      `
      id, order_number, user_id, customer_name, customer_email, customer_phone,
      delivery_method, shipping_address, subtotal, discount_total, shipping_cost, total,
      status, payment_status, payment_method_note, customer_notes, store_notes, created_at, updated_at,
      order_items(*),
      order_status_history(*)
    `
    )
    .eq('id', id)
    .eq('user_id', session.userId)
    .maybeSingle();

  if (!orderRaw) {
    notFound();
  }

  const order: Order = {
    ...(orderRaw as unknown as Order),
    items: orderRaw.order_items || [],
    history: [...(orderRaw.order_status_history || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  };

  const st = ORDER_STATUS_CONFIG[order.status as OrderStatus];
  const waUrl = buildOrderWhatsAppUrl(settings.whatsapp, order, settings.store_name);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/minha-conta/pedidos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para Meus Pedidos
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Pedido #{order.order_number}
            </h1>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-bold border',
                st?.colorClass
              )}
            >
              {st?.label || order.status}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Solicitado em {formatDateTime(order.created_at)}
          </p>
        </div>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-2xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] text-xs sm:text-sm font-black shadow-[0_6px_22px_rgba(190,250,70,0.22)] transition"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          Continuar atendimento pelo WhatsApp
        </a>
      </div>

      {/* Store Observations if present */}
      {order.store_notes && (
