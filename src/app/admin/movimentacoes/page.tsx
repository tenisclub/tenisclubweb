import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/server';
import { cn, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const MOVE_TYPE_LABELS: Record<string, { label: string; cls: string }> = {
  in: { label: 'Entrada', cls: 'bg-emerald-500/15 text-emerald-400' },
  out: { label: 'Saída', cls: 'bg-red-500/15 text-red-400' },
  adjustment: { label: 'Correção', cls: 'bg-sky-500/15 text-sky-400' },
  order_reserve: { label: 'Reserva Pedido', cls: 'bg-amber-500/15 text-amber-300' },
  order_cancel_return: { label: 'Estorno Cancelamento', cls: 'bg-purple-500/15 text-purple-300' },
};

export default async function AdminMovimentacoesPage() {
  const supabase = createServiceClient();
  const { data: movements } = await supabase
    .from('inventory_movements')
    .select(
      `
      *,
      products(name, sku),
      product_variants(color, size),
      user_profiles(full_name, email)
    `
    )
    .order('created_at', { ascending: false })
    .limit(150);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/estoque"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para Controle de Estoque
        </Link>
        <h1 className="text-2xl font-black text-white mt-1">
          Histórico de Movimentações de Estoque
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Rastreabilidade completa de todas as entradas, saídas, reservas de pedidos e correções.
        </p>
      </div>

      {/* Mobile Movement Cards */}
      <div className="md:hidden space-y-3">
        {(movements || []).map((m) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const prod: any = Array.isArray(m.products) ? m.products[0] : m.products;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pv: any = Array.isArray(m.product_variants)
            ? m.product_variants[0]
            : m.product_variants;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const user: any = Array.isArray(m.user_profiles)
            ? m.user_profiles[0]
            : m.user_profiles;
          const badge = MOVE_TYPE_LABELS[m.movement_type] || {
            label: m.movement_type,
            cls: 'bg-zinc-800 text-zinc-300',
          };

          return (
            <div
              key={m.id}
              className="rounded-2xl border border-zinc-800 bg-[#121216] p-4 space-y-2.5 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-extrabold text-white truncate">
                    {prod?.name || 'Produto'}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {pv?.color} • Tam. <strong className="text-white">{pv?.size}</strong>
                  </p>
                </div>
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0', badge.cls)}>
                  {badge.label}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#18181F] p-2.5 text-center">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Anterior</span>
                  <strong className="text-zinc-300">{m.previous_quantity}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Movimento</span>
                  <strong
                    className={cn(
                      m.moved_quantity >= 0 ? 'text-emerald-400' : 'text-red-400'
                    )}
                  >
                    {m.moved_quantity > 0 ? `+${m.moved_quantity}` : m.moved_quantity}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Saldo Final</span>
// step 4/8
