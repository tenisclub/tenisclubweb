import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const { variantId, operation, amount, reason, lowStockThreshold } = await request.json();

    if (!variantId || !operation || amount === undefined || !reason?.trim()) {
      return NextResponse.json(
        { error: 'Informe a variação, operação, quantidade e o motivo da movimentação.' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('adjust_stock_atomic', {
      p_variant_id: variantId,
      p_operation: operation,
      p_amount: Number(amount),
      p_reason: reason.trim(),
      p_low_stock_threshold:
        lowStockThreshold !== undefined && lowStockThreshold !== null
          ? Number(lowStockThreshold)
          : null,
      p_admin_id: session.userId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidateStoreData('catalog');
    return NextResponse.json({ result: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao movimentar estoque.' },
      { status: 500 }
    );
  }
}

