import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.isSuperAdmin) {
    return NextResponse.json(
      { error: 'Apenas o Administrador Principal pode gerenciar acessos administrativos.' },
      { status: 403 }
    );
  }

  try {
    const { email, fullName, phone, password, roleName } = await request.json();

    if (!email?.trim() || !roleName || !['admin_operational', 'super_admin'].includes(roleName)) {
      return NextResponse.json({ error: 'E-mail e nível de permissão são obrigatórios.' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', cleanEmail)
// step 1/6
