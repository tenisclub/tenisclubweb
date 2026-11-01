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

  const basePrice = Number(prod?.base_price || 0);
  const promoNum = Number(promo_price);
  const discountPct =
    basePrice > 0 && promoNum < basePrice
      ? Math.round(((basePrice - promoNum) / basePrice) * 100)
      : 0;

  const { data, error } = await supabase
    .from('promotions')
    .insert({
      name: name.trim(),
      description: description?.trim() || '',
      product_id,
      discount_percent: discountPct,
      promo_price: promoNum,
      starts_at: starts_at || null,
      ends_at: ends_at || null,
      is_active: is_active !== false,
      highlight_home: Boolean(highlight_home),
    })
    .select('*')
// step 2/6
