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

        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 sm:p-6 space-y-1 sm:col-span-2 lg:col-span-1">
          <span className="text-xs text-zinc-400 font-semibold">Ticket Médio por Pedido</span>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {formatCurrency(averageTicket)}
          </p>
          <p className="text-[11px] text-zinc-500">
            Retirada: {pickupCount} • Entrega local: {deliveryCount}
          </p>
        </div>
      </div>

      {/* Stock Valuation */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-4">
        <h2 className="text-base font-black text-white">Valoração de Estoque Físico</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
          <div className="rounded-2xl bg-[#18181F] p-4">
            <span className="text-xs text-zinc-400 block">Total de Pares Disponíveis</span>
            <strong className="text-xl sm:text-2xl font-black text-white">{totalUnitsInStock} un.</strong>
          </div>
          <div className="rounded-2xl bg-[#18181F] p-4">
            <span className="text-xs text-zinc-400 block">Custo de Aquisição em Estoque</span>
            <strong className="text-xl sm:text-2xl font-black text-zinc-200">
              {formatCurrency(stockCostValuation)}
            </strong>
          </div>
          <div className="rounded-2xl bg-[#18181F] p-4">
            <span className="text-xs text-zinc-400 block">Potencial de Venda do Estoque</span>
            <strong className="text-xl sm:text-2xl font-black text-[#BEFA46]">
              {formatCurrency(stockSaleValuation)}
            </strong>
          </div>
        </div>
      </div>

      {/* Status Distribution & Profitability Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-3">
          <h2 className="text-base font-black text-white">Pedidos por Status</h2>
          <div className="divide-y divide-zinc-800/80 text-xs sm:text-sm">
            {statusBreakdown.map((st) => (
              <div key={st.key} className="py-2.5 flex justify-between items-center gap-2">
                <span className="text-zinc-300">{st.label}</span>
                <strong className="text-white">{st.count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-3">
          <h2 className="text-base font-black text-white">
            Margem Estimada por Produto
          </h2>

          {/* Mobile Margin Cards */}
          <div className="sm:hidden divide-y divide-zinc-800/70">
            {products.slice(0, 10).map((p) => {
              const cost = p.cost_price || 0;
              const margin = p.effective_price - cost;
              return (
                <div key={p.id} className="py-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white truncate">{p.name}</span>
                    <span className="font-black text-[#BEFA46] shrink-0">
                      {p.sold_count} vend.
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                    <span>Custo: {formatCurrency(cost)}</span>
                    <span>Venda: {formatCurrency(p.effective_price)}</span>
// step 6/8
