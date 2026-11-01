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
// step 1/6
