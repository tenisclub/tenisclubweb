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

// step 1/6
