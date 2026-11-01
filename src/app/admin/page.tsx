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
    }
  }

  const maxOrdersDay = Math.max(1, ...days.map((d) => d.ordersCount));
  const maxSalesDay = Math.max(1, ...days.map((d) => d.salesTotal));

  const topSelling = [...products]
    .sort((a, b) => b.sold_count - a.sold_count)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header & Quick Shortcuts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#BEFA46]">
            Visão Executiva
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
            Dashboard Administrativo
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <Link
            href="/admin/produtos/novo"
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Produto
          </Link>
          <Link
            href="/admin/estoque"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#16161D] border border-zinc-800 text-xs font-bold text-white hover:border-zinc-600"
          >
            <Boxes className="w-4 h-4 text-[#BEFA46] shrink-0" />
            Ajustar Estoque
          </Link>
          <Link
            href="/admin/promocoes"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#16161D] border border-zinc-800 text-xs font-bold text-white hover:border-zinc-600"
          >
            <Tag className="w-4 h-4 text-[#BEFA46] shrink-0" />
            Promoções
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#BEFA46]/30 bg-[#121216] p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Valor Registrado em Pedidos</span>
            <DollarSign className="w-4 h-4 text-[#BEFA46]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#BEFA46]">
            {formatCurrency(registeredRevenue)}
          </p>
          <p className="text-[11px] text-zinc-500">
            * Valor comercial de pedidos não cancelados (confirmação manual)
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#121216] p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Pedidos Totais</span>
            <ShoppingCart className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalOrders}</p>
          <p className="text-[11px] text-zinc-400">
            <strong className="text-amber-400">{pendingConfirmationOrders}</strong> aguardando confirmação •{' '}
            <strong className="text-emerald-400">{completedOrders}</strong> concluídos
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#121216] p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Catálogo de Produtos</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalProducts}</p>
          <p className="text-[11px] text-zinc-400">
            <strong className="text-emerald-400">{activeProducts}</strong> ativos •{' '}
            <strong className="text-red-400">{unavailableProducts}</strong> indisponíveis
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#121216] p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Clientes & Alertas</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{customersCount || 0}</p>
          <p className="text-[11px] text-amber-400">
            {productsWithLowStock} produto(s) com numeração em estoque baixo
          </p>
        </div>
      </div>

      {/* Period Charts: Orders & Sales (Last 7 Days) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-black text-white">Pedidos por Período (7 dias)</h2>
            <p className="text-xs text-zinc-400">Volume diário de pedidos registrados</p>
          </div>
          <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-2 pt-4">
            {days.map((d) => {
              const heightPct = Math.max(8, Math.round((d.ordersCount / maxOrdersDay) * 100));
              return (
                <div key={d.key} className="flex-1 min-w-0 flex flex-col items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-[11px] font-bold text-white">{d.ordersCount}</span>
                  <div className="w-full h-28 bg-[#1A1A22] rounded-xl flex items-end overflow-hidden p-1">
                    <div
                      className="w-full rounded-lg bg-[#BEFA46] transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-zinc-500 font-semibold">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-black text-white">Valor de Pedidos por Período (7 dias)</h2>
            <p className="text-xs text-zinc-400">Evolução financeira registrada por dia</p>
          </div>
          <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-2 pt-4">
            {days.map((d) => {
              const heightPct = Math.max(8, Math.round((d.salesTotal / maxSalesDay) * 100));
              return (
                <div key={d.key} className="flex-1 min-w-0 flex flex-col items-center gap-1.5 sm:gap-2">
                  <span className="text-[9px] sm:text-[10px] font-bold text-zinc-300 truncate max-w-full">
                    {d.salesTotal > 0 ? `R$${Math.round(d.salesTotal)}` : 'R$0'}
