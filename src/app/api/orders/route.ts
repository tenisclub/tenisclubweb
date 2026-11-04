import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getStoreSettings } from '@/lib/catalog';
import {
  getSelectableCheckoutOptions,
  normalizeCheckoutDeliveryConfig,
  shouldRequireCheckoutAddress,
} from '@/lib/checkout-config';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Faça login para finalizar o pedido.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      deliveryMethod,
      selectedOptionKey,
      shippingAddress,
      customerNotes,
// etapa 1/8
