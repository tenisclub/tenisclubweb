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
  const waUrl = buildOrderWhatsAppUrl(settings.whatsapp, order);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/minha-conta/pedidos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para Meus Pedidos
          </Link>
          <div className="flex items-center gap-3">
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
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] text-xs sm:text-sm font-black shadow-[0_6px_22px_rgba(190,250,70,0.22)] transition"
        >
          <MessageCircle className="w-4 h-4" />
          Continuar atendimento pelo WhatsApp
        </a>
      </div>

      {/* Store Observations if present */}
      {order.store_notes && (
        <div className="rounded-2xl border border-[#BEFA46]/35 bg-[#BEFA46]/10 p-4 text-xs sm:text-sm text-zinc-100">
          <strong className="text-[#BEFA46] block mb-1">Observações da Loja:</strong>
          {order.store_notes}
        </div>
      )}

      {/* Items List */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-4">
        <h2 className="text-base font-black text-white">Produtos Solicitados</h2>
        <div className="divide-y divide-zinc-800">
          {(order.items || []).map((item) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {item.product_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-16 h-16 rounded-xl object-cover bg-[#EAE0D5]"
                  />
                )}
                <div>
                  <p className="text-sm font-extrabold text-white">{item.product_name}</p>
                  <p className="text-xs text-zinc-400">
                    Cor: {item.color} • Numeração: <strong>{item.size}</strong> • Quantidade:{' '}
                    <strong>{item.quantity}</strong>
                  </p>
                  <p className="text-xs text-zinc-500">
                    Valor unitário: {formatCurrency(item.unit_price)}
                  </p>
                </div>
              </div>
              <span className="text-sm sm:text-base font-black text-[#BEFA46]">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-800 pt-4 space-y-1.5 text-xs sm:text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount_total > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Descontos</span>
              <span>-{formatCurrency(order.discount_total)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2">
            <span className="font-bold text-white">Valor Total</span>
            <span className="text-xl font-black text-[#BEFA46]">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Delivery & Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-3 text-xs sm:text-sm">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            {order.delivery_method === 'pickup' ? (
              <Store className="w-4 h-4 text-[#BEFA46]" />
            ) : (
              <MapPin className="w-4 h-4 text-[#BEFA46]" />
            )}
            {order.delivery_method === 'pickup'
              ? 'Retirada na Loja'
              : 'Endereço de Entrega'}
          </h3>

          {order.delivery_method === 'pickup' ? (
            <div className="text-zinc-300 space-y-1">
              <p>{settings.address}</p>
              <p className="text-zinc-400 text-xs">{settings.business_hours}</p>
            </div>
          ) : (
            <div className="text-zinc-300 space-y-1">
              <p>
                {order.shipping_address?.street}, {order.shipping_address?.number}
                {order.shipping_address?.complement
                  ? ` - ${order.shipping_address.complement}`
                  : ''}
              </p>
              <p>
                {order.shipping_address?.neighborhood} — {order.shipping_address?.city}/
                {order.shipping_address?.state}
              </p>
              {order.shipping_address?.reference && (
                <p className="text-zinc-400">Ref: {order.shipping_address.reference}</p>
              )}
            </div>
          )}

          {order.customer_notes && (
            <div className="pt-3 border-t border-zinc-800">
              <span className="text-xs text-zinc-400 block">Suas observações:</span>
              <p className="text-zinc-200">{order.customer_notes}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#BEFA46]" />
            Histórico do Pedido
          </h3>

          <div className="space-y-3">
            {(order.history || []).map((h, idx) => {
              const cfg = ORDER_STATUS_CONFIG[h.new_status as OrderStatus];
              return (
                <div key={h.id} className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full mt-1.5 shrink-0',
                      idx === 0 ? 'bg-[#BEFA46]' : 'bg-zinc-600'
                    )}
                  />
                  <div className="text-xs">
                    <p className="font-bold text-white">{cfg?.label || h.new_status}</p>
                    {h.note && <p className="text-zinc-400 mt-0.5">{h.note}</p>}
                    <span className="text-[11px] text-zinc-500">
                      {formatDateTime(h.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

