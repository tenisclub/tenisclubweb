import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const { name, is_active } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Informe o nome da marca.' }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('brands')
    .insert({
      name: name.trim(),
      slug: slugify(name),
      is_active: is_active !== false,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('admin_logs').insert({
    admin_id: session.userId,
    action: 'brand.create',
    entity_type: 'brand',
    entity_id: data.id,
    details: { name: data.name },
  });

  revalidateTag('catalog', { expire: 0 });
  return NextResponse.json({ brand: data });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const { id, name, is_active } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  const supabase = createServiceClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) {
    updates.name = name.trim();
    updates.slug = slugify(name);
  }
  if (is_active !== undefined) updates.is_active = Boolean(is_active);

  const { data, error } = await supabase
    .from('brands')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('admin_logs').insert({
    admin_id: session.userId,
    action: 'brand.update',
    entity_type: 'brand',
    entity_id: id,
    details: updates,
  });

  revalidateTag('catalog', { expire: 0 });
  return NextResponse.json({ brand: data });
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('admin_logs').insert({
    admin_id: session.userId,
    action: 'brand.delete',
    entity_type: 'brand',
    entity_id: id,
    details: {},
  });

  revalidateTag('catalog', { expire: 0 });
  return NextResponse.json({ success: true });
}

