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
  const activeProducts = products.filter((p) => p.is_active).length;
  const unavailableProducts = products.filter(
    (p) => !p.is_active || (p.total_stock === 0 && !p.allow_backorder)
  ).length;

  // Low stock variants across active products (excluding backorder-enabled products)
  const lowStockVariants = products
    .filter((p) => !p.allow_backorder)
    .flatMap((p) =>
      p.variants
        .filter((v) => v.stock <= v.low_stock_threshold)
        .map((v) => ({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          size: v.size,
          color: v.color,
          stock: v.stock,
          threshold: v.low_stock_threshold,
        }))
    );

  const productsWithLowStock = new Set(lowStockVariants.map((v) => v.productId)).size;

  const totalOrders = orders.length;
  const pendingConfirmationOrders = orders.filter((o) =>
    ['received', 'awaiting_confirmation'].includes(o.status)
  ).length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;

  const validOrders = orders.filter((o) => o.status !== 'cancelled');
  const registeredRevenue = validOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);

  // Build Last 7 Days Chart Data
  const days: { label: string; key: string; ordersCount: number; salesTotal: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    days.push({ label, key, ordersCount: 0, salesTotal: 0 });
  }

  for (const o of validOrders) {
    const dayKey = String(o.created_at).slice(0, 10);
    const bucket = days.find((d) => d.key === dayKey);
    if (bucket) {
      bucket.ordersCount += 1;
      bucket.salesTotal += Number(o.total || 0);
// step 2/8
