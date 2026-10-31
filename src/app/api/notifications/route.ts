import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ notifications: [] });

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope');
  const supabase = createServiceClient();

  if (scope === 'admin' && session.isAdmin) {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('target_audience', 'admin')
      .order('created_at', { ascending: false })
      .limit(40);
    return NextResponse.json({ notifications: data || [] });
  }

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('target_audience', 'customer')
    .eq('user_id', session.userId)
    .order('created_at', { ascending: false })
    .limit(40);

  return NextResponse.json({ notifications: data || [] });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { id, markAll, scope } = await request.json();
  const supabase = createServiceClient();

  if (scope === 'admin' && session.isAdmin) {
    if (markAll) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('target_audience', 'admin')
        .eq('is_read', false);
    } else if (id) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('target_audience', 'admin');
    }
    return NextResponse.json({ success: true });
  }

  if (markAll) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('target_audience', 'customer')
      .eq('user_id', session.userId)
      .eq('is_read', false);
  } else if (id) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', session.userId);
  }

  return NextResponse.json({ success: true });
}
