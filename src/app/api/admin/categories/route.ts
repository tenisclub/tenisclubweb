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
// step 1/6
