import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
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

  revalidateStoreData('catalog');
  void supabase
    .from('admin_logs')
    .insert({
      admin_id: session.userId,
      action: 'brand.create',
      entity_type: 'brand',
      entity_id: data.id,
      details: { name: data.name },
    })
// step 2/6
