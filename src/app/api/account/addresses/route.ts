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
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  if (is_default) {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', session.userId);
  }

  const { data, error } = await supabase
    .from('user_addresses')
    .insert({
      user_id: session.userId,
      label: label || 'Casa',
      recipient_name: recipient_name || session.profile.full_name,
      zip_code: zip_code || '',
      street: street.trim(),
      number: number.trim(),
      complement: complement || '',
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      state: state || 'SP',
      reference: reference || '',
      is_default: Boolean(is_default),
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidateStoreData('user_private');
  return NextResponse.json({ address: data });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const body = await request.json();
// step 4/6
