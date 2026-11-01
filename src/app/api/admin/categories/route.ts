import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const { name, description, sort_order, is_active } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Informe o nome da categoria.' }, { status: 400 });

  const supabase = createServiceClient();
  const slug = slugify(name);

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: name.trim(),
      slug,
      description: description?.trim() || '',
      sort_order: Number(sort_order || 0),
      is_active: is_active !== false,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  revalidateStoreData('catalog');
  void supabase
    .from('admin_logs')
    .insert({
      admin_id: session.userId,
      action: 'category.create',
      entity_type: 'category',
      entity_id: data.id,
      details: { name: data.name },
    })
    .then(() => {});

  return NextResponse.json({ category: data });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const { id, name, description, sort_order, is_active } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  const supabase = createServiceClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) {
    updates.name = name.trim();
    updates.slug = slugify(name);
// step 3/6
