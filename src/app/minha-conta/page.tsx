import Link from 'next/link';
import { ShoppingBag, User, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { NotificationsPanel } from '@/components/account/NotificationsPanel';
import { requireAuth } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { cn, formatCurrency, formatDate, ORDER_STATUS_CONFIG } from '@/lib/utils';
import type { NotificationItem, Order, OrderStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function MinhaContaDashboardPage() {
  const session = await requireAuth('/minha-conta');
  const supabase = createServiceClient();

  const [{ data: ordersRaw }, { data: notificationsRaw }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('notifications')
      .select('*')
      .eq('target_audience', 'customer')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const orders = (ordersRaw || []) as Order[];
  const activeOrders = orders.filter(
    (o) => !['completed', 'cancelled'].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const latestOrder = orders[0] || null;

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#BEFA46]">
            Bem-vindo(a)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
            Olá, {session.profile.full_name?.split(' ')[0] || 'Cliente'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Gerencie seus pedidos, dados pessoais, endereços e calçados favoritos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/carrinho"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black"
          >
            <ShoppingBag className="w-4 h-4" />
// step 2/6
