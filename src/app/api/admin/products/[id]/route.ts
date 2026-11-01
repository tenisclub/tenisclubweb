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
            .select('url, is_primary, sort_order')
            .eq('product_id', id)
            .order('sort_order', { ascending: true })
        : Promise.resolve({ data: null }),
      Array.isArray(variants)
        ? supabase
            .from('product_variants')
            .select('id, color, color_hex, size, is_active, inventory(quantity, low_stock_threshold)')
            .eq('product_id', id)
        : Promise.resolve({ data: null }),
    ]);

    const { data: product, error: prodErr } = prodRes;
    if (prodErr || !product) {
      return NextResponse.json(
        { error: prodErr?.message || 'Produto não encontrado.' },
        { status: 400 }
      );
    }

    const parallelOps: PromiseLike<unknown>[] = [];

    // Sync images ONLY if they actually changed
    if (Array.isArray(images)) {
      const hasExplicitPrimary = images.some((i: { is_primary?: boolean }) => i.is_primary);
      const normalizedIncoming = images.map(
        (img: { url: string; is_primary?: boolean }, idx: number) => ({
          url: img.url,
          is_primary: hasExplicitPrimary ? Boolean(img.is_primary) : idx === 0,
          sort_order: idx,
        })
      );
      const currentImgs = existingImagesRes.data || [];
      const imagesUnchanged =
        currentImgs.length === normalizedIncoming.length &&
        currentImgs.every(
          (cur, idx) =>
            cur.url === normalizedIncoming[idx].url &&
            Boolean(cur.is_primary) === normalizedIncoming[idx].is_primary &&
            Number(cur.sort_order ?? idx) === idx
        );

      if (!imagesUnchanged) {
        parallelOps.push(
          (async () => {
            await supabase.from('product_images').delete().eq('product_id', id);
            if (normalizedIncoming.length > 0) {
              await supabase.from('product_images').insert(
                normalizedIncoming.map((img) => ({
                  product_id: id,
                  url: img.url,
                  alt_text: product.name,
                  is_primary: img.is_primary,
                  sort_order: img.sort_order,
                }))
              );
            }
          })()
        );
      }
    }

    // Sync variants & inventory with zero sequential N+1 loops
    if (Array.isArray(variants)) {
      const existingVars = existingVarsRes.data || [];
      const existingById = new Map(existingVars.map((ev) => [ev.id, ev]));
      const existingByKey = new Map(
        existingVars.map((ev) => [`${ev.color}::${ev.size}`, ev])
      );
      const keptIds = new Set<string>();

      const movementsToInsert: Record<string, unknown>[] = [];
      const newVariantsSpec: {
        color: string;
        color_hex: string;
        size: string;
        variant_sku: string;
        desiredQty: number;
      }[] = [];

      const nowIso = new Date().toISOString();

      for (const v of variants) {
        if (!v.size) continue;
        const color = v.color?.trim() || 'Padrão';
        const colorHex = v.color_hex || '#18181B';
        const size = String(v.size).trim();
        const key = `${color}::${size}`;
        const existing = v.id ? existingById.get(v.id) : existingByKey.get(key);
        const desiredQty = Math.max(0, Number(v.stock ?? 0));

        if (existing) {
          keptIds.add(existing.id);

          // Only touch product_variants if attributes or active flag actually changed
          if (
            existing.color !== color ||
            (existing.color_hex || '#18181B') !== colorHex ||
            String(existing.size) !== size ||
            existing.is_active !== true
          ) {
            parallelOps.push(
              supabase
                .from('product_variants')
                .update({
                  color,
                  color_hex: colorHex,
                  size,
                  is_active: true,
                })
                .eq('id', existing.id)
            );
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const inv: any = Array.isArray(existing.inventory)
            ? existing.inventory[0]
            : existing.inventory;
          const prevQty = Number(inv?.quantity ?? 0);

          if (prevQty !== desiredQty) {
            parallelOps.push(
              supabase
                .from('inventory')
                .update({
                  quantity: desiredQty,
                  updated_at: nowIso,
                })
                .eq('variant_id', existing.id)
            );

            movementsToInsert.push({
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
          newVariantsSpec.push({
            color,
            color_hex: colorHex,
            size,
            variant_sku: `${sku || product.slug}-${size}`,
            desiredQty,
          });
        }
      }

      if (newVariantsSpec.length > 0) {
        parallelOps.push(
          (async () => {
            const { data: createdVars } = await supabase
              .from('product_variants')
              .insert(
                newVariantsSpec.map((nv) => ({
                  product_id: id,
                  color: nv.color,
                  color_hex: nv.color_hex,
                  size: nv.size,
                  variant_sku: nv.variant_sku,
                  is_active: true,
                }))
              )
              .select('id, color, size');

            if (createdVars && createdVars.length > 0) {
              const invRows: Record<string, unknown>[] = [];
              const newMovements: Record<string, unknown>[] = [];

              for (const cv of createdVars) {
                const match = newVariantsSpec.find(
                  (nv) => nv.color === cv.color && nv.size === String(cv.size)
                );
                const qty = match?.desiredQty ?? 0;
                invRows.push({
                  variant_id: cv.id,
                  quantity: qty,
                  low_stock_threshold: 3,
                });
                if (qty > 0) {
                  newMovements.push({
                    variant_id: cv.id,
                    product_id: id,
                    previous_quantity: 0,
                    moved_quantity: qty,
                    new_quantity: qty,
                    movement_type: 'in',
                    reason: 'Nova numeração adicionada na edição do produto',
                    performed_by: session.userId,
                  });
                }
              }

              await Promise.all([
                supabase.from('inventory').insert(invRows),
                newMovements.length > 0
                  ? supabase.from('inventory_movements').insert(newMovements)
                  : Promise.resolve(),
              ]);
            }
          })()
        );
      }

      if (movementsToInsert.length > 0) {
        parallelOps.push(supabase.from('inventory_movements').insert(movementsToInsert));
      }

      // Batch-deactivate removed active variants in a single query
      const removedActiveIds = existingVars
        .filter((ev) => !keptIds.has(ev.id) && ev.is_active !== false)
        .map((ev) => ev.id);

      if (removedActiveIds.length > 0) {
        parallelOps.push(
          supabase
            .from('product_variants')
            .update({ is_active: false })
            .in('id', removedActiveIds)
        );
      }
    }

    if (parallelOps.length > 0) {
      await Promise.all(parallelOps);
    }

    revalidateStoreData('catalog');

    void supabase
      .from('admin_logs')
      .insert({
        admin_id: session.userId,
        action: 'product.update',
        entity_type: 'product',
        entity_id: id,
        details: { name: product.name, base_price: product.base_price },
      })
      .then(() => {});

    return NextResponse.json({ product });
// step 10/12
