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
    const supabase = createServiceClient();

    // Quick toggle mode (e.g. from products table)
    if (body.quickToggle) {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
      if (body.is_featured !== undefined) updates.is_featured = Boolean(body.is_featured);
      if (body.allow_backorder !== undefined) updates.allow_backorder = Boolean(body.allow_backorder);

      const { data: prod, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      revalidateStoreData('catalog');

      void supabase
        .from('admin_logs')
        .insert({
          admin_id: session.userId,
          action: 'product.toggle',
          entity_type: 'product',
          entity_id: id,
          details: updates,
        })
        .then(() => {});

      return NextResponse.json({ product: prod });
    }

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
      images,
      variants,
    } = body;

    const parsedPromo =
      promo_price !== null && promo_price !== '' && Number(promo_price) > 0
        ? Number(promo_price)
        : null;

    // Wave 1: Update product row + fetch existing images & variants in parallel
    const [prodRes, existingImagesRes, existingVarsRes] = await Promise.all([
      supabase
        .from('products')
        .update({
          name: name?.trim(),
          sku: sku?.trim() || null,
          brand_id: brand_id || null,
          category_id: category_id || null,
          gender: gender || 'unissex',
          short_description: short_description?.trim() || '',
          description: description?.trim() || '',
          additional_info: additional_info || {},
          cost_price: Number(cost_price || 0),
          base_price: Number(base_price || 0),
          promo_price: parsedPromo,
          is_active: is_active !== false,
          is_featured: Boolean(is_featured),
          is_new_release: Boolean(is_new_release),
          allow_backorder: Boolean(allow_backorder),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single(),
      Array.isArray(images)
        ? supabase
            .from('product_images')
