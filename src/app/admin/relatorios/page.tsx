import { getAdminProducts } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';
import { formatCurrency, ORDER_STATUS_CONFIG } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminRelatoriosPage() {
  const supabase = createServiceClient();

  const [{ data: ordersRaw }, products] = await Promise.all([
    supabase
      .from('orders')
      .select('id, status, payment_status, delivery_method, total, created_at')
      .order('created_at', { ascending: false }),
    getAdminProducts(),
  ]);

  const orders = ordersRaw || [];

  const validOrders = orders.filter((o) => o.status !== 'cancelled');
  const paidOrders = validOrders.filter((o) => o.payment_status === 'paid_manual');

  const registeredTotal = validOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const manualPaidTotal = paidOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const averageTicket = validOrders.length > 0 ? registeredTotal / validOrders.length : 0;

  const totalUnitsInStock = products.reduce((acc, p) => acc + p.total_stock, 0);
  const stockCostValuation = products.reduce(
    (acc, p) => acc + (p.cost_price || 0) * p.total_stock,
    0
  );
  const stockSaleValuation = products.reduce(
    (acc, p) => acc + p.effective_price * p.total_stock,
    0
  );

  const pickupCount = validOrders.filter((o) => o.delivery_method === 'pickup').length;
  const deliveryCount = validOrders.filter((o) => o.delivery_method === 'local_delivery').length;

  const statusBreakdown = Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => ({
    key,
    label: cfg.label,
    count: orders.filter((o) => o.status === key).length,
  }));

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#BEFA46]">
          Inteligência Comercial
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
          Relatórios Gerenciais
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Indicadores consolidados de pedidos, recebimentos manuais e valoração do estoque atual.
        </p>
      </div>

      {/* Commercial Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 sm:p-6 space-y-1">
          <span className="text-xs text-zinc-400 font-semibold">
            Volume Registrado em Pedidos Ativos
          </span>
          <p className="text-2xl sm:text-3xl font-black text-[#BEFA46]">
            {formatCurrency(registeredTotal)}
          </p>
          <p className="text-[11px] text-zinc-500">{validOrders.length} pedido(s) não cancelados</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 sm:p-6 space-y-1">
          <span className="text-xs text-zinc-400 font-semibold">
            Pagamentos Confirmados Manualmente
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">
            {formatCurrency(manualPaidTotal)}
          </p>
          <p className="text-[11px] text-zinc-500">{paidOrders.length} pedido(s) quitados</p>
        </div>
