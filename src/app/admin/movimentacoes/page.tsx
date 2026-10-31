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

      <div className="rounded-3xl border border-zinc-800 bg-[#121216] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#17171E] text-zinc-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Data / Hora</th>
                <th className="px-4 py-3.5">Produto</th>
                <th className="px-4 py-3.5">Variação</th>
                <th className="px-4 py-3.5">Operação</th>
                <th className="px-4 py-3.5">Anterior</th>
                <th className="px-4 py-3.5">Movimentado</th>
                <th className="px-4 py-3.5">Saldo Final</th>
                <th className="px-4 py-3.5">Responsável</th>
                <th className="px-4 py-3.5">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
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
                  <tr key={m.id} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                      {formatDateTime(m.created_at)}
                    </td>
                    <td className="px-4 py-3 font-bold text-white">
                      {prod?.name || 'Produto'}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                      {pv?.color} • Tam. <strong>{pv?.size}</strong>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full font-bold', badge.cls)}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{m.previous_quantity}</td>
                    <td
                      className={cn(
                        'px-4 py-3 font-extrabold',
                        m.moved_quantity >= 0 ? 'text-emerald-400' : 'text-red-400'
                      )}
                    >
                      {m.moved_quantity > 0 ? `+${m.moved_quantity}` : m.moved_quantity}
                    </td>
                    <td className="px-4 py-3 font-black text-white">{m.new_quantity}</td>
                    <td className="px-4 py-3 text-zinc-300">
                      {user?.full_name || user?.email || 'Sistema'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 max-w-xs">{m.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

