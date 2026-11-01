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
// step 1/8
