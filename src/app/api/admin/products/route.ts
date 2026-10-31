import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
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
        sku: sku?.trim() || null,
        brand_id: brand_id || null,
        category_id: category_id || null,
        gender: gender || 'unissex',
        short_description: short_description?.trim() || '',
        description: description?.trim() || '',
        additional_info: additional_info || {},
        cost_price: Number(cost_price || 0),
        base_price: Number(base_price),
        promo_price: parsedPromo,
        is_active: is_active !== false,
        is_featured: Boolean(is_featured),
        is_new_release: Boolean(is_new_release),
        meta_title: `${name.trim()} | Tênis Club`,
        meta_description: short_description?.trim() || description?.slice(0, 155) || '',
      })
      .select('*')
      .single();

    if (prodError) {
      return NextResponse.json({ error: prodError.message }, { status: 400 });
    }

    // Insert images
    if (Array.isArray(images) && images.length > 0) {
      const imageRows = images.map(
        (img: { url: string; is_primary?: boolean }, index: number) => ({
          product_id: product.id,
          url: img.url,
          alt_text: name.trim(),
          is_primary: img.is_primary ?? index === 0,
          sort_order: index,
        })
      );
      await supabase.from('product_images').insert(imageRows);
    }

    // Insert variants & initial per-size inventory + movements
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        if (!v.size) continue;
        const { data: createdVar, error: varErr } = await supabase
          .from('product_variants')
          .insert({
            product_id: product.id,
            color: v.color?.trim() || 'Padrão',
            color_hex: v.color_hex || '#18181B',
            size: String(v.size).trim(),
            variant_sku: v.variant_sku || `${sku || slug}-${v.size}`,
            is_active: true,
          })
          .select('id')
          .single();

        if (!varErr && createdVar) {
          const initialQty = Math.max(0, Number(v.stock || 0));
          await supabase.from('inventory').insert({
            variant_id: createdVar.id,
            quantity: initialQty,
            low_stock_threshold: Number(v.low_stock_threshold ?? 3),
          });

          if (initialQty > 0) {
            await supabase.from('inventory_movements').insert({
              variant_id: createdVar.id,
              product_id: product.id,
              previous_quantity: 0,
              moved_quantity: initialQty,
              new_quantity: initialQty,
              movement_type: 'in',
              reason: 'Cadastro inicial do produto',
              performed_by: session.userId,
            });
          }
        }
      }
    }

    await supabase.from('admin_logs').insert({
      admin_id: session.userId,
      action: 'product.create',
      entity_type: 'product',
      entity_id: product.id,
      details: { name: product.name, sku: product.sku, base_price: product.base_price },
    });

    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao cadastrar produto.' },
      { status: 500 }
    );
  }
}
