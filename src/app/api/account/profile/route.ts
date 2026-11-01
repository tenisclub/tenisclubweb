import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fullName, phone, email, newPassword } = body;

    const service = createServiceClient();
    const supabase = await createClient();

    if (fullName !== undefined || phone !== undefined) {
      const updates: Record<string, string> = {
        updated_at: new Date().toISOString(),
      };
      if (fullName?.trim()) updates.full_name = fullName.trim();
      if (phone !== undefined) updates.phone = String(phone).trim();

      const { error: profErr } = await service
        .from('user_profiles')
        .update(updates)
        .eq('id', session.userId);

// step 2/5
