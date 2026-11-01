import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { primeStoreSettingsCache } from '@/lib/catalog';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const allowedFields = [
      'store_name',
// step 1/5
