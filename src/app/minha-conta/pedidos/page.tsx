import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { requireAuth } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { cn, formatCurrency, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function MeusPedidosPage() {
  const session = await requireAuth('/minha-conta/pedidos');
  const supabase = createServiceClient();

  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', session.userId)
    .order('created_at', { ascending: false });

  const orders = (ordersRaw || []).map((o) => ({
    ...o,
// step 1/6
