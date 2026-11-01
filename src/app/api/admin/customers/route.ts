import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const { userId, is_active, reason } = await request.json();
  if (!userId || is_active === undefined) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  if (userId === session.userId && !is_active) {
    return NextResponse.json(
      { error: 'Você não pode desativar sua própria conta.' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active: Boolean(is_active), updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  revalidateStoreData('users');
  void supabase
    .from('admin_logs')
    .insert({
      admin_id: session.userId,
      action: is_active ? 'customer.activate' : 'customer.deactivate',
      entity_type: 'user_profile',
      entity_id: userId,
      details: { reason: reason || 'Operação administrativa' },
    })
    .then(() => {});

  return NextResponse.json({ success: true });
}

