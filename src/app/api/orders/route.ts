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
      ? matchedOption.deliveryMethod
      : deliveryMethod === 'local_delivery'
        ? 'local_delivery'
        : 'pickup';

    const requiresAddress = shouldRequireCheckoutAddress(
      deliveryCfg,
      matchedOption,
      initialDeliveryMethod
    );

    const effectiveDeliveryMethod =
      !matchedOption && requiresAddress ? 'local_delivery' : initialDeliveryMethod;

    if (requiresAddress) {
      if (
        !shippingAddress?.street?.trim() ||
        !shippingAddress?.number?.trim() ||
        !shippingAddress?.neighborhood?.trim() ||
        !shippingAddress?.city?.trim()
      ) {
        return NextResponse.json(
          { error: 'Preencha o endereço completo (rua, número, bairro e cidade).' },
          { status: 400 }
        );
      }
    }

    const addressPayload =
      requiresAddress && shippingAddress && typeof shippingAddress === 'object'
        ? {
            zip_code: shippingAddress.zip_code || '',
            street: shippingAddress.street || '',
            number: shippingAddress.number || '',
            complement: shippingAddress.complement || '',
            neighborhood: shippingAddress.neighborhood || '',
            city: shippingAddress.city || '',
            state: shippingAddress.state || 'SP',
            reference: shippingAddress.reference || '',
          }
        : null;

    const optionMetadata: Record<string, unknown> = {};
    if (matchedOption) {
      if (matchedOption.customCardId) {
        optionMetadata.custom_option_id = matchedOption.customCardId;
      }
      if (matchedOption.title) {
        optionMetadata.custom_option_title = matchedOption.title;
      }
      if (matchedOption.summaryLabel) {
        optionMetadata.shipping_label = matchedOption.summaryLabel;
      }
      if (matchedOption.kind === 'pickup' && !requiresAddress) {
        optionMetadata.pickup_address =
          deliveryCfg.pickup_subtitle.trim() || settings.address;
// step 4/8
