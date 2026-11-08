import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getStoreSettings } from '@/lib/catalog';
import {
  getSelectableCheckoutOptions,
  normalizeCheckoutDeliveryConfig,
  shouldRequireCheckoutAddress,
} from '@/lib/checkout-config';
import { clearGuestCartFlagCookie, readGuestCartId } from '@/lib/guest-cart';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const [session, guestId] = await Promise.all([
    getAuthSession(),
    readGuestCartId(),
  ]);

  if (!session && !guestId) {
    return NextResponse.json(
      { error: 'Sua sacola está vazia. Adicione um produto antes de finalizar.' },
      { status: 400 }
    );
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

    if (!customerName?.trim() || !customerPhone?.trim()) {
      return NextResponse.json(
        { error: 'Preencha seu nome completo e telefone/WhatsApp.' },
        { status: 400 }
      );
    }

    const cleanEmail = typeof customerEmail === 'string' ? customerEmail.trim() : '';

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
      }
    } else {
      optionMetadata.custom_option_title = 'A combinar';
      optionMetadata.shipping_label = 'A combinar';
    }

    const finalShippingAddress =
      addressPayload || Object.keys(optionMetadata).length > 0
        ? {
            ...optionMetadata,
            ...(addressPayload || {}),
          }
        : null;

    const supabase = createServiceClient();

    if (session && guestId) {
      await supabase.rpc('merge_guest_cart_into_user', {
        p_guest_id: guestId,
        p_user_id: session.userId,
      });
    }

    const phoneUpdatePromise =
      session && !session.profile.phone && customerPhone
        ? supabase
            .from('user_profiles')
            .update({ phone: customerPhone.trim() })
            .eq('id', session.userId)
        : Promise.resolve();

    const [{ data: rpcResult, error: rpcError }] = await Promise.all([
      supabase.rpc('create_order_from_cart', {
        p_user_id: session?.userId ?? null,
        p_customer_name: customerName.trim(),
        p_customer_email: cleanEmail,
        p_customer_phone: customerPhone.trim(),
        p_delivery_method: effectiveDeliveryMethod,
        p_shipping_address: finalShippingAddress,
        p_customer_notes: customerNotes || '',
        p_guest_id: session ? null : guestId,
      }),
      phoneUpdatePromise,
    ]);

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 });
    }

    const r = rpcResult as { order_id?: string; order_number?: string } | null;
    const orderId = r?.order_id;
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId!)
      .single();

    let orderData = fullOrder as Record<string, unknown> | null;

    if (orderData && orderId) {
      const itemsTotalAfterDiscount = Number(orderData.total) || 0;
      const resolvedOptions = getSelectableCheckoutOptions(
        deliveryCfg,
        settings.address,
        itemsTotalAfterDiscount
      );
      const resolvedOption =
        resolvedOptions.find((opt) => opt.key === requestedKey) ??
        resolvedOptions[0] ??
        null;

      const orderUpdates: Record<string, unknown> = {};
      if (cleanPaymentMethod) {
        orderUpdates.payment_method_note = cleanPaymentMethod;
      }

      if (resolvedOption) {
        const resolvedShippingCost = Number(resolvedOption.shippingCost) || 0;
        const labelChanged =
          resolvedOption.summaryLabel !== (optionMetadata.shipping_label as string | undefined);

        if (resolvedShippingCost > 0 || labelChanged) {
          const updatedShippingAddress = {
            ...(finalShippingAddress || {}),
            shipping_label: resolvedOption.summaryLabel,
          };
          const updatedTotal = itemsTotalAfterDiscount + resolvedShippingCost;
          orderUpdates.shipping_cost = resolvedShippingCost;
          orderUpdates.total = updatedTotal;
          orderUpdates.shipping_address = updatedShippingAddress;
        }
      }

      if (Object.keys(orderUpdates).length > 0) {
        await supabase.from('orders').update(orderUpdates).eq('id', orderId);
        orderData = {
          ...orderData,
          ...orderUpdates,
        };
      }

      await supabase.rpc('sync_order_financial_entry', { p_order_id: orderId });
    }

    revalidateStoreData('orders');

    const res = NextResponse.json({
      order: orderData
        ? {
            ...orderData,
            items: (orderData.order_items as unknown[]) || [],
          }
        : null,
      orderId,
      orderNumber: r?.order_number,
    });

    if (!session) {
      clearGuestCartFlagCookie(res);
    }

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao processar pedido.' },
      { status: 500 }
    );
  }
}
