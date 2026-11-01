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
      'tagline',
      'hero_badge',
      'hero_title',
      'hero_subtitle',
      'hero_banner_url',
      'logo_url',
      'whatsapp',
      'phone',
      'email',
      'address',
      'business_hours',
      'instagram_url',
      'facebook_url',
      'tiktok_url',
      'pickup_info',
      'delivery_info',
      'exchange_policy',
// step 2/5
