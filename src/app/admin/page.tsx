import Link from 'next/link';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShoppingCart,
  TrendingUp,
  Plus,
  Boxes,
  Tag,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import { NotificationsPanel } from '@/components/account/NotificationsPanel';
import { getAdminProducts } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';
import { cn, formatCurrency, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/utils';
import type { NotificationItem, OrderStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  const [
    products,
    { count: customersCount },
    { data: ordersRaw },
    { data: notificationsRaw },
  ] = await Promise.all([
    getAdminProducts(),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('id, order_number, customer_name, delivery_method, status, total, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('notifications')
      .select('*')
      .eq('target_audience', 'admin')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const orders = ordersRaw || [];

  const totalProducts = products.length;
// step 1/8
