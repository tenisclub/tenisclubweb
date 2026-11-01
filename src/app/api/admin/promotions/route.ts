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
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (highlight_home) {
    await supabase.from('products').update({ is_featured: true }).eq('id', product_id);
  }

  revalidateStoreData('catalog');
  void supabase
    .from('admin_logs')
    .insert({
      admin_id: session.userId,
      action: 'promotion.create',
      entity_type: 'promotion',
      entity_id: data.id,
      details: { name: data.name, promo_price: promoNum },
    })
    .then(() => {});

  return NextResponse.json({ promotion: data });
}

// step 3/6
