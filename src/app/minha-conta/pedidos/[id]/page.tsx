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
