import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
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

      const { data: prod, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      await supabase.from('admin_logs').insert({
        admin_id: session.userId,
        action: 'product.toggle',
        entity_type: 'product',
        entity_id: id,
        details: updates,
      });

      revalidateTag('catalog', { expire: 0 });
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
      images,
      variants,
    } = body;

    const parsedPromo =
      promo_price !== null && promo_price !== '' && Number(promo_price) > 0
        ? Number(promo_price)
        : null;

    const { data: product, error: prodErr } = await supabase
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (prodErr) {
      return NextResponse.json({ error: prodErr.message }, { status: 400 });
    }

    // Replace/sync ordered images if provided
    if (Array.isArray(images)) {
      await supabase.from('product_images').delete().eq('product_id', id);
      if (images.length > 0) {
        const hasExplicitPrimary = images.some((i: { is_primary?: boolean }) => i.is_primary);
        await supabase.from('product_images').insert(
          images.map((img: { url: string; is_primary?: boolean }, idx: number) => ({
            product_id: id,
            url: img.url,
            alt_text: product.name,
            is_primary: hasExplicitPrimary ? Boolean(img.is_primary) : idx === 0,
            sort_order: idx,
          }))
        );
      }
    }

    // Sync variants & inventory if provided
    if (Array.isArray(variants)) {
      const { data: existingVars } = await supabase
        .from('product_variants')
        .select('id, color, size, inventory(quantity, low_stock_threshold)')
        .eq('product_id', id);

      const existingMap = new Map(
        (existingVars || []).map((ev) => [`${ev.color}::${ev.size}`, ev])
      );
      const keptIds = new Set<string>();

      for (const v of variants) {
        if (!v.size) continue;
        const color = v.color?.trim() || 'Padrão';
        const size = String(v.size).trim();
        const key = `${color}::${size}`;
        const existing = v.id
          ? (existingVars || []).find((ev) => ev.id === v.id)
          : existingMap.get(key);

        const desiredQty = Math.max(0, Number(v.stock ?? 0));

        if (existing) {
          keptIds.add(existing.id);
          await supabase
            .from('product_variants')
            .update({
              color,
              color_hex: v.color_hex || '#18181B',
              size,
              is_active: true,
            })
            .eq('id', existing.id);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const inv: any = Array.isArray(existing.inventory)
            ? existing.inventory[0]
            : existing.inventory;
          const prevQty = Number(inv?.quantity ?? 0);

          if (prevQty !== desiredQty) {
            await supabase
              .from('inventory')
              .update({
                quantity: desiredQty,
                updated_at: new Date().toISOString(),
              })
              .eq('variant_id', existing.id);

            await supabase.from('inventory_movements').insert({
              variant_id: existing.id,
              product_id: id,
              previous_quantity: prevQty,
              moved_quantity: desiredQty - prevQty,
              new_quantity: desiredQty,
              movement_type: 'adjustment',
              reason: 'Atualização via edição de produto',
              performed_by: session.userId,
            });
          }
        } else {
          const { data: createdVar } = await supabase
            .from('product_variants')
            .insert({
              product_id: id,
              color,
              color_hex: v.color_hex || '#18181B',
              size,
              variant_sku: `${sku || product.slug}-${size}`,
              is_active: true,
            })
            .select('id')
            .single();

          if (createdVar) {
            keptIds.add(createdVar.id);
            await supabase.from('inventory').insert({
              variant_id: createdVar.id,
              quantity: desiredQty,
              low_stock_threshold: 3,
            });

            if (desiredQty > 0) {
              await supabase.from('inventory_movements').insert({
                variant_id: createdVar.id,
                product_id: id,
                previous_quantity: 0,
                moved_quantity: desiredQty,
                new_quantity: desiredQty,
                movement_type: 'in',
                reason: 'Nova numeração adicionada na edição do produto',
                performed_by: session.userId,
              });
            }
          }
        }
      }

      // Deactivate removed variants safely (preserves order history references)
      for (const ev of existingVars || []) {
        if (!keptIds.has(ev.id)) {
          await supabase
            .from('product_variants')
            .update({ is_active: false })
            .eq('id', ev.id);
        }
      }
    }

    await supabase.from('admin_logs').insert({
      admin_id: session.userId,
      action: 'product.update',
      entity_type: 'product',
      entity_id: id,
      details: { name: product.name, base_price: product.base_price },
    });

    revalidateTag('catalog', { expire: 0 });
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao salvar produto.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  // Check if product is referenced in historical order_items
  const { count } = await supabase
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', id);

  if ((count || 0) > 0) {
    // Archive safely to preserve order history integrity
    await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    await supabase.from('admin_logs').insert({
      admin_id: session.userId,
      action: 'product.archive',
      entity_type: 'product',
      entity_id: id,
      details: { reason: 'Produto possui pedidos históricos vinculados; arquivado como inativo.' },
    });

    revalidateTag('catalog', { expire: 0 });
    return NextResponse.json({
      archived: true,
      message: 'Produto arquivado (inativado) pois possui histórico de pedidos.',
    });
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('admin_logs').insert({
    admin_id: session.userId,
    action: 'product.delete',
    entity_type: 'product',
    entity_id: id,
    details: {},
  });

  revalidateTag('catalog', { expire: 0 });
  return NextResponse.json({ deleted: true });
}

