import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      name,
      sku,
      brand_id,
      category_id,
      gender,
      short_description,
      description,
      additional_info,
      cost_price,
      base_price,
      promo_price,
      is_active,
      is_featured,
      is_new_release,
      allow_backorder,
      images = [],
      variants = [],
    } = body;

    if (!name?.trim() || base_price === undefined || Number(base_price) < 0) {
      return NextResponse.json(
        { error: 'Informe o nome comercial e um preço de venda válido.' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    let slug = slugify(name);

    // Ensure unique slug
    const { data: slugCheck } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (slugCheck) {
      slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const parsedPromo =
      promo_price !== null && promo_price !== '' && Number(promo_price) > 0
        ? Number(promo_price)
        : null;

    const { data: product, error: prodError } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        slug,
