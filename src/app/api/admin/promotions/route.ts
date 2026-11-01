import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const body = await request.json();
  const { name, description, product_id, promo_price, starts_at, ends_at, is_active, highlight_home } = body;

  if (!name?.trim() || !product_id || promo_price === undefined) {
    return NextResponse.json({ error: 'Preencha nome, produto e preço promocional.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: prod } = await supabase
    .from('products')
    .select('base_price')
    .eq('id', product_id)
    .single();
// step 1/6
