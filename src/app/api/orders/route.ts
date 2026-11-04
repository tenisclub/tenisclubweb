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
    } = body;

    const cleanPaymentMethod =
      typeof paymentMethod === 'string' ? paymentMethod.trim() : '';

    if (!customerName?.trim() || !customerEmail?.trim() || !customerPhone?.trim()) {
      return NextResponse.json(
        { error: 'Preencha nome completo, e-mail e telefone/WhatsApp.' },
        { status: 400 }
      );
    }

    const settings = await getStoreSettings();
    const deliveryCfg = normalizeCheckoutDeliveryConfig(settings.checkout_delivery_config);
    const selectableOptions = getSelectableCheckoutOptions(deliveryCfg, settings.address, 0);

    const requestedKey =
      typeof selectedOptionKey === 'string' && selectedOptionKey
        ? selectedOptionKey
        : deliveryMethod === 'local_delivery'
          ? 'local_delivery'
          : 'pickup';

    const matchedOption =
      selectableOptions.find((opt) => opt.key === requestedKey) ??
      selectableOptions[0] ??
      null;

    const initialDeliveryMethod = matchedOption
// etapa 2/8
