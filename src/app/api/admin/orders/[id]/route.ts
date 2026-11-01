import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const {
      status,
      note,
      store_notes,
      internal_notes,
      payment_status,
      payment_method_note,
    } = body;

    if (!status) {
      return NextResponse.json({ error: 'Informe o status do pedido.' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('change_order_status_atomic', {
      p_order_id: id,
      p_new_status: status,
      p_note: note || '',
      p_store_notes: store_notes ?? null,
      p_internal_notes: internal_notes ?? null,
      p_payment_status: payment_status ?? null,
      p_payment_method_note: payment_method_note ?? null,
      p_admin_id: session.userId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
// step 4/5
