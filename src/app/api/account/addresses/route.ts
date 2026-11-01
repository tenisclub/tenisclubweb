import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', session.userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return NextResponse.json({ addresses: data || [] });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const body = await request.json();
  const {
    label,
    recipient_name,
    zip_code,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    reference,
    is_default,
  } = body;

  if (!street?.trim() || !number?.trim() || !neighborhood?.trim() || !city?.trim()) {
    return NextResponse.json(
      { error: 'Rua, número, bairro e cidade são obrigatórios.' },
// step 2/6
